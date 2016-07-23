var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var semver = require('semver');
var log4js = require('log4js');
var co = require('co');
var cors = require('cors');

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
var synchroAppUrlPrefix = config.get("APP_PATH_PREFIX");

var apiManager = synchroApi.createApiProcessorManager(config.get('DEBUG_BASE_PORT'), config); 

var synchroWeb = null;

if (synchroAppUrlPrefix)
{
    var synchroWebModule = null;

    try 
    {
        synchroWebModule = require('synchro-web');
    }
    catch (e) 
    {
        if (e instanceof Error && e.code === "MODULE_NOT_FOUND")
            logger.warn("Synchro Web app server module (synchro-web) not installed, no Web Apps will be provided");
        else
            throw e;
    }

    if (synchroWebModule)
    {
        // We could just do this in the try above after the require, but we don't want to exception handler to handle
        // anything except the specific exception of module not found on requiring the web module.
        //
        synchroWeb = new synchroWebModule(config, synchroAppUrlPrefix, synchroApiUrlPrefix);
    }
}

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
        synchroStudio = new synchroStudioModule(config, synchroStudioUrlPrefix, apiManager, synchroAppUrlPrefix);
    }
}

// Now let's set up the web / api servers...
//
var app = express();

app.use(cors());

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

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if (synchroWeb)
{
    synchroWeb.addMiddleware(app);
    synchroWeb.addRoutes(app);
}

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

app.get('/health', function(request, response)
{
    co(function * ()
    {
        var health = { 'healthy': true };

        // Check each child processor for health...
        //
        var apiProcessors = apiManager.getApiProcessors();
        var apiProcessorPaths = Object.keys(apiProcessors);
        for (var i = 0; i < apiProcessorPaths.length; i++)
        {
            var apiProcessorPath = apiProcessorPaths[i];
            var apiProcessor = apiProcessors[apiProcessorPath];

            logger.debug("Checking health of processor for app at path: '%s'", apiProcessorPath);

            try
            {
                var processorHealth = yield apiProcessor.healthCheck();
                if (!processorHealth)
                {
                    health.healthy = false;
                }
                health[apiProcessorPath] = { 'health': processorHealth };
            }
            catch (err)
            {
                health.healthy = false;
                health[apiProcessorPath] = { 'health': false, 'reason': 'error', 'message': err.message };
            }
        }

        if (health.healthy)
        {
            response.send(health);
        }
        else
        {
            response.status(500).send(health);
        }

    }).catch(function(err)
    {
        // Very unlikely we'd ever hit this - would have to be a logical/code error in the reqest processing above
        //
        logger.error("Error checking health:", err);
        response.status(500).send({ 'healthy': false, 'error': 'Error checking health', 'message': err.message});
    });
});

// Let the API processor handle requests to /api 
//
app.all(synchroApiUrlPrefix + '/:appPath', function(request, response) 
{
    apiManager.processHttpRequest(request.params.appPath, request, response);
});

// This will serve static resources (primarily intended to support images) from the resource directory of any installed app.
// This is useful for local dev/test, but you might want to remove it for production if your resources are served from a CDN
// or other more appropriate solution (which will also require you to set APP_RESOURCE_PREFIX - see docs).
// 
app.all(synchroApiUrlPrefix + '/:appPath/resources/:resource', function(request, response) 
{
    var container = config.get("APPS:" + request.params.appPath + ":container");
    if (container)
    {
        response.sendfile(__dirname + '/' + config.get('APP_ROOT_PATH') + '/' + container + '/resources/' + request.params.resource);
    }
    else
    {
        res.status(404).send('Not such app at this location to provide resource');
    }
});

var server = http.createServer(app);

if (synchroStudio)
{
    // Studio might want to add a server event handler, like for websocket connections to its endpoint...
    //
    synchroStudio.onServerCreated(server);
}

function * initSynchroAppsConfig(moduleStore)
{
    // Load the APPS config from either config.json (local) or from the module store...
    //
    // We're just going to look in the APPS key of the config.json store (to see if there is dictionary of apps, or a
    // string indicating a module store file to use).  We look in this store specifically so as not to pick up any
    // apps state that may have gotten into the config via environment variables.
    //
    var config_json = config.stores["config.json"].store;
    var synchroAppsConfig = config_json['APPS'];

    if (typeof synchroAppsConfig === 'object')
    {
        logger.info("Apps defined in config.json");
        return false; // Apps config from config.json
    }
    else
    {
        // Apps config (if any) is in a module store file
        //
        // We put apps config in a specially named store representing the module file (so we can replace it on reload as needed).
        //
        var moduleStoreAppsStore = config.stores["module_store_apps"];
        moduleStoreAppsStore.reset();

        var moduleStoreAppFile = 'apps.json'; // default module store file
        if (typeof synchroAppsConfig === 'string')
        {
            moduleStoreAppFile = synchroAppsConfig; // explicit module store file
        }

        var moduleStoreAppConfig = yield moduleStore.getStoreFileAwaitable(moduleStoreAppFile);
        if (moduleStoreAppConfig)
        {
            logger.info("Loading module store APPS config from module store:", moduleStoreAppFile);
            var moduleStoreApps = JSON.parse(moduleStoreAppConfig);

            moduleStoreAppsStore.store['APPS'] = moduleStoreApps;
        }
        else
        {
            logger.error("No APPS config found in module store at:", moduleStoreAppFile);
        }

        return true; // Apps config loaded/reloaded from module store file
    }
}

// Here is all the asynchronous startup stuff...
//
function * loadApiProcessorAwaitable(moduleStore, synchroAppPath, synchroApp)
{
    // We're going to load the module store (in proc) for the API processor that we're about to create so that
    // we can get the app definition and check version requirements before we create the API processor (which 
    // creation is async and might involve spawning a new process).
    //
    var appModuleStore = yield moduleStore.getAppModuleStoreAwaitable(synchroApp.container);
    var appDefinition = yield appModuleStore.getAppDefinitionAwaitable();
    if (appDefinition)
    {
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
                return;
            }
        }
    }
    else
    {
        // No appDefinition provided by module store
        logger.error("No app definition found for app at path: %s, app not loaded", synchroAppPath);
        return;
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

    if (bDebug && semver.satisfies(process.version, ">= 5.0.0 <5.4.0"))
    {
        logger.warn("Versions of Node.js from 5.0.0 and up to, but not including, 5.4.0, are not stable in debug mode. Please upgrade to at least 5.4.0.");
    }

    return yield apiManager.createApiProcessorAwaitable(synchroAppPath, bFork, bDebug);
}

function * loadApiProcessorsAwaitable()
{
    var moduleStore = synchroApi.createModuleStore(config);

    yield initSynchroAppsConfig(moduleStore);

    var synchroApps = config.get('APPS');
    if (!synchroApps || Object.keys(synchroApps).length == 0)
    {
        logger.error("No Synchro apps defined - no apps will be started");
        return;
    }

    // Dump apps to verify config - this includes apps from file config (local or module store) as well as from env vars.
    // 
    var synchroAppPaths = Object.keys(synchroApps);
    for (var i = 0; i < synchroAppPaths.length; i++)
    {
        logger.debug("Found app at path: %s, container: %s", synchroAppPaths[i], synchroApps[synchroAppPaths[i]].container);
    }

    
    function * loadAllProcessorsAwaitable()
    {
        var synchroAppPaths = Object.keys(synchroApps);
        for (var i = 0; i < synchroAppPaths.length; i++)
        {
            var synchroAppPath = synchroAppPaths[i];
            var synchroApp = synchroApps[synchroAppPath];
            yield loadApiProcessorAwaitable(moduleStore, synchroAppPath, synchroApp);
        }
    }

    if (config.get('NOFORK'))
    {
        yield loadAllProcessorsAwaitable();
    }
    else
    {
        // Extra protection for restart case where all forked child processes are not yet shut down (and thus ports are in use)
        //
        logger.debug("Waiting 500ms before launching api processors");
        yield function(done){setTimeout(done, 500)};
        yield loadAllProcessorsAwaitable();
    }
}

function startServerAsync(callback)
{
    server.listen(config.get('PORT'), function()
    {
        logger.info('Synchro server listening on port ' + this.address().port + ", node version: " + process.version);
        callback(null);
    });
}

// Make the running set of apps match the configured set of apps (start and stop app processors as required), and reload any 
// still-running app processors.
//
function * reloadProcessors()
{
    // Note: We are only supporting the case where the APPS configuration can be changed at runtime (and reloaded while
    //       running) if it is specificed in a module store file.
    //
    //       Supporting APPS changes from config.json or environment vars is problematic for a number of reasons, not
    //       least of which is that we wouldn't support any other configuration changes from those sources (service 
    //       definitions, PORT, etc).
    //
    var moduleStore = synchroApi.createModuleStore(config);

    if (yield initSynchroAppsConfig(moduleStore))
    {
        // APPS definition in module store may have changed
        //
        var synchroApps = config.get('APPS');

        // Make a shallow copy of the configured apps list (so we can remove apps from it as we process them below).
        //
        var configuredAppsBeingProcessed = {};
        var synchroAppPaths = Object.keys(synchroApps);
        for (var i = 0; i < synchroAppPaths.length; i++)
        {
            logger.debug("Found configured app at path: %s, container: %s", synchroAppPaths[i], synchroApps[synchroAppPaths[i]].container);
            configuredAppsBeingProcessed[synchroAppPaths[i]] = synchroApps[synchroAppPaths[i]]; 
        }

        // Go through running apps list and process against configured-apps-being-processed list.  
        //
        var apiProcessors = apiManager.getApiProcessors();
        var apiProcessorPaths = Object.keys(apiProcessors);
        for (var i = 0; i < apiProcessorPaths.length; i++)
        {
            var apiProcessorPath = apiProcessorPaths[i];

            if (configuredAppsBeingProcessed[apiProcessorPath])
            {
                logger.info("App at path: '%s' in new configuration is already running - reloading processor", apiProcessorPath);

                // Reload processor
                //
                //  !!! It would be nice if we could tell whether this was required - timestamp?
                //
                yield apiProcessors[apiProcessorPath].reloadModuleAwaitable();

                // This app has been processed, remove it from the "being processed" list
                //
                delete configuredAppsBeingProcessed[apiProcessorPath];
            }
            else
            {
                logger.info("App at path: '%s' is currently running but not found in new configuration - stopping processor", apiProcessorPath);

                // Stop and remove processor (note that aren't waiting around for it to shut down)
                //
                apiProcessors[apiProcessorPath].shutdown();
                delete apiProcessors[apiProcessorPath];
            }
        }

        // Any apps remaining in configured-apps-being-processed list are new.  Add/start processors for each.
        //
        if (Object.keys(configuredAppsBeingProcessed).length > 0)
        {
            var newAppPaths = Object.keys(configuredAppsBeingProcessed);
            for (var i = 0; i < newAppPaths.length; i++)
            {
                var newAppPath = newAppPaths[i];
                var newApp = configuredAppsBeingProcessed[newAppPath];
                logger.info("App at path: '%s' in new configuration is not currently running - starting processor", newAppPath);

                // Start processor (we are waiting for this to complete)
                //
                // !!! What if this throws an exception?  Should we exit the app?  Continue starting other processors?
                //
                yield loadApiProcessorAwaitable(moduleStore, newAppPath, newApp);
            }
        }
    }
}

function areAllProcessorsComplete()
{
    var apiProcessors = apiManager.getApiProcessors();
    for (var path in apiProcessors)
    {
        if (!apiProcessors[path].isShutdown())
        {
            return false;
        }
    }
    return true;
}

// Note that if you launch Synchro via "npm start" you may see terminal output after the prompt returns.  For more 
// info, see: https://github.com/npm/npm/issues/4603
//
function * orderlyShutdown(exitCode)
{
    var code = exitCode || 0;

    // Sometimes Azure does a restart where the forked child processors are not down shutting down when it tries to
    // fire Synchro back up, and then it fails on startup because all of the processor debug ports are still in use.
    //
    // This is an attempt to delay shutdown of the main process until all of the forked child processors are done
    // shutting down...
    //
    logger.info("Orderly shutdown - checking processors");

    // Loop is exponential intervals (5 times 2 to the i), so an i value of 11 will yield approximately 10 seconds total.
    // This should be overkill (on dev machines it completes typically after the first wait or two, approx 10-20ms total).
    //
    var interval = 5;
    for (var i = 0; i < 11; i++)
    {
        if (areAllProcessorsComplete())
        {
            logger.info("All processors complete, terminating process");
            process.exit();
            return;
        }
        
        logger.info("Waiting %dms, then checking processors again", interval);
        yield function (done) { setTimeout(done, interval) }
        interval *= 2;
    }
    
    logger.error("One or more processors did not complete, timed out waiting, terminating process");
    process.exit(code);
}

function * stopRunningProcessors(exitCode)
{
    var apiProcessors = apiManager.getApiProcessors();
    var apiProcessorPaths = Object.keys(apiProcessors);
    for (var i = 0; i < apiProcessorPaths.length; i++)
    {
        var apiProcessorPath = apiProcessorPaths[i];

        logger.info("Shutting down app at path: '%s'", apiProcessorPath);

        // Stop and remove processor (note that aren't waiting around for it to shut down)
        //
        apiProcessors[apiProcessorPath].shutdown();
        delete apiProcessors[apiProcessorPath];
    }

    yield orderlyShutdown(exitCode);
}

// This is basically our main run function body...
//
co(function * ()
{
    yield loadApiProcessorsAwaitable();
    yield function(done){startServerAsync(done)};
    logger.debug("Synchro server up and running!");

}).catch(function(err)
{
    // It would be nice to be able to throw an err here to cause a failure to start / orderly shutdown.  Because we're 
    // in a promise, any error we throw here will just get eaten by the promise.  If we just do a process.exit(), we can
    // potentially leave child processes running and zombie ports in use (at least for some period of time).  Shutdown is
    //  complicated by the fact that we are only partially started up at this point.
    //
    //
    // In order to shut down cleanly, we have to signal any started processors (which can coorespond to child processes) 
    // to shut down, and then wait for them to actually shut down.
    //
    logger.error("Failed to start:", err);

    co(function * ()
    {
        yield stopRunningProcessors(); // A param here will be propogated to process.exit() as the exit code (future?)

    }).catch(function(err)
    {
        logger.error("Error shutting down:", err);
    });
});

process.on('SIGHUP', function ()
{
    logger.info('SIGHUP');
    co(reloadProcessors).catch(function (err)
    {
        logger.error("Error in SIGHUP:", err);
    });
});  

process.on('SIGTERM', function ()
{
    logger.info('SIGTERM - preparing to exit.');
    co(orderlyShutdown).catch(function (err)
    {
        logger.error("Error in SIGTERM shutdown:", err);
    });
});  

process.on('SIGINT', function ()
{
    logger.info('SIGINT - preparing to exit.');
    co(orderlyShutdown).catch(function (err)
    {
        logger.error("Error in SIGINT shutdown:", err);
    });
});

process.on('exit', function (code)
{
    logger.info('Process exiting with code:', code);
});
