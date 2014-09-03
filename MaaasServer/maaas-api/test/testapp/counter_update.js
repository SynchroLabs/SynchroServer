exports.View =
{
    title: "Counter Page",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Count: {count}", font: 24 },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        count: 0,
    }
    return viewModel;
}

exports.Commands =
{
    inc: function(context, session, viewModel)
    {
        viewModel.count += 5;
    },
    reset: function(context, session, viewModel)
    {
        viewModel.count = 0;
    },
}
