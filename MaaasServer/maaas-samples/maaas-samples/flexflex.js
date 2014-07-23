// Flex 2 page
//
exports.View =
{
    title: "Flex 2",
    onBack: "exit",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
            { control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                { control: "rectangle", height: "100", width: "*", fill: "Red", border: "Blue", borderThickness: 5 },
                ],
            },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "rectangle", height: "100", width: "100", fill: "Green", border: "Yellow", borderThickness: 5 },
                ]
            }
            ]
        }
    ]
}

exports.InitializeViewModel = function (context, session) 
{
    var viewModel =
    {
    }
    return viewModel;
}

exports.Commands =
{
    exit: function (context) 
    {
        return Synchro.navigateToView(context, "menu");
    },
}