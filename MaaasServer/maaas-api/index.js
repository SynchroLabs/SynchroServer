// Maaas module
//
var logger = require('log4js').getLogger("maaas-api");

// For the Maaas "services" (session store, module store, and resource resolver), since the API processor
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
		createApiProcessor: function(appPath, sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, enableDebug)
    	{
            var debugPort = 0; // No debugging
            if (enableDebug)
            {
            	debugPort = currentDebugPort++;
            }

            logger.info("Creating managed API processor, debug port is: " + debugPort);
            var apiProcessor = require("./lib/api-request-delegator")(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, debugPort);
            apiProcessors[appPath] = apiProcessor;
            return apiProcessor;
    	},

        getApiProcessor: function(appPath)
        {
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

exports.createApiProcessor = function(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, debugPort)
{
    logger.info("Creating API processor, debug port is: " + debugPort);
    return apiProcessor = require("./lib/api-request-delegator")(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, debugPort);
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

        case "ResourceResolver":
        {
            service = require('./lib/resource-resolver')(serviceConfiguration);
        }
        break;
    }

    return service;
}
