exports.View =
{
    title: "Menu",
    elements: 
    [
		{ control: "button", caption: "Counter", binding: "goToCounter" },
	]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        test: "testValue"
    }
    return viewModel;
}