// Property Cross list page
//
var http = require('http');

exports.View =
{
    title: "Properties",
    onBack: "exit",
    elements: 
    [
        { control: "stackpanel", width: "*", height: "*", contents: [
            { control: "text", value: "Found {properties} listings in {location}", fontsize: 12 },

            { control: "listview", select: "None", height: "*", width: 460, margin: { bottom: 0 }, binding: { items: "properties", onItemClick: { command: "propertySelected", property: "{$data}" } }, itemTemplate:
                { control: "stackpanel", orientation: "Horizontal", padding: { top: 5, bottom: 5 }, contents: [
                    { control: "image", resource: "{img_url}", height: 90, width: 120 },
                    { control: "stackpanel", orientation: "Vertical", padding: { left: 5 }, contents: [
                        { control: "text", value: "{price_formatted}", font: { bold: true, size: 10 } },
                        { control: "text", value: "{title}", fontsize: 8 },
                    ] },
                ] },
            },
        ] },
    ]
}

function getProperties(callback)
{
    var options = {
        host: "api.nestoria.co.uk",
        port: 80,
        path: '/api?country=uk&pretty=1&action=search_listings&place_name=soho&encoding=json&listing_type=buy',
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        var body = "";
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            var propList = JSON.parse(body);
            callback(null, propList);
        });
    });
    
    req.on('error', function(e) {
        console.log('Problem with request: ' + e.message);
        callback(e, null);
    });

    req.end();
}

exports.InitializeViewModel = function(context, session, params)
{    
    var viewModel =
    {
        location: "None",
        properties: [],
        searchTerm: params && params.searchTerm
    }

    var props = Synchro.waitFor(getProperties);

    console.log("Got " + props.response.listings.length + " listings");
    viewModel.location = props.response.locations[0].title;

    props.response.listings.forEach(function(listing){
        viewModel.properties.push({
            guid: listing.guid,
            title: listing.title,
            summary: listing.summary,
            price_formatted: listing.price_formatted, 
            img_url: listing.img_url,
            beds: listing.bedroom_number,
            baths: listing.bathroom_number
        });
    });

    return viewModel;
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        console.log("Property selected: " + params.property.title);
        return Synchro.navigateToView(context, "propx_detail", { property: params.property });
    },
    exit: function(context)
    {
        return Synchro.navigateToView(context, "propx_main");
    },
}
