// Property Cross - property list page
//
var request = require('request');
var lodash = require("lodash");

exports.Test = function()
{
    console.log("Test");
}

exports.View =
{
    title: "Properties",
    elements: 
    [
        { select: "First", contents: [
            { select: "All", filter: [ { deviceMetric: "deviceType", is: "Tablet" }, { viewMetric: "orientation", is: "Landscape" } ], contents: [
                // Tablet in landscape - list with details panel for selected item 
                { control: "stackpanel", orientation: "Horizontal", width: "*", height: "*", contents: [
                    { control: "stackpanel", width: "480", height: "*", contents: [
                        { control: "text", value: "Searching listings in {searchTerm}...", fontsize: 12, visibility: "{isSearching}" },
                        { control: "text", value: "Found {properties} listings in {location}", fontsize: 12, visibility: "{!isSearching}" },

                        { control: "listview", select: "Single", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "properties", selection: "selectedProperty" }, itemTemplate:
                            { control: "stackpanel", orientation: "Horizontal", padding: { top: 5, bottom: 5 }, contents: [
                                { control: "image", resource: "{img_url}", height: 90, width: 120 },
                                { control: "stackpanel", orientation: "Vertical", padding: { left: 5 }, contents: [
                                    { control: "text", value: "{price_formatted}", font: { bold: true, size: 10 } },
                                    { control: "text", value: "{title}", fontsize: 8 },
                                ] },
                            ] },
                        },
                    ] },
                    { control: "stackpanel", width: "*", height: "*", visibility: "{$data}", binding: { with: "selectedProperty" }, contents: [
                        { control: "text", value: "Property Detail", fontsize: 12 },

                        { control: "stackpanel", contents: [
                            { control: "text", value: "{price_formatted}", font: { bold: true, size: 14 } },
                            { control: "text", value: "{title}", width: "*", ellipsize: true, fontsize: 12 },
                            { control: "image", resource: "{img_url}", horizontalAlignment: "Left", margin: { top: 10, bottom: 10 }, height: 300, width: 400 },
                            { control: "text", value: "{bedroom_number} bedroom, {bathroom_number} bath", fontsize: 12 },
                            { control: "text", value: "{summary}", width: "*", font: { italic: true, size: 10 } },
                        ] },
                    ] },
                ] },
            ] },
            { select: "All", contents: [
                // Otherwise (phone, or tablet in portrait)
                { control: "stackpanel", width: "*", height: "*", contents: [
                    { control: "text", value: "Searching listings in {searchTerm}...", fontsize: 12, visibility: "{isSearching}" },
                    { control: "text", value: "Found {properties} listings in {location}", fontsize: 12, visibility: "{!isSearching}" },

                    { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "properties", onItemClick: { command: "propertySelected", property: "{$data}" } }, itemTemplate:
                        { control: "stackpanel", orientation: "Horizontal", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{img_url}", height: 90, width: 120 },
                            { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                { control: "text", value: "{price_formatted}", font: { bold: true, size: 10 } },
                                { control: "text", value: "{title}", fontsize: 8 },
                            ] },
                        ] },
                    },
                ] },
            ] },
        ] }
    ]
}

function searchForProperties(placename, callback)
{
    // http://www.nestoria.co.uk/help/api-search-listings
    var options = 
    {
        url: "http://api.nestoria.co.uk/api?country=uk&pretty=1&action=search_listings&place_name=" + placename + "&encoding=json&listing_type=buy",
        timeout: 5000
    }

    request(options, function(err, response, body)
    {
        var jsonResponse = (!err && (response.statusCode == 200)) ? JSON.parse(body) : null;
        callback(err, jsonResponse);
    });
}

exports.InitializeViewModel = function(context, session, params, state)
{    
    var viewModel =
    {
        location: "None",
        properties: null,
        selectedProperty: null,
        searchTerm: params && params.searchTerm,
        isSearching: true
    }

    // If we are coming back to the list page from a detail page, we restore the saved property list (to save us
    // from having to go get it again)
    //
    if (state)
    {
        viewModel.location = state.location;
        viewModel.properties = state.properties;
        viewModel.isSearching = false;
    }

    return viewModel;
}

exports.LoadViewModel = function(context, session, viewModel)
{
    // Only do the search/populate if we didn't already populated the list (from saved state) in InitViewModel above.
    //
    if (viewModel.properties === null)
    {
        viewModel.properties = [];

        try
        {
            var props = Synchro.waitFor(context, searchForProperties, viewModel.searchTerm);

            // console.log("Got JSON response: " + JSON.stringify(props, null, 4));

            var resp_code = parseInt(props.response.application_response_code);
            if (resp_code < 200) // Successfully returned listings
            {
                viewModel.location = props.response.locations[0].title;
                console.log("Got " + props.response.listings.length + " listings");

                // Since we're going to be serializing the property list to the session (via the viewModel and possibly the nav stack),
                // we don't want to copy any properties that we aren't going to use.
                //
                props.response.listings.forEach(function(listing)
                {
                    viewModel.properties.push(
                        lodash.pick(listing, "guid", "title", "summary", "price_formatted", "img_url", "bedroom_number", "bathroom_number")
                        );
                });            
            }
            else if ((resp_code === 200) || (resp_code === 202))
            {
                // !!! Ambiguous/misspelled location, one or more locations provided in props.response.locations
                console.log("Ambiguous/misspelled location");
            }            
            else if (resp_code === 201)
            {
                // !!! Location could not be found
                console.log("Location not found");
            }
            else
            {
                // !!! Error
                console.log("Error searching for properties");
            }
        }
        catch(err)
        {
            // !!! Request error
            console.log("Network error searching for properties");
        }

        viewModel.isSearching = false;
    }
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        // Stash the property list in the session so we can pull it back it when we navigate back here.
        //
        var state = { location: viewModel.location, properties: viewModel.properties };

        return Synchro.pushAndNavigateTo(context, "propx_detail", { property: params.property }, state);
    },
}
