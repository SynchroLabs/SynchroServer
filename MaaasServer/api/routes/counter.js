// Counter page
//
exports.View =
{
    title: "Click Counter",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Count: {count}", foreground: "{font.color}", font: { size: 24, bold: "{font.isBold}" } },
        { control: "button", caption: "Increment Count", binding: "increment" },
        { control: "button", caption: "Decrement Count", binding: "decrement", enabled: "{count}" },
        { filter: [
            { filterOS: "Windows", control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
            { filterOS: "WinPhone", control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
            { filterOS: "Android", control: "actionBar.item", text: "Reset", binding: "reset" },
            { control: "button", caption: "Reset Count", binding: "reset" },
            ]},
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
