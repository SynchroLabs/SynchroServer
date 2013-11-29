// List page
//
exports.View =
{
    title: "List example",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", contents: [
            { type: "text", value: "New item:", fontsize: 24 },
            { type: "edit", binding: "itemToAdd" },
            { type: "button", caption: "Add", binding: "add", enabled: "{itemToAdd}" },
        ] },

        { type: "text", value: "Your items", fontsize: 24 },
        { type: "listbox", width: 250, binding: { items: "items", selection: "selectedItem" } },

        { type: "stackpanel", contents: [
            { type: "button", caption: "Remove", binding: "remove", enabled: "{selectedItem}" },
            { type: "button", caption: "Sort", binding: "sort" },
        ] },
    ]
}

exports.InitializeViewModelState = function(context, session)
{
    var vmState =
    {
        itemToAdd: "",
        items: [ "white", "black", "yellow" ],
        selectedItem: "black",
    }
    return vmState;
}

exports.Commands = 
{
    add: function(context, session, vmState)
    {
        vmState.items.push(vmState.itemToAdd);
        vmState.itemToAdd = "";
    },
    sort: function(context, session, vmState)
    {
        vmState.items.sort();
    },
    remove: function(context, session, vmState)
    {
        vmState.items.remove(vmState.selectedItem);
        vmState.selectedItem = "";
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
