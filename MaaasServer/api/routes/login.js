// Login page
//
var maaas = require('../maaas');

exports.View =
{
    title: "Login",
    onBack: "cancel",
    elements:
    [
        { control: "text", value: "Username", fontsize: 12, margin: { bottom: 0 } },
        { control: "edit", binding: "username", width: 200 },
        { control: "text", value: "Password", fontsize: 12, margin: { bottom: 0 } },
        { control: "password", binding: "password", width: 200 },
        { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
            { control: "button", caption: "Login", width: 125, binding: "login" },
            { control: "button", caption: "Cancel", width: 125, binding: "cancel" },
        ] },
        { control: "toggle", binding: "showPassword", header: "Show Password", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
        { control: "text", value: "Entered password: {password}", fontsize: 12, visibility: "{showPassword}" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        username: "test",
        password: "",
        showPassword: false
    }
    return viewModel;
}

exports.Commands = 
{
    login: function(context, session, viewModel)
    {
        if (viewModel.username && (viewModel.username == viewModel.password))
        {
            session.username = viewModel.username;
            var messageBox = 
            {
                title: "Winner",
                message: "Congrats {username}, you succeeded!  Now on the Counter app...",
                options:
                [
                    { label: "Ok", command: "success" },
                    { label: "Cancel" },
                ]
            }
            return maaas.showMessage(context, messageBox);
        }
        else
        {
            return maaas.showMessage(context, { message: "Sorry, you failed!" });
        }
    },
    success: function(context)
    {
        return maaas.navigateToView(context, "counter");
    },
    cancel: function(context)
    {
        return maaas.navigateToView(context, "menu");
    },
}
