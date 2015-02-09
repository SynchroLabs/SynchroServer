// Fill layout page
//
exports.View =
{
    title: "Fill",
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
