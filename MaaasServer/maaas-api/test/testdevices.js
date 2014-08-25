var assert = require("assert")

var deviceMetrics = 
{
	"SurfacePro2" :
	{
	    os: "Windows",
	    osName: "Windows",
	    deviceName: "Windows Device",
	    deviceType: "Tablet",
	    deviceClass: "Tablet",
	    naturalOrientation: "Landscape",
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
	    naturalOrientation: "Portrait",
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
	    naturalOrientation: "Portrait",
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
	    naturalOrientation: "Landscape",
	    widthInches: 7.7579998970031738,
	    heightInches: 5.8179998397827148,
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
	    naturalOrientation: "Portrait",
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
	    naturalOrientation: "Landscape",
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

exports.setSessionDeviceAndViewMetrics = function(session, device, orientation)
{
	assert(deviceMetrics[device], "No device metrics found for device: " + device);
    session.DeviceMetrics = deviceMetrics[device];

	if (orientation == undefined)
	{
        orientation = session.DeviceMetrics.naturalOrientation;
	}

	if ((orientation != "Landscape") && (orientation != "Portrait"))
	{
		assert.fail(orientation, "Landscape or Portrait", "Unsupported orientation");
	}

	session.ViewMetrics =
	{
		orientation: orientation
	}

	if (orientation == session.DeviceMetrics.naturalOrientation)
	{
		session.ViewMetrics.widthUnits = session.DeviceMetrics.widthUnits;
		session.ViewMetrics.heightUnits = session.DeviceMetrics.heightUnits;
		session.ViewMetrics.widthInches = session.DeviceMetrics.widthInches;
		session.ViewMetrics.heightInches = session.DeviceMetrics.heightInches;
	}
	else
	{
		session.ViewMetrics.widthUnits = session.DeviceMetrics.heightUnits;
		session.ViewMetrics.heightUnits = session.DeviceMetrics.widthUnits;
		session.ViewMetrics.widthInches = session.DeviceMetrics.heightInches;
		session.ViewMetrics.heightInches = session.DeviceMetrics.widthInches;
	}

	return session;
}
