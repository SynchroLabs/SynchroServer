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
                { control: "text", value: "{rep.office}", width: "*", font: { bold: true, size: 14 } },
                { control: "text", value: "{rep.name} {rep.partyLetter}", width: "*", ellipsize: true, fontsize: 12 },
                { control: "image", resource: "{rep.photoUrl}", visibility: "{rep.photoUrl}", horizontalAlignment: "Left", margin: { top: 10, bottom: 10 }, width: 300 },

                { control: "stackpanel", orientation: "Vertical", margin: 0, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", visibility: "{rep.phone}", contents: [
                        { control: "button", caption: "Call", verticalAlignment: "Center", binding: "onTel" },
                        { control: "text", value: "{rep.phone}", verticalAlignment: "Center", width: "*", fontsize: 8 },
                    ]},
                    { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", visibility: "{rep.email}", contents: [
                        { control: "button", caption: "Email", verticalAlignment: "Center", binding: "onEmail" },
                        { control: "text", value: "{rep.email}", verticalAlignment: "Center", width: "*", fontsize: 8 },
                    ]},
                    { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", visibility: "{rep.facebook}", contents: [
                        { control: "button", caption: "Facebook", verticalAlignment: "Center", binding: "onFacebook" },
                        { control: "text", value: "{rep.facebook}", verticalAlignment: "Center", width: "*", fontsize: 8 },
                    ]},
                    { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", visibility: "{rep.twitter}", contents: [
                        { control: "button", caption: "Twitter", verticalAlignment: "Center", binding: "onTwitter"},
                        { control: "text", value: "{rep.twitter}", verticalAlignment: "Center", width: "*", fontsize: 8 },
                    ]},
                    { control: "stackpanel", orientation: "Horizontal", margin: 0, width: "*", visibility: "{rep.url}", contents: [
                        { control: "button", caption: "Web", verticalAlignment: "Center", binding: "onWeb" },
                        { control: "text", value: "{rep.url}", verticalAlignment: "Center", width: "*", fontsize: 8 },
                    ]}
                ]},      

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
    onTel: function (context, session, viewModel)
    {
        Synchro.launchUrl(context, "tel:" + viewModel.rep.phone);
    },
    onEmail: function (context, session, viewModel)
    {
        Synchro.launchUrl(context, "mailto:" + viewModel.rep.email);
    },
    onWeb: function (context, session, viewModel)
    {
        Synchro.launchUrl(context, viewModel.rep.url);
    },
    onFacebook: function (context, session, viewModel)
    {
        Synchro.launchUrl(context, "fb://profile/" + viewModel.rep.facebook, "http://www.facebook.com/" + viewModel.rep.facebook);
    },
    onTwitter: function (context, session, viewModel)
    {
        Synchro.launchUrl(context, "twitter://user?screen_name=" + viewModel.rep.twitter, "http://twitter.com/" + viewModel.rep.twitter);
    },
}