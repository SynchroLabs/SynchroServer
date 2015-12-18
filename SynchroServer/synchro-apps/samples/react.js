// React Movies sample app implementation
// https://facebook.github.io/react-native/docs/tutorial.html
//
var request = require('request');
var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';

exports.View =
{
    title: "Movies",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [
            { control: "text", value: "Loading movies...", fontsize: 10, visibility: "{!responseData.movies}" },
            { control: "listview", select: "None", height: "*", width: "*", margin: 0, binding: "responseData.movies", itemTemplate:
                { control: "stackpanel", orientation: "Horizontal", width: "*", margin: 0, contents: [
                    { control: "image", resource: "{posters.thumbnail}", height: 100, width: 75 },
                    { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
                        { control: "text", value: "{title}", width: "*", font: { bold: true, size: 8 } },
                        { control: "text", value: "{year}", width: "*", fontsize: 7 },
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
        responseData: null,
    }
    return viewModel;
}

exports.LoadViewModel = function(context, session, viewModel)
{
    viewModel.responseData = JSON.parse(Synchro.waitFor(context, request, { url: REQUEST_URL }).body);
}