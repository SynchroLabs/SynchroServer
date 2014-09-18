// Misc network-related utility methods
//

exports.getExternalIPAddress = function()
{
    // Inspired by http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
    //
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) 
    {
        if (!/(loopback|vmware|internal)/gi.test(devName))
        {
            var iface = interfaces[devName];

            for (var i = 0; i < iface.length; i++) 
            {
                var alias = iface[i];
                
                // Ignore 127.0.0.0/8 (local loopback) and 169.254.0.0/16 (Link-local / APIPA) addresses
                //
                if (alias.family === 'IPv4' && alias.address.indexOf('169.254') != 0 && alias.address.indexOf('127.') != 0 && !alias.internal)
                {
                    return alias.address;                
                }
            }
        }
    }

    return null;
}

exports.addNonStandardPort = function(host, port)
{
    // This bit of port checking is to add a non-standard port spec if needed (particularly handy in local dev
    // environments).  When deploying to Azure, the port is actually a named pipe reference, which you don't want
    // to add to the endpoint - and presumably you'll be listening on a standard port on cloud deployments anyway.  
    // So we only add the port to the endpoint spec if it's an integer greater than 0 and not the default port (80).
    //
    if ((port === parseInt(port)) && (port > 0) && (port != 80))
    {
        host += ":" + port;
    }

    return host;
}

exports.isWebSocket = function(request) 
{
    // The WebSocket.isWebSocket() function was failing (on Azure only) because the Connection: Upgrade
    // header sent by the client (confirmed by Fiddler) was getting modified by something in the Azure 
    // environment such that it showed up at this point as Connection: Keep-alive.  So we will use this
    // simplified version to check for a websocket connect (not sure what else would trigger "upgrade").
    //
    var upgrade = request.headers.upgrade || '';
    return request.method === 'GET' && upgrade.toLowerCase() === 'websocket';
}
