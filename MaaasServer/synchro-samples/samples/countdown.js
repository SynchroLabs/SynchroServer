// Countdown page
//
exports.View =
{
    title: "Countdown",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Loading...", foreground: "Red", font: { size: 24, bold: true }, visibility: "{isLoading}" },
        { control: "stackpanel", orientation: "Vertical", visibility: "{!isLoading}", contents: [
            { control: "text", value: "Count: {count}", foreground: "Green", font: { size: 24, bold: true } },
            { control: "button", caption: "Start Countdown", binding: "start", visibility: "{!isCounting}" },
            { control: "button", caption: "Pause Countdown", binding: "stop", visibility: "{isCounting}" },
        ] }
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        count: 0,
        isLoading: true,
        isCounting: false
    }
    return viewModel;
}

exports.LoadViewModel = function(context, session, viewModel)
{
    Synchro.waitFor(context, waitInterval, 2000);    
    viewModel.count = 10;
    viewModel.isLoading = false;
}

function waitInterval(intervalMillis, callback)
{
    setTimeout(function(){callback()}, intervalMillis);
}

exports.Commands = 
{
    start: function(context, session, viewModel, params)
    {
        viewModel.isCounting = true;

        while (viewModel.isCounting && (viewModel.count > 0))
        {
            Synchro.waitFor(context, waitInterval, 1000);
            if (viewModel.isCounting)
            {
                viewModel.count--;            
                Synchro.interimUpdate(context);                
            }
        }

        viewModel.isCounting = false;
    },
    stop: function(context, session, viewModel, params)
    {
        viewModel.isCounting = false;
    },
    exit: function(context, session, viewModel)
    {
        return Synchro.navigateToView(context, "menu");
    },
}