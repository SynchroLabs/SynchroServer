﻿// Layout page
//
exports.View =
{
    title: "Border",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Border", fontsize: 10, width: 140, foreground: "Red", verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 20, binding: "border", width: 300, verticalAlignment: "Center" },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Radius", fontsize: 10, width: 140, foreground: "Red", verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 20, binding: "radius", width: 300, verticalAlignment: "Center" },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Padding", fontsize: 10, width: 140, foreground: "Blue", verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 20, binding: "padding", width: 300, verticalAlignment: "Center" },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Content", fontsize: 10, width: 140, foreground: "Green", verticalAlignment: "Center" },
            { control: "slider", minimum: 0, maximum: 300, binding: "content", width: 300, verticalAlignment: "Center" },
        ] },
        { control: "border", border: "Red", borderThickness: "{border}", cornerRadius: "{radius}", padding: "{padding}", background: "Blue", contents: [              
            { control: "rectangle", width: "{content}", height: "{content}", fill: "Green", margin: 0 },
        ] },
        { control: "border", background: "Gray", padding: 20, contents: [
            { control: "text", fontsize: 10, value: "Control below" },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        border: 10,
        radius: 5,
        padding: 20,
        content: 150,
    }
    return viewModel;
}
