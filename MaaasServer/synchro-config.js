var path = require('path');
var nconf = require('nconf');

var logger = require('log4js').getLogger("synchro-config");

function getExternalIPAddress()
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

function addNonStandardPort(host, port)
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

// Get config - precendence: command line (represented by "overrides" from caller), environment, config.json, defaults
//
exports.getConfig = function(rootPath, overrides)
{
	if (overrides)
	{
		nconf.overrides(overrides);		
	}

	nconf.env();

	if (rootPath)
	{
		nconf.file({ file: path.resolve(rootPath, "config.json") });	
	}

	nconf.defaults(
	{
	    'PORT': 1337,
	    'SERVICES_CONFIG': 'local',
	    'NOFORK': false,
	    'API_PATH_PREFIX': "/api",
	    'STUDIO_PATH_PREFIX': "/studio",
	    'DEBUG_BASE_PORT': 6969,
	    'FILE_STORE_PATH': path.resolve(rootPath, "synchro-apps"),
	    'LOCAL_RESOURCE_PREFIX': 
	        "http://" + addNonStandardPort(getExternalIPAddress(), (nconf.get("PORT") || 1337)) + 
	        (nconf.get('API_PATH_PREFIX') || "/api") + 
	        "/resources/",
	    'SYNCHRO_APPS':
	    [
	        { "uriPath": "samples", "container": "samples" },
	        { "uriPath": "propx", "container": "propx" },
	        { "uriPath": "field-engineer", "container": "field-engineer" }
	    ],
	    'LOG4JS_CONFIG': 
	    { 
	        // Redirect console.log to log4js, turn off color coding
	        appenders:
	        [ 
	            { type: "console", layout: { type: "basic" } } 
	        ],
	        replaceConsole: true,
	        levels: 
	        {
	            '[all]': 'INFO'
	        }
	    }
	});

	nconf.addNonStandardPort = function(host)
	{
		return addNonStandardPort(host, this.get("PORT"));
	}

	return nconf;
}
