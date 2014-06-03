// API request delegatee - process API requests
//
var maaasApi = require('../index'); // !!! Should probably be 'maaas-api' (if maaas-api installed as module in node_modules)
var wait = require('wait.for');
var WebSocket = require('faye-websocket');

var logger = require('log4js').getLogger("api-delegatee");

// When this module is launched as a forked process, it is also loaded inproc by the parent in order to call 
// postProcessHttpRequest inproc (from the main thread).  Caution must be exercised, and specifically, the api
// module should only be required by this module for the instance of this module that is going to call into it
// (otherwise the api module gets loaded twice, meaning that it unnecesarily launches two module loaders/manangers
// in sepatate processes).
//
// When this module is loaded for inproc execution only, the caller (api-request-delegator) will call init().
// When this module is loaded as a forked process, it will call init() itself in the child process initialization
// code below.
//
var api;
var sessionStore;

exports.init = function(params)
{
    logger.info("Initializing API processor");

    sessionStore = maaasApi.createServiceFromSpec(params.sessionStoreSpec);

    var moduleStore = maaasApi.createServiceFromSpec(params.moduleStoreSpec);
    var resourceResolver = maaasApi.createServiceFromSpec(params.resourceResolverSpec);

    var moduleManager = require('./maaas-modules')(moduleStore, resourceResolver);

    var ApiProcessor = require('./api');
    api = new ApiProcessor(moduleManager);
}

function apiProcess(session, body)
{
    return api.process(session, body);
}

// This module may be loaded normally or as a forked process, or both...
//
if (module.parent) // Loaded normally (inproc via "require")
{
}
else // Forked child process
{    
    // Need to reconfigure log4js here (log4js config is at the process level and not inherited)
    var log4js = require('log4js');
    // Redirect console.log to log4js, turn off color coding
    log4js.configure({ appenders: [ { type: "console", layout: { type: "basic" } } ], replaceConsole: true })

    logger.info("Forked API child process started started: " + process.argv[1]); // argv[1] is the filename of this file

    exports.init(JSON.parse(process.argv[2]));

    // Maybe we just hook stdout/stderr when we're running user modules, so we can pipe just that to the debugger.
    //
    // https://gist.github.com/pguillory/729616
    /*
    process.stdout.write = (function(write) {
        return function(string, encoding, fd) {
            write.apply(process.stdout, arguments)
            // Do whatever else you want with "string" here...
        }
    })(process.stdout.write);
    */
}

var MaaasApiSessionIdHeader = "maaas-api-session-id";

// This http request processor is always running in a fiber.  If this module is processing requests as a forked
// process, the request will have been JSON serialized, and the err and data returned must be JSON serializable.
//
function processHttpRequest(request, callback)
{
    logger.info("API Processing http post request");

    // See if this is an AppDefinition request and process appropriately (it doesn't want/need session state)
    //
    if (request.body.Mode === "AppDefinition")
    {
        var appDefinition = api.getAppDefinition();
        logger.info("AppDefinition requested: " + appDefinition);
        callback(null, appDefinition);
        return;
    }

    var sessionId = request.headers[MaaasApiSessionIdHeader];
    logger.info("API request session ID: " + sessionId);

    var newSession = false;
    var session = sessionStore.getSession(sessionId);
    if (!session)
    {
        if (sessionId)
        {
            // If the client sent a session ID, but the server could not find that session, then we
            // have a problem (with the dev session store this happens when the server is restarted
            // during a client session - when we have persistent sessions, this should never happen).
            //
            // Since we have no way of synchronizing the client and server (we have no idea what version
            // of the ViewModel the client has or the server used to have), we cannot execute a command.
            // By clearing out the command, if there is one, we will effectively be forcing a silent
            // reload of the current page.
            //
            if (request.body.Command)
            {
                logger.info("Session matching client session ID could not be found, clearing command and forcing page reload");
                request.body.Command = null;
            }
        }
        logger.info("Creating new session");
        session = sessionStore.createSession();
        newSession = true;
    }
        
    var responseObject = apiProcess(session, request.body);

    sessionStore.putSession(session);

    if (newSession)
    {
        logger.info("Returning new session id: " + session.id);
        responseObject.NewSessionId = session.id;
    }

    callback(null, responseObject);
}

// If this module is processing requests as a forked process, then this post-processor will be called from the
// parent process, meaning that any err or data will have been JSON serialized.  This post-processor will also
// not be called in a fiber when it is post-processing a request handled by a forked process, so it must
// execute synchronously.  On the plus side, the request and response objects are always the actual objects
// (not stripped down and/or JSON serialized versions).
// 
exports.postProcessHttpRequest = function(request, response, err, data)
{
    // Do the least amount of work possible to convert the provided err/data into a response...
    //
    response.socket.setNoDelay(true);
    response.send(data);
}

// This is called when the websocket connection is initiated.  The "state" returned is passed in to each
// processWebSocketMessage() call.
//
function processWebSocket(ws, request)
{
    var sessionId = request.headers[MaaasApiSessionIdHeader];
    logger.info("API request session ID: " + sessionId);

    var newSession = false;
    var session = sessionStore.getSession(sessionId);
    if (!session)
    {
        session = sessionStore.createSession();
        newSession = true;
    }
        
    var state = 
    {
        session: session,
        newSession: newSession
    }
    return state;
}

// This web socket request processor (always running in a fiber)
//
function processWebSocketMessage(ws, requestObject, state)
{
    logger.info("API - processing websocket request");

    logger.info('message - Mode: ', requestObject.Mode);

    // See if this is an AppDefinition request and process appropriately
    //
    if (requestObject.Mode === "AppDefinition")
    {
        var appDefinition = api.getAppDefinition();
        logger.info("AppDefinition requested: " + appDefinition);
        ws.send(JSON.stringify(appDefinition));
        return;
    }

    var responseObject = apiProcess(state.session, requestObject);

    sessionStore.putSession(state.session);

    if (state.newSession)
    {
        logger.info("API - returning new session id: " + state.session.id);
        responseObject.NewSessionId = state.session.id;
        state.newSession = false;
    }
    ws.send(JSON.stringify(responseObject));
}

// Module reloader (always running in a fiber)
//
exports.reloadModule = function(moduleName)
{
    logger.info("API reloading module: " + moduleName);
    api.reloadModule(moduleName);
}

//
// Everything below here is generic command routing logic (not specific to API request processing)
//

exports.processHttpRequest = function(request, callback)
{
    logger.info("Launching API http request processor on a fiber...");
    wait.launchFiber(processHttpRequest, request, callback); //handle in a fiber
}

exports.processWebSocket = function(request, socket, body)
{
    var ws = new WebSocket(request, socket, body);
    logger.info("API processor initialized WebSocket");

    var state = null;

    ws.on('message', function(event) 
    {        
        logger.info("API got WebSocket message: " + event.data);
        logger.info("Launching API web socket request processor on a fiber...");

        var requestObject = JSON.parse(event.data);

        if ((state == null) && (event.data.Mode === "AppDefinition"))
        {
            // Establish the WebSocket "state" (session binding) if it hasn't been set yet and this
            // is not the AppDefinition request, which is session-less.
            //
            state = processWebSocket(ws, request);
        }

        wait.launchFiber(processWebSocketMessage, ws, requestObject, state); //handle in a fiber
    });

    ws.on('close', function(event) 
    {
        logger.info('API WebSocket close', event.code, event.reason);
        ws = null;
    });
}

if (!module.parent)
{
    // Listen for messages from the parent process...
    //
    process.on('message', function(message, handle) 
    {
        // Process messages (commands) from the parent process...
        //
        switch (message.cmd)
        {
            case "processHttpRequest":
                exports.processHttpRequest(message.request, function(err, data)
                {
                    // Signal the parent process that we're done, and pass the response data
                    process.send({id: message.id, err: err, data: data});
                });
                break;

            case "processWebSocket":
                logger.info("Got process web socket message with socket: " + handle);
                message.request.socket = handle;
                exports.processWebSocket(message.request, handle, message.body);
                break;

            case "reloadModule":
                wait.launchFiber(exports.reloadModule, message.moduleName); //handle in a fiber
                break;
        }
    });
}