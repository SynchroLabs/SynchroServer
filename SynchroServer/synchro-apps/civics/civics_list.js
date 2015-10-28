// Civics - reps list page
//
var lodash = require("lodash");
var crypto = require('crypto');

var googleApi = require('./google_api');

exports.View =
{
    title: "Representation",
    elements: 
    [
        {
            control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [

                {
                    control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                        { control: "progressring", value: "{isLoading}", height: 40, width: 40, verticalAlignment: "Center", visibility: "{isLoading}" },
                        { control: "text", value: "{message}", width: "*", fontsize: 12, verticalAlignment: "Center", visibility: "{message}" },
                    ]
                },

                {
                    control: "stackpanel", width: "*", height: "*", visibility: "{representatives}", contents: [    
                        {
                            control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "representatives", onItemClick: { command: "repSelected", rep: "{$data}" } }, 
                            itemTemplate:
                            {
                                control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                                    { control: "image", resource: "{photoUrl}", height: 100, width: 75 },
                                    {
                                        control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                            { control: "text", value: "{office}", width: "*", font: { bold: true, size: 10 } },
                                            { control: "text", value: "{name} {partyLetter}", width: "*", fontsize: 8 },
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

function findAndLoadRepresentatives(context, session, viewModel)
{
    try
    {
        var reps = Synchro.waitFor(context, googleApi.callApiAsync, context, "https://www.googleapis.com/civicinfo/v2/representatives", { "address": viewModel.address });
        
        if (!reps || !reps.offices || (reps.offices.length == 0))
        {
            // For some bad addresses, instead of giving you the 404 with the appropriate message it just gives you
            // an empty result.  For example, "foo" triggers this case, whereas "threeve" triggers a 404.  This is a 
            // bug and we 'll work around it here by simulating the expected 404 when we don't get any results...
            //
            var err = new Error("No information for this address");
            err.statusCode = 404;
            throw err;
        }
        
        // Updated recent addresses list (remove existing references, trim list, insert)        
        session.previousAddresses.remove(viewModel.address);
        session.previousAddresses = session.previousAddresses.splice(0, 3);
        session.previousAddresses.unshift(viewModel.address);

        viewModel.isLoading = false;
        viewModel.message = null;
            
        viewModel.representatives = [];
        reps.offices.forEach(function (office)
        {
            // Since we're going to be serializing the property list to the session (via the viewModel and possibly the nav stack),
            // we don't want to copy any properties that we aren't going to use.  We're also going to flatten/normalized a little...
            //
            office.officialIndices.forEach(function (officialIndex)
            {
                var official = reps.officials[officialIndex];
                var normalizedOfficial = lodash.pick(official, "name", "party", "photoUrl");
                normalizedOfficial.office = office.name;

                if (official.party && (official.party != "Unknown"))
                {
                    normalizedOfficial.partyLetter = "(" + official.party[0] + ")";
                }
                              
                // Grab the first phone, email, url (if any)
                //
                if (official.phones && (official.phones.length > 0))
                {
                    normalizedOfficial.phone = official.phones[0];
                }
                if (official.emails && (official.emails.length > 0))
                {
                    normalizedOfficial.email = official.emails[0];
                }
                if (official.urls && (official.urls.length > 0))
                {
                    normalizedOfficial.url = official.urls[0];
                }
                
                // Grab the first Facebook/Twitter id (if any)
                //
                if (official.channels)
                {
                    official.channels.forEach(function (channel)
                    {
                        if (!normalizedOfficial.facebook && (channel.type == "Facebook"))
                        {
                            normalizedOfficial.facebook = channel.id;
                        }
                        else if (!normalizedOfficial.twitter && (channel.type == "Twitter"))
                        {
                            normalizedOfficial.twitter = channel.id;
                        }
                    });
                }
                
                normalizedOfficial.guid = crypto.createHash('md5').update(office.name + office.divisionId + official.name).digest('hex');
                
                viewModel.representatives.push(normalizedOfficial);
            });
        });
    }
    catch (err)
    {
        viewModel.isLoading = false;
        viewModel.message = err.message;
    }
}

exports.InitializeViewModel = function (context, session, params, state)
{
    var viewModel =
    {
        representatives: null,
        isLoading: false,
        address: null
    }
    
    if (state)
    {
        // If we are coming back to the list page from a detail page, we restore the saved representatives list (to save us
        // from having to go get it again)
        //
        lodash.assign(viewModel, state);
    }
    else if (params)
    {
        if (params.address)
        {
            viewModel.address = params.address;
            viewModel.message = "Searching for representatives";
        }
        viewModel.isLoading = true;
    }
    
    return viewModel;
}

exports.LoadViewModel = function (context, session, viewModel)
{
    // Only do the search/populate if we didn't already populated the list (from saved state) in InitViewModel above.
    //
    if ((viewModel.representatives === null) && viewModel.address)
    {
        findAndLoadRepresentatives(context, session, viewModel);
    }
}

exports.Commands = 
{
    repSelected: function (context, session, viewModel, params)
    {
        // Stash the reps list in the session so we can pull it back it when we navigate back here.
        //
        var state = viewModel;
        return Synchro.pushAndNavigateTo(context, "civics_official", { rep: params.rep }, state);
    },
}
