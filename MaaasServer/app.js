/**
 * Module dependencies.
 */
var express = require('express');
var login = require('./routes/login');
var http = require('http');
var path = require('path');
var url = require('url');
var wait = require('wait.for');
var WebSocket = require('faye-websocket');

var log4js = require('log4js');
// Redirect console.log to log4js, turn off color coding
log4js.configure({ appenders: [ { type: "console", layout: { type: "basic" } } ], replaceConsole: true })

var logger = log4js.getLogger("app");
logger.info("Maaas.io server loading...");

var commander = require( 'commander' );
commander.version('0.0.1')
commander.option('-t, --test', 'Run with test services')
commander.parse(process.argv);

logger.info( "Test servies: " + commander.test );

// Create Maaas API processor manager
//
var maaasApi = require('./maaas-api');
var maaasApiUrlPrefix = "/api";

var baseDebugPort = 6969;
var apiManager = maaasApi.createApiProcessorManager(baseDebugPort);

// Create Maaas studio
//
var MaaasStudio = require('./maaas-studio');
var maaasStudioUrlPrefix = "/studio";

var maaasStudio = new MaaasStudio(maaasStudioUrlPrefix, apiManager);


// Create the Maaas API processors
//
function createApiProcessor(apiManager, appPath, directory)
{
    var sessionStoreSpec = null;
    var moduleStoreSpec = null;

    if (commander.test)
    {
        sessionStoreSpec =
        {
            packageRequirePath: path.resolve('./maaas-api'), 
            serviceName: 'MemorySessionStore',
            serviceConfiguration: {}

            /*
            packageRequirePath: path.resolve('./maaas-api'), 
            serviceName: 'FileSessionStore',
            serviceConfiguration: 
            {
                sessionStateFile: path.resolve(__dirname, "sessions.json")
            }
            */
        };

        moduleStoreSpec = 
        {
            packageRequirePath: path.resolve('./maaas-api'), 
            serviceName: 'FileModuleStore',
            serviceConfiguration: 
            {
                moduleDirectory: path.resolve(__dirname, path.join("maaas-samples", directory))
            }        
        }
    }
    else
    {
        sessionStoreSpec =
        {
            packageRequirePath: path.resolve('./maaas-api'), 
            serviceName: 'RedisSessionStore',
            serviceConfiguration: 
            {
                host: "synchroapi.redis.cache.windows.net",
                port: 6379,
                password: "7YTzfcTk9PHyiJdY62q6SRabTiGa9EFMaZgo7KzPUrc=", // Redis Primary Key synchroapi
                pingInterval: 60
            }

            /*
            packageRequirePath: path.resolve('./maaas-azure'), 
            serviceName: 'AzureSessionStore',
            serviceConfiguration: 
            {
                storageAccount: "synchroncus",
                storageAccessKey: "KqhUhHFkjOFDWI3mFG9AiGO8H0OWPaYPmRHf9vUqiKsp5nPFFGjX8gmFmJ1E3lbg9m02K76UrFfaxLU/JKWrxg==",
                tableName: "maaasSessions"
            }
            */
        };

        moduleStoreSpec = 
        {
            packageRequirePath: path.resolve('./maaas-azure'), 
            serviceName: 'AzureModuleStore',
            serviceConfiguration:
            {
                storageAccount: "synchroncus",
                storageAccessKey: "KqhUhHFkjOFDWI3mFG9AiGO8H0OWPaYPmRHf9vUqiKsp5nPFFGjX8gmFmJ1E3lbg9m02K76UrFfaxLU/JKWrxg==",
                containerName: directory
            }
        };
    }


    var resourceResolverSpec = 
    { 
        packageRequirePath: path.resolve('./maaas-api'), 
        serviceName: 'ResourceResolver',
        serviceConfiguration: 
        {
            prefix: "https://synchroncus.blob.core.windows.net/resources/"
        }
    }

    var bFork = true;  // Run API processor forked or in-proc
    var bDebug = true; // Enable debugging of API processor (only valid if running forked)

    apiManager.createApiProcessor(appPath, sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, bFork, bDebug);
}

createApiProcessor(apiManager, "samples", "maaas-samples");
createApiProcessor(apiManager, "propx", "maaas-propx");


// Now let's set up the web / api servers...
//
var app = express();

var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

// all environments
app.set('port', process.env.PORT || 1337);

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
app.use(log4js.connectLogger(logger, { level: 'auto' })); //app.use(express.logger('dev'));
app.use(express.query());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
maaasStudio.addMiddleware(app);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

maaasStudio.addRoutes(app, login.checkAuth);

app.get('/', login.checkAuth, function(request, response) 
{
    // Handle in a fiber, keep node spinning
    //
    wait.launchFiber(function()
    {
        var applications = [];

        var apiProcessors = apiManager.getApiProcessors();
        for (appPath in apiProcessors)
        {
            var apiProcessor = apiManager.getApiProcessor(appPath);
            logger.info("Found API processor at path '" + appPath + "'");

            var moduleStore = apiManager.getModuleStore(appPath);
            var appDefinition = moduleStore.getAppDefinition();
            logger.info("API processor for app named: '" + appDefinition.name + "'"); 

            var studioPath =  maaasStudioUrlPrefix + "/" + appPath + "/sandbox";   

            var host = request.host; 
            var port = app.get("port");

            // This bit of port checking is to add a non-standard port spec if needed (particularly handy in local dev
            // environments).  When deploying to Azure, the port is actually a named pipe reference, which you don't want
            // to add to the endpoint - and presumably you'll be on a standard port on cloud deployments anyway.  So we only
            // add the port to the endpoint spec here if it's an integer greater than 0 and not the default port (80).
            //
            if ((port === parseInt(port)) && (port > 0) && (port != 80))
            {
                host += ":" + port;
            }

            var endpoint = host + maaasApiUrlPrefix + "/" + appPath;

            applications.push({ appPath: appPath, studioPath: studioPath, endpoint: endpoint, appDefinition: appDefinition })
        }

        response.render('index', { applications: applications });
    });
});

app.all('/login', login.login);
app.get('/logout', login.logout);

// Let the API processor handle requests to /api 
//
app.all(maaasApiUrlPrefix + '/:appPath', function(request, response) 
{
    apiManager.processHttpRequest(request.params.appPath, request, response);
});

var server = http.createServer(app);

// This is a copy of the WebSocket.isWebSocket function.  This was failing (on Azure only),
// because the Connection: Upgrade header sent by the client (confirmed by Fiddler) was
// getting modified by something in the Azure environment such that it showed up at this
// point as Connection: Keep-alive.  So we will use this re-written version to skip that
// check (it presumably qualified somehow since the server.on('upgrade') got triggered).
//
function isWebSocket(request) 
{
    if (request.method !== 'GET') 
        return false;

    var connection = request.headers.connection || '',
        upgrade    = request.headers.upgrade || '';

    return request.method === 'GET' &&
           // !!! connection.toLowerCase().split(/\s*,\s*/).indexOf('upgrade') >= 0 &&
           upgrade.toLowerCase() === 'websocket';
}

// !!! Running the API processor as a forked process on Azure does not work with a WebSocket connection.
//     Node.js has a concept of being able to pass a "handle" (a socket in this case) from the parent
//     process to the child process, which is how the main processor dispatches API request to the API
//     processor when using WebSockets.  On Azure, the socket you get is on a named pipe, and on Windows 
//     you cannot pass a named pipe socket handle over the IPC mechanism (which is also a named pipe).
//
//     This is the main Node/libuv bug: https://github.com/joyent/libuv/issues/480
//
server.on('upgrade', function(request, socket, body) 
{
    if (isWebSocket(request)) // was: if (WebSocket.isWebSocket(request))
    {
        var path = url.parse(request.url).pathname; 

        if (path.indexOf(maaasApiUrlPrefix + "/") == 0)
        {
            var appPath = path.substring(maaasApiUrlPrefix.length + 1);
            apiManager.processWebSocket(appPath, request, socket, body);
        }
        else if (path === maaasStudioUrlPrefix) // !!! Web session auth (maybe inside websocket processor - to get/use session)
        {
            maaasStudio.processWebSocket(request, socket, body);
        }
        else
        {
            logger.info("ERROR - No such websocket endpoint: " + path);
        }
    }
});

server.listen(app.get('port'), function(){
    logger.info('Express server listening on port ' + app.get('port') + ", node version: " + process.version);
});
