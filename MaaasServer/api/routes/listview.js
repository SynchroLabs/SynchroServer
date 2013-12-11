// Contacts page
//
exports.View =
{
    title: "Contacts example",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", contents: [
            { type: "text", value: "New Contact:", fontsize: 24 },
            { type: "edit", binding: "addFirst" },
            { type: "edit", binding: "addLast" },
            { type: "button", caption: "Add", binding: "add", enabled: "{addFirst}" },
        ] },

        { type: "text", value: "Your Contacts", fontsize: 24 },
        { type: "listview", select: "single", maxheight: 300, binding: { items: "contacts", selection: "selectedContacts" }, itemTemplate:
            { type: "stackpanel", orientation: "horizontal", contents: [
                { type: "image", resource: "resources/user.png", height: 50, width: 50 },
                { type: "stackpanel", orientation: "vertical", contents: [
                    { type: "text", value: "{first}" },
                    { type: "text", value: "{last}" },
                ] },
            ] },
        },

        { type: "stackpanel", contents: [
            { type: "button", caption: "Remove", binding: "remove", enabled: "{selectedContacts}" },
            { type: "button", caption: "Sort", binding: "sort" },
        ] },
    ]
}

exports.InitializeViewModelState = function(context, session)
{
    var vmState =
    {
        addFirst: "",
        addLast: "",
        contacts: [ { first: "John", last: "Smith" }, { first: "George", last: "Washington" }, ],
        selectedContacts: null,
    }
    return vmState;
}

exports.Commands = 
{
    add: function(context, session, vmState)
    {
        vmState.contacts.push({first: vmState.addFirst, last: vmState.addLast});
        vmState.addFirst = "";
        vmState.addLast = "";
    },
    sort: function(context, session, vmState)
    {
        vmState.contacts.sort(function(a,b){return a.last == b.last ? a.first > b.first : a.last > b.last});
    },
    remove: function(context, session, vmState)
    {
        vmState.contacts.remove(vmState.selectedContacts);
        vmState.selectedContacts = null;
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
