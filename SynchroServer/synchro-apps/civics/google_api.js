// Google API helper module
//
var request = require('request');

var synchroConfig = require('synchro-api/synchro-config');
var config = synchroConfig.getConfig();

exports.callApiAsync = function(endpoint, params, callback)
{
    var url = endpoint + "?";
    if (params)
    {
        Object.keys(params).forEach(function (key)
        {
            url += key + "=" + encodeURIComponent(params[key]) + "&";
        });
    }
    url += "key=" + config.get("GOOGLE_CIVICS_KEY");
    
    request({ url: url, timeout: 5000 }, function (err, response, body)
    {
        var jsonResponse = (!err && body) ? JSON.parse(body) : null;
        
        if (!err)
        {
            if (response.statusCode != 200)
            {
                // Non-200 status is logical/protocol/service error
                //
                if (jsonResponse && jsonResponse.error)
                {
                    // Google "Standard Error Response" - https://developers.google.com/civic-information/docs/v2/standard_errors
                    err = new Error(jsonResponse.error.message);
                    err.statusCode = jsonResponse.error.code;
                    err.response = jsonResponse;
                }
                else
                {
                    // General purpose HTTP error...
                    err = new Error(jsonResponse.statusMessage);
                    err.statusCode = response.statusCode;
                }
                jsonResponse = null;
            }
        }
        
        callback(err, jsonResponse);
    });
}