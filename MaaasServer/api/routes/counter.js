// Counter page
//
exports.View =
{
    title: "Click Counter",
    onBack: "exit",
    elements: 
    [
        { type: "text", value: "Count: {count}", foreground: "{font.color}", fontweight: "{font.weight}", fontsize: 24 },
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
        font: { color: "Green", weight: "Normal" },
    }
    return viewModel;
}

exports.OnChange = function(context, session, viewModel, source, changes)
{
    if (viewModel.count < 10)
    {
        viewModel.font = { color: "Green", weight: "Normal" };
    }
    else
    {
        viewModel.font = { color: "Red", weight: "Bold" };
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
