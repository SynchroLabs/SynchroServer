// Civics - official details page
//
var lodash = require("lodash");

exports.View =
{
    title: "Official",
    elements: 
    [
        {
            control: "stackpanel", width: "*", contents: [
                { control: "text", value: "{rep.office}", font: { bold: true, size: 14 } },
                { control: "text", value: "{rep.name} {rep.partyLetter}", width: "*", ellipsize: true, fontsize: 12 },
                { control: "image", resource: "{rep.photoUrl}", visibility: "{rep.photoUrl}", horizontalAlignment: "Left", margin: { top: 10, bottom: 10 }, height: 300, width: 400 },
                { control: "text", value: "Phone: {rep.phone}", width: "*", visibility: "{rep.phone}", fontsize: 12 },
                { control: "text", value: "Email: {rep.email}", width: "*", visibility: "{rep.email}", fontsize: 12 },
                { control: "text", value: "Facebook: {rep.facebook}", width: "*", visibility: "{rep.facebook}", fontsize: 12 },
                { control: "text", value: "Twitter: {rep.twitter}", width: "*", visibility: "{rep.twitter}", fontsize: 12 },
                { control: "text", value: "Web: {rep.url}", width: "*", visibility: "{rep.url}", fontsize: 12 },

                { filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, control: "commandBar.toggle", text: "Favorite", icon: "Favorite", binding: { value: "fav", onToggle: "favToggled" } },
                { filter: { deviceMetric: "os", is: "Android" }, control: "actionBar.toggle", checkedicon: "ic_action_important", uncheckedicon: "ic_action_not_important", showAsAction: "IfRoom", binding: { value: "fav", onToggle: "favToggled" } },
                { filter: { deviceMetric: "os", is: "iOS" }, control: "navBar.toggle", checkedicon: "star-mini", uncheckedicon: "star-empty-mini" , binding: { value: "fav", onToggle: "favToggled" } },
            ]
        },
    ]
}

exports.InitializeViewModel = function (context, session, params)
{
    var viewModel =
    {
        rep: params.rep,
        fav: lodash.find(session.favs, function (fav){ return fav.guid == params.rep.guid }) != null
    }
    return viewModel;
}

exports.Commands = 
{
    favToggled: function (context, session, viewModel)
    {
        if (viewModel.fav)
        {
            if (lodash.findIndex(session.favs, function (fav) { return fav.guid == viewModel.rep.guid }) === -1)
            {
                session.favs.push(viewModel.rep);
            }
        }
        else
        {
            lodash.remove(session.favs, function (fav) { return fav.guid == viewModel.rep.guid });
        }
    },
}