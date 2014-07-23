// Login page
//
exports.View =
{
    title: "Login",
    onBack: "cancel",
    elements:
    [
        { control: "text", value: "Username", fontsize: 12, margin: { bottom: 0 } },
        { control: "edit", binding: "username", placeholder: "username", width: 200 },
        { control: "text", value: "Password", fontsize: 12, margin: { bottom: 0 } },
        { control: "password", binding: "password", placeholder: "password", width: 200 },
        { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
            { control: "button", caption: "Login", width: 125, binding: "login" },
            { control: "button", caption: "Cancel", width: 125, binding: "cancel" },
        ] },
        { control: "toggle", binding: "showPassword", header: "Show Password", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
        { control: "text", value: "Password: {password}", fontsize: 12, visibility: "{showPassword}" },
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
            return Synchro.showMessage(context, messageBox);
        }
        else
        {
            return Synchro.showMessage(context, { message: "Sorry, you failed!" });
        }
    },
    success: function(context)
    {
        return Synchro.navigateToView(context, "counter");
    },
    cancel: function(context)
    {
        return Synchro.navigateToView(context, "menu");
    },
}
