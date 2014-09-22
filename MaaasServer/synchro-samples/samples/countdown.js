// Countdown page
//
exports.View =
{
    title: "Countdown",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Loading...", foreground: "Red", font: { size: 24, bold: true }, visibility: "{showLoading}" },
        { control: "text", value: "Count: {count}", foreground: "Green", font: { size: 24, bold: true }, visibility: "{showCount}" },
        { control: "button", caption: "Start Countdown", binding: "start", visibility: "{showCount}" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        count: 0,
        showLoading: true,
        showCount: false
    }
    return viewModel;
}

exports.LoadViewModel = function(context, session, viewModel)
{
    Synchro.waitFor(waitInterval, 2000);    
    viewModel.count = 10;
    viewModel.showLoading = false;
    viewModel.showCount = true;
}

function waitInterval(intervalMillis, callback)
{
    setTimeout(function(){callback()}, intervalMillis);
}

exports.Commands = 
{
    start: function(context, session, viewModel, params)
    {
        while (viewModel.count > 0)
        {
            Synchro.waitFor(waitInterval, 1000);
            viewModel.count--;            
            Synchro.interimUpdate(context);
        }
    },
    exit: function(context, session, viewModel)
    {
        return Synchro.navigateToView(context, "menu");
    },
}