﻿// Hello page
//
exports.View =
{
    title: "Hello World",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "First name:", fontsize: 12, width: 200, textAlignment: "Right", margin: { top: 10, right: 10 } },
            { control: "edit", fontsize: 12, width: 200, binding: "firstName" },
        ] },
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Last name:", fontsize: 12, width: 200, textAlignment: "Right", margin: { top: 10, right: 10 } },
            { control: "edit", fontsize: 12, width: 200, binding: "lastName" },
        ] },

        { control: "text", value: "Hello {firstName} {lastName}", fontsize: 12 },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        firstName: "Planet",
        lastName: "Earth",
    }
    return viewModel;
}
