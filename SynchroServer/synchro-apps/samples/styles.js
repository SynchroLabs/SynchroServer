// Styles page
//
exports.View =
{
    title: "Buttons",
    elements:
    [
        { control: "button", style: "btnStyle", caption: "Blue" },
        { control: "button", style: "btnStyle", caption: "Blue Wider", width: 175, margin: { left: 10 } },
        { control: "button", style: "btnStyle", caption: "White", foreground: "White" },
        { control: "text",  style: "txtStyle", value: "Serif, Bold" },
        { control: "text",  style: "txtStyle", value: "Serif, Italic", font: { bold: false, italic: true } },
        { control: "text",  style: "codeTxtStyle, txtStyle", value: "Mono, bold" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        btnStyle:
        {
            foreground: "CornflowerBlue",
            background: "Black",
            margin: { left: 35 },
            width: 125
        },
        txtStyle:
        {
            font:
            {
                face: "Serif",
                bold: true
            }
        },
        codeTxtStyle:
        {
            font:
            {
                face: "Monospace"
            }
        },
        message: null,
    }
    return viewModel;
}
