// Login page
//
exports.View =
{
    title: "Login",
    onBack: "cancel",
    elements:
    [
        { type: "text", value: "Username", fontsize: 12, margin: { bottom: 0 } },
        { type: "edit", binding: "username", width: 200 },
        { type: "text", value: "Password", fontsize: 12, margin: { bottom: 0 } },
        { type: "password", binding: "password", width: 200 },
        { type: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
            { type: "button", caption: "Login", width: 100, binding: "login" },
            { type: "button", caption: "Cancel", width: 100, binding: "cancel" },
        ] },
        { type: "toggle", binding: "showPassword", header: "Show Password", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
        { type: "text", value: "Current entered password: {password}", fontsize: 12, visibility: "{showPassword}" },
        { type: "toggle", binding: "showPassword", header: "Show Password2", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
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
            return showMessage(context, messageBox);
        }
        else
        {
            return showMessage(context, { message: "Sorry, you failed!" });
        }
    },
    success: function(context)
    {
        return navigateToView(context, "counter");
    },
    cancel: function(context)
    {
        return navigateToView(context, "menu");
    },
}
