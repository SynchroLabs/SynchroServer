// Property Cross list page
//
var maaas = require('../maaas');

var http = require('http');

exports.View =
{
    title: "Properties",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Found {properties} listings in {location}", fontsize: 12 },

        { control: "listview", select: "None", height: 300, maxheight: 300, width: 350, binding: { items: "properties", onItemClick: { command: "propertySelected", property: "{$data}" } }, itemTemplate:
            { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                { control: "image", resource: "{img_url}" },
                { control: "stackpanel", orientation: "Vertical", padding: 5, contents: [
                    { control: "text", value: "{title}" },
                    { control: "text", value: "Price: {price_formatted}" },
                ] },
            ] },
        },
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
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var body = "";
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log('BODY CHUNK (' + chunk.length + " bytes)");
            body += chunk;
        });
        res.on('end', function() {
            console.log('END CHUNK (' + body.length + " bytes)");
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
    }

    if (params)
    {
        viewModel.searchTerm = params.searchTerm;
    }

    var props = maaas.waitFor(getProperties);

    console.log("Got " + props.response.listings.length + " listings");

    viewModel.location = props.response.locations[0].title;

    for (var i = 0; i < props.response.listings.length; i++) 
    {        
        var listing = props.response.listings[i];
        viewModel.properties.push({
            guid: listing.guid,
            title: listing.title,
            price_formatted: listing.price_formatted, 
            img_url: listing.img_url
        });
    }

    return viewModel;
}

exports.Commands = 
{
    propertySelected: function(context, session, viewModel, params)
    {
        console.log("Property selected: " + params.property.title);
        return maaas.navigateToView(context, "propx_detail", { property: params.property });
    },
    exit: function(context)
    {
        return maaas.navigateToView(context, "propx_main");
    },
}
