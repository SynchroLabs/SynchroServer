var lodash = require("lodash");

var objectMonitor = require('./objectmon');
var util = require('./util');

var logger = require('log4js').getLogger("api");

var wait = require('wait.for');

var filter = require('./filter');


// Instance id: Monotonically increasing value used to identify a module instance
// Instance version: Monotonically increasing value, starting at 1, used to identify the version of the module instance view model

// Roadmap of members for Session and context
// ----------------------------------------------
//
// Session
//     id
//     DeviceMetrics 
//     ViewMetrics
//     UserData (this is what is passed to user code as the "session" param)
//     ModuleInstance
//         path
//         instanceId
//         viewIsDynamic
//         viewHash (present if viewIsDynamic)
//         ClientViewModel
//             instanceVersion
//             ViewModel
//         ServerViewModel (present only when co-processing)
//             ViewModel
//
// context
//     session
//     request
//     response
//     LocalViewModel
//         instanceId
//         ViewModel
//

// Roadmap of request/response
// ------------------------------
//
// Request
//      DeviceMetrics (optional, typically sent once at start of session)
//      ViewMetrics (optional, typically sent at start of session and on change, such as rotation)
//      TransactionId (client generated, used to match reply to request)
//      Path
//      InstanceId
//      InstanceVersion
//      Mode
//      <other params, as appropriate per Mode>
//
// Response
//      TransactionId
//      InstanceId
//      InstanceVersion
//      View
//      ViewModel/ViewModelDeltas
//      NextRequest (for multi-step transactions, particularly subsequent LoadPage and Continue operations)
//          <fully populated request, including TransactionId which will be unchanged from originating request>
//      Error
//

// Used to capture exceptions thrown from user code
//
function UserCodeError(method, error) 
{
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "UserCode error in method: " + method + " - " + error.message;
    this.name = 'UserCodeError';
    this.method = method,
    this.error = error;
}

UserCodeError.prototype.__proto__ = Error.prototype;

// User for logical client errors (essentially, client bugs - conditions caused by the client that should
// never happen, even considering dropped connections, lost requests/responses, and other normal/predictable
// client/server sync issues).
//
function ClientError(msg) 
{
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Client error - " + msg;
    this.name = 'ClientError';
}

ClientError.prototype.__proto__ = Error.prototype;


function getViewModel(routeModule, context, session, params)
{
    viewModel = {};
    if (routeModule.InitializeViewModel)
    {
        logger.info("Initializing view model");

        try 
        {
            // USERCODE
            viewModel = routeModule.InitializeViewModel(context, session.UserData, params);
        }
        catch (e)
        {
            throw new UserCodeError("InitializeViewModel", e);
        }
    }

    return viewModel;
}

function getView(routeModule, context, session, viewModel, isViewMetricUpdate)
{
    isViewMetricUpdate = isViewMetricUpdate || false;

    var view = {};

    if (routeModule.View)
    {
        view = filter.filterView(session.DeviceMetrics, session.ViewMetrics, viewModel, routeModule.View);
    }

    if (routeModule.InitializeView)
    {
        var metrics = { DeviceMetrics: context.session.DeviceMetrics, ViewMetrics: context.session.ViewMetrics };

        try 
        {
            // USERCODE
            view = routeModule.InitializeView(context, session.UserData, viewModel, view, metrics, isViewMetricUpdate);
        }
        catch (e)
        {
            throw new UserCodeError("InitializeView", e);
        }
    }

    return view;
}

function isCurrentModuleInstance(context)
{
    return (context.LocalViewModel && (context.LocalViewModel.instanceId == context.session.ModuleInstance.instanceId));
}

function populateNewPageResponse(synchroApi, route, routeModule, context, params)
{
    var viewModel = getViewModel(routeModule, context, context.session, params);
    var view = getView(routeModule, context, context.session, viewModel);

    // Note: This will have the side-effect of removing the stored ServerViewModel, which is intentional and appropriate (as 
    //       this is a new module instance and any stored ServerViewModel is obsolete).
    //
    context.session.ModuleInstance =
    {
        path: route,
        instanceId: ((context.session.ModuleInstance && context.session.ModuleInstance.instanceId) || 0) + 1,
        ClientViewModel:
        {
            instanceVersion: 0,
            ViewModel: viewModel
        }
    } 

    // Note: we're only ever going to use the hash for dynamic views, so no use in computing it otherwise.
    //
    if (view.dynamic)
    {
        context.session.ModuleInstance.dynamic = true;
        context.session.ModuleInstance.viewHash = util.jsonHash(view);
    }

    synchroApi.sessionStore.putSession(context.session);

    // Initialize the response
    //
    context.response.View = view;

    if (routeModule.LoadViewModel)
    {
        context.response.NextRequest = 
        {
            Path: context.request.Path,
            TransactionId: context.request.TransactionId,
            InstanceId: context.session.ModuleInstance.instanceId,
            InstanceVersion: 1,
            Mode: "LoadPage"
        }
    }
}

function sendUpdate(synchroApi, context, isInterim)
{
    if (!isCurrentModuleInstance(context) && isInterim)
    {
        // If you navigate to a new page and then post an "interim" update, we are just going ignore that (since those would
        // just be updates to an obsolete page anyway).  The "final" update for the request will go through, which will send
        // the new page.
        //
        logger.info("Ignoring interim update request after page navigation");
        return;
    }

    context.interimUpdate = isInterim;

    var channelId = context.session.id + ":" + context.request.TransactionId;

    if (synchroApi.readerWriter.isWritePending(channelId))
    {
        // If there is currently a write pending on this channel, no need to take any action here.  Any view model
        // changes made since that original update was posted will still be picked up when it gets sent.
        //
        // If the posted update was a partion/interim and the current update is a final/complete, that will get
        // picked up when the write is satisfied (per the response.Update set above) and will result in a final/complete
        // update being sent.
        //
        logger.info("Update - request already pending, no action taken");
        return;
    }

    // Post the response write
    //
    logger.info("Posting write for session:transactionId - " + channelId);
    synchroApi.readerWriter.writeAsync(channelId, function(err, writeData)
    {
        if (err)
        {
            logger.error("writeAsync err: " + err);  
        }
        else
        {
            // We don't want to compute/update the response until we're ready to send it (which is now), since the 
            // response type or view model could have changed subsequent to when the write was originally posted.
            //
            logger.info("writeAsync posting to reader");

            context.response.TransactionId = context.request.TransactionId;

            if (!context.response.Error)
            {
                if (context.session.ModuleInstance.ClientViewModel.instanceVersion == 0)
                {
                    // We have not sent the client a view model yet, so we need to send them the whole view model
                    //
                    if (isCurrentModuleInstance(context))
                    {
                        logger.error("Sending whole page after nav, apply local client changes");
                        context.response.ViewModel = context.LocalViewModel.ViewModel;
                        context.session.ModuleInstance.ClientViewModel.ViewModel = lodash.cloneDeep(context.LocalViewModel.ViewModel);
                    }
                    else
                    {
                        logger.error("Sending whole page after nav, not applying local client changes");
                        context.response.ViewModel = lodash.cloneDeep(context.session.ModuleInstance.ClientViewModel.ViewModel);
                    }
                    context.session.ModuleInstance.ClientViewModel.instanceVersion = 1;
                }
                else
                {
                    if (isCurrentModuleInstance(context))
                    {
                        // We just want to send the client any deltas
                        //
                        logger.error("Sending page updates only");
                        logger.error("LocalViewModel: " + JSON.stringify(context.LocalViewModel, null, 4));
                        var viewModelUpdates = objectMonitor.getChangeList(null, context.session.ModuleInstance.ClientViewModel.ViewModel, context.LocalViewModel.ViewModel);
                        if (viewModelUpdates.length > 0)
                        {
                            context.response.ViewModelDeltas = viewModelUpdates;
                            context.session.ModuleInstance.ClientViewModel.ViewModel = lodash.cloneDeep(context.LocalViewModel.ViewModel);

                            // Note that we're only incrementing the instance version if we actually have any changes
                            //
                            context.session.ModuleInstance.ClientViewModel.instanceVersion++;
                        }
                    }
                    else
                    {
                        // !!! Weird case - updates coming in for obsolete module instance - need to send something to service
                        //     the waiting response.  Maybe some kind of NOOP.
                        //
                        // !!! I think this is what happens when another processor navigates away while a processor continues
                        //     to do asynchronous processing / interim updates on the old instance.  We definitely don't want 
                        //     to send interim updates in this case, but do want to send a final NOOP.
                        //
                        // !!! If navigate away on another processor, we might still hit the instanceVersion == 0 case above, and
                        //     use this transaction to write the initial viewmodel, which doesn't seem right.  And what prevents
                        //     the other guy from also hitting the instanceVersion == 1 case?
                        //
                        logger.error("Freakout");
                    }
                }

                context.response.InstanceId = context.session.ModuleInstance.instanceId;
                context.response.InstanceVersion = context.session.ModuleInstance.ClientViewModel.instanceVersion;

                if (context.interimUpdate)
                {
                    logger.info("Sending interim update");
                    context.response.NextRequest = 
                    {
                        Path: context.request.Path,
                        TransactionId: context.request.TransactionId,
                        InstanceId: context.session.ModuleInstance.instanceId,
                        InstanceVersion: context.session.ModuleInstance.ClientViewModel.instanceVersion,
                        Mode: "Continue"
                    }
                }
            }

            writeData(context.response);

            if (!context.response.Error)
            {            
                // Update the server view model, if any
                //
                if (context.session.ModuleInstance.ServerViewModel)
                {
                    context.session.ModuleInstance.ServerViewModel.ViewModel = lodash.cloneDeep(context.session.ModuleInstance.ClientViewModel.ViewModel);
                }

                logger.info("Putting session after potentially updating client/server view models and incrementing instanceVersion");
                synchroApi.sessionStore.putSession(context.session);

                if (context.interimUpdate)
                {
                    // Update response and view model state in preparation for subsequent update
                    //
                    context.response = 
                    { 
                        Path: context.request.Path,
                    }

                    // If we're going to keep going on this processor, update the LocalViewModel to the ClientViewModel version so
                    // that the continued processing will start from that baseline (for the purpose of computing future diffs)
                    //
                    util.assignNewContents(context.LocalViewModel.ViewModel, lodash.cloneDeep(context.session.ModuleInstance.ClientViewModel.ViewModel));
                }
            }
        }
    });
}

function initLocalViewModel(context)
{
    // Initialize the local view model that this module instance will use during processing of this request.  We only evaluate
    // the local view model for changes on client update if we haven't navigated away from this page/instance.
    //
    if (context.session.ModuleInstance)
    {
        context.LocalViewModel = { instanceId: context.session.ModuleInstance.instanceId };

        if (context.session.ModuleInstance.ServerViewModel)
        {
            // If there is a ServerViewModel, then it represents a live processing state of another processor running against
            // this module instance that has shared this version of the view model before yielding, so we will use it in order
            // to pick up any changes that process has made.
            //
            context.LocalViewModel.ViewModel = lodash.cloneDeep(context.session.ModuleInstance.ServerViewModel.ViewModel);
        }
        else if (context.session.ModuleInstance.ClientViewModel)
        {
            // The normal mode is that we initialize our local view model to the clients version of the view model
            //
            context.LocalViewModel.ViewModel = lodash.cloneDeep(context.session.ModuleInstance.ClientViewModel.ViewModel);
        }        
    }
}

// Public API
//
var SynchroApi = function(moduleManager, sessionStore, readerWriter)
{
    this.appDefinition = null;
    this.moduleManager = moduleManager;
    this.sessionStore = sessionStore;
    this.readerWriter = readerWriter;
}

SynchroApi.prototype.load = function(err, appDefinition)
{
    this.appDefinition = this.moduleManager.loadModules(this);
    return this.appDefinition;
}

SynchroApi.prototype.getAppDefinition = function()
{
    logger.info("Sending appDefinition: " + this.appDefinition);
    return this.appDefinition;
}

SynchroApi.prototype.reloadModule = function(moduleName)
{
    this.moduleManager.reloadModule(moduleName);
}

// Takes a Synchro request object and returns a Synchro response object
//
SynchroApi.prototype.process = function(session, requestObject, responseObject)
{
    session.UserData = session.UserData || {};

    var context = 
    {
        session: session,
        request: requestObject,
        response: responseObject 
    };

    context.response.Path = context.request.Path;

    var route;

    try
    {
        if (context.request.Mode == "Page") // Initial page request on app start
        {
            if (context.request.Path)
            {
                route = context.request.Path;            
            }
            else
            {
                throw new ClientError("Received Mode: Page request with no Path");
            }
        }
        else if (context.request.InstanceId)
        {
            if (context.session.ModuleInstance)
            {
                if (context.request.InstanceId == context.session.ModuleInstance.instanceId)
                {
                    // At this point we've determined that the client sent this transaction regarding an instance that 
                    // is the same instance that the server is processing.  So far so good. 
                    //
                    route = context.session.ModuleInstance.path;

                    // Now let's see if the instance versions match...
                    //
                    if (!context.request.InstanceVersion)
                    {
                        throw new ClientError("Received Mode: " + context.request.Mode + " request with no InstanceVersion");
                    }
                    else if (context.request.InstanceVersion != context.session.ModuleInstance.instanceVersion)
                    {
                        // !!! This is the potentially interesting case where you have a request that refers to a different
                        //     (presumably, previous) version of the current Instance.  Not sure if this can happen normally
                        //     for overlapping/async operations.  Ponder what to do here (and under exactly what conditions
                        //     this can actually happen).  It might also depend on whether this request contains view model
                        //     deltas, or is some other kind of request (command, view metrics update, etc) where we don't
                        //     really care. 
                        //
                        //     Right now, this update is just being applied.
                        //
                        logger.error("Received request for previous version of current instance (request version: " +
                            context.request.InstanceVersion  + ", current version: " +  context.session.ModuleInstance.instanceVersion);
                    }
                }
                else
                {
                    // !!! This request has an InstanceId and it doesn't match the current instanceId in the session, so
                    //     this is an obsolete request (for an instance that has been navigated away from).  It can be safely 
                    //     ignored (but we still need to give a NOOP response).
                    //
                    logger.error("Received request for non-current instance id: " + context.request.InstanceId);     
                }
            }
            else
            {
                // !!! The client provided an InstanceId, but the server doesn't have an active instance. Error.  New page from path?
                //
                logger.error("Received request for instance id: " + context.request.InstanceId + ", but server has no active instance");     
            }
        }
        else
        {
            throw new ClientError("Received Mode: " + context.request.Mode + " request with no InstanceId");
        }

        logger.info("Processing path " + route);

        // Store device metrics in session if provided (should only be at start of session)
        //
        if (context.request.DeviceMetrics)
        {
            context.session.DeviceMetrics = context.request.DeviceMetrics;
        }

        // Update view metrics in session if provided (happens at start of session and whenever orientation or other view state changes on client)
        //
        if (context.request.ViewMetrics)
        {
            context.session.ViewMetrics = context.request.ViewMetrics;
        }

    	var routeModule = this.moduleManager.getModule(route);
        if (!routeModule)
        {
            throw new ClientError("No route found for path: " + context.request.Path);
        }

        logger.info("Found module for route: " + route);
        
        if (context.request.ViewModelDeltas)
        {
            logger.info("ViewModel before deltas: " + viewModel);

            // Record the current state of view model so we can diff it after apply the changes from the client,
            // and use that diff to see if there were any changes, so that we can then pass them to the OnViewModelChange
            // handler (for the "view" mode, indicating changes that were made by/on the view).
            //
            var viewModelBeforeUpdate = lodash.cloneDeep(context.session.ModuleInstance.ClientViewModel.ViewModel);

            // Now apply the changes from the client...
            for (var i = 0; i < context.request.ViewModelDeltas.length; i++) 
            {
                logger.info("View Model change from client - path: " + context.request.ViewModelDeltas[i].path + ", value: " + context.request.ViewModelDeltas[i].value);
                util.setObjectProperty(context.session.ModuleInstance.ClientViewModel.ViewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);
                if (context.session.ModuleInstance.ServerViewModel)
                {
                    util.setObjectProperty(context.session.ModuleInstance.ServerViewModel.ViewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);                    
                }
                util.setObjectProperty(viewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);
            }
            
            // Update the session to reflect changes to ClientViewModel (and possibly ServerViewModel) from client
            //
            this.sessionStore.putSession(context.session);

            // Getting this here allows us to track any changes made by server logic (in change notifications or commands)
            //
            initLocalViewModel(context);

            // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
            //
            if (routeModule.OnViewModelChange)
            {
                // Get the changelist for the callback, but only call if there are any changes
                //
                var viewModelUpdates = objectMonitor.getChangeList(null, viewModelBeforeUpdate, context.LocalViewModel.ViewModel);
                if (viewModelUpdates && (viewModelUpdates.length > 0))
                {
                    try 
                    {
                        // USERCODE
                        routeModule.OnViewModelChange(context, context.session.UserData, context.LocalViewModel.ViewModel, "view", viewModelUpdates);
                    }
                    catch (e)
                    {
                        throw new UserCodeError("OnViewModelChange", e);
                    }
                }
            }
        }
        else
        {
            initLocalViewModel(context);
        }

        switch (requestObject.Mode)
        {
            case "Page":
            {
                logger.info("Page request for: " + route);
                populateNewPageResponse(this, route, routeModule, context);
                initLocalViewModel(context);
            }
            break;

            case "LoadPage":
            {
                logger.info("Load Page request for: " + route);
                if (routeModule.LoadViewModel)
                {
                    try 
                    {
                        // USERCODE
                        routeModule.LoadViewModel(context, context.session.UserData, context.LocalViewModel.ViewModel);
                    }
                    catch (e)
                    {
                        throw new UserCodeError("LoadViewModel", e);
                    }
                }
            }
            break;

            case "Update": // View model update only (no command or view metric change - just data update)
            {
                logger.info("Updating view model");
            }
            break;

            case "Command":
            {
                logger.info("Running command: " + context.request.Command);

                // Only process command if it exists...
                //
                if (routeModule.Commands && routeModule.Commands[context.request.Command])
                {
                    try 
                    {
                        // USERCODE
                        routeModule.Commands[context.request.Command](context, context.session.UserData, context.LocalViewModel.ViewModel, context.request.Parameters);
                    }
                    catch (e)
                    {
                        throw new UserCodeError("Command." + context.request.Command, e);
                    }

                    // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // Get the changelist for the callback, but only call if there are any changes
                        //
                        var viewModelUpdates = objectMonitor.getChangeList(null, context.session.ModuleInstance.ClientViewModel.ViewModel, context.LocalViewModel.ViewModel);
                        if (viewModelUpdates && (viewModelUpdates.length > 0))
                        {
                            try 
                            {
                                // USERCODE
                                routeModule.OnViewModelChange(context, context.session.UserData, context.LocalViewModel.ViewModel, "command", viewModelUpdates); 
                            }
                            catch (e)
                            {
                                throw new UserCodeError("OnViewModelChange", e);
                            }                            
                        }
                    }
                }
                else if (context.request.Command)
                {
                    throw new ClientError("Command not found: " + context.request.Command);
                }
                else
                {
                    throw new ClientError("Mode was Command, but no 'Command' was specified");
                }
            }
            break;

            case "ViewUpdate":
            {
                logger.info("View update, orientation is now: " + context.request.ViewMetrics.orientation);

                if (routeModule.OnViewMetricsChange)
                {
                    var metrics = { DeviceMetrics: context.session.DeviceMetrics, ViewMetrics: context.session.ViewMetrics };

                    try 
                    {
                        // USERCODE
                        routeModule.OnViewMetricsChange(context, context.session.UserData, context.LocalViewModel.ViewModel, metrics);
                    }
                    catch (e)
                    {
                        throw new UserCodeError("OnViewMetricsChange", e);
                    }                            

                    // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // Get the changelist for the callback, but only call if there are any changes
                        //
                        var viewModelUpdates = objectMonitor.getChangeList(null, context.session.ModuleInstance.ClientViewModel.ViewModel, context.LocalViewModel.ViewModel);
                        if (viewModelUpdates && (viewModelUpdates.length > 0))
                        {
                            try 
                            {
                                // USERCODE
                                routeModule.OnViewModelChange(context, context.session.UserData, context.LocalViewModel.ViewModel, "viewMetrics", viewModelUpdates);
                            }
                            catch (e)
                            {
                                throw new UserCodeError("OnViewModelChange", e);
                            }                                                        
                        }
                    }
                }

                // Only want to do the re-render processing if we haven't navigated away...
                //
                if (isCurrentModuleInstance(context))
                {
                    // If dynamic view, re-render the View...
                    //
                    if (context.session.ModuleInstance.dynamic)
                    {
                        // Note: getView() will call InitializeView if present, and that could potentially navigate to another
                        // page, though that would be a dick move.  But anyway, that's why we have to do the path check again
                        // below, before we update the ViewModel.
                        //
                        var view = getView(routeModule, context, context.session, context.LocalViewModel.ViewModel, true);

                        // See if the View actually changed, and if so, send the updated View back...
                        //
                        var viewHash = util.jsonHash(view);
                        if (context.session.ModuleInstance.viewHash == viewHash)
                        {
                            logger.info("Regenerated View was the same as previosuly sent View for path - no View update will be returned");
                        } 
                        else
                        {
                            // Re-rendered View did not match previously sent View.  Record the new View hash and send the updated View...
                            //
                            context.session.ModuleInstance.viewHash = viewHash;
                            context.response.View = view;
                        }
                    }
                }

            }
            break;
        }
    }
    catch (e)
    {
        // !!! At this point we can tell if this error is UserCodeError, ClientError, or something else, and we
        //     might want to handle this or compose the response differently depending.
        //
        context.response.Error = e.message;
    }

    sendUpdate(this, context, false);
}

// Exposed to page modules (user code)
//

// Exposed via Synchro.showMessage()
//
SynchroApi.prototype.showMessage = function(context, messageBox)
{
    context.response.MessageBox = messageBox;
}

// Exposed via Synchro.navigateToView()
//
// context - the current context
// route - the route to the new view
// params - option dictionary of params, if provided is passed to InitializeViewModel
//
SynchroApi.prototype.navigateToView = function(context, route, params)
{
    var routeModule = this.moduleManager.getModule(route);
    if (routeModule)
    {
        logger.info("Found route module for: " + route);
        logger.info("Navigate to view: " + route);
        populateNewPageResponse(this, route, routeModule, context, params);
    }
    else
    {
        // !!! This is an error we should do something about.  UserCode has requested we navigate to a view that
        //     doesn't exist.
    }
}

// Exposed via Synchro.waitFor()
//
SynchroApi.prototype.waitFor = function(moduleObject, context, args)
{
    logger.info("waitFor...");

    var waitingOnCurrentInstance = true;

    // If we are processing the current client instance (meaning the client has not navigated to a new page/instance
    // since we started processing this request), write local view model to the session ServerViewModel before we
    // yield so that other processors on this instance can pick up any changes we've made relative to the baseline
    // client version of the view model.
    //
    if (isCurrentModuleInstance(context))
    {
        context.session.ModuleInstance.ServerViewModel = lodash.cloneDeep(context.LocalViewModel);
    }
    else
    {
        // !!! Already navigated away before calling waitFor (local ViewModel not synchronized to other processors)
        //
        waitingOnCurrentInstance = false;
    }

    // We need to write the session even if we didn't update the ServerViewModel above, so any other session changes
    // will be properly synchronized with other processors (including, but not limited to, UserData).
    //
    this.sessionStore.putSession(context.session);

    var result = wait.for.apply(moduleObject, args);

    // Session data may have changed while we were yielding (that is the only time that can happen, given the single-
    // threaded nature of the environment).
    //
    context.session = this.sessionStore.getSession(context.session.id);

    // If we are still processing the current instance, get our local view model state back (note that it may have
    // been updated by another processor).
    //
    // Note: We don't have to check for the ServerViewModel, because if we are the current instance now, then we were
    //       also the current module instance before the wait, and would therefore have written the ServerViewModel to
    //       the session. The only way the ServerViewModel could be gone here is if another processor navigated away 
    //       from this instance while we were waiting, and in that case the isCurrentInstance test below would fail.
    //
    if (isCurrentModuleInstance(context))
    {
        // This is a little tricky.  The viewModel passed in to any processing function is actually stored in
        // context.LocalViewModel.ViewModel.  By updating the *contents* of that with the updated view model,
        // it will coincidentally (and magically) update the local viewModel parameter of the calling user-code
        // function (since it's the same object and we're just updating its contents).
        //
        // The magic part, which is potentially creepy, but also kind of cool and pretty much always the proper
        // behavior, is that you can call Synchro.waitFor passing the context in your user-code processing method
        // and your local viewModel will be updated (as appropriate) when it returns, even though you didn't pass
        // it in as a parameter to Synchro.waitFor or otherwise explicitly update it.
        //
        context.LocalViewModel.id = context.session.ModuleInstance.ServerViewModel.id;
        util.assignNewContents(context.LocalViewModel.ViewModel, lodash.cloneDeep(context.session.ModuleInstance.ServerViewModel.ViewModel));
    }
    else if (waitingOnCurrentInstance)
    {
        // !!! Another processor navigated away during wait (local ViewModel not updated from other processors)
        //
    }

    return result;
}

// Exposed via Synchro.interimUpdate()
//
SynchroApi.prototype.interimUpdate = function(context)
{
    logger.info("Interim update...");
    sendUpdate(this, context, true);
}

SynchroApi.prototype.isActiveInstance = function(context) // !!! Test
{
    return isCurrentModuleInstance(context);
}

module.exports = SynchroApi;
