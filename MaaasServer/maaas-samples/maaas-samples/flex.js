// Flex layout page
//
exports.View =
{
    title: "Flex",
    onBack: "exit",
    elements:
    [
        // We're looking for this:
        //
        //   R--  BBB
        //   -R-  BRB
        //   --R  BBB
        //   GGG  GGG
        //   BBB  RRR
        //   BBB  GGG
        //   RRR  BRB
        //   RRR  BRB
        //   RRR  BRB
        //   RRR  RRR
        //   RRR  RRR
        //   RRR  RRR
        //
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "stackpanel", orientation: "Vertical", height: 600, width: 150, contents: [
                { control: "rectangle", height: 50, width: 50, horizontalAlignment: "Left", fill: "Red" },
                { control: "rectangle", height: 50, width: 50, horizontalAlignment: "Center", fill: "Red" },
                { control: "rectangle", height: 50, width: 50, horizontalAlignment: "Right", fill: "Red" },
                { control: "rectangle", height: 50, width: "*", fill: "Green" },
                { control: "rectangle", height: "*", width: "*", fill: "Blue" },
                { control: "rectangle", height: "3*", width: "*", fill: "Red" },
                ]
            },
            { control: "stackpanel", orientation: "Vertical", width: 150, contents: [
                { control: "border", height: 150, width: 150, background: "Blue", contents: [
                    { control: "rectangle", height: 50, width: 50, horizontalAlignment: "Center", verticalAlignment: "Center", fill: "Red" },
                ]
                },
                { control: "border", height: 150, width: 150, background: "Green", contents: [
                    { control: "rectangle", height: 50, width: "*", verticalAlignment: "Center", fill: "Red" },
                ]
                },
                { control: "border", height: 150, width: 150, background: "Blue", contents: [
                    { control: "rectangle", height: "*", width: 50, horizontalAlignment: "Center", fill: "Red" },
                ]
                },
                { control: "border", height: 150, width: 150, contents: [
                    { control: "rectangle", height: "*", width: "*", background: "Red", fill: "Red" },
                ]
                },
            ]
            },
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
