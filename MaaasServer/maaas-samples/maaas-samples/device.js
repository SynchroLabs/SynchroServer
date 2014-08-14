// Device page
//
exports.View =
{
    title: "Device Metrics",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "OS: {deviceMetrics.os}", fontsize: 12 },
        { control: "text", value: "OS Name: {^deviceMetrics.osName}", fontsize: 12 },
        { control: "text", value: "Device Name: {deviceMetrics.deviceName}", fontsize: 12 },
        { control: "text", value: "Type: {deviceMetrics.deviceType}", fontsize: 12 },
        { control: "text", value: "Class: {deviceMetrics.deviceClass}", fontsize: 12 },

        // No select:First here, just to show that you can use filters on standalone nodes...
        //
        { control: "text", filterDeviceType: "Phone", value: "Primary orientation is Portrait (phone)", fontsize: 12 },
        { control: "text", filterDeviceType: "Tablet", value: "Primary orientation is Landscape (tablet)", fontsize: 12 },

        // Here is a select:First that will work just as if the items were not included in a select first (since exactly
        // one of the children will be valid on any given platform).
        //
        { select: "First", contents: [
            { control: "text", filterOS: "Windows", value: "Windows Rules!", fontsize: 12 },
            { control: "text", filterOS: "WinPhone", value: "Windows Phone Rules!", fontsize: 12 },
            { control: "text", filterOS: "Android", value: "Android Rules!", fontsize: 12 },
            { control: "text", filterOS: "iOS", value: "iOS Rules!", fontsize: 12 },
            ]},

        // This is the real use-case for select:First, where there would be one or more filtered children with an unfiltered
        // "default" at the bottom...
        //
        { select: "First", contents: [
            { control: "text", filterOS: ["Windows", "WinPhone"], value: "Microsoft OS", fontsize: 12 },
            { control: "text", value: "Non-Microsoft OS", fontsize: 12 },
            ]},

        { control: "text", value: "Height (inches): {deviceMetrics.heightInches:F2}", fontsize: 12 },
        { control: "text", value: "Width (inches): {deviceMetrics.widthInches:F2}", fontsize: 12 },
        { control: "text", value: "Height (device units): {deviceMetrics.heightDeviceUnits:F2}", fontsize: 12 },
        { control: "text", value: "Width (device units): {deviceMetrics.widthDeviceUnits:F2}", fontsize: 12 },
        { control: "text", value: "Device Scaling: {deviceMetrics.deviceScalingFactor:P1}", fontsize: 12 },
        { control: "text", value: "Height (units): {deviceMetrics.heightUnits:F2}", fontsize: 12 },
        { control: "text", value: "Width (units): {deviceMetrics.widthUnits:F2}", fontsize: 12 },
        { control: "text", value: "Scaling: {deviceMetrics.scalingFactor:P1}", fontsize: 12 },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        deviceMetrics: session.DeviceMetrics,
    }
    return viewModel;
}

exports.Commands = 
{
    exit: function(context)
    {
        return Synchro.navigateToView(context, "menu");
    },
}
