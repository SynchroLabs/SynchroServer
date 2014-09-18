// Maaas module
//
var logger = require('log4js').getLogger("synchro-api");

// For the Synchro "services" (session store, module store, and resource resolver), since the API processor
// may be a forked process we cannot pass these services as modules or live objects (since those can't be
// sent as process creation parameters or via IPC).  The forked process needs to load these services itself.  
// To accomodate this, we indicate these services by specification, which looks like this:
//
//    var serviceSpec = 
//    {
//        packageRequirePath = path.resolve('./maaas-module-providing-service'),
//        serviceName = NameOfTheService,
//        serviceConfiguration = { ... appropriate configuration object ... }
//    }
//
// The method below is used internally by Maaas modules (the API processor and any other modules that need
// these) to create services from a specification...
//
exports.createServiceFromSpec = function(serviceSpec)
{
    var serviceModule = require(serviceSpec.packageRequirePath);
    if (serviceModule)
    {
        return serviceModule.createService(serviceSpec.serviceName, serviceSpec.serviceConfiguration);
    }
}

exports.createApiProcessorManager = function(baseDebugPort)
{
    logger.info("Getting API manager with base debug port: " + baseDebugPort);
    var currentDebugPort = baseDebugPort;

    var apiProcessors = {};

    var apiManager =
    {
		createApiProcessorAsync: function(appPath, services, runForked, enableDebug, onCompleted)
    	{
            if (apiProcessors[appPath])
            {
                onCompleted("An API processor already exists for path: " + appPath);
                return;
            }

            var debugPort = 0; // No debugging
            if (enableDebug)
            {
            	debugPort = currentDebugPort++;
            }

            logger.info("Creating managed API processor for appPath: " + appPath + ", debug port is: " + debugPort);
            var apiProcessor = require("./lib/api-request-delegator")(services.sessionStoreSpec, services.moduleStoreSpec, services.resourceResolverSpec, runForked, debugPort, function(err, apiProcessor)
            {
                if (!err)
                {
                    apiProcessors[appPath] = apiProcessor;
                }
                onCompleted(err, apiProcessor);
            });
    	},

        getApiProcessor: function(appPath)
        {
            logger.info("Getting API processor for appPath: " + appPath);
            return apiProcessors[appPath];
        },

        getModuleStore: function(appPath)
        {
            // The apiProcessor has a module store in its process, but there are cases where the main Node / web process (particularly when serving the
            // the web site for the Maaas "studio" application) needs a module store using the same configuration information...
            //
            var apiProcessor = apiProcessors[appPath];
            if (apiProcessor)
            {
                if (apiProcessor.moduleStore == null)
                {
                    // This first time we check, there won't be a moduleStore, so we create it...
                    //
                    apiProcessor.moduleStore = exports.createServiceFromSpec(apiProcessor.moduleStoreSpec)
                }

                return apiProcessor.moduleStore;
            }

            // !!! BAD - No api processor for appName 
            return null;
        },

        getApiProcessors: function()
        {
            return apiProcessors;
        },

        processHttpRequest: function(appPath, request, response)
        {
            logger.info("Processing http request for appPath: " + appPath);
            var apiProcessor = apiProcessors[appPath];
            if (apiProcessor)
            {
                apiProcessor.processHttpRequest(request, response);
            }
            else
            {
                // !!! BAD - No apiProcessor found at appPath
            }
        },

        processWebSocket: function(appPath, request, socket, body)
        {
            var apiProcessor = apiProcessors[appPath];
            if (apiProcessor)
            {
                apiProcessor.processWebSocket(request, response);
            }
            else
            {
                // !!! BAD - No apiProcessor found at appPath
            }
        }
    }

    return apiManager;
}

exports.createService = function(serviceName, serviceConfiguration)
{
    var service;

    switch (serviceName)
    {
        case "FileModuleStore":
        {
            service = require('./lib/file-module-store')(serviceConfiguration);
        }
        break;

        case "MemorySessionStore":
        {
            service = require('./lib/session-store')(serviceConfiguration);
        }
        break;

        case "FileSessionStore":
        {
            service = require('./lib/file-session-store')(serviceConfiguration);
        }
        break;

        case "RedisSessionStore":
        {
            service = require('./lib/redis-session-store')(serviceConfiguration);
        }
        break;

        case "ResourceResolver":
        {
            service = require('./lib/resource-resolver')(serviceConfiguration);
        }
        break;
    }

    return service;
}
