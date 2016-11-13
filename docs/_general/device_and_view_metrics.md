---
title: Device and View Metrics
weight: 8
---

Synchro provides both device and view metrics. These metrics are provided in a metrics object that is passed to certain module callbacks,
such as `InitializeView` and `OnViewMetricsChange`, and which can be retrieved at any time by calling `Synchro.getMetrics(context)`. 
The metrics object contains two members, `DeviceMetrics` and `ViewMetrics`, as described below:

# Device Metrics

Device metrics describe characteristics of the physical device that is connecting to Synchro. It should be noted that device metrics do
not change during a session (or for a given device).

The height and width values in device metrics are based on the natural orientation of the device, and will not change when the device is
rotated (for current height/width, see view metrics below).

The following device metrics are provided:

* `clientName` - e.g. Synchro Explorer or your custom app name
* `clientVersion` - in x.x.x format
* `os` - Windows, WinPhone, Android, iOS
* `osName`
* `deviceName`
* `deviceType` - Phone, Tablet
* `deviceClass` - Phone, Phablet, MiniTablet, Tablet
* `naturalOrientation` - Portrait, Landscape
* `widthUnits`
* `heightUnits`
* `widthDeviceUnits`
* `heightDeviceUnits`
* `deviceScalingFactor`
* `scalingFactor`
* `widthInches`
* `heightInches`

# View Metrics

View metrics describe the current state of the device and the viewport in which Synchro is rendered. View metrics change whenever the
device state or Synchro application viewport change, for example, when the orientation of the device changes, or when a Windows 8 application
changes mode (between FullScreen, Snapped, and Filled).

The following view metrics are provided:

* `orientation` - Portrait, Landscape (current orientation of the device)
* `widthUnits`
* `heightUnits`
* `widthInches`
* `heightInches`