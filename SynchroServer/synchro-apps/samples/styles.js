// Styles page
//
exports.View =
{
    title: "Styles",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
            { control: "button", style: "btnStyle", caption: "Blue" },
            { control: "button", style: "btnStyle", caption: "Blue Wider", width: 175, margin: { left: 10 } },
            { control: "button", style: "btnStyle", caption: "White", foreground: "White" },
            { control: "stackpanel", width: "*", contents: [
                { control: "text",  style: "txtStyle", value: "Serif, Bold" },
                { control: "text",  style: "txtStyle", value: "Serif, Italic", font: { bold: false, italic: true } },
                { control: "text",  style: "codeTxtStyle, txtStyle", value: "Mono, bold" },
                { control: "stackpanel", style: "stackStyle", horizontalAlignment: "Center", contents: [
                    { control: "text", fontsize: 14, value: "Left" },
                    { control: "text", fontsize: 14, value: "Right" },
                ] }, 
            ] },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        btnStyle:
        {
            foreground: "CornflowerBlue",
            background: "DarkSlateGray",
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
            fontsize: 12,
            horizontalAlignment: "Center"
        },
        codeTxtStyle:
        {
            font:
            {
                face: "Monospace"
            }
        },
        stackStyle:
        {
            orientation: "Horizontal"
        },
        message: null,
    }
    return viewModel;
}
