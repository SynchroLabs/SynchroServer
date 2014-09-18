require('./test');

var assert = require("assert");
require("./assert-helper");

var path = require('path');
var net = require('net');

var synchroApiModule = require("../index");

var logger = require('log4js').getLogger("module-test");

// This is testing the functionality of the top level module APIs (in index.js of this module).

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

	describe("Processor Manager", function() 
	{
		var apiProcessorManager = synchroApiModule.createApiProcessorManager(6969);
		var inprocProcessor;
		var forkedProcessor;

		var services = 
		{
			sessionStoreSpec:
			{
				packageRequirePath: path.resolve('./index'),
				serviceName: "MemorySessionStore",
				serviceConfiguration: { }
			},

		    moduleStoreSpec:
			{
				packageRequirePath: path.resolve('./index'),
				serviceName: "FileModuleStore",
				serviceConfiguration: { moduleDirectory: path.resolve('./test/testapp') }
			},

			resourceResolverSpec: 
			{
				packageRequirePath: path.resolve('./index'),
				serviceName: "ResourceResolver",
				serviceConfiguration: { prefix: "test:" }
			}
		}

		it("Should create API processor manager", function() 
		{
			assert.notEqual(apiProcessorManager, null);
		});

		it("Should create specified in-proc API processor", function(done)
		{
			apiProcessorManager.createApiProcessorAsync("inproc", services, false, false, function(err, apiProcessor)
			{
				inprocProcessor = apiProcessor;
				assert.equal(err, null);
				assert.notEqual(inprocProcessor, null);
				assert.equal(inprocProcessor.isForked, false);
				done();
			});
		});

		it("Should create specified forked API processor", function(done) 
		{
			apiProcessorManager.createApiProcessorAsync("forked", services, true, true, function(err, apiProcessor)
			{
				forkedProcessor = apiProcessor;
				assert.equal(err, null);
				assert.notEqual(forkedProcessor, null);
				assert.equal(forkedProcessor.isForked, true);
				done();
			});
		});

		it("Should fail to create API processor if one already exists at the specified path", function(done) 
		{
			apiProcessorManager.createApiProcessorAsync("inproc", services, false, false, function(err, apiProcessor)
			{
				assert.notEqual(err, null);
				assert.equal(apiProcessor, null);
				done();
			});
		});

		it("Should find proper API processor based on path", function()
		{
			assert.equal(apiProcessorManager.getApiProcessor("inproc"), inprocProcessor);
			assert.equal(apiProcessorManager.getApiProcessor("forked"), forkedProcessor);
		});

		it("Should fail to find API processor when none coorespond to path", function()
		{
			assert.equal(apiProcessorManager.getApiProcessor("foo"), null);
		});

		it("Should return all API processors", function()
		{
			var apiProcessors = apiProcessorManager.getApiProcessors();
			assert.equal(Object.keys(apiProcessors).length, 2);
			assert.equal(apiProcessors["inproc"], inprocProcessor);
			assert.equal(apiProcessors["forked"], forkedProcessor);
		});

		it("Should return module store for API processor", function()
		{
			assert.equal(apiProcessorManager.getModuleStore("inproc"), inprocProcessor.moduleStore); 
			assert.equal(apiProcessorManager.getModuleStore("forked"), forkedProcessor.moduleStore); 
		});

		it("Should get proper app definition from API processor", function(done)
		{
			var request = { headers: [], body: { Mode: "AppDefinition" } };
			var response = 
			{
				send: function(data)
				{
					var expectedAppDefinition = 
					{
						"name": "synchro-test",
						"version": "0.0.0",
						"description": "Synchro API Test",
						"mainPage": "launch",
						"author": "Bob Dickinson <bob@synchro.io> (http://synchro.io/)"
					};

					assert.objectsEqual(data, expectedAppDefinition);
					done();
				}
			};

			apiProcessorManager.processHttpRequest("inproc", request, response);
		});

		it("Should route HTTP request to in-proc API processor", function(done)
		{
			var request = { headers: [], body: { Mode: "Page", Path: "counter" } };
			var response = 
			{
				send: function(data)
				{
					assert.notEqual(data, null);
					assert.equal(data.View.title, "Counter Page");
					assert.equal(data.ViewModel.count, 0);
					done();
				}
			};

			apiProcessorManager.processHttpRequest("inproc", request, response);
		});

		it("Should route HTTP request to forked API processor", function(done)
		{
			var request = { headers: [], body: { Mode: "Page", Path: "counter" } };
			var response = 
			{
				send: function(data)
				{
					assert.notEqual(data, null);
					assert.equal(data.View.title, "Counter Page");
					assert.equal(data.ViewModel.count, 0);
					done();
				}
			};

			apiProcessorManager.processHttpRequest("forked", request, response);
		});
	});

	describe("Built-in Services", function() 
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
