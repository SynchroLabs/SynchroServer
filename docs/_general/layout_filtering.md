---
title: Layout Filtering
weight: 9
---

# Filtering Overview

While Synchro applications strive to run well with a single view on all platforms, there are cases where it is appropriate, even necessary,
to customize the actual view definition for a page/screen. Layout filtering is the mechanism that provides this support.

Layout filtering pre-processes the view for a given application page or screen, filtering the elements that apply based on the current
device metrics, view metrics, or view model, and then passes the resulting view to the mobile client. The most common filters are based
on device metrics such as the client operating system, device type, or screen size, and view metrics, most commonly the current orientation.

# Filtering Caveats

There are many tools and techniques for flexible layouts in Synchro, and it will very often be the case that highly flexible layouts that
adapt well to different device sizes and orientations can be achieved without layout filtering.

As just one example, if you had a page that primarily consisted of a list of items, where you wanted to display details of the selected
item next to the list, but only when in portrait mode and only on wide screen devices, you could compute the desired visibility of the
details control container, store that in your view model, and then data-bind that value to the visibility attribute of the details control
container. The layout would then adjust automatically (even responding to device rotation), with no layout filtering required. If however,
you wanted the list to be a no-select list with a bound command to launch a separate details page in one mode, and a single-select list
with the current selection data-bound such that it drove the details display on the same page in the other mode, you would need layout filtering.

Layouts that change due to layout filtering will cause the client to re-render the layout, which may result in a slight delay and/or may lose
some display state when switching (especially when switching back and forth). While these visual artifacts are fairly minor, they are best
avoided when possible.

# Element Filtering

Any view element may contain a filter specifying criteria for inclusion of that element in the final rendered view. If the filter criteria
is met, the element is included, and if not, it is excluded. In either case, the filter specification itself is removed from the element
when the final view is rendered.

A filter consists of a value specification and a qualifier. The value specification may use one of the following value domains as its attribute:

* `deviceMetric`
* `viewMetric`
* `viewModel`

The contents of the value specification attribute should be an appropriate device metric, view metric, or view model member. Please refer
to the complete list of [Device and View Metrics](device-and-view-metrics) for more details on the values that you may use for filtering in those domains.

The qualifier may use one of the following relationship specification values as its attribute:

* `is` - equals value, or if value is array, is present in array
* `isnot` - not equals value, or if value is array, is not present in array
* `lt` - less than
* `lte` - less than or equal to
* `gt` - greater than
* `gte` - greater than or equal to

The contents of the qualifier attribute should be the value to be used for the comparison (or, in the case of is or isnot, optionally
an array of values).

One of each of these two attribute types are combined to form an object that is the contents of a filter attribute on the element to
be filtered. For example:

    { control: "text", filter: { deviceMetric: "deviceType", is: "Tablet" }, value: "Tablets Rule!" },
    { control: "text", filter: { viewMetric: "widthInches", gt: 6.0 }, value: "Wide Screen" },

More than one value may be provided when using the `is` (or `isnot`) relationship attribute, in which case the filter checks to see if the
value matches (or does not match) any value in the attribute array, for example:

    { control: "text", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, value: "Microsoft Rules!" },

More than one filter can be specified on an element by using an array of filter objects, such as:

    { control: "text", filter: [{ deviceMetric: "deviceType", is: "Tablet" }, { viewMetric: "widthInches", gt: 6.0 }], value: "Wide screen tablet" },

In this case, the filters are treated as an and (all filters must pass in order for the element to be included in the rendered view).

# Selection Filtering

It is possible to have a set of elements with mutually exclusive filters to guarantee that a single element is present in the final
layout, such as:

    { control: "text", filter: { deviceMetric: "deviceType", is: "Phone" }, value: "Device is Phone!" },
    { control: "text", filter: { deviceMetric: "deviceType", is: "Tablet" }, value: "Device is Tablet!" },

In addition, there are "selector" container elements that can assist in scenarios where more complex filtering logic is required.

* `select: "First"` - This will select the first child element to replace this element (after removing any non-qualifying child elements based on filter criteria).
* `select: "All"` - This will select all child elements to replace this element (typically used to group like elements)

Note: select:First and element disqualification via filter criteria are performed first, for the entire layout, followed by select:All. This allows select:All elements to be contained in a select:First element (a common scenario).

It is common for the final element in a select:First to have no filter criteria, and thus serve as the default (the element chosen when
no other elements pass their filter criteria).

Examples:

    { select: "First", contents: [
        { control: "text", filter: { deviceMetric: "os", is: "iOS" }, value: "iOS rules!" },
        { control: "text", filter: { deviceMetric: "os", is: "Android" }, value: "Android rules!" },
        { control: "text", value: "Some kind of Windows platform rules!" },
        ]},

    { select: "First", contents: [
        { control: "text", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, value: "Microsoft OS",  },
        { control: "text", value: "Non-Microsoft OS" },
        ]},

Here is a real-word example to include specific auxiliary control elements based on the OS (platform), using select:All child elements
for grouping:

    { select: "First", contents: [
        { select: "All", filter: { deviceMetric: "os", is: "Windows" }, contents: [
            { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: "increment" },
            { control: "commandBar.button", text: "Subtract", icon: "Remove", commandBar: "Bottom", commandType: "Secondary", binding: "decrement"},
            { control: "commandBar.button", text: "Reset", icon: "Stop", commandBar: "Bottom", binding: "reset" },
            ]},
        { select: "All", filter: { deviceMetric: "os", is: "WinPhone" }, contents: [
            { control: "appBar.button", text: "Add", icon: "add",  binding: "increment" },
            { control: "appBar.button", text: "Subtract", icon: "minus", binding: "decrement"},
            { control: "appBar.button", text: "Reset", icon: "refresh", binding: "reset" },
            ]},
        { select: "All", filter: { deviceMetric: "os", is: "Android" }, contents: [
            { control: "actionBar.item", text: "Add", binding: "increment" },
            { control: "actionBar.item", text: "Subtract", binding: "decrement", enabled: "{count}" },
            { control: "actionBar.item", text: "Reset", icon: "ic_action_refresh", showAsAction: "IfRoom", binding: "reset" },
            ]},
        { select: "All", filter: { deviceMetric: "os", is: "iOS" }, contents: [
            { control: "navBar.button", systemItem: "Trash", binding: "reset", enabled: "{count}" },
            { control: "toolBar.button", text: "Add", icon: "plus-symbol-mini", binding: "increment" },
            { control: "toolBar.button", text: "Subtract", icon: "minus-symbol-mini", binding: "decrement" },
            ]},
        ]},
