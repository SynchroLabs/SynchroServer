// Menu page
//
exports.View =
{
    title: "Synchro.io Menu",
    elements: 
    [
        { control: "stackpanel", width: "*", contents: [
            { control: "border", border: "Red", horizontalAlignment: "Center", borderThickness: 10, cornerRadius: 15, padding: { top: 15, bottom: 15, left: 50, right: 50 }, margin: { top: 10, bottom: 25 }, background: "Blue", contents: [
                { control: "image", width: 150, height: 150, resource: Synchro.getResourceUrl("cloud_system_256.png") },
            ]
            },
            { control: "button", caption: "{caption}", binding: { foreach: "pages", command: "goToView", view: "{view}" } },
        ] }
    ]
}

exports.InitializeViewModel = function (context, session)
{
    var viewModel =
    {
        pages: [
            { caption: "Hello World", view: "hello" },
            { caption: "Login Sample", view: "login" },
            { caption: "Click Counter Sample", view: "counter" },
            { caption: "Device", view: "device" },
            { caption: "Auto-Complete", view: "autocomplete" },
            { caption: "List Sample", view: "list" },
            { caption: "List Click", view: "listclick" },
            { caption: "Contacts", view: "listview" },
            { caption: "StackPanel", view: "stack" },
            { caption: "WrapPanel", view: "wrap" },
            { caption: "Border", view: "layout" },
            { caption: "Fill", view: "fill" },
            { caption: "Flex", view: "flex" },
            { caption: "Flex 2", view: "flexflex" },
            { caption: "Text Flow", view: "textflow" },
            { caption: "Image", view: "image" },
            { caption: "Font", view: "font" },
            { caption: "Binding", view: "binding" },
            { caption: "Picker", view: "picker" },
            { caption: "Webview", view: "webview" },
            { caption: "Sandbox", view: "sandbox" },
        ]
    }
    return viewModel;
}

exports.Commands = 
{
    goToView: function(context, session, viewModel, params)
    {
        return Synchro.navigateToView(context, params.view);
    },
}