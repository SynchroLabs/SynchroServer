var debuggerClient = null;

var websocket;

var debugging = false;
var running = false;

function updateDebugging(isDebugging)
{
    debugging = isDebugging;
    if (debugging)
    {
        $("#editorPanel").removeClass("notdebugging").addClass("debugging");    
    }
    else
    {
        $("#editorPanel").removeClass("debugging").addClass("notdebugging");
        editor.session.clearBreakpoints();
        setActiveBreakpoint(-1);
    }
}

function updateRunning(isRunning)
{
    running = isRunning;
    if (running)
    {
        $(".debug-running").prop('disabled', true);
        setActiveBreakpoint(-1);
        $("#stackTable").empty();
    }
    else
    {
        $(".debug-running").prop('disabled', false);            
    }
}

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
    updateRunning(true);
}

function debugStep(action) // next, in, out
{
    doSend({ command: "step", action: action });
    updateRunning(true);
}

function setBreakpoint(scriptName, line)
{
    if (debugging)
    {
        doSend({ command: "setbreakpoint", scriptName: scriptName, line: line });
    }
}

function clearBreakpoint(scriptName, line)
{
    doSend({ command: "clearbreakpoint", scriptName: scriptName, line: line });
}

function loadBreakpoints(scriptName)
{
    if (debugging)
    {
        doSend({ command: "getbreakpoints", scriptName: scriptName });
    }
}

function onOpen(evt) 
{ 
    console.log("CONNECTED"); 
    doSend({ command: "connect", port: 6969}); 
}  

function onClose(evt) 
{ 
    updateDebugging(false);
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
            updateDebugging(true);
            updateRunning(true);
        }
        break;

        case "break":
        {
            console.log("[Debug client] Got breakpoint at: " + event.breakPoint.scriptName + " line: " + event.breakPoint.sourceLine);

            $("#stackTable").empty();
            for (var i = 0; i < event.breakPoint.frames.length; i++)
            {
                var frame = event.breakPoint.frames[i];
                $('#stackTable').append('<tr><td></td><td>' + frame.funcName + ' [' + frame.scriptName + ':' + frame.sourceLine + ']</td></tr>');
            }

            var currentFrame = event.breakPoint.frames[0];

            $("#argumentsTable").empty();
            for (var i = 0; i < currentFrame.arguments.length; i++)
            {
                $('#argumentsTable').append('<tr><td>' + currentFrame.arguments[i].name + '</td><td>' + JSON.stringify(currentFrame.arguments[i].display) + '</td></tr>');
            }

            $("#localsTable").empty();
            for (var i = 0; i < currentFrame.locals.length; i++)
            {
                $('#localsTable').append('<tr><td>' + currentFrame.locals[i].name + '</td><td>' + JSON.stringify(currentFrame.locals[i].display) + '</td></tr>');
            }

            if (currentScriptPath != event.breakPoint.scriptPath)
            {
                doSend(
                { 
                    command: "source", 
                    frame: 0, 
                    scriptPath: event.breakPoint.scriptPath, // This will get us breakpoints
                    context: { scriptPath: event.breakPoint.scriptPath, lineNumber: event.breakPoint.sourceLine } 
                });
            }
            else
            {
                setActiveBreakpoint(event.breakPoint.sourceLine);
                editor.renderer.scrollToLine(event.breakPoint.sourceLine, true, true);
            }
            updateRunning(false);
        }
        break;

        case "source":
        {
            console.log("[Debug client] Got source, context: " + event.context);
            onBreakpointSource(
            {
                scriptPath: event.context.scriptPath,
                source: event.source.source,
                breakpoints: event.source.breakpoints,
                executionPointer: event.context.lineNumber
            });
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

        case "breakpoints":
        {
            if (event.scriptName == currentScriptPath)
            {
                editor.session.clearBreakpoints();
                for (var i = 0; i < event.breakpoints.length; i++)
                {
                    editor.session.setBreakpoint(event.breakpoints[i].line);
                }
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