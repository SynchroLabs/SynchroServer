var assert = require("assert")

var filter = require("../lib/filter");

var deviceMetrics = 
{
	"SurfacePro2" :
	{
	    os: "Windows",
	    osName: "Windows",
	    deviceName: "Windows Device",
	    deviceType: "Tablet",
	    deviceClass: "Tablet",
	    widthInches: 9.27536243678291,
	    heightInches: 5.2173914222901567,
	    widthDeviceUnits: 1371.4285888671875,
	    heightDeviceUnits: 771.4285888671875,
	    deviceScalingFactor: 1.4,
	    widthUnits: 1371.4285888671875,
	    heightUnits: 771.4285888671875,
	    scalingFactor: 1.0
	},

    "Nokia925" : 
	{
	    os: "WinPhone",
	    osName: "Windows Phone",
	    deviceName : "Windows Phone Device",
	    deviceType: "Phone",
	    deviceClass: "Phone",
	    widthInches: 2.2834645669291342,
	    heightInches: 3.8057742782152237,
	    widthDeviceUnits: 480.0,
	    heightDeviceUnits: 800.0,
	    deviceScalingFactor: 1.0,
	    widthUnits: 480.0,
	    heightUnits: 800.0,
	    scalingFactor: 1.0
	},

    "iPhone4" : 
	{
	    os: "iOS",
	    osName: "iOS",
	    deviceName: "iPhone/iPod",
	    deviceType: "Phone",
	    deviceClass: "Phone",
	    widthInches: 1.9630000591278076,
	    heightInches: 2.9440000057220459,
	    widthDeviceUnits: 320.0,
	    heightDeviceUnits: 480.0,
	    deviceScalingFactor: 2.0,
	    widthUnits: 480.0,
	    heightUnits: 720.0,
	    scalingFactor: 0.66666666666666663
    },

    "iPad3" :
	{
	    os: "iOS",
	    osName: "iOS",
	    deviceName: "iPad",
	    deviceType: "Tablet",
	    deviceClass: "Tablet",
	    widthInches: 5.8179998397827148,
	    heightInches: 7.7579998970031738,
	    widthDeviceUnits: 1024.0,
	    heightDeviceUnits: 768.0,
	    deviceScalingFactor: 2.0,
	    widthUnits: 1024.0,
	    heightUnits: 768.0,
	    scalingFactor: 1.0  
	},

    "GalaxyS3" :
	{
	    os: "Android",
	    osName: "Android",
	    deviceName: "Android Device",
	    deviceType: "Phone",
	    deviceClass: "Phone",
	    widthInches: 2.3622123874135008,
	    heightInches: 4.1732416493955009,
	    widthDeviceUnits: 720.0,
	    heightDeviceUnits: 1280.0,
	    deviceScalingFactor: 1.0,
	    widthUnits: 480.0,
	    heightUnits: 853.33333333333337,
	    scalingFactor: 1.5
	},

    "Nexus7" : 
    {
	    os: "Android",
	    osName: "Android",
	    deviceName: "Android Device",
	    deviceType: "Tablet",
	    deviceClass: "Tablet",
	    widthInches: 6.009389671361502,
	    heightInches: 3.455399061032864,
	    widthDeviceUnits: 1280.0,
	    heightDeviceUnits: 736.0,
	    deviceScalingFactor: 1.0,
	    widthUnits: 1335.6521739130435,
	    heightUnits: 768.0,
	    scalingFactor: 0.95833333333333337
    }

};

function assertFilterView(device, view, expected)
{
	assert(deviceMetrics[device], "No device metrics found for device: " + device);

    var session = { DeviceMetrics: deviceMetrics[device] };
	var actual = filter.filterView(session, view);
    assert.deepEqual(actual, expected);	
}

describe("View filtering", function()
{
	describe("simple filter include/exclude", function() 
	{
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { control: "text", filterDeviceType: "Phone", value: "Primary orientation is Portrait (phone)", fontsize: 12 },
		        { control: "text", filterDeviceType: "Tablet", value: "Primary orientation is Landscape (tablet)", fontsize: 12 },
		    ]
	    }

	    it('Phone', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", filterDeviceType: "Phone", value: "Primary orientation is Portrait (phone)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("iPhone4", view, expected);
	    });

	    it('Tablet', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
			        { control: "text", filterDeviceType: "Tablet", value: "Primary orientation is Landscape (tablet)", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("Nexus7", view, expected);
	    });
	});

    describe('simple selectFirst', function()
    {
	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { select: "First", contents: [
		            { control: "text", filterOS: "Windows", value: "Windows Rules!", fontsize: 12 },
		            { control: "text", filterOS: "WinPhone", value: "Windows Phone Rules!", fontsize: 12 },
		            { control: "text", filterOS: "Android", value: "Android Rules!", fontsize: 12 },
		            { control: "text", filterOS: "iOS", value: "iOS Rules!", fontsize: 12 },
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
		            { control: "text", filterOS: "Windows", value: "Windows Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("SurfacePro2", view, expected);
	    });

	    it('WinPhone', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filterOS: "WinPhone", value: "Windows Phone Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("Nokia925", view, expected);
	    });

	    it('Android', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filterOS: "Android", value: "Android Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("GalaxyS3", view, expected);
	    });

	    it('iOS', function()
	    {
		    var expected = 
		    {
			    title: "Test View",
			    elements: 
			    [
		            { control: "text", filterOS: "iOS", value: "iOS Rules!", fontsize: 12 },
			    ]
		    }

	    	assertFilterView("iPhone4", view, expected);
	    });

    });

    describe('simple selectAll', function()
    {
 	    var view = 
	    {
		    title: "Test View",
		    elements: 
		    [
		        { select: "First", contents: [
		            { select: "All", filterOS: "Windows", contents: [
		                { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: 1 } },
		                { control: "commandBar.button", text: "Subtract", icon: "Remove", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
		                ]
		            },
		            { select: "All", filterOS: "WinPhone", contents: [
		                { control: "appBar.button", text: "Add", icon: "add", binding: { command: "vary", amount: 1 } },
		                { control: "appBar.button", text: "Subtract", icon: "minus", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
		                ]
		            },
		            { select: "All", filterOS: "Android", contents: [
		                { control: "actionBar.item", text: "Add", binding: { command: "vary", amount: 1 } },
		                { control: "actionBar.item", text: "Subtract", binding: { command: "vary", amount: -1 }, enabled: "{count}" },
		                { control: "actionBar.item", text: "Reset", icon: "ic_action_refresh", showAsAction: "IfRoom", binding: "reset", enabled: "{count}" },
		                ]
		            },
		            { select: "All", filterOS: "iOS", contents: [
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

	    	assertFilterView("SurfacePro2", view, expected);
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

	    	assertFilterView("Nokia925", view, expected);
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

	    	assertFilterView("Nexus7", view, expected);
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

	    	assertFilterView("iPhone4", view, expected);
	    });

    });
});
