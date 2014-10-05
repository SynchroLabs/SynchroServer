// Property Cross list page
//
exports.View =
{
    title: "Property Details",
    onBack: "exit",
    elements: 
    [
        { control: "stackpanel", width: "*", contents: [
            { control: "text", value: "{property.price_formatted}", font: { bold: true, size: 14 } },
            { control: "text", value: "{property.title}", width: "*", ellipsize: true, fontsize: 12 },
            { control: "image", resource: "{property.img_url}", horizontalAlignment: "Left", margin: { top: 10, bottom: 10 }, height: 300, width: 400 },
            { control: "text", value: "{property.beds} bedroom, {property.baths} bath", fontsize: 12 },
            { control: "text", value: "{property.summary}", width: "*", font: { italic: true, size: 10 } },
        ] }
    ]
}

exports.InitializeViewModel = function(context, session, params)
{
    var viewModel =
    {
        property: params.property,
    }
    return viewModel;
}

exports.Commands = 
{
    exit: function(context)
    {
        return Synchro.navigateToView(context, "propx_list", { fromDetail: true });
    },
}
