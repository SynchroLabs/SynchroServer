// Synchro Studio module
//
// http://justjs.com/posts/creating-reusable-express-modules-with-their-own-routes-views-and-static-assets
//
var logger = require('log4js').getLogger("synchro-studio");
var express = require('express');
var path = require('path');
var url = require('url');
var wait = require('wait.for');

var hbs = require('express-hbs');

var render = hbs.create().express3({
    partialsDir: __dirname + '/views/partials',
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: __dirname + '/views/layouts/default.hbs',
    contentHelperName: 'content'
});

var index = require('./routes/index');
var edit = require('./routes/edit');
var login = require('./routes/login');

var debugApi = require('./lib/ws-debug-server');

// Constructor
//
var SynchroStudio = function(basePath, apiManager)
{
	this.basePath = basePath;
	this.apiManager = apiManager;
};

SynchroStudio.prototype.getUrlPrefix = function()
{
	return this.basePath;
}

// Called before the Express router or any routes are added to the app.  This is a good time to add any
// static middleware.
//
SynchroStudio.prototype.addMiddleware = function(expressApp)
{
	logger.info("Adding static path from basePath: " + this.basePath);
	logger.info("Static path is: " + path.join(__dirname, 'public'));
	expressApp.use(this.basePath, express.static(path.join(__dirname, 'public')));
}

SynchroStudio.prototype.addRoutes = function(expressApp, config)
{
	var self = this;
	var checkAuth = login.checkAuth;

	expressApp.get('/', checkAuth, function(request, response) 
	{
	    // Launch fiber to asynchronously process the loaded apps and render the 'index' (app list) page
	    //
	    wait.launchFiber(function()
	    {
	        var applications = [];

	        var apiProcessors = self.apiManager.getApiProcessors();
	        for (appPath in apiProcessors)
	        {
	            var moduleStore = self.apiManager.getModuleStore(appPath);
	            var studioPath = self.getUrlPrefix() + "/" + appPath + "/sandbox";
	            applications.push(
	            { 
	                appPath: appPath, 
	                studioPath: studioPath, 
	                endpoint: config.addNonStandardPort(request.host) +  config.get("API_PATH_PREFIX") + "/" + appPath, 
	                appDefinition: moduleStore.getAppDefinition()
	            });
	        }

	        index.index(self, request, response, applications);
	    });
	});

	expressApp.all('/login', function(req, res, next)
	{
		login.login(self, req, res, next);
	});
	expressApp.get('/logout', function(req, res, next)
	{
		login.logout(self, req, res, next);
	});

	// We need to process /sandbox and /module (get and put) on a fiber, since they use wait.for to do async processing...
	//
	expressApp.get(this.basePath + '/:appName/sandbox', checkAuth, function(req,res)
	{
	    wait.launchFiber(edit.edit, self, req.params.appName, req, res); //handle in a fiber, keep node spinning
	});

	expressApp.get(this.basePath + '/:appName/module', checkAuth, function(req,res)
	{
	    wait.launchFiber(edit.loadModule, self, req.params.appName, req, res); //handle in a fiber, keep node spinning
	});

	expressApp.post(this.basePath + '/:appName/module', checkAuth, function(req,res)
	{
	    wait.launchFiber(edit.saveModule, self, req.params.appName, req, res); //handle in a fiber, keep node spinning
	});
}

SynchroStudio.prototype.onServerCreated = function(server)
{
	var self = this;

	server.on('upgrade', function(request, socket, body)
	{
	    // The WebSocket.isWebSocket() function was failing (on Azure only) because the Connection: Upgrade
	    // header sent by the client (confirmed by Fiddler) was getting modified by something in the Azure 
	    // environment such that it showed up at this point as Connection: Keep-alive.  So we will use this
	    // simplified logic to check for a websocket connect (and only a websocket should trigger "upgrade").
	    //
	    var upgrade = request.headers.upgrade || '';
	    if (request.method === 'GET' && upgrade.toLowerCase() === 'websocket')
	    {
	        var path = url.parse(request.url).pathname; 
	        if (path === self.getUrlPrefix())
	        {
	            // !!! Web session auth? (maybe inside websocket processor - to get/use session)
	            //
	            self.processWebSocket(request, socket, body);
	        }
	    }
	});	
}

SynchroStudio.prototype.getApiProcessor = function(appName)
{
	return this.apiManager.getApiProcessor(appName);
}

SynchroStudio.prototype.getModuleStore = function(appName)
{
	return this.apiManager.getModuleStore(appName);
}

SynchroStudio.prototype.render = function(templateName, locals, res)
{
	var dirname = path.join(__dirname, '/views');

	locals.settings = { views: dirname };

	render(path.join(dirname, templateName + '.hbs'), locals, function(err, html) 
	{
		if (err)
		{

		}
		else
		{
			res.send(html);
		}
    });
}

SynchroStudio.prototype.processWebSocket = function(request, socket, body)
{
    debugApi.processWebSocket(request, socket, body);
}

module.exports = SynchroStudio;
