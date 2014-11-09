// Property Cross - property list page
//
var request = require('request');
var lodash = require("lodash");

exports.View =
{
    title: "Properties",
    elements: 
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [

            { control: "text", value: "{message}", width: "*", fontsize: 12, visibility: "{message}" },

            { control: "stackpanel", width: "*", height: "*", visibility: "{properties}", contents: [    
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "properties", onItemClick: { command: "propertySelected", property: "{$data}" } }, 
                    itemTemplate:
                        { control: "stackpanel", orientation: "Horizontal", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{img_url}", height: 90, width: 120 },
                            { control: "stackpanel", orientation: "Vertical", padding: { left: 5 }, contents: [
                                { control: "text", value: "{price_formatted}", font: { bold: true, size: 10 } },
                                { control: "text", value: "{title}", fontsize: 8 },
                            ] },
                        ] },
                    footer:
                        { control: "stackpanel", orientation: "Vertical", contents: [
                            { control: "text", value: "Showing {properties} of {totalProperties} properties", fontsize: 10 },
                            { control: "button", caption: "Load more...", binding: "loadMore", horizontalAlignment: "Center", visibility: "{isMore}" },
                        ] }
                },
            ] },

            { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, visibility: "{locations}", binding: { items: "locations", onItemClick: { command: "locationSelected", location: "{$data}" } }, itemTemplate:
                { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                    { control: "text", value: "{title}", font: { bold: true, size: 10 } },
                    { control: "text", value: "{long_title}", fontsize: 8 },
                ] },
            },
        ] },
    ]
}

function searchForProperties(placename, page, callback)
{
    // http://www.nestoria.co.uk/help/api-search-listings
    var options = 
    {
        url: "http://api.nestoria.co.uk/api?country=uk&pretty=1&action=search_listings&place_name=" + placename + "&encoding=json&listing_type=buy",
        timeout: 5000
    }

    if (page)
    {
        options.url += "&page=" + page;
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
        message: null,
        location: null,
        properties: null,
        page: 0,
        totalPages: 0,
        totalProperties: 0,
        isMore: false,
        searchTerm: params && params.searchTerm,
    }

    if (state)
    {
        // If we are coming back to the list page from a detail page, we restore the saved property list (to save us
        // from having to go get it again)
        //
        lodash.assign(viewModel, state);
        viewModel.message = "Found " + viewModel.totalProperties + " listings in " + viewModel.location.title;
    }
    else
    {
        if (params && params.location)
        {
            viewModel.location = params.location;
            viewModel.message = "Searching listings in " + viewModel.location.title;
        }
        else
        {
            viewModel.message = "Searching listings in " + viewModel.searchTerm;
        }
    }

    return viewModel;
}

function findAndLoadProperties(context, session, viewModel, searchTerm, page)
{
    try
    {
        var props = Synchro.waitFor(context, searchForProperties, searchTerm, page);

        var resp_code = parseInt(props.response.application_response_code);
        if (resp_code < 200) // Successfully returned listings
        {
            console.log("Got " + props.response.listings.length + " listings");

            viewModel.location = lodash.pick(props.response.locations[0], "place_name", "title", "long_title");

            viewModel.page = parseInt(props.response.page);
            viewModel.totalPages = parseInt(props.response.total_pages);
            viewModel.totalProperties = parseInt(props.response.total_results);

            // Put this search on top of the recent searches list (removing previous references to it, and trunctating the list)
            lodash.remove(session.searches, function(location){ return location.place_name == viewModel.location.place_name });
            session.searches = session.searches.splice(0, 3);
            session.searches.unshift(viewModel.location);

            if (viewModel.page == 1)
            {
                viewModel.properties = [];                
            }

            props.response.listings.forEach(function(listing)
            {
                // Since we're going to be serializing the property list to the session (via the viewModel and possibly the nav stack),
                // we don't want to copy any properties that we aren't going to use.
                //
                viewModel.properties.push(
                    lodash.pick(listing, "guid", "title", "summary", "price_formatted", "img_url", "bedroom_number", "bathroom_number")
                    );
            });            

            viewModel.message = "Found " + viewModel.totalProperties + " listings in " + viewModel.location.title;
            viewModel.isMore = viewModel.properties.length < viewModel.totalProperties;
        }
        else if ((resp_code === 200) || (resp_code === 202))
        {
            // Ambiguous (200) or misspelled (202) location, one or more locations provided in props.response.locations
            //
            viewModel.locations = [];
            props.response.locations.forEach(function(location)
            {
                console.log("Found location: " + JSON.stringify(location));
                viewModel.locations.push(
                    lodash.pick(location, "place_name", "title", "long_title")
                    );
            });            

            viewModel.message = "One or more locations found matching " + searchTerm;
        }            
        else if (resp_code === 201)
        {
            viewModel.message = "Location " + viewModel.searchTerm + " was not found";
        }
        else
        {
            console.log("Error: resp_code: " + resp_code);
            console.log("Resp: " + JSON.stringify(props, null, 4));
            viewModel.message = "Error searching for properties";
        }
    }
    catch(err)
    {
        console.log("findAndLoadProperties err: " + err);
        viewModel.message = "Network error searching for properties";
    }
}

exports.LoadViewModel = function(context, session, viewModel)
{
    // Only do the search/populate if we didn't already populated the list (from saved state) in InitViewModel above.
    //
    if (viewModel.properties === null)
    {
        var searchTerm = (viewModel.location && viewModel.location.place_name) || viewModel.searchTerm;
        findAndLoadProperties(context, session, viewModel, searchTerm);
    }
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        // Stash the property list in the session so we can pull it back it when we navigate back here.
        //
        var state = lodash.pick(viewModel, "location", "properties", "page", "totalPages", "totalProperties");
        return Synchro.pushAndNavigateTo(context, "propx_detail", { property: params.property }, state);
    },

    locationSelected: function(context, session, viewModel, params)
    {
        viewModel.locations = null;
        viewModel.message = "Searching listings in " + params.location.title;
        Synchro.interimUpdate(context);
        findAndLoadProperties(context, session, viewModel, params.location.place_name);
    },

    loadMore: function(context, session, viewModel, params)
    {
        findAndLoadProperties(context, session, viewModel, viewModel.location.place_name, viewModel.page + 1);
    },
}
