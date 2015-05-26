var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var log4js = require('log4js');

var synchroConfig = require('synchro-api/synchro-config');

var pkg = require('./package.json');

// Process command line params
//
var commander = require('commander');
commander.version(pkg.version);
commander.option('-i, --inproc', 'Do not fork api processors (run inproc)');
commander.option('-p, --port <n>', 'The port on which the Synchro server will listen', parseInt);
commander.option('-d, --debug-base-port <value>', 'The starting port for the debugging engine', parseInt);
commander.option('-n, --no-studio', 'The Synchro Studio will not be enabled');
commander.option('-c, --config <value>', 'Use the specified configuration file');
commander.parse(process.argv);

if (commander.debugBasePort && commander.debugBasePort <= 1024)
{
    console.log("Error, debug base port must be greater than 1024, was:", commander.debugBasePort);
    process.exit(1);
}

var overrides = {};

if (commander.inproc)
{
    overrides.NOFORK = true;
}

if (commander.port)
{
    overrides.PORT = commander.port;
}
else if (process.env.PORT)
{
    // For Azure specifically, they set the port via the PORT environment variable
    //
    overrides.PORT = process.env.PORT;
}

if (commander.debugBasePort)
{
    overrides.DEBUG_BASE_PORT = commander.debugBasePort;
}

if (!commander.studio)
{
    overrides.NOSTUDIO = true;
}

var config = synchroConfig.getConfig(commander.config, overrides);

log4js.configure(config.get('LOG4JS_CONFIG'));

var logger = log4js.getLogger("app");
logger.info("Synchro server loading - " + config.configDetails);

// Create Synchro API processor manager
//
var synchroApi = require('synchro-api');
var synchroApiUrlPrefix = config.get("API_PATH_PREFIX");

var apiManager = synchroApi.createApiProcessorManager(config.get('DEBUG_BASE_PORT'), config.get('LOG4JS_CONFIG'));

// Create Synchro studio (unless config indicates not to)
//
var synchroStudio = null; 

if (!config.get("NOSTUDIO"))
{
    var synchroStudioModule = null;

    try 
    {
        synchroStudioModule = require('synchro-studio');
    }
    catch (e) 
    {
        if (e instanceof Error && e.code === "MODULE_NOT_FOUND")
            logger.warn("Synchro Studio module (synchro-studio) not installed, no Studio services will be provided");
        else
            throw e;
    }

    if (synchroStudioModule)
    {
        // We could just do this in the try above after the require, but we don't want to exception handler to handle
        // anything except the specific exception of module not found on requiring the studio module.
        //
        var synchroStudioUrlPrefix = config.get("STUDIO_PATH_PREFIX");
        synchroStudio = new synchroStudioModule(config, synchroStudioUrlPrefix, apiManager);
    }
}

// Now let's set up the web / api servers...
//
var app = express();

var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

app.use(express.cookieParser());
// Note: Setting the maxAge value to 60000 (one hour) generates a cookie that .NET does not record (date generation/parsing
// is my guess) - for now we just omit expiration...
app.use(express.cookieSession({ store: sessionStore, secret: 'sdf89f89fd7sdf7sdf', cookie: { maxAge: false, httpOnly: true } }));
app.use(express.favicon());
app.use(log4js.connectLogger(logger, { level: 'auto' })); 
app.use(express.query());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

// Serve client app resources locally (can be removed if not needed in your config).  Note that this route must be added before
// the app.router below in order for it to get a crack at the request.
//
var appStaticResourcePath = config.get('APP_RESOURCE_PATH');
if (appStaticResourcePath)
{
    app.use(synchroApiUrlPrefix + '/resources', express.static(appStaticResourcePath));    
}

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if (synchroStudio)
{
    synchroStudio.addMiddleware(app);
    if (config.get("STUDIO_NOAUTH") == true)
    {
        // No auth...
        synchroStudio.addRoutes(app, config, false);
    }
    else
    {
        // Use built-in auth...
        synchroStudio.addRoutes(app, config);        
    }
}
else
{
    app.get('/', function(request, response)
    {
        response.send('Synchro server running...');
    });
}

// Let the API processor handle requests to /api 
//
app.all(synchroApiUrlPrefix + '/:appPath', function(request, response) 
{
    apiManager.processHttpRequest(request.params.appPath, request, response);
});

var server = http.createServer(app);

if (synchroStudio)
{
    // Studio might want to add a server event handler, like for websocket connections to its endpoint...
    //
    synchroStudio.onServerCreated(server);
}

// Here is all the asynchronous startup stuff...
//
function loadApiProcessorsAsync(callback)
{
    var synchroApps = config.get('SYNCHRO_APPS');

    function loadApiProcessorAsync(synchroApp, callback)
    {
        var servicesConfig =
        {
            sessionStoreSpec:
            {
                packageRequirePath: config.get('SESSIONSTORE_PACKAGE'),
                serviceName: config.get('SESSIONSTORE_SERVICE'),
                serviceConfiguration: config.get('SESSIONSTORE')
            },
            moduleStoreSpec:
            {
                packageRequirePath: config.get('MODULESTORE_PACKAGE'),
                serviceName: config.get('MODULESTORE_SERVICE'),
                serviceConfiguration: config.get('MODULESTORE')
            },
            resourceResolverSpec:
            { 
                packageRequirePath: 'synchro-api', 
                serviceName: 'ResourceResolver',
                serviceConfiguration: 
                {
                    prefix: config.get('APP_RESOURCE_PREFIX')
                }
            },
            appRootPath: config.get('APP_ROOT_PATH')
        }

        var bFork = true;   // Run API processor forked
        var bDebug = (synchroStudio != null) && bFork;  // Enable debugging of API processor (only valid if running forked and studio present)

        if (config.get('NOFORK'))
        {
            // This situation is typically for when you want to run this "app" itself under a local debugger, and
            // you want to be able to debug the api processor and actual Synchro module code also.
            //
            bFork = false;  // Run API processor in-proc
            bDebug = false; // Debugging of API processor not available in-proc, so don't even ask ;)
        }

        apiManager.createApiProcessorAsync(synchroApp.uriPath, synchroApp.container, servicesConfig, bFork, bDebug, callback);
    }

    async.each(synchroApps, loadApiProcessorAsync, callback);    
}

function startServerAsync(callback)
{
    server.listen(config.get('PORT'), function()
    {
        logger.info('Synchro server listening on port ' + this.address().port + ", node version: " + process.version);
        callback(null);
    });
}

async.series([loadApiProcessorsAsync, startServerAsync], function(err)
{
    if (err)
    {
        logger.error("Failed to start: " + err);
    }
    else
    {
        logger.debug("Synchro server up and running!");
    }
});
