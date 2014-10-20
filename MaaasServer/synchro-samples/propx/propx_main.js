// Property Cross main page
//
exports.View =
{
    title: "PropertyCross",
    elements: 
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "text", width: "*", value: "Use the form below to search for houses to buy. You can search by place-name, postcode, or click 'My Location' to search your current location", fontsize: 10 },
            { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
                { control: "edit", binding: "search", width: 200, verticalAlignment: "Center" },
                { control: "button", caption: "Go", verticalAlignment: "Center", binding: "search", enabled: "{search}" },
                { control: "button", caption: "My location", verticalAlignment: "Center", binding: "location" },
            ] },

            { control: "stackpanel", margin: { top: 10 }, height: "*", contents: [
                { control: "text", value: "Recent searches", fontsize: 12 },
                { control: "listview", select: "None", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "previousSearches", onItemClick: { command: "previousSearch", searchTerm: "{data}" } }, itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                        { control: "text", value: "{title}" },
                    ] },
                },
            ] },

            { select: "First", contents: [
                { select: "All", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, contents: [
                    { control: "commandBar.button", text: "Favs", icon: "Favorite", commandBar: "Bottom", binding: "favs" },
                    ]},
                { select: "All", filter: { deviceMetric: "os", is: "Android" }, contents: [
                    { control: "actionBar.item", text: "Favs", showAsAction: "IfRoom", binding: "favs" },
                    ]},
                { select: "All", filter: { deviceMetric: "os", is: "iOS" }, contents: [
                    { control: "navBar.button", text: "Favs", binding: "favs" },
                    ]},
                ]},
            ] 
        },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        search: "",
        previousSearches: [],
    }
    return viewModel;
}

exports.Commands = 
{
    search: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchTerm: viewModel.search });
    },
    location: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchTerm: "Soho"});
    },
    previousSearch: function(context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchTerm: params.searchTerm });
    },
    favs: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_favs");
    }
}
