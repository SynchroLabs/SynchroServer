// Text flow page
//
var maaas = require('../maaas');

exports.View =
{
    title: "Text flow",
    onBack: "exit",
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

exports.Commands =
{
    exit: function (context) {
        return maaas.navigateToView(context, "menu");
    },
}
