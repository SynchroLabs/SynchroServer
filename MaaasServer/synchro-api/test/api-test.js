require('./test');

var assert = require("assert");
var assertHelper = require("./assert-helper");

var ApiProcessor = require("../lib/api");
var ReaderWriter = require("../lib/reader-writer");
var readerWriter = new ReaderWriter();
var devices = require("./testdevices");

var SessionStore = require('../lib/session-store');
var sessionStore = new SessionStore();

var wait = require('wait.for');

var logger = require('log4js').getLogger("api-test");

function createApiProcessor(testModules)
{
    var testModuleManager = 
    {
    	getModule: function(route)
    	{
    		//assert(testModules[route], "Module not found for route: " + route);
    		return testModules[route];
    	}
    }

	return new ApiProcessor(testModuleManager, sessionStore, readerWriter);
}

// !!! Should get session after api processing and test that session (as opposed to the live session object passed in) to
//     ensure that session synchronization is happening correctly throughout.
//

describe("API Processor", function()
{
	beforeEach(function()
	{
		readerWriter.drain();
	});

	describe("Initial Page Request", function()
	{
		var modules =
		{
			menu:
			{
				View:
				{
				    title: "Menu",
				    elements: 
				    [
				        { control: "button", caption: "Counter", binding: "goToCounter" },
				    ]
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        foo: "bar"
				    }
				    return viewModel;
				},
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        // Initial page request
		var requestObject = 
		{ 
			Mode: "Page", 
			Path: "menu", 
			TransactionId: 0, 
			DeviceMetrics: metrics.DeviceMetrics, 
			ViewMetrics: metrics.ViewMetrics 
		};
		var response = {};

        it("should store device and view metric from request in session", function() 
        {
			apiProcessor.process(session, requestObject, response);
			assert.objectsEqual(session.DeviceMetrics, metrics.DeviceMetrics);
			assert.objectsEqual(session.ViewMetrics, metrics.ViewMetrics);
		});

        it("should store view state and view model in session", function() 
        {
			apiProcessor.process(session, requestObject, response);
			assert.objectsEqual(session.ModuleInstance.path, "menu");
			assert.objectsEqual(session.ModuleInstance.ClientViewModel.ViewModel, { foo: "bar" });
		});

        it("should return view and view model in response", function(done) 
        {
			apiProcessor.process(session, requestObject, response);
			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				assert.objectsEqual(responseObject.View, modules.menu.View);
				assert.objectsEqual(responseObject.ViewModel, { foo: "bar" });
				done();
			});

		});
	});

	describe("Navigation", function()
	{
    	var Synchro = null;
		var testModules =
		{
			menu:
			{
				View:
				{
				    title: "Menu",
				    elements: 
				    [
				        { control: "button", caption: "Counter", binding: "goToCounter" },
				    ]
				},

				Commands:
				{
				    goToCounter: function(context, session, viewModel, params)
				    {
				        return Synchro.navigateToView(context, "counter");
				    },
				}
			},

			counter:
			{
				View:
				{
				    title: "Counter Page",
				    onBack: "exit",
				    elements: 
				    [
				        { control: "text", value: "Count: {count}", foreground: "{fontColor}", font: 24 },
				    ]
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        count: 0,
				        fontColor: "Green"
				    }
				    return viewModel;
				},

				Commands:
				{
				    exit: function(context, session, viewModel)
				    {
				        return Synchro.navigateToView(context, "menu");
				    },
				}
			}
		}

		var apiProcessor = createApiProcessor(testModules);
    	Synchro = require("../lib/app-services")(apiProcessor, null);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        it("should return menu page and view model when requesting menu page", function(done) 
        {
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "menu", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				assert.objectsEqual(response.View, testModules.menu.View);
				assert.objectsEqual(response.ViewModel, {});
				done();
			});
		});

        it("should return counter page and view model after menu page command goToCounter", function(done) 
        {
	        // Command: navigate to counter
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "menu", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				Command: "goToCounter" 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				assert.objectsEqual(responseObject.View, testModules.counter.View);
				var expectedViewModel = 
				{
					count: 0,
					fontColor: "Green"
				};
				assert.objectsEqual(responseObject.ViewModel, expectedViewModel);
				done();
			});

		});

        it("should return menu page and view model after counter page exit command", function(done) 
        {
	        // Command: exit
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "counter", 
				InstanceId: 2, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				Command: "exit" 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				assert.objectsEqual(responseObject.View, testModules.menu.View);
				assert.objectsEqual(responseObject.ViewModel, {});
				done();
			});
		});
	});

	describe("ViewModel updates from command", function(done)
	{
		var modules =
		{
			counter:
			{
				View:
				{
				    title: "Counter Page",
				    onBack: "exit",
				    elements: 
				    [
				        { control: "text", value: "Count: {count}", foreground: "{fontColor}", font: 24 },
				    ]
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        count: 0,
				        fontColor: "Green"
				    }
				    return viewModel;
				},

				OnViewModelChange: function(context, session, viewModel, source, changes)
				{
				    viewModel.fontColor = (viewModel.count < 10) ? "Green" : "Red"
				},

				Commands:
				{
				    vary: function(context, session, viewModel, params)
				    {
				        viewModel.count += params.amount;
				    },
				    reset: function(context, session, viewModel)
				    {
				        viewModel.count = 0;
				    },
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        it("should return initial view model in response", function(done) 
        {
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "counter", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				var expectedViewModel = 
				{
					count: 0,
					fontColor: "Green"
				};
				assert.objectsEqual(responseObject.ViewModel, expectedViewModel);
				done();
			});
		});

        it("should return deltas in response after command modifies view model", function(done) 
        {
	        // Command: vary count (add 12)
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "counter", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				Command: "vary", 
				Parameters: { amount: 12 } 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);
				var expectedDeltas = 
				[
				    { path: "count", change: "update", value: 12 },
				    { path: "fontColor", change: "update", value: "Red" }
				];
				assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
				done();
			});
		});
	});

	describe("Custom View initializer", function()
	{
		var modules =
		{
			custom:
			{
				View:
				{
				    title: "Custom Page",
				    elements: 
				    [
				        { control: "text", value: "Custom", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view)
				{
				    view.elements[0].value = "Super Custom";
				    return view;
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);
		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return view modified by InitialzeView", function(done) 
		{
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "custom", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
				    title: "Custom Page",
				    elements: 
				    [
				        { control: "text", value: "Super Custom", font: 12 }, // InitializeView updated this
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModel, {});
				done();
			});
		});
	});

	describe("Dynamic page", function()
	{
		var modules =
		{
			dynamic:
			{
				View:
				{
				    title: "Dynamic Page",
				    elements: 
				    [
				        { filter: { viewMetric: "orientation", is: "Landscape"}, control: "text", value: "Landscape", font: 12 },
				        { filter: { viewMetric: "orientation", is: "Portrait"}, control: "text", value: "Portrait", font: 12 },
				    ]
				},
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return correctly filtered view on initial request", function(done)
		{
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "dynamic", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Portrait", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModel, {});
				done();
			});
		});

		it("should return new filtered view on view update (orientation changed)", function(done)
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "dynamic", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Landscape", font: 12 },
				    ]
		        }

				assert.objectsEqual(response.View, expectedView);
				assert.equal(responseObject.ViewModelDeltas, undefined);
				done();
			});
		});
    });

	describe("Dynamic page with OnViewMetricsChange handler", function()
	{
    	var Synchro = null;

		var modules =
		{
			dynamic:
			{
				View:
				{
				    title: "Dynamic Page",
				    elements: 
				    [
				        { filter: { viewModel: "orientation", is: "Landscape"}, control: "text", value: "Landscape", font: 12 },
				        { filter: { viewModel: "orientation", is: "Portrait"}, control: "text", value: "Portrait", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view, metrics, isViewMetricUpdate)
				{
					if (!isViewMetricUpdate)
					{
    				    view.elements[0].value += " - Init";
					}
					else
					{
    				    view.elements[0].value += " - Update";	
					}
				    return view;
				},

				InitializeViewModel: function(context, session)
				{
					var metrics = Synchro.getMetrics(context);

				    var viewModel =
				    {
				        orientation: metrics.ViewMetrics.orientation,
				    }
				    return viewModel;
				},

				OnViewMetricsChange: function(context, session, viewModel, metrics)
				{
				    viewModel.orientation = metrics.ViewMetrics.orientation;
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);
    	Synchro = require("../lib/app-services")(apiProcessor, null);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return view that reflects view model initialized, view filtered, and view initialized, in order", function(done)
		{
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "dynamic", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Portrait - Init", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModel, { orientation: "Portrait" });
				done();
			});
		});

		it("should return updated view that reflects view model initialized, view filtered, and view initialized, in order, after view update", function(done)
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "dynamic", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Landscape - Update", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModelDeltas, [{ path: "orientation", change: "update", value: "Landscape" }]);
				done();
			});
	    });
    });

	describe("Static page made dynamic in InitializeView", function()
	{
    	var Synchro = null;

		var modules =
		{
			dynamic:
			{
				View:
				{
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "placeholder", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view, metrics, isViewMetricUpdate)
				{
					view.dynamic = true;
				    view.elements[0].value = viewModel.orientation;
				    return view;
				},

				InitializeViewModel: function(context, session)
				{
					var metrics = Synchro.getMetrics(context);

				    var viewModel =
				    {
				        orientation: metrics.ViewMetrics.orientation,
				    }
				    return viewModel;
				},

				OnViewMetricsChange: function(context, session, viewModel, metrics)
				{
				    viewModel.orientation = metrics.ViewMetrics.orientation;
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);
    	Synchro = require("../lib/app-services")(apiProcessor, null);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return dynamic page that has been initialized by InitializeView", function(done)
		{
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "dynamic", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Portrait", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModel, { orientation: "Portrait" });
				done();
			});
		});

		it("should return updated dynamic page that has been initialized by InitializeView after view update", function(done)
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "dynamic", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Landscape", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModelDeltas, [{ path: "orientation", change: "update", value: "Landscape" }]);
				done();
			});
	    });
    });

	describe("Dynamic page filter unaffected by view change", function()
	{
		var modules =
		{
			dynamic:
			{
				View:
				{
				    title: "Dynamic Page",
				    elements: 
				    [
	    		        { select: "First", contents: [
				            { control: "text", filter: { viewMetric: "widthInches", gt: 6.0 }, value: "Wide screen", font: 12 },
				            { control: "text", value: "Narrow screen", font: 12 },
				            ]},
				    ]
				},
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return correctly filtered view on initial request", function(done)
		{
	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "dynamic", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response contains correct view and viewModel
		        var expectedView = 
		        {
		        	dynamic: true,
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "Narrow screen", font: 12 },
				    ]
		        }
				assert.objectsEqual(responseObject.View, expectedView);
				assert.objectsEqual(responseObject.ViewModel, {});
				done();
			});
		});

		it("should not return updated view after view change", function(done)
		{
	        // Update view to landscape (will still not be wider than 6 inches)
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "dynamic", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 0, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

		        // Verify response does not send back an updated view (or view model changes)
				assert.objectsEqual(responseObject.View, undefined);
				assert.objectsEqual(responseObject.ViewModelDeltas, undefined);
				done();
			});
		});
    });

	describe("View model change notification", function()
	{
    	var Synchro = null;

		var modules =
		{
			test:
			{
				View:
				{
				    title: "Dynamic Page",
				    elements: 
				    [
				        { control: "text", value: "placeholder", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view, metrics, isViewMetricUpdate)
				{
					view.dynamic = true;
				    view.elements[0].value = viewModel.orientation;
				    return view;
				},

				InitializeViewModel: function(context, session)
				{
					var metrics = Synchro.getMetrics(context);

				    var viewModel =
				    {
				    	count: 0,
				        orientation: metrics.ViewMetrics.orientation,
				    }
				    return viewModel;
				},

				OnViewMetricsChange: function(context, session, viewModel, metrics)
				{
					if (!session.orientationLocked)
					{
					    viewModel.orientation = metrics.ViewMetrics.orientation;
					}
				},

				OnViewModelChange: function(context, session, viewModel, source, changes)
				{
					session.test = session.test || {};

					switch (source)
					{
						case "view":
						{
							session.test.viewChanges = { called: true, changes: changes };
							if (viewModel.count >= 10)
							{
								viewModel.large = true;
							}
						}
						break;

						case "command":
						{
							session.test.commandChanges = { called: true, changes: changes };
						}
						break;

						case "viewMetrics":
						{
							session.test.viewmetricsChanges = { called: true, changes: changes };
						}
						break;
					}
				},

				Commands:
				{
				    vary: function(context, session, viewModel, params)
				    {
						session.test = session.test || {};
						session.test.varyCommand = true;
				        viewModel.count += params.amount;
				    },
				    reset: function(context, session, viewModel)
				    {
						session.test = session.test || {};
						session.test.resetCommand = true;
				        viewModel.count = 0;
				    },
				}
			}
		}

        var session;
        var apiProcessr;
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		beforeEach(function() 
		{
			apiProcessor = createApiProcessor(modules);
	    	Synchro = require("../lib/app-services")(apiProcessor, null);

		    session = sessionStore.createSession();

	        // Initial page request
			var requestObject = 
			{
				Mode: "Page", 
				Path: "test", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				// Ignore response
			});

			apiProcessor.process(session, requestObject, response);

		});

		it("should call OnViewModelChange with correct changes and source when client sends view model changes only", function(done) 
		{
			var viewModelDeltas = 
			[
			    { path: "count", value: 1 },
			];
			var requestObject = 
			{ 
				Mode: "Update", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				ViewModelDeltas: viewModelDeltas 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					viewChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 1 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				assert.objectsEqual(response.ViewModelDeltas, undefined);
				done();
			});
		});

		it("should call OnViewModelChange when client sends view model changes only, then return view model changes made during that processing", function(done) 
		{
			var viewModelDeltas = 
			[
			    { path: "count", value: 10 },
			];
			var requestObject = 
			{ 
				Mode: "Update", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				ViewModelDeltas: viewModelDeltas 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					viewChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 10 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				assert.objectsEqual(response.ViewModelDeltas, [{ path: "large", change: "add", value: true }]);
				done();
			});
		});

		it("should call OnViewModelChange with correct changes and source when client sends view model changes with command", function(done) 
		{
			var viewModelDeltas = 
			[
			    { path: "count", value: 1 },
			];
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				Command: "vary", 
				Parameters: { amount: 0 }, 
				ViewModelDeltas: viewModelDeltas 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					varyCommand: true,
					viewChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 1 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});
		});

		it("should call OnViewModelChange with correct changes and source for changes sent with command and caused by processing the command", function(done) 
		{
			var viewModelDeltas = 
			[
			    { path: "count", value: 1 },
			];
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				Command: "vary", 
				Parameters: { amount: 1 }, 
				ViewModelDeltas: viewModelDeltas 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					varyCommand: true,
					viewChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 1 },
						]
					},
					commandChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 2 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});
		});

		it("should call OnViewModelChange with correct changes and source when command processing updates view model", function(done) 
		{
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1,  
				TransactionId: 1, 
				Command: "vary", 
				Parameters: { amount: 1 } 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					varyCommand: true,
					commandChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 1 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});
		});

		it("should call OnViewModelChange with correct changes and source when view metrics change includes view model changes", function(done) 
		{
			var newMetrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var viewModelDeltas = 
			[
			    { path: "count", value: 1 },
			];

			session.UserData.orientationLocked = true;

			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				ViewMetrics: newMetrics.ViewMetrics, 
				ViewModelDeltas: viewModelDeltas 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					viewChanges:
					{
						called: true,
						changes: 
						[
						    { path: "count", change: "update", value: 1 },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});
		});

		it("should call OnViewModelChange with correct changes and source when view metrics change processing updates view model", function(done) 
		{
			var newMetrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");

			var requestObject = 
			{ 
				Mode: "ViewUpdate", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				ViewMetrics: newMetrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					viewmetricsChanges:
					{
						called: true,
						changes: 
						[
						    { path: "orientation", change: "update", value: "Landscape" },
						]
					}
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});
		});

		it("should not call OnViewModelChange after command if no view model changes made during command", function(done) 
		{
			var requestObject = 
			{ 
				Mode: "Command", 
				Path: "test", 
				InstanceId: 1, 
				InstanceVersion: 1, 
				TransactionId: 1, 
				Command: "reset" 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

				var expectedSessionTest = 
				{
					resetCommand: true
				}

				assert.objectsEqual(session.UserData.test, expectedSessionTest);
				done();
			});

		});
	});

	describe("Partial ViewModel updates xxx", function(done)
	{
    	var Synchro = null;

		var modules =
		{
			menu:
			{
				View:
				{
				    title: "Menu",
				    elements: 
				    [
				        { control: "button", caption: "Counter", binding: "goToCounter" },
				    ]
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        foo: "bar"
				    }
				    return viewModel;
				},

				Commands:
				{
				    goToCountdown: function(context, session, viewModel, params)
				    {
				        return Synchro.navigateToView(context, "countdown");
				    },
				}
			},

			countdown:
			{
				View:
				{
				    title: "Countdown Page",
				    onBack: "exit",
				    elements: 
				    [
				        { control: "text", value: "Count: {count}", font: 24 },
				    ]
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        count: 0,
				        loading: true
				    }
				    return viewModel;
				},

				LoadViewModel: function(context, session, viewModel)
				{
				    Synchro.waitFor(context, Synchro.waitInterval, 100);
				    viewModel.count = 3;
				    viewModel.loading = false;
				    console.log("view model: " + JSON.stringify(viewModel, null, 4));
				},

				Commands:
				{
				    countdown: function(context, session, viewModel)
				    {
				        while (viewModel.count > 0)
				        {
				        	console.log("vm before wait: " + JSON.stringify(viewModel, null, 4));
				        	console.log("context vm before wait: " + JSON.stringify(context.LocalViewModel.ViewModel, null, 4));
				            Synchro.waitFor(context, Synchro.waitInterval, 50);
				        	console.log("vm after wait: " + JSON.stringify(viewModel, null, 4));
				            viewModel.count--;
				            Synchro.interimUpdate(context);
				        }
				    },
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);
    	Synchro = require("../lib/app-services")(apiProcessor, null);

    	// Add this test utility fn (would normally just be a module-local function)
    	Synchro.waitInterval = function(intervalMillis, callback)
		{
		    setTimeout(function(){callback()}, intervalMillis);
		}

		function yield(callback)
		{
			setTimeout(function(){callback()}, 1);
		}

		var session = sessionStore.createSession();
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        it("should give partial response after InitializeViewModel, followed by complete response after LoadViewMode", function(done) 
        {
        	// Run in fiber because Synchro.waitFor needs to be in fiber (called inside of apiProcessor.process)
        	wait.launchFiber(function()
        	{
				var requestObject = 
				{ 
					Mode: "Page", 
					Path: "countdown", 
					TransactionId: 0, 
					DeviceMetrics: metrics.DeviceMetrics, 
					ViewMetrics: metrics.ViewMetrics 
				};
				var response = {};

				var nextRequest;

				var plan = new assertHelper.Plan(3, done);

				function onResponse(err, responseObject)
				{
					logger.error("Resp[" + plan.count + "]: " + JSON.stringify(responseObject, null, 4));
					assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

					switch (plan.count)
					{
						case 0:
						{
							var expectedNextRequest =
							{
								Path: "countdown",
								TransactionId: 0,
								InstanceId: 1,
								InstanceVersion: 1,
								Mode: "LoadPage"
							};
							var expectedViewModel = 
							{
								count: 0,
								loading: true
							};
							assert.equal(responseObject.TransactionId, 0);
							assert.equal(responseObject.InstanceId, 1);
							assert.equal(responseObject.InstanceVersion, 1);
							assert.objectsEqual(responseObject.NextRequest, expectedNextRequest);
							assert.objectsEqual(responseObject.ViewModel, expectedViewModel);
							plan.ok(true);

							nextRequest = responseObject.NextRequest;
							readerWriter.readAsync(session.id + ":0", onResponse);
						}
						break;

						case 1:
						{
							assert.equal(responseObject.NextRequest, undefined);
							var expectedDeltas = 
							[
							    { path: "count", change: "update", value: 3 },
							    { path: "loading", change: "update", value: false }
							];
							assert.equal(responseObject.TransactionId, 0);
							assert.equal(responseObject.InstanceId, 1);
							assert.equal(responseObject.InstanceVersion, 2);
							assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
							plan.ok(true);
						}
						break;
					}
				}

				readerWriter.readAsync(session.id + ":0", onResponse);
				apiProcessor.process(session, requestObject, response);
				apiProcessor.process(session, nextRequest, {});

				assert.equal(readerWriter.isWritePending(session.id + ":0"), false, "Pending writes still waiting");
				plan.ok(true);
        	});
		});

		it("should give partial response after InitializeViewModel, followed by complete response after LoadViewModel, when navigated to", function(done) 
        {
        	// Run in fiber because Synchro.waitFor needs to be in fiber (called inside of apiProcessor.process)
        	wait.launchFiber(function()
        	{
				var nextRequest;

				var plan = new assertHelper.Plan(4, done);

				function onResponse(err, responseObject)
				{
					logger.error("Resp[" + plan.count + "]: " + JSON.stringify(responseObject, null, 4));
					assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

					switch (plan.count)
					{
						case 0:
						{
							var expectedViewModel = 
							{
								count: 0,
								loading: true
							};
							assert.equal(responseObject.TransactionId, 1);
							assert.equal(responseObject.InstanceId, 2);
							assert.equal(responseObject.InstanceVersion, 1);
							assert.objectsEqual(responseObject.NextRequest, undefined);
							assert.objectsEqual(responseObject.ViewModel, { foo: "bar" });
							plan.ok(true);
						}
						break;

						case 1:
						{
							var expectedNextRequest =
							{
								Path: "countdown",
								TransactionId: 2,
								InstanceId: 3,
								InstanceVersion: 1,
								Mode: "LoadPage"
							};
							var expectedViewModel = 
							{
								count: 0,
								loading: true
							};
							assert.equal(responseObject.TransactionId, 2);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 1);
							assert.objectsEqual(responseObject.NextRequest, expectedNextRequest);
							assert.objectsEqual(responseObject.ViewModel, expectedViewModel);
							plan.ok(true);

							nextRequest = responseObject.NextRequest;
							readerWriter.readAsync(session.id + ":2", onResponse);
						}
						break;

						case 2:
						{
							assert.equal(responseObject.NextRequest, undefined);
							var expectedDeltas = 
							[
							    { path: "count", change: "update", value: 3 },
							    { path: "loading", change: "update", value: false }
							];
							assert.equal(responseObject.TransactionId, 2);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 2);
							assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
							plan.ok(true);
						}
						break;
					}
				}

				var menuRequestObject = 
				{ 
					Mode: "Page", 
					Path: "menu", 
					TransactionId: 1, 
					DeviceMetrics: metrics.DeviceMetrics, 
					ViewMetrics: metrics.ViewMetrics 
				};
				var response = {};

				readerWriter.readAsync(session.id + ":1", onResponse);
				apiProcessor.process(session, menuRequestObject, response);

				var countdownRequestObject = 
				{ 
					Mode: "Page", 
					Path: "countdown", 
					TransactionId: 2, 
					DeviceMetrics: metrics.DeviceMetrics, 
					ViewMetrics: metrics.ViewMetrics 
				};

				readerWriter.readAsync(session.id + ":2", onResponse);
				apiProcessor.process(session, countdownRequestObject, response);
				apiProcessor.process(session, nextRequest, {});

				assert.equal(readerWriter.isWritePending(session.id + ":0"), false, "Pending writes still waiting");
				plan.ok(true);
        	});
		});

        it("should return multiple partial responses, followed by complete response, on command using Synchro.interimUpdate", function(done) 
        {
        	// Run in fiber because Synchro.waitFor needs to be in fiber (called inside of apiProcessor.process)
        	wait.launchFiber(function()
        	{
        		// Need to read session back from store (in-memory local copy doesn't contain changes)
        		session = sessionStore.getSession(session.id);

				var requestObject = 
				{ 
					Mode: "Command", 
					Path: "countdown", 
					TransactionId: 3, 
					InstanceId: 3, 
					InstanceVersion: 2, 
					Command: "countdown" 
				};
				var response = {};

				var nextRequest;

				var plan = new assertHelper.Plan(5, done);

				var expectedNextRequest =
				{
					Path: "countdown",
					Mode: "Continue",
					TransactionId: 3,
					InstanceId: 3
				};

				function onResponse(err, responseObject)
				{
					logger.error("Resp[" + plan.count + "]: " + JSON.stringify(responseObject, null, 4));
					assert.equal(responseObject.Error, undefined, "Unexpected error: " + responseObject.Error);

					switch (plan.count)
					{
						case 0:
						{
							assert.equal(responseObject.TransactionId, 3);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 3);
							expectedNextRequest.InstanceVersion = 3;
							assert.objectsEqual(responseObject.NextRequest, expectedNextRequest);
							var expectedDeltas = 
							[
							    { path: "count", change: "update", value: 2 },
							];
							assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
							plan.ok(true);

							nextRequest = responseObject.NextRequest;
							readerWriter.readAsync(session.id + ":3", onResponse);
						}
						break;

						case 1:
						{
							assert.equal(responseObject.TransactionId, 3);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 4);
							expectedNextRequest.InstanceVersion = 4;
							assert.objectsEqual(responseObject.NextRequest, expectedNextRequest);
							var expectedDeltas = 
							[
							    { path: "count", change: "update", value: 1 },
							];
							assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
							plan.ok(true);

							nextRequest = responseObject.NextRequest;
							readerWriter.readAsync(session.id + ":3", onResponse);
						}
						break;

						case 2:
						{
							assert.equal(responseObject.TransactionId, 3);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 5);
							expectedNextRequest.InstanceVersion = 5;
							assert.objectsEqual(responseObject.NextRequest, expectedNextRequest);
							var expectedDeltas = 
							[
							    { path: "count", change: "update", value: 0 },
							];
							assert.objectsEqual(responseObject.ViewModelDeltas, expectedDeltas);
							plan.ok(true);

							nextRequest = responseObject.NextRequest;
							readerWriter.readAsync(session.id + ":3", onResponse);
						}
						break;

						case 3:
						{
							// There doesn't happen to be any ViewModel changes between the last interimUpdate and the
							// completion (this response) in this particular test app, so the response is pretty much
							// empty and just needed to break the long-poll chain on the client.
							//
							assert.equal(responseObject.TransactionId, 3);
							assert.equal(responseObject.InstanceId, 3);
							assert.equal(responseObject.InstanceVersion, 5);
							assert.objectsEqual(responseObject.NextRequest, undefined);
							assert.objectsEqual(responseObject.ViewModelDeltas, undefined);
							plan.ok(true);
						}
						break;
					}
				}

				readerWriter.readAsync(session.id + ":3", onResponse);
				apiProcessor.process(session, requestObject, response);

				assert.equal(readerWriter.isWritePending(session.id + ":3"), false, "Pending writes still waiting");
				plan.ok(true);
			});
		});
	});

	describe("Client Errors", function()
	{
		it("should fail with appropriate message when requesting page/route that does not exist", function(done)
		{
			var modules =
			{
				menu:
				{
					View:
					{
					    title: "Menu",
					    elements: 
					    [
					        { control: "button", caption: "Counter", binding: "goToCounter" },
					    ]
					},

					InitializeViewModel: function(context, session)
					{
					    var viewModel =
					    {
					        foo: "bar"
					    }
					    return viewModel;
					},
				}
			}

			var apiProcessor = createApiProcessor(modules);

			var session = sessionStore.createSession();
			var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "foo", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				var expectedResponse = 
				{
					Path: "foo",
					Error: "Client error - No route found for path: foo",
					TransactionId: 0
				}

				assert.objectsEqual(responseObject, expectedResponse);
				done();
			});
		});

		it("should fail with appropriate message when calling command that does not exist", function(done)
		{
			var modules =
			{
				menu:
				{
					View:
					{
					    title: "Menu",
					    elements: 
					    [
					        { control: "button", caption: "Counter", binding: "goToCounter" },
					    ]
					},

					InitializeViewModel: function(context, session)
					{
					    var viewModel =
					    {
					        foo: "bar"
					    }
					    return viewModel;
					},
				}
			}

			var apiProcessor = createApiProcessor(modules);

			var session = sessionStore.createSession();
			var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "menu", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				// Ignore response
			});

			apiProcessor.process(session, requestObject, response);

			requestObject = { Mode: "Command", Path: "menu", InstanceId: 1, InstanceVersion: 1, TransactionId: 1, Command: "foo" };
			response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				var expectedResponse = 
				{
					Path: "menu",
					Error: "Client error - Command not found: foo", 
					TransactionId: 1
				}
				assert.objectsEqual(responseObject, expectedResponse);
				done();
			});
		});

		it("should fail with appropriate message when trying to navigate to a page does not exist from user code", function(done)
		{
	    	var Synchro = null;

			var modules =
			{
				menu:
				{
					View:
					{
					    title: "Menu",
					    elements: 
					    [
					        { control: "button", caption: "Counter", binding: "goToCounter" },
					    ]
					},

					InitializeViewModel: function(context, session)
					{
					    var viewModel =
					    {
					        foo: "bar"
					    }
					    return viewModel;
					},

					Commands:
					{
					    nowhere: function(context, session, viewModel)
					    {
					        return Synchro.navigateToView(context, "nowhere");
					    },
					}					
				}
			}

			var apiProcessor = createApiProcessor(modules);
	    	Synchro = require("../lib/app-services")(apiProcessor, null);

			var session = sessionStore.createSession();
			var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

	        // Initial page request
			var requestObject = 
			{ 
				Mode: "Page", 
				Path: "menu", 
				TransactionId: 0, 
				DeviceMetrics: metrics.DeviceMetrics, 
				ViewMetrics: metrics.ViewMetrics 
			};
			var response = {};

			readerWriter.readAsync(session.id + ":0", function(err, responseObject)
			{
				// Ignore response
			});

			apiProcessor.process(session, requestObject, response);

			requestObject = { Mode: "Command", Path: "menu", InstanceId: 1, InstanceVersion: 1, TransactionId: 1, Command: "nowhere" };
			response = {};
			apiProcessor.process(session, requestObject, response);

			readerWriter.readAsync(session.id + ":1", function(err, responseObject)
			{
				var expectedResponse = 
				{
					Path: "menu",
					Error: "UserCode error in method: Command.nowhere - Attempted to navigate to page that does not exist: nowhere", 
					TransactionId: 1
				}
				assert.objectsEqual(responseObject, expectedResponse);
				done();
			});
		});


	});
});

