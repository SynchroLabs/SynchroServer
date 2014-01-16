// Stackpanel page
//
exports.View =
{
    title: "StackPanel",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Padding", fontsize: 10, width: 140 },
            { type: "slider", minimum: 0, maximum: 20, binding: "padding", width: 300 },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", caption: "Horizontal", binding: { command: "setOrientation", orientation: "Horizontal" } },
            { type: "button", caption: "Vertical", binding: { command: "setOrientation", orientation: "Vertical" } },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", width: 150, caption: "Top", binding: { command: "setVAlign", align: "Top" } },
            { type: "button", width: 150, caption: "Center", binding: { command: "setVAlign", align: "Center" } },
            { type: "button", width: 150, caption: "Bottom", binding: { command: "setVAlign", align: "Bottom" } },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", width: 150, caption: "Left", binding: { command: "setHAlign", align: "Left" } },
            { type: "button", width: 150, caption: "Center", binding: { command: "setHAlign", align: "Center" } },
            { type: "button", width: 150, caption: "Right", binding: { command: "setHAlign", align: "Right" } },
        ] },

        { type: "border", border: "Gray", borderThickness: "5", padding: "{padding}", contents: [
            { type: "stackpanel", background: "Red", orientation: "{orientation}", alignContentH: "{alignContentH}", alignContentV: "{alignContentV}", contents: [
                { type: "button", caption: "Button", width: 125 },
                { type: "button", caption: "Tall and Fat", height: 150, width: 250 },
            ] },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        padding: 0,
        orientation: "Horizontal",
        alignContentH: "Left",
        alignContentV: "Top",
    }
    return viewModel;
}

exports.Commands =
{
    setOrientation: function(context, session, viewModel, params)
    {
        viewModel.orientation = params.orientation;
    },
    setVAlign: function(context, session, viewModel, params)
    {
        viewModel.alignContentV = params.align;
    },
    setHAlign: function(context, session, viewModel, params)
    {
        viewModel.alignContentH = params.align;
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
