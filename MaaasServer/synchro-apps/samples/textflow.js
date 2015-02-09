// Text flow page
//
exports.View =
{
    title: "Text flow",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
            { control: "edit", binding: "userText" },
            { control: "text", value: "{userText}", fontsize: 12, width: "*" },
            { control: "rectangle", height: "100", width: "*", fill: "Red", border: "Blue", borderThickness: 5 },
            ]
        }
    ]
}

exports.InitializeViewModel = function (context, session) {
    var viewModel =
    {
        userText: "Sample Text"
    }
    return viewModel;
}
