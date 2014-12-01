var express = require('express');
var login = require('./routes/login');
var http = require('http');
var path = require('path');
var url = require('url');
var wait = require('wait.for');
var async = require('async');
var netutil = require('./netutil');
var log4js = require('log4js');

// Process command line params
//
var commander = require( 'commander' );
commander.version('0.0.1');
commander.option('-n, --nofork', 'Do not fork api processors (run inproc)');
commander.option('-p, --port <n>', 'Server port', parseInt);
commander.option('-s, --services <value>', 'Run with specified services configuration');
commander.option('-l, --logconfig <value>', 'Configure logging using specified logging configuration file');
commander.parse(process.argv);

// Load config - precendence: command line, environment, config.json, default
//
var nconf = require('nconf');
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
nconf.overrides(overrides);
nconf.env();
nconf.file({ file: 'config.json' });
nconf.defaults(
{
    'PORT': 1337,
    'SERVICES_CONFIG': 'local',
    'NOFORK': false,
    'API_PATH_PREFIX': "/api",
    'STUDIO_PATH_PREFIX': "/studio",
    'DEBUG_BASE_PORT': 6969,
    'FILE_STORE_PATH': path.resolve(__dirname, "synchro-samples"),
    'LOCAL_RESOURCE_PREFIX': 
        "http://" + netutil.addNonStandardPort(netutil.getExternalIPAddress(), (nconf.get("PORT") || 1337)) + 
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

log4js.configure(nconf.get('LOG4JS_CONFIG'));

var logger = log4js.getLogger("app");
logger.info("Synchro server loading...");

if (nconf.get("SERVICES_CONFIG") == "local")
{
    logger.info("Using local services, reasource prefix: " + nconf.get("LOCAL_RESOURCE_PREFIX"));
}

// Create Synchro API processor manager
//
var synchroApi = require('./synchro-api');
var synchroApiUrlPrefix = nconf.get("API_PATH_PREFIX");

var apiManager = synchroApi.createApiProcessorManager(nconf.get('DEBUG_BASE_PORT'), nconf.get('LOG4JS_CONFIG'));

// Create Synchro studio
//
var SynchroStudio = require('./synchro-studio');
var synchroStudioUrlPrefix = nconf.get("STUDIO_PATH_PREFIX");

var synchroStudio = new SynchroStudio(synchroStudioUrlPrefix, apiManager);

// Now let's set up the web / api servers...
//
var app = express();

var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

var hbs = require('express-hbs');

// Use `.hbs` for extensions and find partials in `views/partials`.
app.engine('hbs', hbs.express3({
    partialsDir: __dirname + '/views/partials',
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: __dirname + '/views/layouts/default.hbs',
    contentHelperName: 'content'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

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
app.use(synchroApiUrlPrefix + '/resources', express.static(path.join(nconf.get('FILE_STORE_PATH'), 'resources')));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
synchroStudio.addMiddleware(app);

synchroStudio.addRoutes(app, login.checkAuth);

app.get('/', login.checkAuth, function(request, response) 
{
    // Launch fiber to asynchronously process the loaded apps and render the 'index' (app list) page
    //
    wait.launchFiber(function()
    {
        var applications = [];

        var apiProcessors = apiManager.getApiProcessors();
        for (appPath in apiProcessors)
        {
            var moduleStore = apiManager.getModuleStore(appPath);
            applications.push(
            { 
                appPath: appPath, 
                studioPath: synchroStudioUrlPrefix + "/" + appPath + "/sandbox", 
                endpoint: netutil.addNonStandardPort(request.host, nconf.get("PORT")) + synchroApiUrlPrefix + "/" + appPath, 
                appDefinition: moduleStore.getAppDefinition()
            });
        }

        response.render('index', { applications: applications });
    });
});

app.all('/login', login.login);
app.get('/logout', login.logout);

// Let the API processor handle requests to /api 
//
app.all(synchroApiUrlPrefix + '/:appPath', function(request, response) 
{
    apiManager.processHttpRequest(request.params.appPath, request, response);
});

var server = http.createServer(app);

server.on('upgrade', function(request, socket, body) 
{
    if (netutil.isWebSocket(request))
    {
        var path = url.parse(request.url).pathname; 

        if (path === synchroStudioUrlPrefix) // !!! Web session auth (maybe inside websocket processor - to get/use session)
        {
            synchroStudio.processWebSocket(request, socket, body);
        }
        else
        {
            logger.info("ERROR - No such websocket endpoint: " + path);
        }
    }
});

// Here is all the asynchronous startup stuff...
//
var servicesConfig = require('./services-config');

function loadApiProcessorsAsync(callback)
{
    var synchroApps = nconf.get('SYNCHRO_APPS');

    function loadApiProcessorAsync(synchroApp, callback)
    {
        var services = servicesConfig.getServicesConfig(nconf.get('SERVICES_CONFIG'), synchroApp.container);

        var bFork = true;   // Run API processor forked
        var bDebug = true;  // Enable debugging of API processor (only valid if running forked)

        if (nconf.get('NOFORK'))
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
    server.listen(nconf.get('PORT'), function()
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
