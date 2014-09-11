var assert = require("assert");
require("./assert-helper");

var path = require('path');

var synchroApiModule = require("../index");

var logger = require('log4js').getLogger("module-test");


// Test fixture
exports.createService = function(serviceName, serviceConfiguration)
{
    var service;

    switch (serviceName)
    {
        case "TestService":
        {
        	service = 
        	{
        		name: "TestService",
        		config: serviceConfiguration
        	};
        }
        break;
    }

    return service;
}

describe("Synchro API module", function () 
{
	describe("Service creation", function () 
	{
		it("Should create test service from spec", function() 
		{
			var serviceSpec =
			{
				packageRequirePath: path.resolve('./test/module-test'),
				serviceName: "TestService",
				serviceConfiguration: { foo: "bar"}
			}

			var service = synchroApiModule.createServiceFromSpec(serviceSpec);
			assert.objectsEqual(service, { name: "TestService", config: { foo: "bar"} });
		});
	});

	describe("Processor Manager", function () 
	{
		var apiProcessorManager = synchroApiModule.createApiProcessorManager(6969);
		var inprocProcessor;
		var forkedProcessor;

		var sessionStoreSpec = 
		{
			packageRequirePath: path.resolve('./index'),
			serviceName: "MemorySessionStore",
			serviceConfiguration: { }
		};

		var moduleStoreSpec = 
		{
			packageRequirePath: path.resolve('./index'),
			serviceName: "FileModuleStore",
			serviceConfiguration: { moduleDirectory: path.resolve('./test/testapp') }
		};

		var resourceResolverSpec = 
		{
			packageRequirePath: path.resolve('./index'),
			serviceName: "ResourceResolver",
			serviceConfiguration: { prefix: "test:" }
		};

		it("Should create API processor manager", function () 
		{
			assert.notEqual(apiProcessorManager, null);
		});

		it("Should create specified in-proc API processor", function ()
		{
			inprocProcessor = apiProcessorManager.createApiProcessor("inproc", sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, false, false);
			assert.notEqual(inprocProcessor, null);
		});

		it.skip("Should create specified forked API processor", function() 
		{
			// !!! This doesn't wait for the forked proc to get created and verify that we can talk to it yet. The forked process needs to send a
			//     message to the main process and signal it that the forked process is running and ready to handle requests.  We could use a callback
			//     for this, or an event, and probably combine either of those with a "ready" member so we can check/poll readiness.
			//
			forkedProcessor = apiProcessorManager.createApiProcessor("forked", sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, true, true);
			assert.notEqual(forkedProcessor, null);
		});

		it("Should fail to create API processor if one already exists at the specified path");
		it("Should find proper API processor based on path");
		it("Should fail to find API processor when none coorespond to path");
		it("Should return all API processors");
		it("Should return module store for API processor");
		it("Should route HTTP request to in-proc API processor");
		it("Should route HTTP request to forked API processor");
		it("Should route websocket request to in-proc API processor");
		it("Should route websocket request to forked API processor");
	});

	describe("Built-in Services", function () 
	{
		it("Should create file module store", function() 
		{
			var service = synchroApiModule.createService("FileModuleStore", { moduleDirectory: path.resolve('./test/testapp') } );
			var appDefinition = service.getAppDefinition();
			assert.equal(appDefinition.name, "synchro-test");
		});

		it("Should create memory session store", function() 
		{
			var service = synchroApiModule.createService("MemorySessionStore", { } );
			var sessionId = service.createSession();
			assert.notEqual(sessionId, null);
		});

		it("Should create resource resolver", function() 
		{
			var service = synchroApiModule.createService("ResourceResolver", { prefix: "test:" } );
			var resourceUrl = service. getResourceUrl("foo");
			assert.equal(resourceUrl, "test:foo");
		});

		it("Should create file session store");
		it("Should create Redis session store");
	});
});
