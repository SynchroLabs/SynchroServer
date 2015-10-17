﻿// Sandbox page
//
var userImage =  "http://blob.synchro.io/resources/user.png";
var profileImage = "http://blob.synchro.io/resources/cloud_system_256.png";

exports.View =
{
    title: "Sandbox",
    elements:
    [
        { control: "border", border: "Blue", borderthickness: "5", contents: [
            { control: "scrollview", orientation: "Horizontal", height: 150, width: 150, contents: [
                { control: "image", height: 300, width: 300, resource: "{image}" },
            ] },
        ] },

        { control: "image", height: 150, width: 150, resource: "{image}" },

        { control: "button", caption: "Switch images", binding: "switchImages" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        image: profileImage,
    }
    return viewModel;
}

exports.Commands =
{
    switchImages: function(context, session, viewModel)
    {
        if (viewModel.image == userImage)
        {
            viewModel.image = profileImage;
        }
        else
        {
            viewModel.image = userImage;
        }
    },
}