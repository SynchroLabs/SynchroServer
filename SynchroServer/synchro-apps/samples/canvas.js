// Image scaling page
//
exports.View =
{
    title: "Canvas",
    elements:
    [
        { control: "canvas", width: "*", height: "300", contents: [
            { control: "rectangle", width: "100", height: "100", left: "{redLeft}", top: "{redTop}s", fill: "Red", margin: 0 },
            { control: "rectangle", width: "100", height: "100", left: "100", top: "100",fill: "Green", margin: 0 },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Red Left", fontsize: 10, width: 140, verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 200, binding: "redLeft", width: 300, verticalAlignment: "Center" },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Red Top", fontsize: 10, width: 140, verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 200, binding: "redTop", width: 300, verticalAlignment: "Center" },
        ] },
    ]
}

exports.InitializeViewModel = function (context, session)
{
    var viewModel =
    {
        redLeft: 50,
        redTop: 50
    }
    return viewModel;
}

exports.Commands =
{
}
