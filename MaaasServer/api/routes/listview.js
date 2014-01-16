// Contacts page
//
exports.View =
{
    title: "Contacts example",
    onBack: "exit",
    elements:
    [
        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "text", value: "New Contact:", fontsize: 12 },
            { type: "edit", binding: "addFirst" },
            { type: "edit", binding: "addLast" },
            { type: "button", caption: "Add", binding: "add", enabled: "{addFirst}" },
        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "stackpanel", orientation: "Vertical", contents: [

                { type: "text", value: "Your Contacts", fontsize: 12 },
                { type: "listview", select: "multiple", maxheight: 300, binding: { items: "contacts", selection: "selectedContacts" }, itemTemplate:
                    { type: "stackpanel", orientation: "Horizontal", contents: [
                        { type: "image", resource: "resources/user.png", height: 50, width: 50 },
                        { type: "stackpanel", orientation: "Vertical", contents: [
                            { type: "text", value: "{first}" },
                            { type: "text", value: "{last}" },
                        ] },
                    ] },
                },
            ] },

            { type: "stackpanel", orientation: "Vertical", contents: [

                { type: "text", value: "Selected Contacts", fontsize: 12 },
                { type: "listview", select: "none", maxheight: 300, binding: { items: "selectedContacts" }, itemTemplate:
                    { type: "stackpanel", orientation: "Horizontal", contents: [
                        { type: "image", resource: "resources/user.png", height: 50, width: 50 },
                        { type: "stackpanel", orientation: "Vertical", contents: [
                            { type: "text", value: "{first}" },
                            { type: "text", value: "{last}" },
                        ] },
                    ] },
                },

            ] },

        ] },

        { type: "stackpanel", orientation: "Horizontal", contents: [
            { type: "button", caption: "Remove", binding: "remove", enabled: "{selectedContacts}" },
            { type: "button", caption: "Sort", binding: "sort" },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        addFirst: "",
        addLast: "",
        contacts: [ { first: "John", last: "Smith" }, { first: "George", last: "Washington" }, ],
        selectedContacts: [],
    }
    return viewModel;
}

exports.Commands = 
{
    add: function(context, session, viewModel)
    {
        viewModel.contacts.push({first: viewModel.addFirst, last: viewModel.addLast});
        viewModel.addFirst = "";
        viewModel.addLast = "";
    },
    sort: function(context, session, viewModel)
    {
        viewModel.contacts.sort(function(a,b){return a.last == b.last ? a.first > b.first : a.last > b.last});
    },
    remove: function(context, session, viewModel)
    {
        viewModel.contacts.remove(viewModel.selectedContacts);
        viewModel.selectedContacts = [];
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
