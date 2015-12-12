// Hello page
//
var img = "http://blob.synchro.io/resources/cloud_system_256.png";

exports.View =
{
    title: "Buttons",
    elements:
    [
        { control: "button", caption: "Button", foreground: "CornflowerBlue", background: "Black", width: 125, binding: "text" },
        { control: "button", caption: "Button", foreground: "Black", opacity: "0.65", resource: img, width: 125, height: 125, binding: "textWithImage" },
        { control: "button", resource: img, width: 125, height: 125, binding: "image" },
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
    text: function(context, session, viewModel)
    {
        viewModel.message = "Caption Only";
        Synchro.interimUpdate(context);                
        Synchro.waitFor(context, waitInterval, 1000);
        viewModel.message = "";
    },
    textWithImage: function(context, session, viewModel)
    {
        viewModel.message = "Caption + Image";
        Synchro.interimUpdate(context);                
        Synchro.waitFor(context, waitInterval, 1000);
        viewModel.message = "";
    },
    image: function(context, session, viewModel)
    {
        viewModel.message = "Image Only";
        Synchro.interimUpdate(context);                
        Synchro.waitFor(context, waitInterval, 1000);
        viewModel.message = "";
    },
}
