// Menu page
//
exports.View =
{
    title: "MAaaS Menu",
    elements: 
    [
        { type: "image", resource: "http://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash3/c23.23.285.285/s160x160/943786_10201215910308278_1343091684_n.jpg" },
        { type: "button", caption: "Hello World", binding: { command: "goToView", view: "hello" } },
        { type: "button", caption: "Login Sample", binding: { command: "goToView", view: "login" } },
        { type: "button", caption: "Click Counter Sample", binding: { command: "goToView", view: "counter" } },
        { type: "button", caption: "List Sample", binding: { command: "goToView", view: "list" } },
        { type: "button", caption: "Contacts", binding: { command: "goToView", view: "listview" } },
        { type: "button", caption: "Sandbox", binding: { command: "goToView", view: "sandbox" } },
    ]
}

exports.Commands = 
{
    goToView: function(context, session, viewModel, params)
    {
        return navigateToView(context, params.view);
    },
}
