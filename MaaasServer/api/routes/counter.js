// Counter page
//
exports.View =
{
    title: "Click Counter",
    onBack: "exit",
    elements: 
    [
        { type: "text", value: "Count: {count}", foreground: "{font.color}", font: { size: 24, bold: "{font.isBold}" } },
        { type: "button", caption: "Increment Count", binding: "increment" },
        { type: "button", caption: "Decrement Count", binding: "decrement", enabled: "{count}" },
        { type: "button", caption: "Reset Count", binding: "reset" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        count: 0,
        font: { color: "Green", isBold: false },
    }
    return viewModel;
}

exports.OnChange = function(context, session, viewModel, source, changes)
{
    if (viewModel.count < 10)
    {
        viewModel.font = { color: "Green", isBold: false };
    }
    else
    {
        viewModel.font = { color: "Red", isBold: true };
    }
}

exports.Commands = 
{
    increment: function(context, session, viewModel)
    {
        viewModel.count += 1;
    },
    decrement: function(context, session, viewModel)
    {
        viewModel.count -= 1;
    },
    reset: function(context, session, viewModel)
    {
        viewModel.count = 0;
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
