// Debugger API
//
var WebSocket = require('faye-websocket');
var wait = require('wait.for');
var v8debugger = require('v8-debugger');

var debugPort = null;

exports.setDebugPort = function(port)
{
    debugPort = port;
}

function processWebSocketMessage(ws, event)
{
    ws.send("Debug API heard: '" + event.data + "'");
}

exports.processWebSocket = function(request, socket, body)
{
    var ws = new WebSocket(request, socket, body);
    console.log("Debug API initialized WebSocket");

    ws.on('message', function(event) 
    {
        console.log("Debug API got WebSocket message: " + event.data);
        wait.launchFiber(processWebSocketMessage, ws, event); //handle in a fiber
    });

    ws.on('close', function(event) 
    {
        console.log('Debug API WebSocket close', event.code, event.reason);
        ws = null;
    });
}

/*
if (debugPort)
{
    console.log("Firing up debugger client, connecting to port: " + childProcessor.debugPort);
    var client = v8debugger.createClient({port: childProcessor.debugPort});
    client.reqVersion(function(err, version) {
       console.log("DEBUGGER: Remote debugger version: " + version);
    });

    client.on("ready", function() {
        console.log("DEBUGGER: Got ready");
        for (var key in client.scripts)
        {
            console.log("Found script: " + client.scripts[key].name + " (" + client.scripts[key].lineCount + " lines)");
        }
    });

    client.on("break", function() {
        console.log("DEBUGGER: Got break");
    });

    app.get('/cont', function(req, res) {
        client.reqContinue(function() {
            console.log("DEBUGGER: continued");
        });
        res.send("Continued");
    });
}
*/
