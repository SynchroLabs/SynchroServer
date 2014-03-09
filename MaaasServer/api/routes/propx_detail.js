// Property Cross list page
//
var maaas = require('../maaas');

exports.View =
{
    title: "Property Details",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "Property: {property.title}", fontsize: 12 },
        { control: "image", resource: "{property.img_url}" },
        { control: "text", value: "Price: {property.price_formatted}", fontsize: 10 },
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
        return maaas.navigateToView(context, "propx_list");
    },
}
