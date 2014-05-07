// Maaas module
//
var logger = require('log4js').getLogger("maaas-api");

// For the Maaas "services" (session store, module store, and resource resolver), since the API processor
// may be a forked process we cannot pass these services as modules or live objects (since those can't be
// sent as process creation parameters or via IPC).  The forked process needs  to load these services itself.  
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

    var apiManager =
    {
		createApiProcessor: function(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, enableDebug)
    	{
            var debugPort = 0; // No debugging
            if (enableDebug)
            {
            	debugPort = currentDebugPort++;
            }

            logger.info("Creating managed API processor, debug port is: " + debugPort);
            return apiProcessor = require("./lib/api-request-delegator")(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, debugPort);
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
