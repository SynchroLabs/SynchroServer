// Civics - main page
//
var googleApi = require('./google_api');

exports.View =
{
    title: "Civics",
    elements: 
    [
        {
            control: "stackpanel", width: "*", height: "*", contents: [

                { control: "location", binding: "position" },

                { control: "text", width: "*", value: "Enter your address below to find your government representatives", fontsize: 10 },
                {
                    control: "stackpanel", orientation: "Vertical", margin: { top: 10 }, width: "*", contents: [
                        { control: "edit", binding: "address", placeholder: "street address", width: "320" },
                        {
                            control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", contents: [
                                { control: "button", caption: "Find Reps", verticalAlignment: "Center", binding: "placenameSearch", enabled: "{address}" },
                                { control: "button", caption: "Use Location", verticalAlignment: "Center", binding: "locationSearch", visibility: "{position.available}", enabled: "{position.coordinate}" },
                            ]
                        },
                    ]
                },

                {
                    control: "stackpanel", margin: { top: 10 }, height: "*", visibility: "{previousAddresses}", contents: [
                        { control: "text", value: "Recent addresses", fontsize: 12 },
                        {
                            control: "listview", select: "None", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "previousAddresses", onItemClick: { command: "previousAddress", address: "{$data}" } }, itemTemplate:
                            {
                                control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                                    { control: "text", value: "{$data}", fontsize: 10 },
                                ]
                            },
                        },
                    ]
                },

                { filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, control: "commandBar.button", text: "Favorites", icon: "Favorite", commandBar: "Bottom", binding: "favs" },
                { filter: { deviceMetric: "os", is: "Android" }, control: "actionBar.item", text: "Favorites", showAsAction: "IfRoom", binding: "favs" },
                { filter: { deviceMetric: "os", is: "iOS" }, control: "navBar.button", text: "Favs", binding: "favs" },
            ]
        },
    ]
}

exports.InitializeViewModel = function (context, session)
{
    session.favs = session.favs || [];
    session.previousAddresses = session.previousAddresses || [];
    
    var viewModel =
    {
        address: "",
        previousAddresses: session.previousAddresses,
        position: null,
    }
    return viewModel;
}

exports.Commands = 
{
    placenameSearch: function (context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "civics_list", { address: viewModel.address });
    },
    locationSearch: function (context, session, viewModel)
    {
        try
        {
            var params = 
            {
                "latlng": viewModel.position.coordinate.latitude + "," + viewModel.position.coordinate.longitude,
                "result_type": "street_address"
            }
            var response = Synchro.waitFor(context, googleApi.callApiAsync, context, "https://maps.googleapis.com/maps/api/geocode/json", params);
            if (response && response.results && (response.results.length > 0))
            {
                viewModel.address = response.results[0].formatted_address;
            }
            else
            {
                return Synchro.showMessage(context, { message: "Unable to determine address from location" });
            }
        }
        catch (err)
        {
            return Synchro.showMessage(context, { message: "Error attempting to determine address from location: " + err.message });
        }
    },
    previousAddress: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "civics_list", { address: params.address });
    },
    favs: function (context, session, viewModel)
    {
        return Synchro.pushAndNavigateTo(context, "civics_favs");
    }
}