// Menu page
//
exports.View =
{
    title: "MAaaS Menu",
    elements: 
    [
        { type: "image", resource: "http://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash3/c23.23.285.285/s160x160/943786_10201215910308278_1343091684_n.jpg" },
        { type: "button", caption: "Hello World", binding: "hello" },
        { type: "button", caption: "Login Sample", binding: "login" },
        { type: "button", caption: "Click Counter Sample", binding: "counter" },
        { type: "button", caption: "List Sample", binding: "list" },
        { type: "button", caption: "Contacts", binding: "contacts" },
        { type: "button", caption: "Sandbox", binding: "sandbox" },
    ]
}

exports.Commands = 
{
    hello: function(context)
    {
        return navigateToView(context, "hello");
    },
    login: function(context)
    {
        return navigateToView(context, "login");
    },
    counter: function(context)
    {
        return navigateToView(context, "counter");
    },
    list: function(context)
    {
        return navigateToView(context, "list");
    },
    contacts: function(context)
    {
        return navigateToView(context, "listview");
    },
    sandbox: function(context)
    {
        return navigateToView(context, "sandbox");
    },
}
