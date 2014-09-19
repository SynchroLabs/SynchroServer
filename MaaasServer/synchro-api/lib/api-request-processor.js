// API request processor - process API requests
//
// Note: This module and the objects it returns may be called in-proc or cross-process, as documented below.
//
var synchroApi = require('../index'); // This is our own 'synchro-api' module
var wait = require('wait.for');
var WebSocket = require('faye-websocket');

var logger = require('log4js').getLogger("api-request-processor");

var SynchroApiSessionIdHeader = "synchro-api-session-id";

exports.createApiRequestProcessorAsync = function(params, callback)
{
    logger.info("Initializing API request processor");

    var sessionStore = synchroApi.createServiceFromSpec(params.sessionStoreSpec);
    var moduleStore = synchroApi.createServiceFromSpec(params.moduleStoreSpec);
    var resourceResolver = synchroApi.createServiceFromSpec(params.resourceResolverSpec);

    var moduleManager = require('./module-manager')(moduleStore, resourceResolver);


    var ApiProcessor = require('./api');
    var api = new ApiProcessor(moduleManager);
    logger.info("Loading API request processor");
    api.load();
    logger.info("Done loading API request processor");

    function apiProcess(session, body)
    {
        return api.process(session, body);
    }

    // This http request processor is always running in a fiber.  If this module is processing requests as a forked
    // process, the request will have been JSON serialized, and the err and data returned must be JSON serializable.
    //
    function internalProcessHttpRequest(request, callback)
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

        var session = null;
        var newSessionCreated = false;
        var sessionId = request.headers[SynchroApiSessionIdHeader];
        if (sessionId)
        {
            logger.info("API request session ID: " + sessionId);
            session = sessionStore.getSession(sessionId);
        }

        if (!session)
        {
            if (sessionId)
            {
                // !!! There should really be a test for this...
                //
                // If the client sent a session ID, but the server could not find that session, then we have
                // a problem (with the dev session store this happens when the server is restarted during a
                // client session - when using a real (persistent) sessions store, this should never happen).
                //
                // Since we have no way of synchronizing the client and server (we have no idea what version
                // of the ViewModel the client has or the server used to have), we cannot execute a command, or
                // any other kind of update.  By setting the Mode to "Page", we will effectively be forcing a 
                // silent reload of the current page (as new, with a "new" ViewwModel).
                //
                if (request.body.Mode != "Page")
                {
                    logger.info("Session matching client session ID could not be found, forcing page reload");
                    request.body.Mode = "Page";
                }
            }
            logger.info("Creating new session");
            session = sessionStore.createSession();
            newSessionCreated = true;
        }
            
        var responseObject = apiProcess(session, request.body);

        sessionStore.putSession(session);

        if (newSessionCreated)
        {
            logger.info("Returning new session id: " + session.id);
            responseObject.NewSessionId = session.id;
        }

        callback(null, responseObject);
    }

    // This is called when the websocket connection is initiated.  The "state" returned is passed in to each
    // processWebSocketMessage() call.
    //
    function internalProcessWebSocket(ws, request)
    {
        var sessionId = request.headers[SynchroApiSessionIdHeader];
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

    // The web socket request processor (always running in a fiber)
    //
    function internalProcessWebSocketMessage(ws, requestObject, state)
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

    // Public API functions may be called either in-proc or cross-process.
    //
    var publicApi =
    {
        processHttpRequest: function(request, callback)
        {
            logger.info("Launching API http request processor on a fiber...");
            wait.launchFiber(internalProcessHttpRequest, request, callback); //handle in a fiber
        },

        processWebSocket: function(request, socket, body)
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
                    state = internalProcessWebSocket(ws, request);
                }

                wait.launchFiber(internalProcessWebSocketMessage, ws, requestObject, state); //handle in a fiber
            });

            ws.on('close', function(event) 
            {
                logger.info('API WebSocket close', event.code, event.reason);
                ws = null;
            });
        },

        // Module reloader (always already running in a fiber)
        //
        reloadModule: function(moduleName)
        {
            logger.info("API reloading module: " + moduleName);
            api.reloadModule(moduleName);
        }
    }

    return publicApi;
}

// Always called in-proc
//
// If this module is processing requests on behalf of a forked process, then this post-processor will be called
// from the parent process, meaning that any "err" or "data" will have been JSON serialized (in order to get back
// to the parent process on completion).  
//
// This post-processor will also not be called in a fiber when it is post-processing a request handled by a forked
// process, so it must execute synchronously.
//
// On the plus side, the request and response objects are always the actual objects (not stripped down and/or JSON
// serialized versions).
// 
exports.postProcessHttpRequest = function(request, response, err, data)
{
    // Do the least amount of work possible to convert the provided err/data into a response...
    //
    if (response.socket)
    {
        response.socket.setNoDelay(true);        
    }
    response.send(data);
}
