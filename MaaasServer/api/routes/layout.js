// Layout page
//
exports.View =
{
    title: "Border",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Border", fontsize: 10, width: 140, foreground: "Red" },
            { type: "slider", minimum: 0, maximum: 20, binding: "border", width: 300 },
        ] },
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Radius", fontsize: 10, width: 140, foreground: "Red" },
            { type: "slider", minimum: 0, maximum: 20, binding: "radius", width: 300 },
        ] },
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Padding", fontsize: 10, width: 140, foreground: "Blue" },
            { type: "slider", minimum: 0, maximum: 20, binding: "padding", width: 300 },
        ] },
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Content", fontsize: 10, width: 140, foreground: "Green" },
            { type: "slider", minimum: 0, maximum: 300, binding: "content", width: 300 },
        ] },
        { type: "border", alignContentV: "Bottom", alignContentH: "Right", border: "Red", borderThickness: "{border}", cornerRadius: "{radius}", padding: "{padding}", background: "Blue", contents: [
            { type: "rectangle", width: "{content}", height: "{content}", fill: "Green" },
        ] },
        { type: "border", background: "Gray", padding: 20, contents: [
            { type: "text", fontsize: 10, value: "Control below" },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        border: 10,
        radius: 5,
        padding: 20,
        content: 150,
    }
    return viewModel;
}

exports.Commands =
{
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
