// Stackpanel page
//
var maaas = require('../maaas');

exports.View =
{
    title: "StackPanel",
    onBack: "exit",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Padding", fontsize: 10, width: 140 },
            { control: "slider", minimum: 0, maximum: 20, binding: "padding", width: 300 },
        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Margin", fontsize: 10, width: 140 },
            { control: "slider", minimum: 0, maximum: 20, binding: "margin", width: 300 },
        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "button", caption: "Horizontal", binding: { command: "setOrientation", orientation: "Horizontal" } },
            { control: "button", caption: "Vertical", binding: { command: "setOrientation", orientation: "Vertical" } },
        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "button", width: 150, caption: "Top", binding: { command: "setVAlign", align: "Top" } },
            { control: "button", width: 150, caption: "Center", binding: { command: "setVAlign", align: "Center" } },
            { control: "button", width: 150, caption: "Bottom", binding: { command: "setVAlign", align: "Bottom" } },
        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "button", width: 150, caption: "Left", binding: { command: "setHAlign", align: "Left" } },
            { control: "button", width: 150, caption: "Center", binding: { command: "setHAlign", align: "Center" } },
            { control: "button", width: 150, caption: "Right", binding: { command: "setHAlign", align: "Right" } },
        ] },

        { control: "border", border: "Gray", borderThickness: "5", contents: [
            { control: "stackpanel", background: "Red", padding: "{padding}", orientation: "{orientation}", alignContentH: "{alignContentH}", alignContentV: "{alignContentV}", contents: [
                { control: "button", caption: "Button", width: 125, margin: "{margin}" },
                { control: "button", caption: "Tall and Fat", height: 150, width: 250 },
            ] },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        padding: 0,
        margin: 0,
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
        return maaas.navigateToView(context, "menu");
    },
}
