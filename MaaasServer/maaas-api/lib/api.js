var lodash = require("lodash");

var objectMonitor = require('./objectmon');
var util = require('./util');

var logger = require('log4js').getLogger("maaas-api");

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

// Public API
//
var MaaasApi = function(moduleManager)
{
    this.appDefinition = null;
    this.moduleManager = moduleManager;
}

MaaasApi.prototype.load = function(err, appDefinition)
{
    // Load the Maaas modules asynchronously...
    //
    try
    {
        logger.info("Launching fiber to load Maaas app...");
        wait.launchFiber(this.moduleManager.loadModules, this, this.onLoadComplete.bind(this)); // Load modules in a fiber - keep node spinning on async module load operations
    }
    catch (err)
    {
        logger.info("Error launching fiber to load Maaas app: " + err);
    }
}

MaaasApi.prototype.onLoadComplete = function(err, appDefinition)
{
    this.appDefinition = appDefinition;
    logger.info("Maaas app load complete for: " + this.appDefinition.name + " - " + this.appDefinition.description);
}

MaaasApi.prototype.getAppDefinition = function()
{
    logger.info("Sending appDefinition: " + this.appDefinition);
    return this.appDefinition;
}

MaaasApi.prototype.reloadModule = function(moduleName)
{
    this.moduleManager.reloadModule(moduleName);
}

MaaasApi.prototype.showMessage = function(context, messageBox)
{
    context.response.MessageBox = messageBox;
}

function populateNewPageResponse(route, routeModule, context, params)
{
    var viewModel = getViewModel(routeModule, context, context.session, params);
    var view = getView(routeModule, context, context.session, viewModel);

    // Build response
    //
    context.response.Path = route;
    context.response.View = view;
    context.response.ViewModel = viewModel;

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
}

// context - the current context
// route - the route to the new view
// params - option dictionary of params, if provided is passed to InitializeViewModel
//
MaaasApi.prototype.navigateToView = function(context, route, params)
{
    var routeModule = this.moduleManager.getModule(route);
    if (routeModule)
    {
        logger.info("Found route module for: " + route);
        logger.info("Navigate to view: " + route);
        populateNewPageResponse(route, routeModule, context, params);
    }
}

// Takes a Maaas request object and returns a Maaas response object
//
MaaasApi.prototype.process = function(session, requestObject)
{
    var context = 
    {
        session: session,
        request: requestObject,
        response: { control: "response", Path: requestObject.Path } // !!! Not sure what "control: response" is intended to do, or if it's needed
    };

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
        var viewModelAfterUpdate = null;

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
            viewModelAfterUpdate = JSON.parse(JSON.stringify(viewModel));

            // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
            //
            if (routeModule.OnViewModelChange)
            {
                // Get the changelist for the callback, but only call if there are any changes
                //
                var viewModelUpdates = objectMonitor.getChangeList(null, viewModelBeforeUpdate, viewModelAfterUpdate);
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
                populateNewPageResponse(route, routeModule, context);
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
                if (!viewModelAfterUpdate)
                {
                    viewModelAfterUpdate = JSON.parse(JSON.stringify(viewModel));
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
                        var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, viewModel);
                        if (viewModelUpdates && (viewModelUpdates.length > 0))
                        {
                            routeModule.OnViewModelChange(context, context.session, viewModel, "command", viewModelUpdates); 
                        }
                    }

                    // Only update the session ViewModel and send back updates if we're staying on this view (path)...
                    //
                    if (context.request.Path == context.response.Path)
                    {
                        context.session.ViewModel = viewModel;
                        var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, viewModel);
                        context.response.ViewModelDeltas = viewModelUpdates;
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
                    if (!viewModelAfterUpdate)
                    {
                        viewModelAfterUpdate = JSON.parse(JSON.stringify(viewModel));
                    }

                    routeModule.OnViewMetricsChange(context, context.session, viewModel);

                    // If we have a view model change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // Get the changelist for the callback, but only call if there are any changes
                        //
                        var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, viewModel);
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

                // Only update the session ViewModel and send back updates if we're staying on this view (path).
                //
                if (context.request.Path == context.response.Path)
                {
                    context.session.ViewModel = viewModel;

                    // We are only going to have the possibility of deltas created by the module if there was an OnViewMetricsChange
                    // handler (and we will have only created viewModelAfterUpdate as the baseline for the diffs in that case).
                    //
                    if (routeModule.OnViewMetricsChange)
                    {
                        var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, viewModel);
                        context.response.ViewModelDeltas = viewModelUpdates;                        
                    }
                }
            }
            break;
        }
    }
    else
    {
        context.response.Error = "No route found for path: " + context.request.Path;
    }

    return context.response;
}

module.exports = MaaasApi;