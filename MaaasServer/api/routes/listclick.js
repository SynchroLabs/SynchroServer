// List Click page
//
exports.View =
{
    title: "List Click",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "stackpanel", orientation: "Vertical", contents: [

                { type: "text", value: "Click an item...", fontsize: 16 },
                { type: "listview", select: "None", height: 300, maxheight: 300, width: 300, binding: { items: "items", onItemClick: { command: "itemClicked", itemData: "{data}" } }, itemTemplate:
                    { type: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                        { type: "image", resource: "resources/user.png", height: 50, width: 50 },
                        { type: "text", value: "{title}" },
                    ] },
                },
            ] },
        ] },

        { type: "text", value: "Last item clicked: {lastClicked}", fontsize: 12 },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        items: [
            { title: "Item Number One", data: "one" },
            { title: "Item Number Two", data: "two" },
            { title: "Item Number Three", data: "three" },
            { title: "Item Number Four", data: "four" },
        ],
        lastClicked: "none",
    }
    return viewModel;
}

exports.Commands = 
{
    itemClicked: function(context, session, viewModel, params)
    {
        viewModel.lastClicked = params.itemData;
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
