// Debugger API server (serves the debug API over websocket to web client).  This can be somewhat
// confusing, as this debugger API "server" itself is a client of the v8 debugger service (accessed
// via v8client, which uses v8protocol to talk to the v8 debugger on the debug port).
//
//    Browser->[websocket]->debug-server(this)->v8client->v8protocol over socket->v8 debugger
//
var WebSocket = require('faye-websocket');
var wait = require('wait.for');
var v8Client = require('./v8client');
var path = require('path');

var logger = require('log4js').getLogger("dbg-server");

function sendResponse(ws, responseObject)
{
    ws.send(JSON.stringify(responseObject));
}

// https://github.com/joyent/node/blob/master/lib/_debugger.js
//
// Specifically, review the debugger "interface" class Interface (lots of useful implementation details).
//

function DebugSession(ws, port)
{
    logger.info("Firing up debugger client, connecting to port: " + port);

    this.client = new v8Client();
    this.client.connect(port);

    // !!! This can fail hard (like kill the server hard) if the connect fails (specifically with bad/zero port)
    this.client.reqVersion(function(err, version) {
       logger.info("Remote debugger version: " + version);
    });

    this.client.watch("viewModel");

    this.client.on("ready", function() 
    {
        logger.info("Got ready");
        sendResponse(ws, { event: "ready" });
        logger.info("Found " + Object.keys(this.scripts).length + " scripts");
        for (var key in this.scripts)
        {
            logger.info("Found script: " + this.scripts[key].name + " (" + this.scripts[key].lineCount + " lines)");
        }
    });

    // On the break you need to send back the breakpoint info, the stack frame (possibly frame summary only), and the
    // fully resolved "current" frame (frame 0), which will contain the arguments and values for the frame, as well as
    // the watches resolved in the context of that frame.
    //
    // The web client may elect to retrieve a specific frame, in which case that fully resolved frame should be returned:
    //     client.reqFrame(frameIndex, function(err, frame));
    //
    // The user may also elect to retrieve the source for a frame:
    //     client.reqSource(frameIndex, null, null, function(err, source));
    //

    this.client.on("break", function(response) 
    {
        var self = this;

        logger.info("Got break at: " + response.body.script.name + " - line: " + response.body.sourceLine);
        var breakData = 
        {
            frameIndex: 0,
            scriptId: response.body.script.id,
            scriptName: path.basename(response.body.script.name),
            scriptPath: response.body.script.name,
            lineCount: response.body.script.lineCount,
            sourceLine: response.body.sourceLine,
            sourceColumn: response.body.sourceColumn,
            frames: []
        }
        
        this.fullTrace(function (err, data)
        {
            logger.info("Stacktrace contained " + data.frames.length + " frames");
            data.frames.forEach(function(frame) 
            {
                var frameData = 
                {
                    frameIndex: frame.index,
                    scriptId: frame.script.id,
                    scriptName: path.basename(frame.script.name),
                    scriptPath: frame.script.name,
                    lineCount: frame.script.lineCount,
                    isNative: frame.script.isNative,
                    sourceLine: frame.line,
                    sourceColumn: frame.column,
                    funcName: (frame.func.name !== "") ? frame.func.name : frame.func.inferredName,
                    arguments: frame.arguments, // [] name, value.display
                    locals: frame.locals,       // [] name, value.display
                    watches: frame.watches      // [] id, watch, value
                }
                breakData.frames.push(frameData);
            });

            sendResponse(ws, { event: "break", breakPoint: breakData });
        });
    });

    this.client.on("end", function() 
    {
        logger.info("Got end");
        sendResponse(ws, { event: "end" });
    });

    this.close = function(callback)
    {
        // !!! This will blow away breakpoints and resume execution, which is probably what we want long-term (when
        //     we're managing the breakpoints on the client side).
        //
        // this.client.req({command: "disconnect"}, function(){});
        //
        this.client.end();
        if (callback)
        {
            callback();
        }
    }
}

function processWebSocketMessage(ws, event, state)
{
    // !!! TODO:
    //
    //     setBreakpoint(s), clearBreakpoint(s), clearAllBreakpoints, listBreakpoints
    //
    //     watch, unwatch (value, index?)
    //
    //     getSource (for frame?)
    //
    //     On break: return break details (module, line), stack frames, locals (anything in scope?), watches
    //
    //         Frame contains arguments and locals (but they need to be looked up / mirrored)
    //
    //     View: Output, locals, call stack, watches
    //        -- For each frame in the call stack: ability to get source/position and locals
    //
    //     Maybe client.isRunning
    //
    //
    //   
    var requestObject = JSON.parse(event.data);
    logger.info("Processing debug API command: " + requestObject.command);
    switch (requestObject.command)
    {
        case "connect":
        {
            state.debugSession = new DebugSession(ws, requestObject.port);
        }
        break;

        case "version":
        {
            state.debugSession.client.reqVersion(function(err, version) 
            {
                logger.info("Remote debugger version: " + version);
                sendResponse(ws, { event: "version", version: version });
            });
        }
        break;

        case "continue":
        {
            state.debugSession.client.reqContinue(function() 
            {
                logger.info("continued");
                sendResponse(ws, { event: "continued" });
            });
        }
        break;

        case "step":
        {
            // action: next, in, out
            state.debugSession.client.step(requestObject.action, 1, function() 
            {
                // You get another break after the step, so not clear you need any kind of onComplete 
                // response to the client command...
                //
                logger.info("step completed");
                sendResponse(ws, { event: "stepped" });
            });
        }
        break;

        case "source":
        {
            // !!! Ideally, we should automatically (or maybe by param) get the breakpoints associated with the
            //     module and return those at the same time.
            //
            state.debugSession.client.reqSource(requestObject.frame, null, null, function(err, source) 
            {
                logger.info("got source for frame " + requestObject.frame);
                if (requestObject.scriptPath)
                {
                    source.breakpoints = state.debugSession.client.listBreakpoints(requestObject.scriptPath);
                }
                sendResponse(ws, { event: "source", context: requestObject.context, source: source });
            });
        }
        break;

        case "setbreakpoint":
        {
            state.debugSession.client.setBreakpoint(requestObject.scriptName, requestObject.line, function(err, breakpoint) 
            {
                logger.info("breakpoint set: " + JSON.stringify(breakpoint));
                sendResponse(ws, { event: "breakpoint-set", breakpoint: breakpoint });
            });
        }
        break;

        case "clearbreakpoint":
        {
            state.debugSession.client.clearBreakpoint(requestObject.scriptName, requestObject.line, function(err, breakpoint) 
            {
                logger.info("breakpoint cleared: " + JSON.stringify(breakpoint));
                sendResponse(ws, { event: "breakpoint-cleared", breakpoint: breakpoint });
            });
        }
        break;

        case "getbreakpoints":
        {
            logger.info("getting breakpoints for script: " + requestObject.scriptName);
            var breakpoints = state.debugSession.client.listBreakpoints(requestObject.scriptName);
            sendResponse(ws, { event: "breakpoints", scriptName: requestObject.scriptName, breakpoints: breakpoints });
        }
        break;

        case "close":
        {
            state.debugSession.close(function() 
            {
                logger.info("closed");
                sendResponse(ws, { event: "closed" });
                ws.end();
                state.debugSession = null;
            });
        }
        break;
    }
}

exports.processWebSocket = function(request, socket, body)
{
    var ws = new WebSocket(request, socket, body);
    logger.info("Debug API initialized WebSocket");

    state = {};

    ws.on('message', function(event) 
    {
        logger.info("Debug API got WebSocket message: " + event.data);
        wait.launchFiber(processWebSocketMessage, ws, event, state); //handle in a fiber
    });

    ws.on('close', function(event) 
    {
        logger.info('Debug API WebSocket close', event.code, event.reason);
        if (state.debugSession)
        {
            state.debugSession.close();
        }
        ws = null;
    });
}
