// Maaas module
//
var logger = require('log4js').getLogger("maaas-module");

module.exports = function(baseDebugPort)
{
    logger.info("Getting API manager with base debug port: " + baseDebugPort);
    var currentDebugPort = baseDebugPort;

    var apiManager =
    {
		// For the session store and module store, since the API processor may be a forked process we cannot pass
		// live objects to it via IPC.  The forked process needs to load these services itself.  To accomodate
		// this we will pass these services by spec (requirePath and params).
		//
		createApiProcessor: function(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, enableDebug)
    	{
            logger.info("Creating API processor, debug port is: " + currentDebugPort);

            var debugPort = 0; // No debugging
            if (enableDebug)
            {
            	debugPort = currentDebugPort++;
            }

            return apiProcessor = require("./api-request-delegator")(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, runForked, debugPort);
    	}
    }

    return apiManager;
}
