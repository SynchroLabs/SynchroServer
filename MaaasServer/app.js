var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var log4js = require('log4js');

var servicesConfig = require('./services-config');
var synchroConfig = require('./synchro-config');

var pkg = require('./package.json');

// Process command line params
//
var commander = require('commander');
commander.version(pkg.version);
commander.option('-n, --nofork', 'Do not fork api processors (run inproc)');
commander.option('-p, --port <n>', 'Server port', parseInt);
commander.option('-s, --services <value>', 'Run with specified services configuration');
commander.option('-l, --logconfig <value>', 'Configure logging using specified logging configuration file');
commander.parse(process.argv);

var overrides = {};
if (commander.nofork)
{
    overrides.NOFORK = true;
}
if (commander.port)
{
    overrides.PORT = commander.port;
}
if (commander.services)
{
    overrides.SERVICES_CONFIG = commander.services;
}
if (commander.logconfig)
{
    overrides.LOG4JS_CONFIG = commander.logconfig;
}

var config = synchroConfig.getConfig(__dirname, overrides);

log4js.configure(config.get('LOG4JS_CONFIG'));

var logger = log4js.getLogger("app");
logger.info("Synchro server loading...");

if (config.get("SERVICES_CONFIG") == "local")
{
    logger.info("Using local services, reasource prefix: " + config.get("LOCAL_RESOURCE_PREFIX"));
}

// Create Synchro API processor manager
//
var synchroApi = require('synchro-api');
var synchroApiUrlPrefix = config.get("API_PATH_PREFIX");

var apiManager = synchroApi.createApiProcessorManager(config.get('DEBUG_BASE_PORT'), config.get('LOG4JS_CONFIG'));

// Create Synchro studio (load and use Studio only if synchro-studio module is present)
//
// !!! There will eventually be configuration to indicate whether Studio should be active.  If config says
//     no Studio, then we can skip the attempted module load (the studio module may or may not be installed,
//     and we don't care).  If config says yes Studio, then we should attempt studio module load and fail with 
//     specific error of module not present if not present.
//
var synchroStudio = null; 
var synchroStudioModule = null;

try 
{
    synchroStudioModule = require('synchro-studio');
}
catch (e) 
{
    if (e instanceof Error && e.code === "MODULE_NOT_FOUND")
        logger.info("Synchro Studio module (synchro-studio) not installed, no Studio services will be provided");
    else
        throw e;
}

if (synchroStudioModule)
{
    // We could just do this in the try above after the require, but we don't want to exception handler to handle
    // anything except the specific exception of module not found on requiring the studio module.
    //
    var synchroStudioUrlPrefix = config.get("STUDIO_PATH_PREFIX");
    synchroStudio = new synchroStudioModule(synchroStudioUrlPrefix, apiManager);
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
app.use(synchroApiUrlPrefix + '/resources', express.static(path.join(config.get('FILE_STORE_PATH'), 'resources')));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if (synchroStudio)
{
    synchroStudio.addMiddleware(app);
    synchroStudio.addRoutes(app, config);
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
        var services = servicesConfig.getServicesConfig(config.get('SERVICES_CONFIG'), synchroApp.container);

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

        apiManager.createApiProcessorAsync(synchroApp.uriPath, services, bFork, bDebug, callback);
    }

    async.each(synchroApps, loadApiProcessorAsync, callback);    
}

function startServerAsync(callback)
{
    server.listen(config.get('PORT'), function()
    {
        logger.info('Express server listening on port ' + this.address().port + ", node version: " + process.version);
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
        logger.info("Server up and running!");
    }
});
