var debuggerClient = null;

var websocket;

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

function setBreakpoint(scriptName, line)
{
    doSend({ command: "setbreakpoint", scriptName: scriptName, line: line });
}

function clearBreakpoint(scriptName, line)
{
    doSend({ command: "clearbreakpoint", scriptName: scriptName, line: line });
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
            if (currentScriptPath != event.breakPoint.scriptPath)
            {
                doSend({ command: "source", frame: 0, context: { scriptPath: event.breakPoint.scriptPath, lineNumber: event.breakPoint.sourceLine } });
            }
            else
            {
                setActiveBreakpoint(event.breakPoint.sourceLine);
                editor.renderer.scrollToLine(event.breakPoint.sourceLine, true, true);
            }
        }
        break;

        case "source":
        {
            console.log("[Debug client] Got source, context: " + event.context);
            currentScriptPath = event.context.scriptPath;
            editMode = false;
            editor.session.setValue(event.source.source);
            setActiveBreakpoint(event.context.lineNumber);
            editor.renderer.scrollToLine(event.context.lineNumber, true, true);
        }
        break;

        case "breakpoint-set":
        {
            if (event.breakpoint.scriptName == currentScriptPath)
            {
                editor.session.setBreakpoint(event.breakpoint.line);
            }
        }
        break;

        case "breakpoint-cleared":
        {
            if (event.breakpoint.scriptName == currentScriptPath)
            {
                editor.session.clearBreakpoint(event.breakpoint.line);
            }
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