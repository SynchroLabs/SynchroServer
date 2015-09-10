// Property Cross - main page
//
exports.View =
{
    title: "PropertyCross",
    elements: 
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "location", binding: "position" },

            { control: "text", width: "*", value: "Use the form below to search for houses to buy. You can search by place-name, postcode, or click 'My Location' to search your current location", fontsize: 10 },
            { control: "stackpanel", orientation: "Vertical", margin: { top: 10 }, width: "*", contents: [
                { control: "edit", binding: "searchTerm", placeholder: "place name or postcode", width: "320"},
                { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", contents: [
                    { control: "button", caption: "Go", verticalAlignment: "Center", binding: "placenameSearch", enabled: "{searchTerm}" },
                    { control: "button", caption: "My location", verticalAlignment: "Center", binding: "locationSearch", visibility: "{position.available}", enabled: "{position.coordinate}" },
                ] },
            ] },

            { control: "stackpanel", margin: { top: 10 }, height: "*", visibility: "{previousSearches}", contents: [
                { control: "text", value: "Recent searches", fontsize: 12 },
                { control: "listview", select: "None", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "previousSearches", onItemClick: { command: "previousSearch", location: "{$data}" } }, itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                        { control: "text", value: "{title}", fontsize: 10 },
                    ] },
                },
            ] },

            { filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, control: "commandBar.button", text: "Favorites", icon: "Favorite", commandBar: "Bottom", binding: "favs" },
            { filter: { deviceMetric: "os", is: "Android" }, control: "actionBar.item", text: "Favorites", showAsAction: "IfRoom", binding: "favs" },
            { filter: { deviceMetric: "os", is: "iOS" }, control: "navBar.button", text: "Favs", binding: "favs" },

        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    session.favs = session.favs || [];
    session.searches = session.searches || [];

    var viewModel =
    {
        searchTerm: "",
        previousSearches: session.searches,
        position: null,
    }
    return viewModel;
}

exports.Commands = 
{
    placenameSearch: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchTerm: viewModel.searchTerm });
    },
    locationSearch: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchPosition: viewModel.position.coordinate});
    },
    previousSearch: function(context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "propx_list", { searchLocation: params.location });
    },
    favs: function(context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "propx_favs");
    }
}