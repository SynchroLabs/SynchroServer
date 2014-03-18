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
    console.log('RESPONSE: ' + evt.data); 
}  

function onError(evt) 
{ 
    console.log('<span style="color: red;">ERROR:</span> ' + evt.data); 
}  

function doSend(message) 
{ 
    console.log("SENT: " + JSON.stringify(message));  
    websocket.send(JSON.stringify(message)); 
} 