/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var edit = require('./routes/edit');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var url = require('url');
var wait = require('wait.for');

var WebSocket = require('faye-websocket');

var app = express();

var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

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

// We need to process /edit (get and put) on a fiber, since they use wait.for to do async processing...
//
app.get('/edit', function(req,res){
      wait.launchFiber(edit.edit, req, res); //handle in a fiber, keep node spinning
});
app.post('/edit', function(req,res){
      wait.launchFiber(edit.save, req, res); //handle in a fiber, keep node spinning
});

//var apiProcessor = require("./api/api-request-delegator")(false); // In-proc
var apiProcessor = require("./api/api-request-delegator")(true, 6969); // Forked sub-process

var debugApi = require('./routes/debug-api');
debugApi.setDebugPort(apiProcessor.debugPort);

// Let the API processor handle requests to /api
//
app.all('/api', function(request, response) 
{
    apiProcessor.processHttpRequest(request, response);
});
app.use('/api/resources', express.static(path.join(__dirname, 'api/resources')));

var server = http.createServer(app);

// This is a copy of the WebSocket.isWebSocket function.  This was failing (on Azure only),
// because the Connection: Upgrade header sent by the client (confirmed by Fiddler) was
// getting modified by something in the Azure environment such that it showed up at this
// point as Connection: Keep-alive.  So we will use this re-written version to skip that
// check (it presumably qualified somehow since the server.on('upgrade') got triggered).
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

server.on('upgrade', function(request, socket, body) 
{
    if (isWebSocket(request)) // was: if (WebSocket.isWebSocket(request))
    {
        var path = url.parse(request.url).pathname; 
        if (path === "/api")
        {
            apiProcessor.processWebSocket(request, socket, body);
        }
        else if (path === "/debug")
        {
            debugApi.processWebSocket(request, socket, body);
        }
        else
        {
            console.log("ERROR - No such websocket endpoint: " + path);
        }
    }
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port') + ", node version: " + process.version);
});
