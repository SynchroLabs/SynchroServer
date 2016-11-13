---
title: Built-in Helper Functions
weight: 3
---

Synchro provides a number of built-in commands in the Synchro namespace. These are automatically made accessible to Synchro modules (no 
"require" is necessary).

# Synchro.getResourceUrl

    Synchro.getResourceUrl(resource)

`getResourceUrl` uses the resource mapper provided in the Synchro application configuration to resolve resource names to full URLs that
can be used to access those resources.

# Synchro.navigateTo

    Synchro.navigateTo(context, route, params)

`navigateToView` navigates between Synchro views. The `route` describes the path to the desired view, and `params`, if present, is an object
that is passed to the IntializeViewModel function of the module being navigated to.

For more details, see [Navigation Support](navigation-support).

# Synchro.pushAndNavigateTo

    Synchro.pushAndNavigateTo(context, route, params, state)

`pushAndNavigateToView` navigates between Synchro views. It works like `navigateTo`, except that is also pushes the current view on to the
back stack, so that it can be accessed later using `Synchro.pop` or `Synchro.popTo`. In addition, any `state` provided will be passed to the
InitializeViewModel function of this view when it is navigated back to via `Synchro.pop` or `Synchro.popTo`.

For more details, see [Navigation Support](navigation-support).

# Synchro.pop

    Synchro.pop(context)

`pop` navigates to the most recent view stored on the back stack.

For more details, see [Navigation Support](navigation-support).

# Synchro.popTo

    Synchro.popTo(context, route)

`popTo` navigates to the most recent view stored on the back stack which has a route matching the supplied `route`.

For more details, see [Navigation Support](navigation-support).

# Synchro.showMessage

    Synchro.showMessage(context, messageBox)

`showMessage` causes the client device to show a message using the native message/alert mechanism on the device. Below is an example 
showing the components of the messageBox:

    {
        title: "Caption",
        message: "This is the message",
        options:
        [
            { label: "Ok", command: "doOK" },
            { label: "Cancel" }
        ]
    }

The `title` is optional. The `options` are also optional. If no `options` are provided, the message box will have a single Close button
that dismisses the message box. Up to three options may be provided. Each option will generate a button with a label as specified in
the `label` attribute of the option. An option with a `command` attribute will result in the message box being dismissed and that command
issued when the corresponding button is clicked. An option without a command attribute result in a button that simply dismisses the
message box.

# Synchro.launchUrl

    Synchro.launchUrl(context, primaryUrl, secondaryUrl)

`launchUrl` will attempt to launch the provided primary URL. If that fails, typically because there is no handler for the URL scheme,
and if a secondary URL is provided, then the secondary URL will be launched.

One common use case would be to try to launch a custom scheme URL, like twitter://user?screen_name=foo, to launch the Twitter app (if
installed). If not, you could fall back to a seconday URL to launch the Twitter page in the browser, like http://twitter.com/foo.

# Synchro.yieldAwaitable

    yield Synchro.yieldAwaitable(context, yieldable)

`yieldAwaitable` allows for asynchronous processing of any object that the [co](https://www.npmjs.com/package/co) library considers
[yieldable](https://www.npmjs.com/package/co#yieldables) (in practice this will often be a thunk wrapping a 
[Node-style async completion callback](http://thenodeway.io/posts/understanding-error-first-callbacks/), and can also be a Promise 
or a generator function, among other things).

If the yielded object or async function returns an error, that error will be thrown by `yieldAwaitable`, otherwise `yieldAwaitable`
will return any result produced by the yieldable (via the completion callback, Promise result, etc).

__Note: `yieldAwaitable` is an asynchronous generator function. It may only be called from an asynchronous generator function, and it must
be preceded by the keyword "yield".__

For more details, see [Asynchronous Processing](asynchronous-processing).

# Synchro.interimUpdateAwaitable

    yield Synchro.interimUpdateAwaitable(context)

`interimUpdateAwaitable` provides a partial viewModel update back to the client, while allowing the server module to continue processing.
It is important to call `interimUpdateAwaitable` in most cases before invoking an async or long running call using `yieldAwaitable`,
typically with some indicator in the ViewModel that will communicate the waiting state back to the user's View.

__Note: interimUpdatedAwaitable is an asynchronous generator function. It may only be called from an asynchronous generator function, and it
must be preceded by the keyword "yield".__

For more details, see [Asynchronous Processing](asynchronous-processing).

# Synchro.isActiveInstance

    Synchro.isActiveInstance(context)

`isActiveInstance` indicates whether the page/instance being processed is the active instance. If it returns `false`, that means that the
instance that the calling code is processing is not current (has been navigated away from). In this case, no viewModel updates will be
sent to the client.

If your async processing is incremental, such that you are calling `yieldAwaitable` in a loop, then you should check `isActiveInstance` each
time through the loop, and if it returns false, you should abandon the loop (as any further processing on behalf of the obsolete page/instance
is not useful)

For more details, see [Asynchronous Processing](asynchronous-processing).

# Synchro.getMetrics

    Synchro.getMetrics(context)

`getMetrics` returns a `metrics` object containing `DeviceMetrics` and `ViewMetrics`.

For more details, see [Device and View Metrics](device-and-view-metrics).

# Synchro.getConfig

    Synchro.getConfig(context, key)

`getConfig` will return a value representing the application-level configuration defined for the provided `key`.

Please see the Application Configuration section of [Server Configuration](server-configuration) for more details on setting application
configuration values.
