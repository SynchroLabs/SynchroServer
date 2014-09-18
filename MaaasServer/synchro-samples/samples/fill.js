// Fill layout page
//
exports.View =
{
    title: "Fill",
    onBack: "exit",
    elements:
    [
        { control: "rectangle", height: "*", width: "*", fill: "Red", border: "Blue", borderThickness: 5 },
    ]
}

exports.InitializeViewModel = function (context, session) {
    var viewModel =
    {
    }
    return viewModel;
}

exports.Commands =
{
    exit: function (context) 
    {
        return Synchro.navigateToView(context, "menu");
    },
}
