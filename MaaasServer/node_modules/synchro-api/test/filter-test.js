require('./test');

var assert = require("assert")
require("./assert-helper");

var filter = require("../lib/filter");
var devices = require("./testdevices");


function assertFilterView(view, expected, device, orientation)
{
	var session = {};
    devices.setSessionDeviceAndViewMetrics(session, device, orientation);

    var viewModel =
    {
        stringValue: "Foo",
        numericValue: 420,
        booleanTrue: true,
        booleanFalse: false
    };

	var actual = filter.filterView(session.DeviceMetrics, session.ViewMetrics, viewModel, view);
    assert.objectsEqual(actual, expected);	
}

describe("View filtering", function()
{
	describe("simple is filtering", function() 
	{
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { control: "text", filter: { deviceMetric: "deviceType", is: "Phone" }, value: "Primary orientation is Portrait (phone)", fontsize: 12 },
		        { control: "text", filter: { deviceMetric: "deviceType", is: "Tablet" }, value: "Primary orientation is Landscape (tablet)", fontsize: 12 },
		    ]
	    }

	    it('should return phone control and not tablet control when device type is phone', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Primary orientation is Portrait (phone)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	    it('should return tablet control and not phone control when device type is tablet', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Primary orientation is Landscape (tablet)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "Nexus7");
	    });
	});

	describe("numeric comparison filtering", function() 
	{
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { control: "text", filter: { deviceMetric: "widthUnits", gt: 1024 }, value: "This is a wide screen display", fontsize: 12 },
		        { control: "text", filter: { deviceMetric: "widthUnits", lte: 1024 }, value: "This is not a wide screen display", fontsize: 12 },
		    ]
	    }

	    it('should return gt filtered element and not lte filtered element when test value is greater than specified value', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
    		        { control: "text", value: "This is a wide screen display", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	    it('should return lte filtered element and not gt filtered element when test value is equal to specified value', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
    		        { control: "text", value: "This is not a wide screen display", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPad3");
	    });
	});

	describe("is/isnot filtering", function()
	{
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { control: "text", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, value: "Windows!", fontsize: 12 },
		        { control: "text", filter: { deviceMetric: "os", is: "Android" }, value: "Android!", fontsize: 12 },
		        { control: "text", filter: { deviceMetric: "os", isnot: ["Windows", "WinPhone", "Android"] }, value: "Must be iOS!", fontsize: 12 },
		    ]
	    }

	    it('should return filtered element when value is equal to standalone "is" test value', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Android!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "GalaxyS3");
	    });

	    it('should return filtered element when value is first element of array of "is" test values', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Windows!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	    it('should return filtered element when value is non-first element of array of "is" test values', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Windows!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "Nokia925");
	    });


	    it('shoould return filtered element when value is not any element of array of "isnot" test value', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
    		        { control: "text", value: "Must be iOS!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPad3");
	    });
	});

    describe('selectFirst', function()
    {
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { select: "First", contents: [
		            { control: "text", filter: { deviceMetric: "os", is: "Windows" }, value: "Windows Rules!", fontsize: 12 },
		            { control: "text", filter: { deviceMetric: "os", is: "WinPhone" }, value: "Windows Phone Rules!", fontsize: 12 },
		            { control: "text", filter: { deviceMetric: "os", is: "Android" }, value: "Android Rules!", fontsize: 12 },
		            { control: "text", value: "iOS Rules!", fontsize: 12 },
		            ]},
		    ]
	    }

	    it('should return only first element when first element passes its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "Windows Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	    it('should return only second element when second element is the first to pass its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "Windows Phone Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "Nokia925");
	    });

	    it('should return only third element when third element is the first to pass its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "Android Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "GalaxyS3");
	    });

	    it('should return last (unfiltered) element when no previous element pass their filters', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "iOS Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

    });

    describe('selectAll', function()
    {
 	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { select: "First", contents: [
		            { select: "All", filter: { deviceMetric: "os", is: "Windows" }, contents: [
		                { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: 1 } },
		                { control: "commandBar.button", text: "Subtract", icon: "Remove", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
		                ]
		            },
		            { select: "All", filter: { deviceMetric: "os", is: "WinPhone" }, contents: [
		                { control: "appBar.button", text: "Add", icon: "add", binding: { command: "vary", amount: 1 } },
		                { control: "appBar.button", text: "Subtract", icon: "minus", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
		                ]
		            },
		            { select: "All", filter: { deviceMetric: "os", is: "Android" }, contents: [
		                { control: "actionBar.item", text: "Add", binding: { command: "vary", amount: 1 } },
		                { control: "actionBar.item", text: "Subtract", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "actionBar.item", text: "Reset", icon: "ic_action_refresh", showAsAction: "IfRoom", binding: "reset", enabled: "{count}" },
		                ]
		            },
		            { select: "All", filter: { deviceMetric: "os", is: "iOS" }, contents: [
		                { control: "navBar.button", systemItem: "Trash", binding: "reset", enabled: "{count}" },
		                { control: "toolBar.button", text: "Add", icon: "plus-symbol-mini", binding: { command: "vary", amount: 1 } },
		                { control: "toolBar.button", text: "Subtract", icon: "minus-symbol-mini", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                ]
		            },
		            ]
		        },		    
		    ]
	    }

	    it('should return contents of first select:All on select:First when it passes filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
	                { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: 1 } },
	                { control: "commandBar.button", text: "Subtract", icon: "Remove", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
	                { control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	    it('should return contents of second select:All on select:First when it is the first to pass its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
	                { control: "appBar.button", text: "Add", icon: "add", binding: { command: "vary", amount: 1 } },
	                { control: "appBar.button", text: "Subtract", icon: "minus", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
	                { control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
			    ]
		    }

	    	assertFilterView(view, expected, "Nokia925");
	    });

	    it('should return contents of third select:All on select:First when it is the first to pass its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
	                { control: "actionBar.item", text: "Add", binding: { command: "vary", amount: 1 } },
	                { control: "actionBar.item", text: "Subtract", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
	                { control: "actionBar.item", text: "Reset", icon: "ic_action_refresh", showAsAction: "IfRoom", binding: "reset", enabled: "{count}" },
			    ]
		    }

	    	assertFilterView(view, expected, "Nexus7");
	    });

	    it('should return contents of last select:All on select:First when it is the first to pass its filter', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
	                { control: "navBar.button", systemItem: "Trash", binding: "reset", enabled: "{count}" },
	                { control: "toolBar.button", text: "Add", icon: "plus-symbol-mini", binding: { command: "vary", amount: 1 } },
	                { control: "toolBar.button", text: "Subtract", icon: "minus-symbol-mini", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

    });

	describe("multiple filters", function() 
	{
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { select: "First", contents: [
		            { control: "text", filter: [ { deviceMetric: "os", is: "iOS" }, { deviceMetric: "widthInches", gt: 6.0 } ], value: "iOS big screen!", fontsize: 12 },
		            { control: "text", value: "Not iOS big screen", fontsize: 12 },
		            ]},
		    ]
	    }

	    it('should return filtered element when filter is array of two filter specification, both of which pass', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "iOS big screen!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPad3");
	    });

	    it('should not return filtered element when filter is array of two filter specification, only the first of which passes', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Not iOS big screen", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	    it('should not return filtered element when filter is array of two filter specification, only the second of which passes', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Not iOS big screen", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	    it('should not return filtered element when filter is array of two filter specification, neither of which passes', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", value: "Not iOS big screen", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "Nokia925");
	    });

	});

	describe("value domains", function() 
	{
	    it('should return filter element that matches deviceMetric value, and not return element that does not', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { deviceMetric: "os", is: "iOS" }, value: "iOS", fontsize: 12 },
		            { control: "text", filter: { deviceMetric: "os", isnot: "iOS" }, value: "Not iOS", fontsize: 12 },
			    ]
		    }

		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", value: "iOS", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	    it('should return filter element that matches viewMetric value, and not return element that does not', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { viewMetric: "orientation", is: "Landscape" }, value: "Landscape", fontsize: 12 },
		            { control: "text", filter: { viewMetric: "orientation", isnot: "Landscape" }, value: "Not Landscape", fontsize: 12 },
			    ]
		    }

		    var expected = 
		    {
			    title: "Test View",
			    dynamic: true,
			    elements: 
			    [
			        { control: "text", value: "Landscape", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4", "Landscape");
	    });

	    it('should return filter element that matches viewModel value, and not return element that does not', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { viewModel: "stringValue", is: "Foo" }, value: "Foo", fontsize: 12 },
		            { control: "text", filter: { viewModel: "stringValue", isnot: "Foo" }, value: "Not Foo", fontsize: 12 },
			    ]
		    }

		    var expected = 
		    {
			    title: "Test View",
			    dynamic: true,
			    elements: 
			    [
			        { control: "text", value: "Foo", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "SurfacePro2");
	    });

	});

	describe("operator value types", function() 
	{
	    describe('string', function()
	    {
	    	it('should return element when value matches "is" test value and not return element when value does not match', function() 
	    	{
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "stringValue", is: "Foo" }, value: "Foo", fontsize: 12 },
			            { control: "text", filter: { viewModel: "stringValue", is: "Bar" }, value: "FAIL", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Foo", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
	    	});

	    	it('should return element when value does not match "isnot" test value and not return element when value does match', function() 
	    	{
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "stringValue", isnot: "Foo" }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "stringValue", isnot: "Bar" }, value: "Not Bar", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Not Bar", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
	    	});
	    });

	    describe('boolean', function()
	    {
	    	it('should return element with "is" test value of true and not return element with "is" test value of false when value is true', function() 
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "booleanTrue", is: true }, value: "True (is)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "booleanTrue", is: false }, value: "FAIL", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "True (is)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

	    	it('should return element with "isnot" test value of false and not return element with "isnot" test value of true when value is true', function() 
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "booleanTrue", isnot: true  }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "booleanTrue", isnot: false  }, value: "True (isnot)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "True (isnot)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

	    	it('should return element with "is" test value of false and not return element with "is" test value of true when value is false', function() 
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "booleanFalse", is: true }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "booleanFalse", is: false }, value: "False (is)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "False (is)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

	    	it('should return element with "isnot" test value of true and not return element with "isnot" test value of false when value is false', function() 
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "booleanFalse", isnot: true  }, value: "False (isnot)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "booleanFalse", isnot: false  }, value: "FAIL", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "False (isnot)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });
	    });

		describe('number', function() 
		{
		    it('should return filtered element when value equals "is" test value, and not when value equals "isnot" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", is: 420 }, value: "Pass (is)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", isnot: 420 }, value: "FAIL", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (is)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value not equals "isnot" test value, and not when value not equals "is" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", is: 421 }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", isnot: 421 }, value: "Pass (isnot)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (isnot)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value is greater than "gt" test value, and not when value is less than "gt" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", gt: 400  }, value: "Pass (gt)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", gt: 500  }, value: "FAIL", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (gt)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value is less than "lt" test value, and not when value is greater than "lt" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", lt: 400  }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", lt: 500  }, value: "Pass (lt)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (lt)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value is greater than or equal to "gte" test value, and not when value is less than "gte" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", gte: 400  }, value: "Pass (gte)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", gte: 500  }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", gte: 420  }, value: "Pass (gte equal)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (gte)", fontsize: 12 },
			            { control: "text", value: "Pass (gte equal)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value is greater than or equal to "lte" test value, and not when value is less than "lte" test value', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", lte: 400  }, value: "FAIL", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", lte: 500  }, value: "Pass (lte)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", lte: 420  }, value: "Pass (lte equal)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (lte)", fontsize: 12 },
			            { control: "text", value: "Pass (lte equal)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });

		    it('should return filtered element when value is included in array of "is" test values, and not when it is not', function()
		    {
			    var view = 
			    {
				    title: "Test View",
				    elements: 
				    [
			            { control: "text", filter: { viewModel: "numericValue", is: [1, 420, 69] }, value: "Pass (is array)", fontsize: 12 },
			            { control: "text", filter: { viewModel: "numericValue", is: [1, 421, 69] }, value: "FAIL (is array)", fontsize: 12 },
				    ]
			    }

			    var expected = 
			    {
				    title: "Test View",
				    dynamic: true,
				    elements: 
				    [
			            { control: "text", value: "Pass (is array)", fontsize: 12 },
				    ]
			    }

		    	assertFilterView(view, expected, "iPhone4");
		    });
		});
	});
});
