// Special case of view initializer with no view template defined in exports.View
//
exports.InitializeView = function(context, session, viewModel, view)
{
    var view =
    {
        title: "Counter Page",
        onBack: "exit",
        elements: 
        [
            { control: "text", value: "Count: {count}", font: 24 },
        ]
    };

    return view;
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
    test: function(context, session, viewModel)
    {
        viewModel.url = Synchro.getResourceUrl("user.png");
    },
    inc: function(context, session, viewModel)
    {
        viewModel.count += 1;
    },
    reset: function(context, session, viewModel)
    {
        viewModel.count = 0;
    },
}
