// This module contains the MAAAS API that is exposed to pages/screens
//
var maaasApi = require('./api');
var wait = require('wait.for');

exports.getResourceUrl = function(resource)
{
    return "https://maaas.blob.core.windows.net/resources/" + resource;
}

exports.navigateToView = function(context, route, params)
{
    maaasApi.navigateToView(context, route, params);
}

exports.showMessage = function(context, messageBox)
{
    maaasApi.showMessage(context, messageBox);
}

exports.waitFor = function()
{
    return wait.for.apply(this, arguments);
}