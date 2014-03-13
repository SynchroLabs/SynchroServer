/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var edit = require('./routes/edit');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var wait = require('wait.for');

var api = require('./api/api');

var app = express();

var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

var uuid = require('node-uuid');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.cookieParser());
// Note: Setting the maxAge value to 60000 (one hour) generates a cookie that .NET does not record (date generation/parsing
// is my guess) - for now we just omit expiration...
app.use(express.cookieSession({ store: sessionStore, secret: 'sdf89f89fd7sdf7sdf', cookie: { maxAge: false, httpOnly: true } }));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.query());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/users', user.list);
app.get('/', routes.index);

// We need to process /edit (get and put) on a fiber, since they used wait.for to do async processing...
//

//app.get('/edit', edit.edit);
app.get('/edit', function(req,res){
      wait.launchFiber(edit.edit, req, res); //handle in a fiber, keep node spinning
});

//app.post('/edit', edit.save);
app.post('/edit', function(req,res){
      wait.launchFiber(edit.save, req, res); //handle in a fiber, keep node spinning
});


var MaaasSessionIdHeader = "maaas-session-id";

function processHttpPostRequest(request, response)
{
    console.log("Processing http post request");

    var sessionId = request.headers[MaaasSessionIdHeader];
    console.log("Session ID: " + sessionId);

    var responseObject = api.process(request.session, request.body);
    response.socket.setNoDelay(true);

    if (sessionId == null)
    {
        responseObject.NewSessionId = uuid.v4();
        console.log("Generated new session id: " + responseObject.NewSessionId);
    }
    response.send(responseObject);
}

app.post('/api', function(request, response)
{
    console.log("Launching fiber for http post request");
    try
    {
        wait.launchFiber(processHttpPostRequest, request, response); //handle in a fiber, keep node spinning
    }
    catch (err)
    {
        console.log("Error launching fiber for http post request: " + err);
    }
    console.log("Done launching fiber for http post request");
});
app.use('/api/resources', express.static(path.join(__dirname, 'api/resources')));

var WebSocket = require('faye-websocket');

var server = http.createServer(app);

// This is a copy of the WebSocket.isWebSocket function.  This was failing (on Azure only),
// because the Connection: Upgrade header sent by the client (confirmed by Fiddler) was
// getting modified by something in the Azure environment such that it showed up at this
// point as Connection: Keep-alive.  So we will use this re-written version to skip that
// check (it presumably qualified somehow since the server.on('upgrade') got triggered.
//
function isWebSocket(request) 
{
    if (request.method !== 'GET') 
        return false;

    var connection = request.headers.connection || '',
        upgrade    = request.headers.upgrade || '';

    return request.method === 'GET' &&
           // !!! connection.toLowerCase().split(/\s*,\s*/).indexOf('upgrade') >= 0 &&
           upgrade.toLowerCase() === 'websocket';
}

function processWebSocketRequest(ws, session, event)
{
    console.log("Processing websocket request");

    console.log('message', event.data);
    var requestObject = JSON.parse(event.data);
    var responseObject = api.process(session, requestObject);
    if (session.id == null)
    {
        session.id = uuid.v4();
        responseObject.NewSessionId = session.id;
        console.log("Generated session id: " + session.id);
    }
    ws.send(JSON.stringify(responseObject));
}

server.on('upgrade', function(request, socket, body) 
{
    if (isWebSocket(request)) // was: if (WebSocket.isWebSocket(request))
    {
        var ws = new WebSocket(request, socket, body);
        console.log("Initialized WebSocket");

        // !!! Fix this...
        //
        // This is super low tech.  Since all of the transactions on this web socket
        // have this context, we're just going to allocate an object and use that as
        // the "session" for all of them.  This is not a great solution (has all the
        // downsides of MemoryStore) and doesn't provide any persistence across connections.
        // If a websocket connection is disconnected, the client will fire up a new one,
        // and that one won't have any session state.
        //
        var sessionId = request.headers[MaaasSessionIdHeader];
        console.log("Session ID: " + sessionId);
        
        session = { id: sessionId };

        ws.on('message', function(event) 
        {
            console.log("Launching fiber for websocket request");
            wait.launchFiber(processWebSocketRequest, ws, session, event); //handle in a fiber, keep node spinning
            console.log("Done launching fiber for websocket request");
        });

        ws.on('close', function(event) 
        {
            console.log('close', event.code, event.reason);
            ws = null;
        });
    }
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port') + ", node version: " + process.version);
});
