// Flex 3 page
//
exports.View =
{
    title: "Flex 3",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", height: "*", width: "*", contents: [
            { control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                { control: "toggle", binding: "showRed", header: "Show Red", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
                { control: "toggle", binding: "showBlue", header: "Show Blue", onLabel: "Showing", offLabel: "Hiding", fontsize: 12 },
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", height: "*", visibility: "{showRed}",  contents: [
                { control: "rectangle", height: "*", width: "*", fill: "Red"},
            ] },
            { control: "stackpanel", orientation: "Horizontal", width: "*", height: "*", visibility: "{showBlue}",  contents: [
                { control: "rectangle", height: "*", width: "*", fill: "Blue"},
            ] }
        ] }
    ]
}

exports.InitializeViewModel = function (context, session) 
{
    var viewModel =
    {
    	showRed: true,
    	showBlue: true
    }
    return viewModel;
}
