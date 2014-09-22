var lodash = require("lodash");

var objectMonitor = require('./objectmon');
var util = require('./util');

var logger = require('log4js').getLogger("api");

var wait = require('wait.for');

var filter = require('./filter');


function getViewModel(routeModule, context, session, params)
{
    viewModel = {};
    if (routeModule.InitializeViewModel)
    {
        logger.info("Initializing view model");
        viewModel = routeModule.InitializeViewModel(context, session, params);
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
        view = routeModule.InitializeView(context, session, viewModel, view, isViewMetricUpdate);
    }

    return view;
}

function populateNewPageResponse(synchroApi, route, routeModule, context, params)
{
    var viewModel = getViewModel(routeModule, context, context.session, params);
    var view = getView(routeModule, context, context.session, viewModel);

    // Build response
    //
    context.response.Path = route;
    context.response.View = view;
    context.response.ViewModel = viewModel;

    // Clear out any view model client sync baseline (which. if exists, is now obsolete)
    //
    context.clientViewModel = null;

    // Update session - Note: we're only ever going to use the hash for dynamic views, so no use in computing it otherwise.
    //
    if (view.dynamic)
    {
        context.session.ViewState = { path: route, dynamic: true, viewHash: util.jsonHash(view) };
    }
    else
    {
        context.session.ViewState = { path: route };
    }
    context.session.ViewModel = viewModel;

    if (routeModule.LoadViewModel)
    {
        sendUpdate(synchroApi, context, true);
        routeModule.LoadViewModel(context, context.session, viewModel);
    }
}

function sendUpdate(synchroApi, context, isInterim)
{
    if (isInterim)
    {
        context.response.Update = "Partial"
    }
    else
    {
        delete context.response.Update;
    }

    if (synchroApi.readerWriter.isWritePending(context.session.id))
    {
        // If there is currently a write pending on this channel, no need to take any action here.  Any view model
        // changes made since that original update was posted will still be picked up when it gets sent.
        //
        // If the posted update was a partion/interim and the current update is a final/complete, that will get
        // picked up when the write is satisfied (per the response.Update set above) and will result in a final/complete
        // update being sent.
        //
        logger.error("Update - request already pending, no action taken");
        return;
    }

    // Post the response write
    //
    logger.info("Posting write for session id: " + context.session.id);
    synchroApi.readerWriter.writeAsync(context.session.id, function(err, writeData)
    {
        if (err)
        {
            logger.error("writeAsync err: " + err);  
        }
        else
        {
            logger.info("writeAsync posting to reader");

            // We don't want to create/compute the response until we're ready to send it (which is now), since the 
            // response type or view model could have changed subsequent to when the write was originally posted.
            //
            var response = context.response;

            if (context.clientViewModel)
            {
                var viewModelUpdates = objectMonitor.getChangeList(null, context.clientViewModel, context.session.ViewModel);
                if (viewModelUpdates.length > 0)
                {
                    response.ViewModelDeltas = viewModelUpdates;
                }
                else if (response.ViewModelDeltas)
                {
                    delete response.ViewModelDeltas;
                }
            }

            if (response.Update == "Partial")
            {
                // Update response and view model state in preparation for subsequent update
                //
                context.response = { Path: response.Path }
                context.clientViewModel = JSON.parse(JSON.stringify(context.session.ViewModel));
            }
            else
            {
                context.response = null;
                context.clientViewModel = null;
            }

            writeData(response);                
        }
    });
}

// Public API
//
var SynchroApi = function(moduleManager, readerWriter)
{
    this.appDefinition = null;
    this.moduleManager = moduleManager;
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

SynchroApi.prototype.showMessage = function(context, messageBox)
{
    context.response.MessageBox = messageBox;
}

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
}

// Takes a Synchro request object and returns a Synchro response object
//
SynchroApi.prototype.process = function(session, requestObject, responseObject)
{
    var context = 
    {
        session: session,
        request: requestObject,
        response: responseObject 
    };

    context.response.Path = requestObject.Path;

    logger.info("Processing path " + context.request.Path);

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

    var route = context.request.Path;
	var routeModule = this.moduleManager.getModule(route);
    if (routeModule)
    {
        var viewModel = session.ViewModel; // Use this ViewModel throughout and only store back to session at the end if we're staying on the same page

        logger.info("Found route module for: " + route);
        
        if (context.request.ViewModelDeltas)
        {
            logger.info("ViewModel before deltas: " + viewModel);

            // Record the current state of view model so we can diff it after apply the changes from the client,
            // and use that diff to see if there were any changes, so that we can then pass them to the OnViewModelChange
            // handler (for the "view" mode, indicating changes that were made by/on the view).
            //
            var viewModelBeforeUpdate = JSON.parse(JSON.stringify(viewModel));

            // Now apply the changes from the client...
            for (var i = 0; i < context.request.ViewModelDeltas.length; i++) 
            {
                logger.info("View Model change from client - path: " + context.request.ViewModelDeltas[i].path + ", value: " + context.request.ViewModelDeltas[i].value);
                util.setObjectProperty(viewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);
            }
            
            // Getting this here allows us to track any changes made by server logic (in change notifications or commands)
            //
            context.clientViewModel = JSON.parse(JSON.stringify(viewModel));

            // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
            //
            if (routeModule.OnViewModelChange)
            {
                // Get the changelist for the callback, but only call if there are any changes
                //
                var viewModelUpdates = objectMonitor.getChangeList(null, viewModelBeforeUpdate, context.clientViewModel);
                if (viewModelUpdates && (viewModelUpdates.length > 0))
                {
                    routeModule.OnViewModelChange(context, context.session, viewModel, "view", viewModelUpdates);
                }
            }
        }

        switch (requestObject.Mode)
        {
            case "Page":
            {
                logger.info("Page request for: " + route);
                populateNewPageResponse(this, route, routeModule, context);
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

                // If no view model updates happened on the client, we need to record the state of the
                // view model now, before we run any commands, so we can diff it after...
                // (this is really "ViewModel after update from client, if any" or "ViewModel before
                // any server code gets a crack at them").
                //
                if (!context.clientViewModel)
                {
                    context.clientViewModel = JSON.parse(JSON.stringify(viewModel));
                }

                // Only process command if it exists...
                //
                if (routeModule.Commands && routeModule.Commands[context.request.Command])
                {
                    routeModule.Commands[context.request.Command](context, context.session, viewModel, context.request.Parameters);

                    // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // Get the changelist for the callback, but only call if there are any changes
                        //
                        var viewModelUpdates = objectMonitor.getChangeList(null, context.clientViewModel, viewModel);
                        if (viewModelUpdates && (viewModelUpdates.length > 0))
                        {
                            routeModule.OnViewModelChange(context, context.session, viewModel, "command", viewModelUpdates); 
                        }
                    }
                }
                else
                {
                    context.response.Error = "Command not found: " + context.request.Command;
                }
            }
            break;

            case "ViewUpdate":
            {
                logger.info("View update, orientation is now: " + context.request.ViewMetrics.orientation);

                if (routeModule.OnViewMetricsChange)
                {
                    // If no view model updates happened on the client, we need to record the state of the
                    // view model now, before we run any commands, so we can diff it after...
                    // (this is really "ViewModel after update from client, if any" or "ViewModel before
                    // any server code gets a crack at them").
                    //
                    if (!context.clientViewModel)
                    {
                        context.clientViewModel = JSON.parse(JSON.stringify(viewModel));
                    }

                    routeModule.OnViewMetricsChange(context, context.session, viewModel);

                    // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // Get the changelist for the callback, but only call if there are any changes
                        //
                        var viewModelUpdates = objectMonitor.getChangeList(null, context.clientViewModel, viewModel);
                        if (viewModelUpdates && (viewModelUpdates.length > 0))
                        {
                            routeModule.OnViewModelChange(context, context.session, viewModel, "viewMetrics", viewModelUpdates);
                        }
                    }
                }

                // Only want to do the re-render processing if we haven't navigated away...
                //
                if (context.request.Path == context.response.Path)
                {
                    // If dynamic view, re-render the View...
                    //
                    if (context.session.ViewState.dynamic)
                    {
                        // Note: getView() will call InitializeView if present, and that could potentially navigate to another
                        // page, though that would be a dick move.  But anyway, that's why we have to do the path check again
                        // below, before we update the ViewModel.
                        //
                        var view = getView(routeModule, context, context.session, viewModel, true);

                        // See if the View actually changed, and if so, send the updated View back...
                        //
                        var viewHash = util.jsonHash(view);
                        if (context.session.ViewState.viewHash == viewHash)
                        {
                            logger.info("Regenerated View was the same as previosuly sent View for path - no View update will be returned");
                        } 
                        else
                        {
                            // Re-rendered View did not match previously sent View.  Record the new View hash and send the updated View...
                            //
                            context.session.ViewState.viewHash = viewHash;
                            context.response.View = view;
                        }
                    }
                }

            }
            break;
        }

        // Only update the session ViewModel if we're staying on this view (path).
        //
        if ((requestObject.Mode !== "Page") && (context.request.Path == context.response.Path))
        {
            context.session.ViewModel = viewModel;
        }
    }
    else
    {
        context.response.Error = "No route found for path: " + context.request.Path;
    }

    sendUpdate(this, context, false);
}

SynchroApi.prototype.interimUpdate = function(context)
{
    logger.info("Interim update...");
    sendUpdate(this, context, true);
}

module.exports = SynchroApi;
