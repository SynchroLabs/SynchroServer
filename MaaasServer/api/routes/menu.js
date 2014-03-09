// Menu page
//
var maaas = require('../maaas');

exports.View =
{
    title: "Maaas.io Menu",
    elements: 
    [
        { control: "border", border: "Red", borderThickness: 10, cornerRadius: 15, padding: 30, background: "Blue", contents: [
            { control: "image", width: 150, height: 150, resource: "http://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash3/c23.23.285.285/s160x160/943786_10201215910308278_1343091684_n.jpg" },
        ] },
        { control: "button", caption: "PropertyCross", binding: { command: "goToView", view: "propx_main" } },
        { control: "button", caption: "Hello World", binding: { command: "goToView", view: "hello" } },
        { control: "button", caption: "Device", binding: { command: "goToView", view: "device" } },
        { control: "button", caption: "Login Sample", binding: { command: "goToView", view: "login" } },
        { control: "button", caption: "Click Counter Sample", binding: { command: "goToView", view: "counter" } },
        { control: "button", caption: "List Sample", binding: { command: "goToView", view: "list" } },
        { control: "button", caption: "List Click", binding: { command: "goToView", view: "listclick" } },
        { control: "button", caption: "Contacts", binding: { command: "goToView", view: "listview" } },
        { control: "button", caption: "StackPanel", binding: { command: "goToView", view: "stack" } },
        { control: "button", caption: "Border", binding: { command: "goToView", view: "layout" } },
        { control: "button", caption: "Font", binding: { command: "goToView", view: "font" } },
        { control: "button", caption: "Binding", binding: { command: "goToView", view: "binding" } },
        { control: "button", caption: "Picker", binding: { command: "goToView", view: "picker" } },
        { control: "button", caption: "Webview", binding: { command: "goToView", view: "webview" } },
        { control: "button", caption: "Sandbox", binding: { command: "goToView", view: "sandbox" } },
    ]
}

exports.Commands = 
{
    goToView: function(context, session, viewModel, params)
    {
        return maaas.navigateToView(context, params.view);
    },
}
