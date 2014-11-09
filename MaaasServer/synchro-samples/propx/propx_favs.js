// Property Cross - favorites page
//
var request = require('request');
var lodash = require("lodash");

exports.View =
{
    title: "Favorites",
    elements: 
    [
        { control: "stackpanel", width: "*", height: "*", contents: [
            { control: "text", value: "{message}", width: "*", fontsize: 12, visibility: "{message}" },

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
    ]
}

function getFavoriteProperties(favorites, callback)
{
    // http://www.nestoria.co.uk/help/api-search-listings
    var options = 
    {
        url: "http://api.nestoria.co.uk/api?country=uk&pretty=1&action=search_listings&guid=" + favorites.join() + "&encoding=json&listing_type=buy",
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
        message: null,
        properties: null,
        selectedProperty: null
    }

    if (session.favs.length > 0)
    {
        if (state)
        {
            // We are coming back to the favorites list page from a detail page, so we restore the saved property 
            // list (to save us from having to go get it again)
            //
            if (session.favs.indexOf(state.visited_property) === -1)
            {
                // If the visited property is not in session.favs, then it was unfavorited while being visited,
                // so we need to remove it from the list of properties we are restoring
                //
                state.properties.remove(function(prop){ return prop.guid == state.visited_property });
            }

            viewModel.properties = state.properties;
        }
        else
        {
            viewModel.message = "Loading favorites..."
        }
    }
    else
    {
        viewModel.properties = [];
        viewModel.message = "You have not added any properties to your favorites"
    }

    return viewModel;
}

exports.LoadViewModel = function(context, session, viewModel)
{
    // Only do the search/populate if we have favs and didn't already populated the list (from saved state) in InitViewModel above.
    //
    if (viewModel.properties === null)
    {
        viewModel.properties = [];
        viewModel.message = null;

        try
        {
            var props = Synchro.waitFor(context, getFavoriteProperties, session.favs);
            if (props.response.listings)
            {
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
            else
            {
                // Protocol error
                viewModel.message = "Error loading favorites";
            }
        }
        catch(err)
        {
            // Network error
            viewModel.message = "Error loading favorites";
        }
    }
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        // Stash the property list in the session so we can pull it back it when we navigate back here.
        //
        // We need to save a reference to the property we're visiting, so that we can check upon return
        // to see if it needs to be removed from the restored property list (if it got "unfavorited").
        //
        var state = { properties: viewModel.properties, visited_property: params.property.guid };
        return Synchro.pushAndNavigateTo(context, "propx_detail", { property: params.property }, state);
    },
}
