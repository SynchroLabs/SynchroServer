// Font page
//
exports.View =
{
    title: "Font",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", width: 150, caption: "San Serif", binding: { command: "setFace", face: "SanSerif" } },
            { type: "button", width: 130, caption: "Serif", binding: { command: "setFace", face: "Serif" } },
            { type: "button", width: 170, caption: "Monospace", binding: { command: "setFace", face: "Monospace" } },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Size", fontsize: 10, width: 140 },
            { type: "slider", minimum: 10, maximum: 50, binding: "currFont.size", width: 300 },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Bold", fontsize: 10, width: 140 },
            { type: "toggle", binding: "currFont.bold", fontsize: 12 },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "Italic", fontsize: 10, width: 140 },
            { type: "toggle", binding: "currFont.italic", fontsize: 12 },
        ] },

        { type: "text", value: "Testing {currFont.face}", font: { face: "{currFont.face}", size: "{currFont.size}", bold: "{currFont.bold}", italic: "{currFont.italic}" } },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        currFont: 
        {
            face: "Monospace",
            size: 24,
            bold: false,
            italic: false,
        },
    }
    return viewModel;
}

exports.Commands =
{
    setFace: function(context, session, viewModel, params)
    {
        viewModel.currFont.face = params.face;
    },

    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
