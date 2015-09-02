// Login page
//
exports.View =
{
    title: "PropertyCross",
    elements:
 [
        { control: "text", value: "Login", font: { size: 16 }, margin: { bottom: 16 } },
        { control: "text", value: "Username", fontsize: 12, margin: { bottom: 0 } },
        { control: "edit", binding: "username", placeholder: "username", width: 200 },
        { control: "text", value: "Password", fontsize: 12, margin: { bottom: 0 } },
        { control: "password", binding: "password", placeholder: "password", width: 200 },
        {
            control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
                { control: "button", caption: "Login", width: 125, binding: "login" },
            ]
        },
    ]
}

exports.InitializeViewModel = function (context, session)
{
    if (session.username)
    {
        Synchro.navigateTo(context, "propx_main");
    }
    else
    {
        var viewModel =
        {
            username: "",
            password: "",
            showPassword: false
        }
        return viewModel;
    }
}

exports.Commands = 
{
    login: function (context, session, viewModel)
    {
        if (viewModel.username && (viewModel.username == viewModel.password))
        {
            session.username = viewModel.username;
            return Synchro.pushAndNavigateTo(context, "propx_main");
        }
        else
        {
            return Synchro.showMessage(context, { message: "Sorry, login failed!" });
        }
    }
}
