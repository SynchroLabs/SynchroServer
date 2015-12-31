// Styles test page
//
var styles = require("synchro-api/style-helper");

var appStyles = require("./lib/app_styles");

exports.View =
{
    title: "Styles",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
            { control: "button", caption: "Blue" }, // default app style of btnStyle will be applied
            { control: "button", style: "btnStyle", caption: "Blue Wider", width: 175, margin: { left: 10 } },
            { control: "button", style: "btnStyle", caption: "White", foreground: "White" },
            { control: "stackpanel", width: "*", contents: [
                { control: "text",  style: "txtStyle", value: "Serif, Bold" },
                { control: "text",  style: "txtStyle", value: "Serif, Italic", font: { bold: false, italic: true } },
                { control: "text",  style: "codeTxtStyle", value: "Mono, bold" }, // default app style of txtStyle will be added
                { control: "stackpanel", style: "stackStyle", horizontalAlignment: "Center", contents: [
                    { control: "text", fontsize: 10, value: "Left" },      // default app style of txtStyle will be applied
                    { control: "text", fontsize: 10, value: "{message}" }, // default app style of txtStyle will be applied
                    { control: "text", fontsize: 10, value: "Right" },     // default app style of txtStyle will be applied
                ] }, 
            ] },
        ] },
    ]
}

exports.InitializeView = function(context, session, viewModel, view, metrics, isViewMetricUpdate)
{
    styles.processViewAndViewModelStyles(viewModel, view, metrics, appStyles.defaultStyleMapping, appStyles.styles);
    return view;
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        // Styles (individual settings will override any cooresponding app style settings)
        //
        btnStyle:
        {
            margin: { left: 35 },
            width: 125
        },
        txtStyle:
        {
            font:
            {
                face: "Serif",
                bold: true
            },
            horizontalAlignment: "Center"
        },
        codeTxtStyle:
        {
            font:
            {
                face: "Monospace"
            }
        },
        // Data
        //
        message: "Test"
    }

    return viewModel;
}
