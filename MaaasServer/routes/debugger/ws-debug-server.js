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
    console.log("Firing up debugger client, connecting to port: " + port);

    this.client = new v8Client();
    this.client.connect(port);

    this.client.reqVersion(function(err, version) {
       console.log("DEBUGGER: Remote debugger version: " + version);
    });

    this.client.watch("viewModel");

    this.client.on("ready", function() 
    {
        console.log("DEBUGGER: Got ready");
        sendResponse(ws, { event: "ready" });
        for (var key in this.scripts)
        {
            console.log("Found script: " + this.scripts[key].name + " (" + this.scripts[key].lineCount + " lines)");
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

        console.log("DEBUGGER: Got break at: " + response.body.script.name + " - line: " + response.body.sourceLine);
        var breakData = 
        {
            frameIndex: 0,
            scriptId: response.body.script.id,
            scriptName: path.basename(response.body.script.name),
            scriptPath: response.body.script.name,
            lineCount: response.body.script.lineCount,
            sourceLine: response.body.sourceLine,
            sourceColumn: response.body.sourceColumn
        }

        sendResponse(ws, { event: "break", breakPoint: breakData });
        /*
        this.fullTrace(function (err, data)
        {
            console.log("Stacktrace contained " + data.frames.length + " frames");
            data.frames.forEach(function(frame) 
            {
                var frameData = 
                {
                    frameIndex: frame.index,
                    scriptId: frame.script.id,
                    scriptName: path.basename(frame.script.name),
                    scriptPath: convertFullToRelativePath(frame.script.name),
                    lineCount: frame.script.lineCount,
                    isNative: frame.script.isNative,
                    sourceLine: frame.line,
                    sourceColumn: frame.column,
                    funcName: (frame.func.name !== "") ? frame.func.name : frame.func.inferredName
                }

                console.log("Frame[" + frameData.frameIndex + "]: " + frameData.funcName);

                // The current resolve frame resolves all arguments and locals, mirroring the objects up to a specified number of levels deep.
                // This is probably not a viable long term solution for sending this over the wire to the browser, because this can produce some
                // monster serialized JSON objects.  A better solution is probably to resolve the value and mirror a single level of properties,
                // and then provide an API to resolve a specific object reference (optionally recursively) - so when the user attemts to drill into
                // a value, the browser can request the details it needs at that time.
                //
                self.resolveFrame(frame, function() // !!! Just do this for frame 0, and do it on the server...
                {
                    frame.arguments.forEach(function(argument)
                    {
                        console.log("  Argument[frame:" + frame.index + "]: " + argument.name); // + " = " + JSON.stringify(argument.value));
                    }); 
                    frame.locals.forEach(function(local)
                    {
                        console.log("  Local[frame:" + frame.index + "]: " + local.name); // + " = " + JSON.stringify(local.value));
                    }); 
                });
            });
        });
        */
    });

    this.client.on("end", function() 
    {
        console.log("DEBUGGER: Got end");
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
    console.log("Processing debug API command: " + requestObject.command);
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
                console.log("DEBUGGER: Remote debugger version: " + version);
                sendResponse(ws, { event: "version", version: version });
            });
        }
        break;

        case "continue":
        {
            state.debugSession.client.reqContinue(function() 
            {
                console.log("DEBUGGER: continued");
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
                console.log("DEBUGGER: step completed");
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
                console.log("DEBUGGER: got source for frame " + requestObject.frame);
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
                console.log("DEBUGGER: breakpoint set: " + JSON.stringify(breakpoint));
                sendResponse(ws, { event: "breakpoint-set", breakpoint: breakpoint });
            });
        }
        break;

        case "clearbreakpoint":
        {
            state.debugSession.client.clearBreakpoint(requestObject.scriptName, requestObject.line, function(err, breakpoint) 
            {
                console.log("DEBUGGER: breakpoint cleared: " + JSON.stringify(breakpoint));
                sendResponse(ws, { event: "breakpoint-cleared", breakpoint: breakpoint });
            });
        }
        break;

        case "getbreakpoints":
        {
            console.log("DEBUGGER: getting breakpoints for script: " + requestObject.scriptName);
            var breakpoints = state.debugSession.client.listBreakpoints(requestObject.scriptName);
            sendResponse(ws, { event: "breakpoints", scriptName: requestObject.scriptName, breakpoints: breakpoints });
        }
        break;

        case "close":
        {
            state.debugSession.close(function() 
            {
                console.log("DEBUGGER: closed");
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
    console.log("Debug API initialized WebSocket");

    state = {};

    ws.on('message', function(event) 
    {
        console.log("Debug API got WebSocket message: " + event.data);
        wait.launchFiber(processWebSocketMessage, ws, event, state); //handle in a fiber
    });

    ws.on('close', function(event) 
    {
        console.log('Debug API WebSocket close', event.code, event.reason);
        if (state.debugSession)
        {
            state.debugSession.close();
        }
        ws = null;
    });
}
