// Wrappanel page
//
exports.View =
{
    title: "WrapPanel",
    onBack: "exit",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "button", caption: "Horizontal", binding: { command: "setOrientation", orientation: "Horizontal" } },
                { control: "button", caption: "Vertical", binding: { command: "setOrientation", orientation: "Vertical" } },
            ] },

            { control: "wrappanel", width: "*", height: "*", itemHeight: 100, itemWidth: 100, padding: 10, background: "Gray", orientation: "{orientation}", contents: [
                { control: "rectangle", width: 50, height: 50, margin: 10, fill: "Green" },
                { control: "rectangle", width: 75, height: 50, margin: 10, fill: "Green" },
                { control: "rectangle", width: 50, height: 75, margin: 10, fill: "Green" },
                { control: "rectangle", width: 75, height: 75, margin: 10, fill: "Green" },
                { control: "rectangle", width: 25, height: 50, margin: 10, fill: "Green" },
                { control: "rectangle", width: 50, height: 50, margin: 10, fill: "Green" },
                { control: "rectangle", width: 75, height: 50, margin: 10, fill: "Green" },
                { control: "rectangle", width: 50, height: 75, margin: 10, fill: "Green" },
                { control: "rectangle", width: 75, height: 75, margin: 10, fill: "Green" },
                { control: "rectangle", width: 25, height: 50, margin: 10, fill: "Green" },
                ]
            },
            ]
        },
    ]
}

exports.InitializeViewModel = function (context, session)
{
    var viewModel =
    {
        orientation: "Horizontal",
    }
    return viewModel;
}

exports.Commands =
{
    setOrientation: function(context, session, viewModel, params)
    {
        viewModel.orientation = params.orientation;
    },
    exit: function (context)
    {
        return Synchro.navigateToView(context, "menu");
    },
}
