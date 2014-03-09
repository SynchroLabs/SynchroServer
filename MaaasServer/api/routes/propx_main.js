// Property Cross main page
//
var maaas = require('../maaas');

exports.View =
{
    title: "PropertyCross",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Use the form below to search for houses to buy. You can search by place-name, postcode, or click 'My Location' to search your current location", fontsize: 12, width: 1024 },
        { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
            { control: "edit", binding: "search", width: 200 },
            { control: "button", caption: "Go", binding: "search", enabled: "{search}" },
            { control: "button", caption: "My location", binding: "location" },
        ] },

        { control: "stackpanel", margin: { top: 10 }, contents: [
            { control: "text", value: "Recent searches", fontsize: 12 },
            { control: "listview", select: "None", height: 300, maxheight: 300, width: 350, binding: { items: "previousSearches", onItemClick: { command: "previousSearch", searchTerm: "{data}" } }, itemTemplate:
                { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                    { control: "text", value: "{title}" },
                ] },
            },
        ] },

        { select: "First", contents: [
            { select: "All", filterOS: "Windows", contents: [
                { control: "commandBar.button", text: "Favs", icon: "Stop", commandBar: "Bottom", binding: "favs" },
                ]},
            { select: "All", filterOS: "WinPhone", contents: [
                { control: "appBar.button", text: "Favs", icon: "add", binding: "favs" },
                ]},
            { select: "All", filterOS: "Android", contents: [
                { control: "actionBar.item", text: "Favs", showAsAction: "IfRoom", binding: "favs" },
                ]},
            { select: "All", filterOS: "iOS", contents: [
                { control: "navBar.button", text: "Favs", binding: "favs" },
                ]},
            ]},
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
        return maaas.navigateToView(context, "propx_list", { searchTerm: viewModel.search });
    },
    location: function(context, session, viewModel)
    {
        return maaas.navigateToView(context, "propx_list");
    },
    previousSearch: function(context, session, viewModel, params)
    {
        return maaas.navigateToView(context, "propx_list", { searchTerm: params.searchTerm });
    },
    favs: function(context, session, viewModel)
    {
        return maaas.navigateToView(context, "propx_favs");
    },
    exit: function(context)
    {
        return maaas.navigateToView(context, "menu");
    },
}
