// Image page
//
exports.View =
{
    title: "Image",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Size", fontsize: 10, width: 140, verticalAlignment: "Center" },
            { control: "slider", minimum: 10, maximum: 400, binding: "size", width: 300, verticalAlignment: "Center" },
            ]
        },
        { control: "image", resource: "http://blob.synchro.io/resources/user.png", height: "{size}", width: "{size}" },
    ]
}

exports.InitializeViewModel = function (context, session)
{
    var viewModel =
    {
        size: 100,
    }
    return viewModel;
}

