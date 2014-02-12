var lodash = require("lodash");

var requireDir = require('require-dir');

var objectMonitor = require('./objectmon');
var util = require('./util');

var routes = requireDir("routes");
for (var routePath in routes) {
    console.log("Found route processor for: " + routePath);
    var route = routes[routePath];
    route.View["path"] = routePath;
}

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
        console.log("Updating bound item for property: " + propertyPath);
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

function processObject(session, obj)
{
    // If the object is a "filter", process it now (promote eligible child, if any)
    if (obj["filter"] && (obj["filter"] instanceof Array))
    {
        var filter = obj["filter"];
        obj = null;

        // For each filter element...
        for (var i = 0; i < filter.length; i++) 
        {
            // If the filter element is an Object (it should be), inspect to see if it meets the criteria
            if (filter[i] && (filter[i] instanceof Object))
            {
                var filterElement = filter[i] 

                if (filterElement["filterOS"] && !equalsOrContains(filterElement["filterOS"], session.DeviceMetrics.os))
                {
                    continue;
                }

                if (filterElement["filterDeviceType"] && !equalsOrContains(filterElement["filterDeviceType"], session.DeviceMetrics.deviceType))
                {
                    continue;
                }

                if (filterElement["filterDeviceClass"] && !equalsOrContains(filterElement["filterDeviceClass"], session.DeviceMetrics.deviceClass))
                {
                    continue;
                }

                // If we get here, we didn't fail to meet any filter criteria, so we won!
                obj = filterElement;
                break;
            }
        }            
    }
    
    if (obj)
    {
        // Iterate properties of object...
        for (var property in obj)
        {
            // Process properties that contain arrays...
            if (obj[property] && (obj[property] instanceof Array))
            {
                // For each array element...
                for (var i = 0; i < obj[property].length; i++) 
                {
                    // If the array element is an Object, recurse into that object...
                    if (obj[property][i] && (obj[property][i] instanceof Object))
                    {
                        obj[property][i] = processObject(session, obj[property][i]);
                    }
                }
                
                // Some of the array elements may now be null (a filter may have produced no valid element), so
                // we want to remove the empy array elements.
                obj[property].clean();
            }
        }
    }

    return obj;
}

function getFilteredView(session, view)
{
    console.log("Applying filter to view");
    return processObject(session, lodash.cloneDeep(view));
}

function fnShowMessage(context, messageBox)
{
    context.response.MessageBox = messageBox;
}
showMessage = fnShowMessage;

// context - the current context
// route - the route to the new view
// params - option dictionary of params, if provided is passed to InitializeViewModel
//
function fnNavigateToView(context, route, params)
{
    var routeModule = routes[route];
    if (routeModule)
    {
        console.log("Found route module for " + route);
        context.session.ViewModel = {};
        if (routeModule.InitializeViewModel)
        {
            console.log("Initializing view model (on nav)");
            context.session.ViewModel = routeModule.InitializeViewModel(context, context.session, params);
        }

        context.response.Path = route;
        context.response.View = getFilteredView(context.session, routeModule.View);
        context.response.ViewModel = context.session.ViewModel;
    }
}
navigateToView = fnNavigateToView;

// Takes a Maaas request object and returns a Maaas response object
//
exports.process = function(session, requestObject)
{
    var context = 
    {
        session: session,
        request: requestObject,
        response: { control: "response", Path: requestObject.Path }
    };

    console.log("Processing path " + context.request.Path);

	var routeModule = routes[context.request.Path];
    if (routeModule)
    {
        var viewModelAfterUpdate = null;

        console.log("Found route module for " + context.request.Path);
        
        // Store device metrics in session if provided
        //
        if (context.request.DeviceMetrics)
        {
            context.session.DeviceMetrics = context.request.DeviceMetrics;
        }

        if (context.request.ViewModelDeltas)
        {
            console.log("ViewModel before deltas: " + context.session.ViewModel);

            // Record the current state of view model so we can diff it after apply the changes from the client,
            // and use that diff to see if there were any changes, so that we can then pass them to the OnChange
            // handler (for the "view" mode, indicating changes that were made by/on the view).
            //
            var viewModelBeforeUpdate = JSON.parse(JSON.stringify(context.session.ViewModel));

            // Now apply the changes from the client...
            for (var i = 0; i < context.request.ViewModelDeltas.length; i++) 
            {
                console.log("View Model change from client - path: " + context.request.ViewModelDeltas[i].path + ", value: " + context.request.ViewModelDeltas[i].value);
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
            console.log("Running command: " + context.request.Command);

            // If no view model updates happened on the client, we need to record the state of the
            // view model now, before we run any commands, so we can diff it after...
            // (this is really "ViewModel after update from client, if any" or "ViewModel before
            // any server code gets a crack at them).
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
            context.session.ViewModel = {};
            if (routeModule.InitializeViewModel)
            {
                console.log("Initializing view model");
                context.session.ViewModel = routeModule.InitializeViewModel(context, context.session);
            }

            context.response.View = getFilteredView(context.session, routeModule.View);
            context.response.ViewModel = session.ViewModel;
        }
    }
    else
    {
        context.response.error = "No route found for command: " + context.request.command;
    }

    return context.response;
}
