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

function getView(routeModule, context, session, viewModel)
{
    var view = {};

    if (routeModule.View)
    {
        view = filter.filterView(session, routeModule.View);
    }

    if (routeModule.InitializeView)
    {
        view = routeModule.InitializeView(context, session, viewModel, view);
    }

    return view;
}

// Public API
//
var MaaasApi = function(moduleManager)
{
    this.appDefinition = null;
    this.moduleManager = moduleManager;

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

// context - the current context
// route - the route to the new view
// params - option dictionary of params, if provided is passed to InitializeViewModel
//
MaaasApi.prototype.navigateToView = function(context, route, params)
{
    var routeModule = this.moduleManager.getModule(route);
    if (routeModule)
    {
        logger.info("Found route module for " + route);

        context.session.ViewModel = getViewModel(routeModule, context, context.session, params);

        context.response.Path = route;
        context.response.View = getView(routeModule, context, context.session, context.session.ViewModel);
        context.response.ViewModel = context.session.ViewModel;
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
        response: { control: "response", Path: requestObject.Path }
    };

    logger.info("Processing path " + context.request.Path);

    // Store device metrics in session if provided (should only be at start of session)
    //
    if (context.request.DeviceMetrics)
    {
        context.session.DeviceMetrics = context.request.DeviceMetrics;
    }

    // Update view metrics in session if provided (happens whenever orientation or other view state changes on client)
    //
    if (context.request.ViewMetrics)
    {
        context.session.ViewMetrics = context.request.ViewMetrics;
    }

	var routeModule = this.moduleManager.getModule(context.request.Path);
    if (routeModule)
    {
        var viewModelAfterUpdate = null;

        logger.info("Found route module for " + context.request.Path);
        
        if (context.request.ViewModelDeltas)
        {
            logger.info("ViewModel before deltas: " + context.session.ViewModel);

            // Record the current state of view model so we can diff it after apply the changes from the client,
            // and use that diff to see if there were any changes, so that we can then pass them to the OnViewModelChange
            // handler (for the "view" mode, indicating changes that were made by/on the view).
            //
            var viewModelBeforeUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));

            // Now apply the changes from the client...
            for (var i = 0; i < context.request.ViewModelDeltas.length; i++) 
            {
                logger.info("View Model change from client - path: " + context.request.ViewModelDeltas[i].path + ", value: " + context.request.ViewModelDeltas[i].value);
                util.setObjectProperty(session.ViewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);
            }
            
            // Getting this here allows us to track any changes made by server logic (in change notifications or commands)
            //
            viewModelAfterUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));

            // If we had changes from the view and we have a change listener for this route, call it.
            if (routeModule.OnViewModelChange)
            {
                // !!! Pass changelist (consistent with command side changelist)
                routeModule.OnViewModelChange(context, context.session, context.session.ViewModel, "view");
            }
        }

        switch (requestObject.Mode)
        {
            case "Page":
            {
                logger.info("Page request: " + context.request.Path);

                context.session.ViewModel = getViewModel(routeModule, context, context.session);
                context.response.View = getView(routeModule, context, context.session, context.session.ViewModel);
                context.response.ViewModel = session.ViewModel;
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
                    viewModelAfterUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));
                }

                // !!! Probably should look up the command first to see if it's there, and fail cleaner if not.
                //
                routeModule.Commands[context.request.Command](context, context.session, context.session.ViewModel, context.request.Parameters);

                // If we have a change listener for this route, analyze changes, and call it as appropriate.
                if (routeModule.OnViewModelChange)
                {
                    // !!! We need to call getChangeList here also, to determine if there were any changes, and
                    //     to construct the changelist for the handler (consistend with the view side changelist).
                    routeModule.OnViewModelChange(context, context.session, context.session.ViewModel, "command");
                }

                // Only send back the view model updates is we're staying on this view (path)...
                if (context.request.Path == context.response.Path)
                {
                    var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, context.session.ViewModel);
                    context.response.ViewModelDeltas = viewModelUpdates;
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
                        viewModelAfterUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));
                    }

                    routeModule.OnViewMetricsChange(context, context.session, context.session.ViewModel);

                    // If we have a change listener for this route, analyze changes, and call it as appropriate.
                    //
                    if (routeModule.OnViewModelChange)
                    {
                        // !!! We need to call getChangeList here also, to determine if there were any changes, and
                        //     to construct the changelist for the handler (consistend with the view side changelist).
                        routeModule.OnViewModelChange(context, context.session, context.session.ViewModel, "viewMetrics");
                    }

                    // Send back the viewmodel changes
                    //
                    var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, context.session.ViewModel);
                    context.response.ViewModelDeltas = viewModelUpdates;
                }

                // !!! If View is dynamic, re-filter it and send it back
            }
            break;
        }
    }
    else
    {
        context.response.error = "No route found for command: " + context.request.command;
    }

    return context.response;
}

module.exports = MaaasApi;