// Property Cross - favorites page
//
var request = require('request');
var lodash = require("lodash");

exports.View =
{
    title: "Favorites",
    elements: 
     [
        {
            control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [

                {
                    control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                        { control: "text", value: "{message}", width: "*", fontsize: 12, verticalAlignment: "Center", visibility: "{message}" },
                    ]
                },

                {
                    control: "stackpanel", width: "*", height: "*", visibility: "{reps}", contents: [    
                        {
                            control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "reps", onItemClick: { command: "repSelected", rep: "{$data}" } }, 
                            itemTemplate:
                            {
                                control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                                    { control: "image", resource: "{photoUrl}", height: 100, width: 75 },
                                    {
                                        control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                            { control: "text", value: "{office}", font: { bold: true, size: 10 } },
                                            { control: "text", value: "{name} {partyLetter}", fontsize: 8 },
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        },
    ]
}

exports.InitializeViewModel = function (context, session, params, state)
{
    var viewModel =
    {
        reps: session.favs,
        message: (session.favs.length == 0) ? "No favorites chosen" : null
    }
    
    return viewModel;
}

exports.Commands = 
{
    repSelected: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "civics_official", { rep: params.rep });
    },
}
