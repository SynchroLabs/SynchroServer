---
title: Application Hooks
weight: 7
---

Application hooks provide a mechanism for supplying code that runs before or after a defined [module entry point](module-entry-points) is
called, and do this for every page (module/route) in an application, for the life of the application.

Hooks can be useful for things like ensuring authentication status on every page, or applying app-wide styles to views on every page.

While it is possible to implement hooks as asynchronous generator functions (see: [Asynchronous Processing](asynchronous-processing)),
great care should be exercised in doing so since the hooks are called for every page.

# Supported Application Hook Functions

An application hook is a module that implements one or more of the defined application hook functions, listed below.  The hook functions have
a prefix of "Before" or "After" to indicate whether they are called before or after the hooked function.  The hook functions are called with a
route and routeModule, followed by the same set of parameters passed to the hooked function. 

Note: The application hook functions will be called whether or not the "hooked" function is implemented in the current module.

```
BeforeInitializeViewModel (route, routeModule, context, session, params, state)
```

```
AfterInitializeViewModel (route, routeModule, context, session, params, state, viewModel)
```

```
BeforeInitializeView (route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
```

```
AfterInitializeView (route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
```

```
BeforeLoadViewModel (route, routeModule, context, session, viewModel)
```

```
AfterLoadViewModel (route, routeModule, context, session, viewModel)
```

```
BeforeOnViewMetricsChange (route, routeModule, context, session, viewModel, metrics)
```

```
AfterOnViewMetricsChange (route, routeModule, context, session, viewModel, metrics)
```

```
BeforeOnViewModelChange (route, routeModule, context, session, viewModel, source, changes)
```

```
AfterOnViewModelChange (route, routeModule, context, session, viewModel, source, changes)
```

```
BeforeOnBack (route, routeModule, context, session, viewModel)
```

```
AfterOnBack (route, routeModule, context, session, viewModel)
```

```
BeforeCommand (route, routeModule, command, context, session, viewModel, parameters)
```

```
AfterCommand (route, routeModule, command, context, session, viewModel, parameters)
```

# Installing Application Hooks

Application hooks are installed via the package.json file for the application, in the "hooks" attribute.  The "hooks" attribute can be set
to the module name of the hook, or if more than one hook is installed, an array of module names.

    {
        "name": "synchro-samples",
        "version": "x.x.x",     
        "description": "Synchro API Samples",
        "main": "menu",
        "private": true,
        "engines": { "synchro": "*" },
        "hooks": [ "somehook", "lib/otherhook" ]
    }

If multiple application hooks are installed, they are called in the order they are specified for all "Before" hook functions, and in the reverse order for all "After" hook functions.

# Sample Hook

Following is an application hook that implements every hook function and just logs that it got called:

    // Logging Hook Example
    //
    // This module illustrates the implementation of each supported application hook function, where each of the 
    // hooks simply logs some information about the hook to the console when it is called.
    //

    exports.BeforeInitializeViewModel = function (route, routeModule, context, session, params, state)
    {
        console.log("BeforeInitializeViewModel - route: %s", route);
    }

    exports.AfterInitializeViewModel = function(route, routeModule, context, session, params, state, viewModel)
    {
        console.log("AfterInitializeViewModel - route: %s, viewModel: %s", route, JSON.stringify(viewModel, null, 4));
    }

    exports.BeforeInitializeView = function (route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
    {
        console.log("BeforeInitializeView - route: %s", route);
    }

    exports.AfterInitializeView = function (route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
    {
        console.log("AfterInitializeView - route: %s, view: %s", route, JSON.stringify(view, null, 4));
    }

    exports.BeforeLoadViewModel = function (route, routeModule, context, session, viewModel)
    {
        console.log("BeforeLoadViewModel - route: %s, viewModel: %s", route, JSON.stringify(viewModel, null, 4));
    }

    exports.AfterLoadViewModel = function (route, routeModule, context, session, viewModel)
    {
        console.log("AfterLoadViewModel - route: %s, viewModel: %s", route, JSON.stringify(viewModel, null, 4));
    }

    exports.BeforeOnViewMetricsChange = function (route, routeModule, context, session, viewModel, metrics)
    {
        console.log("BeforeOnViewMetricsChange - route: %s, metrics: %s", route, JSON.stringify(metrics, null, 4));
    }

    exports.AfterOnViewMetricsChange = function (route, routeModule, context, session, viewModel, metrics)
    {
        console.log("AfterOnViewMetricsChange - route: %s, metrics: %s", route, JSON.stringify(metrics, null, 4));
    }

    exports.BeforeOnViewModelChange = function (route, routeModule, context, session, viewModel, source, changes)
    {
        console.log("BeforeOnViewModelChange - route: %s, source: %s", route, source);
    }

    exports.AfterOnViewModelChange = function (route, routeModule, context, session, viewModel, source, changes)
    {
        console.log("AfterOnViewModelChange - route: %s, source: %s", route, source);
    }

    exports.BeforeOnBack = function (route, routeModule, context, session, viewModel)
    {
        console.log("BeforeOnBack - route: %s", route);
    }

    exports.AfterOnBack = function (route, routeModule, context, session, viewModel)
    {
        console.log("AfterOnBack - route: %s", route);
    }

    exports.BeforeCommand = function (route, routeModule, command, context, session, viewModel, parameters)
    {
        console.log("BeforeCommand - route: %s, command: %s", route, command);
    }

    exports.AfterCommand = function (route, routeModule, command, context, session, viewModel, parameters)
    {
        console.log("AfterCommand - route: %s, command: %s", route, command);
    }
     