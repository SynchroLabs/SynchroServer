var assert = require("assert")

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
    assert.deepEqual(actual, expected);	
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

	    it('Phone', function()
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

	    it('Tablet', function()
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

	describe("comparison filtering", function() 
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

	    it('gt', function()
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

	    it('lte', function()
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

	    it('is - first element in array', function()
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

	    it('is - non-first element in array', function()
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

	    it('is - standalone value', function()
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

	    it('isnot - any element in array', function()
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
		            { control: "text", filter: { deviceMetric: "os", is: "iOS" }, value: "iOS Rules!", fontsize: 12 },
		            ]},
		    ]
	    }

	    it('Windows', function()
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

	    it('WinPhone', function()
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

	    it('Android', function()
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

	    it('iOS', function()
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

	    it('Windows', function()
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

	    it('WinPhone', function()
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

	    it('Android', function()
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

	    it('iOS', function()
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

	    it('both conditions met - true', function()
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

	    it('first condition only - false', function()
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

	    it('second condition only - false', function()
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

	    it('neither condition - false', function()
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
	    it('deviceMetric', function()
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

	    it('viewMetric', function()
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

	    it('viewModel', function()
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
	    it('string', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { viewModel: "stringValue", is: "Foo" }, value: "Foo", fontsize: 12 },
		            { control: "text", filter: { viewModel: "stringValue", is: "Bar" }, value: "FAIL", fontsize: 12 },
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
		            { control: "text", value: "Foo", fontsize: 12 },
		            { control: "text", value: "Not Bar", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	    it('boolean', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { viewModel: "booleanTrue", is: true }, value: "True (is)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "booleanTrue", is: false }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "booleanTrue", isnot: true  }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "booleanTrue", isnot: false  }, value: "True (isnot)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "booleanFalse", is: true }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "booleanFalse", is: false }, value: "False (is)", fontsize: 12 },
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
		            { control: "text", value: "True (is)", fontsize: 12 },
		            { control: "text", value: "True (isnot)", fontsize: 12 },
		            { control: "text", value: "False (is)", fontsize: 12 },
		            { control: "text", value: "False (isnot)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	    it('number', function()
	    {
		    var view = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filter: { viewModel: "numericValue", is: 420 }, value: "Pass (is)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", isnot: 420 }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", gt: 400  }, value: "Pass (gt)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", gt: 500  }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", lt: 400  }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", lt: 500  }, value: "Pass (lt)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", gte: 400  }, value: "Pass (gte)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", gte: 500  }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", gte: 420  }, value: "Pass (gte equal)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", lte: 400  }, value: "FAIL", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", lte: 500  }, value: "Pass (lte)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", lte: 420  }, value: "Pass (lte equal)", fontsize: 12 },
		            { control: "text", filter: { viewModel: "numericValue", is: [1, 420, 69] }, value: "Pass (is array)", fontsize: 12 },
			    ]
		    }

		    var expected = 
		    {
			    title: "Test View",
			    dynamic: true,
			    elements: 
			    [
		            { control: "text", value: "Pass (is)", fontsize: 12 },
		            { control: "text", value: "Pass (gt)", fontsize: 12 },
		            { control: "text", value: "Pass (lt)", fontsize: 12 },
		            { control: "text", value: "Pass (gte)", fontsize: 12 },
		            { control: "text", value: "Pass (gte equal)", fontsize: 12 },
		            { control: "text", value: "Pass (lte)", fontsize: 12 },
		            { control: "text", value: "Pass (lte equal)", fontsize: 12 },
		            { control: "text", value: "Pass (is array)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView(view, expected, "iPhone4");
	    });

	});

});
