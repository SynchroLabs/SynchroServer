// Login page
//
exports.View =
{
    title: "Login",
    onBack: "cancel",
    elements:
    [
        { type: "text", value: "Username", fontsize: 24, margin: { bottom: 0 } },
        { type: "edit", binding: "username", width: 200 },
        { type: "text", value: "Password", fontsize: 24, margin: { bottom: 0 } },
        { type: "password", binding: "password", width: 200 },
        { type: "stackpanel", margin: { top: 10 }, contents: [
            { type: "button", caption: "Login", width: 100, binding: "login" },
            { type: "button", caption: "Cancel", width: 100, binding: "cancel" },
        ] },
        { type: "toggle", binding: "showPassword", header: "Show Password", onLabel: "Showing", offLabel: "Hiding", fontsize: 24 },
        { type: "text", value: "Current entered password: {password}", fontsize: 24, visibility: "{showPassword}" },
        { type: "toggle", binding: "showPassword", header: "Show Password2", onLabel: "Showing", offLabel: "Hiding", fontsize: 24 },
    ]
}

exports.InitializeViewModelState = function(context, session)
{
    var vmState =
    {
        username: "test",
        password: "",
        showPassword: false
    }
    return vmState;
}

exports.Commands = 
{
    login: function(context, session, vmState)
    {
        if (vmState.username && (vmState.username == vmState.password))
        {
            session.username = vmState.username;
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
