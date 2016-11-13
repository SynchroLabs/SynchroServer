---
title: Application Model
weight: 1
---

Consider the sample application __Counter__, shown below. This application displays a count, with buttons to increment, decrement, and 
reset the count. The decrement and reset buttons are only enabled if the count is greater than zero. The count value is displayed in
green with a normal font weight unless the count is greater than or equal to 10, in which case the count is displayed in red and bold.

![Counter Screen]({{ site.baseurl }}/assets/img/win_counter.png)

This is the Synchro code for the __Counter__ sample app:

    // Counter page
    //
    var fontStyle = 
    {
        normal: { color: "Green", isBold: false },
        highlighted: { color: "Red", isBold: true }
    }

    exports.View =
    {
        title: "Click Counter",
        elements: 
        [
            { control: "text", value: "Count: {count}", color: "{font.color}", font: { size: 24, bold: "{font.isBold}" } },
            { control: "button", caption: "Increment Count", binding: { command: "vary", amount: 1 } },
            { control: "button", caption: "Decrement Count", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
            { control: "button", caption: "Reset Count", binding: "reset", enabled: "{count}" },
        ]
    }

    exports.InitializeViewModel = function(context, session, params)
    {
        var viewModel =
        {
            count: 0,
            font: fontStyle.normal,
        }
        return viewModel;
    }

    exports.Commands = 
    {
        vary: function(context, session, viewModel, params)
        {
            viewModel.count += params.amount;
        },
        reset: function(context, session, viewModel)
        {
            viewModel.count = 0;
        },
    }

    exports.OnViewModelChange = function(context, session, viewModel, source, changes)
    {
        viewModel.font = (viewModel.count < 10) ? fontStyle.normal : fontStyle.highlighted; 
    }

Now let's break down what is happening here. Note that for the purpose of this explanation, we will refer to the unit of functionality 
expressed above as a "page", and the instance of this code running on the Synchro server as the "page module".

The page above provides a view, view model data, view model commands, and view model update notifications. We'll discuss how these 
elements fit into the application model below.

In our sample, we declare some module variables, as shown below.

    var fontStyle = 
    {
        normal: { color: "Green", isBold: false },
        highlighted: { color: "Red", isBold: true }
    }

It is important to note that there is __no module state__ of any kind (the module may very well even be unloaded and reloaded, and possibly
even updated, during any given session). Any local module variables should be used as if they were static, as we have done here. The only
state available to the page module is provided via the `session` and `viewModel` parameters passed to the various callback methods.

When the client requests a page, the first action taken by the Synchro server is to get initial view model data for the page via the page's
`exports.InitializeViewModel` method.

    exports.InitializeViewModel = function(context, session, params)
    {
        var viewModel =
        {
            count: 0,
            font: fontStyle.normal,
        }
        return viewModel;
    }

The Synchro server then retrieves the view specification for the page via `exports.View`, and applies any Layout Filtering or (optional) view
initialization logic to that view specification.

    exports.View =
    {
        title: "Click Counter",
        elements: 
        [
            { control: "text", value: "Count: {count}", color: "{font.color}", font: { size: 24, bold: "{font.isBold}" } },
            { control: "button", caption: "Increment Count", binding: { command: "vary", amount: 1 } },
            { control: "button", caption: "Decrement Count", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
            { control: "button", caption: "Reset Count", binding: "reset", enabled: "{count}" },
        ]
    }

Once the Synchro server has the view specification (filtered for the client, as appropriate) and the initial view model data, it sends that
information to the client, and the client can then render the view and begin allowing the user to interact with it.

Various user interactions can trigger view model commands. In our example, the user clicking any of the buttons will trigger a command. The
view model commands are packaged together and exposed via the `exports.Commands` object.

    exports.Commands = 
    {
        vary: function(context, session, viewModel, params)
        {
            viewModel.count += params.amount;
        },
        reset: function(context, session, viewModel)
        {
            viewModel.count = 0;
        },
    }

When view model data is changed by the client, the server is notified via the `exports.OnChange` method, allowing the page module to take action
based on the change, before any commands are executed. The `source` parameter will contain the value "view" in this case (the view was the source
of the change).

When view model data is changed by the execution of a page module command, the `exports.OnChange` method is also called, in this case with a `source`
parameter value of "command" (a command was the source of the change). It should be noted that the command could simply apply its own post
processing, but this call is provided as a convenience to allow centralized handling of view model data changes in one place. For example, in
the counter sample we want to set the font based on the count without having to do this from each command that might have modified the count.

    exports.OnViewModelChange = function(context, session, viewModel, source, changes)
    {
        viewModel.font = (viewModel.count < 10) ? fontStyle.normal : fontStyle.highlighted; 
    }

See the complete list of [Module Entry Points](module-entry-points) for more details on these and other module functions, including their parameters
and operation.
