// Contacts page
//
exports.View =
{
    title: "Contacts example",
    onBack: "exit",
    elements:
    [
        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "text", value: "New Contact:", fontsize: 12 },
            { control: "edit", binding: "addFirst" },
            { control: "edit", binding: "addLast" },
            { control: "button", caption: "Add", binding: "add", enabled: "{addFirst}" },
        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "stackpanel", orientation: "Vertical", contents: [

                { control: "text", value: "Your Contacts", fontsize: 12 },
                { control: "listview", select: "Multiple", height: 300, maxheight: 300, width: 300, binding: { items: "contacts", selection: "selectedContacts" }, itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                        { control: "image", resource: "resources/user.png", height: 50, width: 50 },
                        { control: "stackpanel", orientation: "Vertical", contents: [
                            { control: "text", value: "{first}" },
                            { control: "text", value: "{last}" },
                        ] },
                    ] },
                },
            ] },
            /*
            { control: "stackpanel", orientation: "Vertical", contents: [

                { control: "text", value: "Selected Contacts", fontsize: 12 },
                { control: "listview", select: "none", maxheight: 300, binding: { items: "selectedContacts" }, itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", contents: [
                        { control: "image", resource: "resources/user.png", height: 50, width: 50 },
                        { control: "stackpanel", orientation: "Vertical", contents: [
                            { control: "text", value: "{first}" },
                            { control: "text", value: "{last}" },
                        ] },
                    ] },
                },

            ] },
            */

        ] },

        { control: "stackpanel", orientation: "Horizontal", contents: [
            { control: "button", caption: "Remove", binding: "remove", enabled: "{selectedContacts}" },
            { control: "button", caption: "Sort", binding: "sort" },
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
