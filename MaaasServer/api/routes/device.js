// Device page
//
exports.View =
{
    title: "Device Metrics",
    onBack: "exit",
    elements: 
    [
        { control: "text", value: "OS: {deviceMetrics.os}", fontsize: 12 },
        { control: "text", value: "OS Name: {deviceMetrics.osName}", fontsize: 12 },
        { control: "text", value: "Device Name: {deviceMetrics.deviceName}", fontsize: 12 },
        { control: "text", value: "Type: {deviceMetrics.deviceType}", fontsize: 12 },
        { control: "text", value: "Class: {deviceMetrics.deviceClass}", fontsize: 12 },
        { filter: [
            { control: "text", filterDeviceType: "Phone", value: "Primary orientation is Portrait", fontsize: 12 },
            { control: "text", filterDeviceType: "Tablet", value: "Primary orientation is Landscape", fontsize: 12 },
            ]},
        { control: "text", value: "Scaling: {deviceMetrics.scalingFactor}", fontsize: 12 },
        { control: "text", value: "Height (inches): {deviceMetrics.heightInches}", fontsize: 12 },
        { control: "text", value: "Width (inches): {deviceMetrics.widthInches}", fontsize: 12 },
        { control: "text", value: "Height (units): {deviceMetrics.heightUnits}", fontsize: 12 },
        { control: "text", value: "Width (units): {deviceMetrics.widthUnits}", fontsize: 12 },
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
        return navigateToView(context, "menu");
    },
}
