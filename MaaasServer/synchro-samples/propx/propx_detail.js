// Property Cross list page
//
exports.View =
{
    title: "Property Details",
    elements: 
    [
        { control: "stackpanel", width: "*", contents: [
            { control: "text", value: "{property.price_formatted}", font: { bold: true, size: 14 } },
            { control: "text", value: "{property.title}", width: "*", ellipsize: true, fontsize: 12 },
            { control: "image", resource: "{property.img_url}", horizontalAlignment: "Left", margin: { top: 10, bottom: 10 }, height: 300, width: 400 },
            { control: "text", value: "{property.bedroom_number} bedroom, {property.bathroom_number} bath", fontsize: 12 },
            { control: "text", value: "{property.summary}", width: "*", font: { italic: true, size: 10 } },
            { select: "First", contents: [
                { select: "All", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, contents: [
                    { control: "commandBar.toggle", text: "Favorite", icon: "Favorite", binding: { value: "fav", onToggle: "favToggled" } },
                    ]},
                { select: "All", filter: { deviceMetric: "os", is: "Android" }, contents: [
                    { control: "actionBar.toggle", checkedicon: "ic_action_important", uncheckedicon: "ic_action_not_important", showAsAction: "IfRoom", binding: { value: "fav", onToggle: "favToggled" } },
                    ]},
                { select: "All", filter: { deviceMetric: "os", is: "iOS" }, contents: [
                    { control: "navBar.toggle", checkedicon: "bookmark-small-mini", uncheckedicon: "bookmark-small-empty-mini" , binding: { value: "fav", onToggle: "favToggled" } },
                    ]},
            ] },
        ] },

    ]
}

exports.InitializeViewModel = function(context, session, params)
{
    var viewModel =
    {
        property: params.property,
        fav: session.favs.indexOf(params.property.guid) >= 0
    }
    return viewModel;
}

exports.Commands = 
{
    favToggled: function(context, session, viewModel, params)
    {
        if (viewModel.fav)
        {
            if (session.favs.indexOf(viewModel.property.guid) === -1)
            {
                session.favs.push(viewModel.property.guid);
            }
        }
        else
        {
            session.favs.remove(viewModel.property.guid);
        }
    },
}