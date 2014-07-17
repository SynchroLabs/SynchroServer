var lodash = require("lodash");

var objectMonitor = require('./objectmon');
var util = require('./util');

var logger = require('log4js').getLogger("maaas-api");

var wait = require('wait.for');

function getObjectProperty(obj, propertyPath)
{
    propertyPath = propertyPath.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    var parts = propertyPath.split('.'),
        last = parts.pop(),
        len = parts.length,
        i = 1,
        current = parts[0];

    if (len > 0)
    {
        while ((obj = obj[current]) && i < len)
        {
            current = parts[i];
            i++;
        }
    }

    if (obj)
    {
        return obj[last];
    }
}

function setObjectProperty(obj, propertyPath, value)
{
    propertyPath = propertyPath.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    var parts = propertyPath.split('.'),
        last = parts.pop(),
        len = parts.length,
        i = 1,
        current = parts[0];

    if (len > 0)
    {
        while ((obj = obj[current]) && i < len)
        {
            current = parts[i];
            i++;
        }
    }
    
    if (obj)
    {
        logger.info("Updating bound item for property: " + propertyPath);
        obj[last] = value;
        return obj[last];
    }
}

function equalsOrContains(haystack, needle)
{
    if (haystack instanceof Array)
    {
        for (var i = 0; i < haystack.length; i++) 
        {
            if (haystack[i] == needle)
            {
                return true;
            }
        }
        return false;
    }
    else
    {
        return haystack == needle;
    }
}

// Return false if any provided filter criteria is not met, otherwise true
//
function filterObject(session, obj)
{
    if (obj["filterOS"] && !equalsOrContains(obj["filterOS"], session.DeviceMetrics.os))
    {
        return false;
    }

    if (obj["filterDeviceType"] && !equalsOrContains(obj["filterDeviceType"], session.DeviceMetrics.deviceType))
    {
        return false;
    }

    if (obj["filterDeviceClass"] && !equalsOrContains(obj["filterDeviceClass"], session.DeviceMetrics.deviceClass))
    {
        return false;
    }

    // If we get here, we didn't fail to meet any filter criteria, so we won!
    return true;
}

function processSelectFirst(session, obj, containingArray)
{
    // If the object is a select:First, process it now - promote first qualifying child, if any
    //
    if (obj["select"] == "First")
    {
        if (obj["contents"] && (obj["contents"] instanceof Array) && (obj["contents"].length > 0))
        {
            for (var i = 0; i < obj["contents"].length; i++) 
            {
                // Return the first qualifying child
                var childObj = obj["contents"][i];
                if (filterObject(session, childObj))
                {
                    return processSelectFirst(session, childObj);
                }
            }
        }

        return null;
    }

    return processObject(session, obj); // Not a select:First
}

function processSelectAll(obj, containingArray)
{
    // If the object is a select:All, process it now - promote all children by adding them to the containing array
    //
    if (obj["select"] == "All")
    {
        if (obj["contents"] && (obj["contents"] instanceof Array))
        {
            for (var i = 0; i < obj["contents"].length; i++) 
            {
                containingArray.push(obj["contents"][i]);
            }
        }
    }
    else
    {
        // Not a select:All, just add object itself to the containing array
        containingArray.push(obj);
    }
}

function processObject(session, obj)
{    
    if (!filterObject(session, obj))
    {
        return null;
    }

    if (obj)
    {
        // Iterate properties of object...
        for (var property in obj)
        {
            // Process properties that contain arrays...
            if (obj[property] && (obj[property] instanceof Array))
            {
                var newArray = [];

                // For each array element...
                for (var i = 0; i < obj[property].length; i++) 
                {
                    // If the array element is an Object, process that object...
                    if (obj[property][i] && (obj[property][i] instanceof Object))
                    {
                        var childObj = processSelectFirst(session, obj[property][i], newArray);
                        if (childObj)
                        {
                            processSelectAll(childObj, newArray);
                        }
                    }
                }
                
                obj[property] = newArray;
            }
        }
    }

    return obj;
}

function getFilteredView(session, view)
{
    logger.info("Applying filter to view");
    return processObject(session, lodash.cloneDeep(view));
}

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
        view = getFilteredView(session, routeModule.View);
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

	var routeModule = this.moduleManager.getModule(context.request.Path);
    if (routeModule)
    {
        var viewModelAfterUpdate = null;

        logger.info("Found route module for " + context.request.Path);
        
        // Store device metrics in session if provided
        //
        if (context.request.DeviceMetrics)
        {
            context.session.DeviceMetrics = context.request.DeviceMetrics;
        }

        if (context.request.ViewModelDeltas)
        {
            logger.info("ViewModel before deltas: " + context.session.ViewModel);

            // Record the current state of view model so we can diff it after apply the changes from the client,
            // and use that diff to see if there were any changes, so that we can then pass them to the OnChange
            // handler (for the "view" mode, indicating changes that were made by/on the view).
            //
            var viewModelBeforeUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));

            // Now apply the changes from the client...
            for (var i = 0; i < context.request.ViewModelDeltas.length; i++) 
            {
                logger.info("View Model change from client - path: " + context.request.ViewModelDeltas[i].path + ", value: " + context.request.ViewModelDeltas[i].value);
                setObjectProperty(session.ViewModel, context.request.ViewModelDeltas[i].path, context.request.ViewModelDeltas[i].value);
            }
            
            // Getting this here allows us to track any changes made by server logic (in change notifications or commands)
            //
            viewModelAfterUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));

            // If we had changes from the view and we have a change listener for this route, call it.
            if (routeModule.OnChange)
            {
                // !!! Pass changelist (consistent with command side changelist)
                routeModule.OnChange(context, context.session, context.session.ViewModel, "view");
            }
        }

		if (requestObject.Command)
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

            routeModule.Commands[context.request.Command](context, context.session, context.session.ViewModel, context.request.Parameters);

            // If we have a change listener for this route, analyze changes, and call it as appropriate.
            if (routeModule.OnChange)
            {
                // !!! We need to call getChangeList here also, to determine if there were any changes, and
                //     to construct the changelist for the handler (consistend with the view side changelist).
                routeModule.OnChange(context, context.session, context.session.ViewModel, "command");
            }

            // Only send back the view model updates is we're staying on this view (path)...
            if (context.request.Path == context.response.Path)
            {
                var viewModelUpdates = objectMonitor.getChangeList(null, viewModelAfterUpdate, context.session.ViewModel);
                context.response.ViewModelDeltas = viewModelUpdates;
            }
        }
        else
        {
            context.session.ViewModel = getViewModel(routeModule, context, context.session);

            context.response.View = getView(routeModule, context, context.session, context.session.ViewModel);
            context.response.ViewModel = session.ViewModel;
        }
    }
    else
    {
        context.response.error = "No route found for command: " + context.request.command;
    }

    return context.response;
}

module.exports = MaaasApi;