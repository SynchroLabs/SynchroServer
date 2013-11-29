// Counter page
//
exports.View =
{
    title: "Click Counter",
    onBack: "exit",
    elements: 
    [
        { type: "text", value: "Count: {count}", foreground: "{font.color}", fontweight: "{font.weight}", fontsize: 24 },
        { type: "button", caption: "Increment Count!", binding: "increment" },
        { type: "button", caption: "Decrement Count!", binding: "decrement", enabled: "{count}" },
        { type: "button", caption: "Reset Count!", binding: "reset" },
    ]
}

exports.InitializeViewModelState = function(context, session)
{
    var vmState =
    {
        count: 0,
        font: { color: "Green", weight: "Normal" },
    }
    return vmState;
}

exports.OnChange = function(context, session, vmState, source, changes)
{
    if (vmState.count < 10)
    {
        vmState.font = { color: "Green", weight: "Normal" };
    }
    else
    {
        vmState.font = { color: "Red", weight: "Bold" };
    }
}

exports.Commands = 
{
    increment: function(context, session, vmState)
    {
        vmState.count += 1;
    },
    decrement: function(context, session, vmState)
    {
        vmState.count -= 1;
    },
    reset: function(context, session, vmState)
    {
        vmState.count = 0;
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
