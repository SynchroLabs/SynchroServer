// Font page
//
exports.View =
{
    title: "Toggle",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "Toggle:", fontsize: 10, width: 140 },
            { control: "toggle", binding: "toggleState", fontsize: 12 },
        ] },

        { filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, control: "commandBar.toggle", text: "Favorite", icon: "Favorite", binding: { value: "toggleState", onToggle: "onToggle" } },
        { filter: { deviceMetric: "os", is: "Android" }, control: "actionBar.toggle", checkedicon: "ic_action_important", uncheckedicon: "ic_action_not_important", showAsAction: "IfRoom", binding: { value: "toggleState", onToggle: "onToggle" } },
        { filter: { deviceMetric: "os", is: "iOS" }, control: "navBar.toggle", checkedicon: "star-mini", uncheckedicon: "star-empty-mini" , binding: { value: "toggleState", onToggle: "onToggle" } },

        { control: "text", value: "Toggle state: {toggleState}" },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        toggleState: false 
    }
    return viewModel;
}

exports.Commands =
{
    onToggle: function(context, session, viewModel, params)
    {
        console.log("Toggled");
    },
}
