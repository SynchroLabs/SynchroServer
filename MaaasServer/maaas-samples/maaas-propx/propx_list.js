// Property Cross list page
//
var http = require('http');

exports.View =
{
    title: "Properties",
    onBack: "exit",
    elements: 
    [
        { select: "First", contents: [
            { select: "All", filter: [ { deviceMetric: "deviceType", is: "Tablet" }, { viewMetric: "orientation", is: "Landscape" } ], contents: [
                /* Tablet in landscape - list with details panel for selected item */
                { control: "stackpanel", filter: { deviceMetric: "deviceType", is: "Tablet" }, orientation: "Horizontal", width: "*", height: "*", contents: [
                    { control: "stackpanel", width: "480", height: "*", contents: [
                        { control: "text", value: "Found {properties} listings in {location}", fontsize: 12 },

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
                            { control: "text", value: "{beds} bedroom, {baths} bath", fontsize: 12 },
                            { control: "text", value: "{summary}", width: "*", font: { italic: true, size: 10 } },
                        ] },
                    ] },
                ] },
            ] },
            { select: "All", contents: [
                /* Otherwise (phone, or tablet in portrait) */
                { control: "stackpanel", width: "*", height: "*", contents: [
                    { control: "text", value: "Found {properties} listings in {location}", fontsize: 12 },

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
        selectedProperty: null,
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
