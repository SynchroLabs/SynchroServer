// List page
//
exports.View =
{
    title: "List example",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "New item:", fontsize: 12 },
            { type: "edit", binding: "itemToAdd" },
        ] },
        { type: "button", caption: "Add", binding: "add", enabled: "{itemToAdd}" },

        { type: "text", value: "Your items", fontsize: 12 },
        { type: "listbox", width: 250, height: 300, select: "Multiple", binding: { items: "items", selection: "selectedItems" } },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", caption: "Remove", binding: "remove", enabled: "{selectedItems}" },
            { type: "button", caption: "Sort", binding: "sort", enabled: "{items}" },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        itemToAdd: "",
        items: [ "white", "black", "yellow" ],
        selectedItems: [ "black" ],
    }
    return viewModel;
}

exports.Commands = 
{
    add: function(context, session, viewModel)
    {
        viewModel.items.push(viewModel.itemToAdd);
        viewModel.itemToAdd = "";
    },
    sort: function(context, session, viewModel)
    {
        viewModel.items.sort();
    },
    remove: function(context, session, viewModel)
    {
        viewModel.items.remove(viewModel.selectedItems);
        viewModel.selectedItems = [];
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
