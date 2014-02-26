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

        // Toolbar support for ther various platforms
        //
        { select: "First", contents: [
            { select: "All", filterOS: "Windows", contents: [
                { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: "increment" },
                { control: "commandBar.button", text: "Subtract", icon: "Remove", commandBar: "Bottom", commandType: "Secondary", binding: "decrement", enabled: "{count}" },
                { control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
                ]},
            { select: "All", filterOS: "WinPhone", contents: [
                { control: "appBar.button", text: "Add", icon: "add",  binding: "increment" },
                { control: "appBar.button", text: "Subtract", icon: "minus", binding: "decrement", enabled: "{count}" },
                { control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
                ]},
            { select: "All", filterOS: "Android", contents: [
                { control: "actionBar.item", text: "Add", binding: "increment" },
                { control: "actionBar.item", text: "Subtract", binding: "decrement", enabled: "{count}" },
                { control: "actionBar.item", text: "Reset", icon: "ic_action_refresh", showAsAction: "IfRoom", binding: "reset", enabled: "{count}" },
                ]},
            { select: "All", filterOS: "iOS", contents: [
                { control: "navBar.button", systemItem: "Trash", binding: "reset", enabled: "{count}" },
                { control: "toolBar.button", text: "Add", icon: "plus-symbol-mini", binding: "increment" },
                { control: "toolBar.button", text: "Subtract", icon: "minus-symbol-mini", binding: "decrement", enabled: "{count}" },
                ]},
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
