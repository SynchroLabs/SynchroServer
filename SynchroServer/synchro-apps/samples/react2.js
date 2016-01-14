// React Movies sample app implementation (using styles)
// https://facebook.github.io/react-native/docs/tutorial.html
//
var request = require('request');
var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';

exports.View =
{
    title: "Movies",
    elements:
    [
        { control: "stackpanel", style: "container", contents: [
            { control: "text", style: "loading", visibility: "{!responseData.movies}" },
            { control: "listview", style: "listView", binding: "responseData.movies", itemTemplate:
                { control: "stackpanel", style: "listItem", contents: [
                    { control: "image", style: "thumbnail", resource: "{posters.thumbnail}" },
                    { control: "stackpanel", style: "rightContainer", contents: [
                        { control: "text", style: "title", value: "{title}" },
                        { control: "text", style: "year", value: "{year}" },
                    ]}
                ]}
            }
        ]}
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        /* Styles */
        container: { orientation: "Vertical", width: "*", height: "*" },
        loading: { value: "Loading movies...", fontsize: 10 },
        listView: { select: "None", height: "*", width: "*", margin: 0 },
        listItem: { orientation: "Horizontal", width: "*", margin: 0 },
        thumbnail: { height: 100, width: 75 },
        rightContainer: { orientation: "Vertical", width: "*" },
        title: { font: { bold: true, size: 8 }, width: "*" },
        year: { fontsize: 7, width: "*" },
        /* Data */
        responseData: null,
    }
    return viewModel;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    viewModel.responseData = JSON.parse((yield Synchro.waitForAwaitable(context, request, { url: REQUEST_URL }))[0].body);
}