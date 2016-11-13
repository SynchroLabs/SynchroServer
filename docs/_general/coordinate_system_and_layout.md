---
title: Coordinate System and Layout
weight: 12
---

# Basic Layout Concepts

## Synchro Units

Synchro uses a unified coordinate system across all devices and operating systems. This coordinate system is designed to make it easy
to create layouts that work across a wide variety of devices, while maintaining a simple and efficient mapping to the underlying device
coordinate system. When the term "unit" is used below, it refers to a Synchro unit.

The Synchro coordinate system places 0, 0 in the upper left corner of the screen/page, with values increasing down and to the right.

Phone-type devices are assumed to operate in portrait mode and will always be 480 units wide. The native aspect ratio will be preserved,
so the height will range from 720 units (3.5" iPhone/iPod) to 853 units (16:9 Android and Windows Phone devices).

Tablet-type devices are assumed to operate in landscape mode and will always be 768 units tall. The native aspect ratio will be preserved,
so the width will range from 1024 units (iPad/iPad Mini) to 1368 units (Surface).

If controls overflow the screen size in either dimension, the page will automatically enable scrolling as appropriate so that all page
contents may be accessed.

Note that this unit system applies both to positioning of controls (though that will largely be handled automatically) as well as for
sizing of controls. For example, a control that is 240 units wide will always be exactly half of the width of the screen on any phone-type
device.

## Layout Guidelines

If your application is primarily targeted at phone-type devices, you will generally be safe laying out your pages vertically assuming a width
of 480 units. If it is important that all content be visible on the screen without scrolling, you should constrain the layout to 720 units tall.
However, it is recommended that you let your pages overflow vertically as needed. This will meet the expectation of a phone user, who will
expect to scroll the page up/down if not all controls are visible.

If your application is primarily targeted at tablet-type devices, you have more flexibility in terms of layout. While the screen will be 768
units tall, some part of that space may be used for page navigation controls (app bar, caption, back button, etc), and the size of those elements
will vary by platform. Layouts on these types of devices may overflow in either dimension, but it is preferable to only overflow in a single dimension.

A common technique to take advantage of the full size of the screen/page is to use star sizing on your top level container controls, and potentially
on their contents. This will allow these controls to take up the available space without causing an overflow.

Many layouts can be made to function acceptably on both phone and tablet devices, but it will often be the case when fine-tuning your layouts
that you will want to have a specific layout for each class of device. This can be accomplished very easily by using [Layout Filtering](layout-filtering).

# Advanced Layout Concepts

It should be possible to create great looking, cross-platform screen/page layouts for most applications using the basic layout concepts
and guidelines above. There may be special cases where the basic layout concepts are not sufficient, and where access to more detailed
information about the device, the native coordinate system, pixel density, physical screen size, etc. may be required.

## Device Metrics

Synchro provides the following device metrics related to the coordinate system, layout, and scaling:

* `widthUnits`
* `heightUnits`
* `widthDeviceUnits`
* `heightDeviceUnits`
* `deviceScalingFactor`
* `scalingFactor`
* `widthInches`
* `heightInches`

## Device Units

Synchro exposes the concept of "device units" and provides the dimensions of the screen in device units via the `widthDeviceUnits` and
`heightDeviceUnits` metrics. Device units represent the native underlying coordinate system of the device (a "point" in iOS, a "view pixel"
in Windows Phone, an actual pixel in Android, etc). These units may themselves be scaled or transformed in some way by the device operating
system to map to underlying display pixels (and will in fact be scaled on most contemporary devices, which will have displays with
significantly higher actual native pixel resolutions).

The `deviceScalingFactor` represents the ratio of physical pixels (typically) to device units.

DeviceUnits * `deviceScalingFactor` = Pixels

The `scalingFactor` represents the ratio of units to device units.

Units * `scalingFactor` = DeviceUnits

## Physical Measurement

Synchro exposes the physical dimensions of the device screen in inches via `widthInches` and `heightInches`.

There may be special cases where the layout needs to be modified for devices that are physically very large or very small, and these metrics
may be used to make that determination.

There may also be special cases where controls need to be a certain physical size on screen. If you wanted to create a control that was
exactly two inches wide on any device, for example, you could compute the width of that control in Synchro units as follows:

`widthUnits` / `widthInches` * 2

