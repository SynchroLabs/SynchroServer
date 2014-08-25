var assert = require("assert")

var ApiProcessor = require("../lib/api");
var devices = require("./testdevices");

var logger = require('log4js').getLogger("apitest");

require('log4js').setGlobalLogLevel("ERROR");

function createApiProcessor(testModules)
{
    var testModuleManager = 
    {
    	getModule: function(route)
    	{
    		assert(testModules[route], "Module not found for route: " + route);
    		return testModules[route];
    	}
    }

	return new ApiProcessor(testModuleManager);
}

describe("API Processor", function()
{
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

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        // Initial page request
		var requestObject = { Mode: "Page", Path: "menu", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
		var response = apiProcessor.process(session, requestObject);

        it("should store device and view metric from request in session", function() 
        {
			assert.deepEqual(metrics.DeviceMetrics, session.DeviceMetrics);
			assert.deepEqual(metrics.ViewMetrics, session.ViewMetrics);
		});

        it("should store view state and view model in session", function() 
        {
			assert.deepEqual({ path: "menu" }, session.ViewState);
			assert.deepEqual({ foo: "bar" }, session.ViewModel);
		});

        it("should return view and view model in response", function() 
        {
			assert.deepEqual(modules.menu.View, response.View);
			assert.deepEqual({ foo: "bar" }, response.ViewModel);
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
    	Synchro = require("../lib/maaas")(apiProcessor, null);

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        it("should return menu page and view model when requesting menu page", function() 
        {
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "menu", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

			assert.deepEqual(testModules.menu.View, response.View);
			assert.deepEqual({}, response.ViewModel);
		});

        it("should return counter page and view model after menu page command goToCounter", function() 
        {
	        // Command: navigate to counter
			var requestObject = { Mode: "Command", Path: "menu", Command: "goToCounter" };
			var response = apiProcessor.process(session, requestObject);

			assert.deepEqual(testModules.counter.View, response.View);
			var expectedViewModel = 
			{
				count: 0,
				fontColor: "Green"
			};
			assert.deepEqual(expectedViewModel, response.ViewModel);
		});

        it("should return menu page and view model after counter page exit command", function() 
        {
	        // Command: exit
			var requestObject = { Mode: "Command", Path: "counter", Command: "exit" };
			var response = apiProcessor.process(session, requestObject);

			assert.deepEqual(testModules.menu.View, response.View);
			assert.deepEqual({}, response.ViewModel);
		});
	});

	describe("ViewModel updates from command", function()
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

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

        it("should store initial view model in session and return it in response", function() 
        {
			var requestObject = { Mode: "Page", Path: "counter", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

			var expectedViewModel = 
			{
				count: 0,
				fontColor: "Green"
			};
			assert.deepEqual(expectedViewModel, session.ViewModel);
			assert.deepEqual(expectedViewModel, response.ViewModel);
		});

        it("should store updated view model in session and return deltas in response after command modifies view model", function() 
        {
	        // Command: vary count (add 12)
			var requestObject = { Mode: "Command", Path: "counter", Command: "vary", Parameters: { amount: 12 } };
			var response = apiProcessor.process(session, requestObject);

			var expectedViewModel = 
			{
				count: 12,
				fontColor: "Red"
			};
			assert.deepEqual(expectedViewModel, session.ViewModel);

			var expectedDeltas = 
			[
			    { path: "count", change: "update", value: 12 },
			    { path: "fontColor", change: "update", value: "Red" }
			];
			assert.deepEqual(expectedDeltas, response.ViewModelDeltas);
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
		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return view modified by InitialzeView", function() 
		{
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "custom", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

	        // Verify response contains correct view and viewModel
	        var expectedView = 
	        {
			    title: "Custom Page",
			    elements: 
			    [
			        { control: "text", value: "Super Custom", font: 12 }, // InitializeView updated this
			    ]
	        }
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual({}, response.ViewModel);
			assert.deepEqual({}, session.ViewModel);
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

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return correctly filtered view on initial request", function()
		{
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "dynamic", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

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
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual({}, response.ViewModel);
			assert.deepEqual({}, session.ViewModel);
		});

		it("should return new filtered view on view update (orientation changed)", function()
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = { Mode: "ViewUpdate", Path: "dynamic", ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

	        // Verify response contains correct view and viewModel
	        expectedView = 
	        {
	        	dynamic: true,
			    title: "Dynamic Page",
			    elements: 
			    [
			        { control: "text", value: "Landscape", font: 12 },
			    ]
	        }

			assert.deepEqual(expectedView, response.View);
			assert.equal(undefined, response.ViewModelDeltas);
		});
    });

	describe("Dynamic page with OnViewMetricsChange handler", function()
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
				        { filter: { viewModel: "orientation", is: "Landscape"}, control: "text", value: "Landscape", font: 12 },
				        { filter: { viewModel: "orientation", is: "Portrait"}, control: "text", value: "Portrait", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view, isViewMetricUpdate)
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
				    var viewModel =
				    {
				        orientation: session.ViewMetrics.orientation,
				    }
				    return viewModel;
				},

				OnViewMetricsChange: function(context, session, viewModel)
				{
				    viewModel.orientation = session.ViewMetrics.orientation;
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return view that reflects view model initialized, view filtered, and view initialized, in order", function()
		{
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "dynamic", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

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
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual({ orientation: "Portrait" }, response.ViewModel);
			assert.deepEqual({ orientation: "Portrait" }, session.ViewModel);
		});

		it("should return updated view that reflects view model initialized, view filtered, and view initialized, in order, after view update", function()
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = { Mode: "ViewUpdate", Path: "dynamic", ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

	        // Verify response contains correct view and viewModel
	        expectedView = 
	        {
	        	dynamic: true,
			    title: "Dynamic Page",
			    elements: 
			    [
			        { control: "text", value: "Landscape - Update", font: 12 },
			    ]
	        }
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual([{ path: "orientation", change: "update", value: "Landscape" }], response.ViewModelDeltas);
	    });
    });

	describe("Static page made dynamic in InitializeView", function()
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
				        { control: "text", value: "placeholder", font: 12 },
				    ]
				},

				InitializeView: function(context, session, viewModel, view, isViewMetricUpdate)
				{
					view.dynamic = true;
				    view.elements[0].value = viewModel.orientation;
				    return view;
				},

				InitializeViewModel: function(context, session)
				{
				    var viewModel =
				    {
				        orientation: session.ViewMetrics.orientation,
				    }
				    return viewModel;
				},

				OnViewMetricsChange: function(context, session, viewModel)
				{
				    viewModel.orientation = session.ViewMetrics.orientation;
				}
			}
		}

		var apiProcessor = createApiProcessor(modules);

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return dynamic page that has been initialized by InitializeView", function()
		{
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "dynamic", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

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
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual({ orientation: "Portrait" }, response.ViewModel);
			assert.deepEqual({ orientation: "Portrait" }, session.ViewModel);			
		});

		it("should return updated dynamic page that has been initialized by InitializeView after view update", function()
		{
	        // Update view to landscape
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = { Mode: "ViewUpdate", Path: "dynamic", ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

	        // Verify response contains correct view and viewModel
	        expectedView = 
	        {
	        	dynamic: true,
			    title: "Dynamic Page",
			    elements: 
			    [
			        { control: "text", value: "Landscape", font: 12 },
			    ]
	        }
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual([{ path: "orientation", change: "update", value: "Landscape" }], response.ViewModelDeltas);
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

		var session = {};
		var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4");

		it("should return correctly filtered view on initial request", function()
		{
	        // Initial page request
			var requestObject = { Mode: "Page", Path: "dynamic", DeviceMetrics: metrics.DeviceMetrics, ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

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
			assert.deepEqual(expectedView, response.View);
			assert.deepEqual({ }, response.ViewModel);
			assert.deepEqual({ }, session.ViewModel);
		});

		it("should not return updated view after view change", function()
		{
	        // Update view to landscape (will still not be wider than 6 inches)
	        var metrics = devices.setSessionDeviceAndViewMetrics({}, "iPhone4", "Landscape");
			var requestObject = { Mode: "ViewUpdate", Path: "dynamic", ViewMetrics: metrics.ViewMetrics };
			var response = apiProcessor.process(session, requestObject);

	        // Verify response does not send back an updated view (or view model changes)
			assert.deepEqual(undefined, response.View);
			assert.deepEqual(undefined, response.ViewModelDeltas);
		});
    });

});