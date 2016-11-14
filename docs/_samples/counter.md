---
title: Counter
---

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
            { control: "button", caption: "Increment", binding: { command: "vary", amount: 1 } },
            { control: "button", caption: "Decrement", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
            { control: "button", caption: "Decrement", binding: "reset", enabled: "{count}" },
            },
        ]
    }

    exports.InitializeViewModel = function(context, session)
    {
        var viewModel =
        {
            count: session.count,
            font: fontStyle.normal
        }
        return viewModel;
    }

    exports.OnViewModelChange = function(context, session, viewModel, source, changes)
    {
        viewModel.font = (viewModel.count < 10) ? fontStyle.normal : fontStyle.highlighted; 
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
