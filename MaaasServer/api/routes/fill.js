﻿// Fill layout page
//
var maaas = require('../maaas');

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
    exit: function (context) {
        return maaas.navigateToView(context, "menu");
    },
}
