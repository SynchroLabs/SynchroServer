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

            { control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                { control: "progressring", value: "{isLoading}", height: 40, width: 40, verticalAlignment: "Center", visibility: "{isLoading}" },
                { control: "text", value: "{message}", width: "*", fontsize: 12, verticalAlignment: "Center", visibility: "{message}" },
            ] },

            { control: "stackpanel", width: "*", height: "*", visibility: "{properties}", contents: [    
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "properties", onItemClick: { command: "propertySelected", property: "{$data}" } }, 
                    itemTemplate:
                        { control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{img_url}", height: 90, width: 120 },
                            { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                { control: "text", value: "{price_formatted}", font: { bold: true, size: 10 } },
                                { control: "text", value: "{title}", fontsize: 8 },
                            ] },
                        ] },
                    footer:
                        { control: "stackpanel", orientation: "Vertical", height: 110, contents: [
                            { control: "stackpanel", orientation: "Horizontal", contents: [
                                { control: "progressring", value: "{isLoadingMore}", height: 30, width: 30, verticalAlignment: "Center", visibility: "{isLoadingMore}" },
                                { control: "text", value: "Loading more properties", verticalAlignment: "Center", visibility: "{isLoadingMore}", margin: 5, fontsize: 10 },
                            ] },
                            { control: "text", value: "Showing {properties} of {totalProperties} properties", visibility: "{!isLoadingMore}", margin: 5, fontsize: 10 },
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

function searchForProperties(criteria, page, callback)
{
    // http://www.nestoria.co.uk/help/api-search-listings
    var options = 
    {
        url: "http://api.nestoria.co.uk/api?country=uk&pretty=1&action=search_listings&" + criteria + "&encoding=json&listing_type=buy",
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
        properties: null,
        page: 0,
        totalPages: 0,
        totalProperties: 0,
        isLoading: false,
        isLoadingMore: false,
        isMore: false,
        searchTerm: null,
        searchLocation: null,
        searchPosition: null,
    }

    if (state)
    {
        // If we are coming back to the list page from a detail page, we restore the saved property list (to save us
        // from having to go get it again)
        //
        lodash.assign(viewModel, state);
    }
    else if (params)
    {
        if (params.searchTerm)
        {
            viewModel.searchTerm = params.searchTerm;
            viewModel.message = "Searching listings in " + viewModel.searchTerm;
        }
        else if (params.searchLocation)
        {
            viewModel.searchLocation = params.searchLocation;
            viewModel.message = "Searching listings in " + viewModel.searchLocation.title;
        }
        else if (params.searchPosition)
        {
            viewModel.searchPosition = params.searchPosition;
            viewModel.message = "Searching listings near current location";
        }
        viewModel.isLoading = true;
    } 

    return viewModel;
}

function populateViewModelPropertiesFromResponse(viewModel, response)
{
    viewModel.page = parseInt(response.page);
    viewModel.totalPages = response.total_pages ? parseInt(response.total_pages) : 1; // 1 if null/undefined
    viewModel.totalProperties = response.total_results ? parseInt(response.total_results) : 0; // 0 if null/undefined
    if (viewModel.page == 1)
    {
        viewModel.properties = [];                
    }

    response.listings.forEach(function(listing)
    {
        // Since we're going to be serializing the property list to the session (via the viewModel and possibly the nav stack),
        // we don't want to copy any properties that we aren't going to use.
        //
        viewModel.properties.push(
            lodash.pick(listing, "guid", "title", "summary", "price_formatted", "img_url", "bedroom_number", "bathroom_number")
            );
    });
    
    viewModel.isMore = viewModel.properties.length < viewModel.totalProperties;
}

function findAndLoadPropertiesByProximity(context, session, viewModel, page)
{
    try
    {
        var criteria = "centre_point=" + viewModel.searchPosition.latitude + "," + viewModel.searchPosition.longitude;
        var props = Synchro.waitFor(context, searchForProperties, criteria, page);

        viewModel.isLoading = false;
        viewModel.isLoadingMore = false;

        var resp_code = parseInt(props.response.application_response_code);
        if (resp_code < 200) // Successfully returned listings
        {
            console.log("Got " + props.response.listings.length + " listings");
            populateViewModelPropertiesFromResponse(viewModel, props.response);
            viewModel.message = "Found " + viewModel.totalProperties + " listings near current location";
        }
        else if (resp_code === 210) // Coordinate error
        {
            viewModel.message = "Current location is not within the UK, no listings nearby";
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
        console.log("findAndLoadPropertiesByProximity err: " + err);
        viewModel.message = "Network error searching for properties";
    }
}

function findAndLoadPropertiesByPlace(context, session, viewModel, page)
{
    try
    {
        var criteria = "place_name=" + (viewModel.searchLocation ? viewModel.searchLocation.place_name : viewModel.searchTerm);
        var props = Synchro.waitFor(context, searchForProperties, criteria, page);

        viewModel.isLoading = false;
        viewModel.isLoadingMore = false;

        var resp_code = parseInt(props.response.application_response_code);

        if (resp_code < 200) // Successfully returned listings
        {
            console.log("Got " + props.response.listings.length + " listings");

            if (!viewModel.searchLocation)
            {
                viewModel.searchTerm = null;
                viewModel.searchLocation = lodash.pick(props.response.locations[0], "place_name", "title", "long_title");                
            }

            // Put this search on top of the recent searches list (removing previous references to it, and trunctating the list)
            lodash.remove(session.searches, function(location){ return location.place_name == viewModel.searchLocation.place_name });
            session.searches = session.searches.splice(0, 3);
            session.searches.unshift(viewModel.searchLocation);

            populateViewModelPropertiesFromResponse(viewModel, props.response);
            viewModel.message = "Found " + viewModel.totalProperties + " listings in " + viewModel.searchLocation.title;
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

            viewModel.message = "One or more locations found matching " + viewModel.searchTerm;
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
        console.log("findAndLoadPropertiesByPlace err: " + err);
        viewModel.message = "Network error searching for properties";
    }
}

exports.LoadViewModel = function(context, session, viewModel)
{
    // Only do the search/populate if we didn't already populated the list (from saved state) in InitViewModel above.
    //
    if (viewModel.properties === null)
    {
        if (viewModel.searchPosition)
        {
            findAndLoadPropertiesByProximity(context, session, viewModel);
        }
        else
        {
            findAndLoadPropertiesByPlace(context, session, viewModel);
        }
    }
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        // Stash the property list in the session so we can pull it back it when we navigate back here.
        //
        var state = lodash.pick(viewModel, "searchLocation", "searchPosition", "message", "properties", "page", "totalPages", "totalProperties");
        return Synchro.pushAndNavigateTo(context, "propx_detail", { property: params.property }, state);
    },

    locationSelected: function(context, session, viewModel, params)
    {
        viewModel.locations = null;
        viewModel.searchTerm = null;
        viewModel.searchLocation = params.location;
        viewModel.message = "Searching listings in " + viewModel.searchLocation.title;
        Synchro.interimUpdate(context);
        findAndLoadPropertiesByPlace(context, session, viewModel);
    },

    loadMore: function(context, session, viewModel, params)
    {
        viewModel.isMore = false; // Suppress "Load More..." while we're loading more
        viewModel.isLoadingMore = true;
        Synchro.interimUpdate(context);

        if (viewModel.searchPosition)
        {
            findAndLoadPropertiesByProximity(context, session, viewModel, viewModel.page + 1);
        }
        else
        {
            findAndLoadPropertiesByPlace(context, session, viewModel, viewModel.page + 1);
        }
    },
}
