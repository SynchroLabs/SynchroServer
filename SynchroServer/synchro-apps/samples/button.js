// Hello page
//
var imgCloud = Synchro.getResourceUrl("cloud_system_256.png");

exports.View =
{
    title: "Buttons",
    elements:
    [
        { control: "button", caption: "Button", foreground: "CornflowerBlue", background: "Black", width: 125, binding: "text" },
        { control: "button", resource: imgCloud, width: 125, height: 125, binding: "image" },
        { control: "text", value: "{message}", fontsize: 12 },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        message: null,
    }
    return viewModel;
}

function waitInterval(intervalMillis, callback)
{
    setTimeout(function(){callback()}, intervalMillis);
}

exports.Commands =
{
    text: function * (context, session, viewModel)
    {
        viewModel.message = "Caption button";
        yield Synchro.interimUpdateAwaitable(context);
        yield Synchro.waitForAwaitable(context, waitInterval, 1000);
        viewModel.message = "";
    },
    image: function * (context, session, viewModel)
    {
        viewModel.message = "Image button";
        yield Synchro.interimUpdateAwaitable(context);
        yield Synchro.waitForAwaitable(context, waitInterval, 1000);
        viewModel.message = "";
    },
}
