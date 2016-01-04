var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var semver = require('semver');
var log4js = require('log4js');
var wait = require('wait.for');

var synchroConfig = require('synchro-api/synchro-config');

var pkg = require('./package.json');
var apiPkg = require('synchro-api/package.json');

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

var apiManager = synchroApi.createApiProcessorManager(config.get('DEBUG_BASE_PORT'), config);

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
    app.get('/', function (request, response)
    {
        response.send('Synchro server running...');
    });
}

// Let the API processor handle requests to /api 
//
app.all(synchroApiUrlPrefix + '/:appPath', function (request, response)
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
    var synchroApps = config.get('APPS');
    if (!synchroApps || Object.keys(synchroApps).length == 0)
    {
        logger.error("No Synchro apps defined (via the \"APPS\" key in config) - no apps will be started");
        callback();
        return;
    }
    
    function loadApiProcessorAsyncInFiber(synchroAppPath, callback)
    {
        var synchroApp = synchroApps[synchroAppPath];
        
        // We're going to load the module store (in proc) for the API processor that we're about to create so that
        // we can get the app definition and check version requirements before we create the API processor (which 
        // creation is async and might involve spawning a new process).
        //
        var moduleStoreSpec = 
 {
            packageRequirePath: config.get('MODULESTORE_PACKAGE'),
            serviceName: config.get('MODULESTORE_SERVICE'),
            serviceConfiguration: config.get('MODULESTORE')
        }
        
        var appModuleStore = apiManager.getAppModuleStore(synchroAppPath, synchroApp.container, moduleStoreSpec);
        var appDefinition = appModuleStore.getAppDefinition();
        if (appDefinition.engines && appDefinition.engines.synchro)
        {
            // A Synchro engine version spec exists in the app being loaded, let's check it against the API version...
            //
            if (!semver.satisfies(apiPkg.version, appDefinition.engines.synchro))
            {
                // For now we're just going to log an error message for the app in question, but we will continue to load
                // other apps and start the server.
                //
                logger.error("App being loaded: \"" + appDefinition.name + "\" at path: \"" + synchroAppPath + "\"" +
                    " specified a synchro engine version requirement that was not met by the Synchro API on this server." +
                    " Synchro API version: \"" + apiPkg.version + "\", required version: \"" + appDefinition.engines.synchro + "\"");
                
                callback(null); // Could throw the above messages as an error by passing it as first param to callback, if desired
                return;
            }
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
        
        apiManager.createApiProcessorAsync(synchroAppPath, bFork, bDebug, callback);
    }
    
    function loadApiProcessorAsync(synchroAppPath, callback)
    {
        wait.launchFiber(loadApiProcessorAsyncInFiber, synchroAppPath, callback);
    }
    
    async.each(Object.keys(synchroApps), loadApiProcessorAsync, callback);
}

function startServerAsync(callback)
{
    server.listen(config.get('PORT'), function ()
    {
        logger.info('Synchro server listening on port ' + this.address().port + ", node version: " + process.version);
        callback(null);
    });
}

async.series([loadApiProcessorsAsync, startServerAsync], function (err)
{
    if (err)
    {
        // !!! This gets called if an individual app throws an exception on load, but other apps will load and the server
        //     will still start.  Investigate whether we really want to bail on startup here, and if so, how to do that.
        //
        logger.error("Failed to start: " + err);
    }
    else
    {
        logger.debug("Synchro server up and running!");
    }
});
