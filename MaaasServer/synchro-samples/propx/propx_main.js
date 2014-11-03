// Property Cross main page
//
// https://github.com/tastejs/PropertyCross/tree/master/specification
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

            { control: "stackpanel", margin: { top: 10 }, height: "*", visibility: "{previousSearches}", contents: [
                { control: "text", value: "Recent searches", fontsize: 12 },
                { control: "listview", select: "None", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "previousSearches", onItemClick: { command: "previousSearch", location: "{$data}" } }, itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                        { control: "text", value: "{title}", fontsize: 10 },
                    ] },
                },
            ] },

            { select: "First", contents: [
                { select: "All", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, contents: [
                    { control: "commandBar.button", text: "Favorites", icon: "Favorite", commandBar: "Bottom", binding: "favs" },
                    ]},
                { select: "All", filter: { deviceMetric: "os", is: "Android" }, contents: [
                    { control: "actionBar.item", text: "Favorites", showAsAction: "IfRoom", binding: "favs" },
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
    session.favs = session.favs || [];
    session.searches = session.searches || [];

    var viewModel =
    {
        search: "",
        previousSearches: session.searches,
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
        return Synchro.pushAndNavigateTo(context, "propx_list", { location: params.location });
    },
    favs: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_favs");
    }
}
