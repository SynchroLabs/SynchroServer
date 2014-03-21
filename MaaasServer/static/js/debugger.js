var debuggerClient = null;

var websocket;

var currentScriptPath;

function debugStart() 
{ 
    websocket = new WebSocket('ws://' + window.location.host + '/debug'); 
    websocket.onopen = function(evt) { onOpen(evt) }; 
    websocket.onclose = function(evt) { onClose(evt) }; 
    websocket.onmessage = function(evt) { onMessage(evt) }; 
    websocket.onerror = function(evt) { onError(evt) }; 
}  

function debugStop()
{
    doSend({ command: "close" });
}

function debugContinue()
{
    doSend({ command: "continue" });
}

function debugStep(action) // next, in, out
{
    doSend({ command: "step", action: action });
}

function onOpen(evt) 
{ 
    console.log("CONNECTED"); 
    doSend({ command: "connect", port: 6969}); 
}  

function onClose(evt) 
{ 
    console.log("DISCONNECTED");
    websocket = null;
}  

function onMessage(evt) 
{
    var event = JSON.parse(evt.data);

    switch (event.event)
    {
        case "ready":
        {
            console.log("[Debug client] Debugger ready!");
        }
        break;

        case "break":
        {
            console.log("[Debug client] Got breakpoint at: " + event.breakPoint.scriptName + " line: " + event.breakPoint.sourceLine);
            doSend({ command: "source", frame: 0, context: { scriptPath: event.breakPoint.scriptPath, lineNumber: event.breakPoint.sourceLine } });
        }
        break;

        case "source":
        {
            console.log("[Debug client] Got source, context: " + event.context);
            if (currentScriptPath != event.context.scriptPath)
            {
                editor.session.setValue(event.source.source);
            }
            setActiveBreakpoint(event.context.lineNumber);
            editor.renderer.scrollToLine(event.context.lineNumber, true, true);
        }
        break;

        default:
        {
            console.log('[Debug client] Unhandled response: ' + evt.data); 
        }
        break;
    }
}  

function onError(evt) 
{ 
    console.log('ERROR: ' + evt.data); 
}  

function doSend(message) 
{ 
    console.log("SENT: " + JSON.stringify(message));  
    websocket.send(JSON.stringify(message)); 
} 