// Debugger API
//
var WebSocket = require('faye-websocket');
var wait = require('wait.for');
var v8debugger = require('v8-debugger');

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
    this.client = v8debugger.createClient({port: port});
    this.client.reqVersion(function(err, version) {
       console.log("DEBUGGER: Remote debugger version: " + version);
    });

    this.client.on("ready", function() 
    {
        console.log("DEBUGGER: Got ready");
        sendResponse(ws, { event: "ready" });
        for (var key in this.scripts)
        {
            console.log("Found script: " + this.scripts[key].name + " (" + this.scripts[key].lineCount + " lines)");
        }
    });

    this.client.on("break", function(response) 
    {
        console.log("DEBUGGER: Got break at: " + response.body.script.name + " - line: " + response.body.sourceLine);
        sendResponse(ws, { event: "break", script: response.body.script.name, line: response.body.sourceLine });
    });

    this.client.on("end", function() 
    {
        console.log("DEBUGGER: Got end");
        sendResponse(ws, { event: "end" });
    });

    this.close = function(callback)
    {
        this.client.end();
        if (callback)
        {
            callback();
        }
    }
}

function processWebSocketMessage(ws, event, state)
{
    var requestObject = JSON.parse(event.data);
    console.log("Processing debug API command: " + requestObject.cmd);
    switch (requestObject.command)
    {
        case "connect":
        {
            state.debugSession = new DebugSession(ws, requestObject.port);
        }
        break;

        case "version":
        {
            state.debugSession.client.reqVersion(function(err, version) {
                console.log("DEBUGGER: Remote debugger version: " + version);
                sendResponse(ws, { event: "version", version: version });
            });
        }
        break;

        case "continue":
        {
            state.debugSession.client.reqContinue(function() {
                console.log("DEBUGGER: continued");
                sendResponse(ws, { event: "continued" });
            });
        }
        break;

        case "step":
        {
            // action: next, in, out
            state.debugSession.client.step(requestObject.action, 1, function() {
                // You get another break aftet the step, so not clear you need any kind of onComplete 
                // response to the client command...
                //
                console.log("DEBUGGER: step completed");
                sendResponse(ws, { event: "stepped" });
            });
        }
        break;

        case "close":
        {
            state.debugSession.close(function() {
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
