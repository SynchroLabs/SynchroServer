---
title: View Style Helper
weight: 11
---

Synchro provides a "Style Helper" module to assist in applying styles in your application.  

You are certainly free to build a module like this yourself if the provided style helper module doesn't meet your needs (the style
helper module is itself a standalone module - it does not rely on anything internal to Synchro).

The Synchro Style Helper module does the following:

* Applies default styles to controls in your View based on control type
* Merges app default styles into your ViewModel
* Filters styles based on operating system
* Applies Default Styles

If you want to provide styling for every control of a certain type it can get pretty cumbersome to specify the style on every instance
of the control, like this:

    { control: "text", style: "txtStyle", value: "Hello" },
    { control: "text", style: "txtStyle", value: "World" },
    { control: "button", style: "btnStyle", caption: "Submit", binding: "OnClick" }

The Style Helper will automatically apply a style to each control based on the control type.

# Merges App Default Styles

It is often useful to define a set of application-wide styles to use on every page of your app.  In order to use those styles on your
controls, you need to move those styles to the ViewModel of the page.

In addition, it may be the case that you want to override some of your application-wide styles on a given page.

The Style Helper will merge only those application-wide styles that are actually referenced from the View on a page, and will merge
them in such a way that any style values specified in the ViewModel will override corresponding application-wide style values.

# Filters Styles Based on OS

It may be useful to have different style values for different operating systems.  The Style Helper module provides a mechanism for
applying operating system filters to produce a clean set of styles for the current operating system.  There are two types operating
system filters, `os_value` for selecting a single value, and `os_merge` to select a group of attribute values.

`os_value` selects the appropriate value from those listed and replaces itself with that value.

`os_merge` selects the appropriate set of attributes from those listed and replaces itself with that set of (zero or more) attributes.

Following is an example of how these filters are used.

    editStyle:
    {
        fontsize: { os_value: { iOS: 9, Android: 10, Windows: 11, default: 12 } },
        os_merge: 
        {
            iOS: 
            {
                color: "Blue"
            },
            Windows:
            {
                color: "Blue",
                background: "Black"
            },
            default:
            {
                background: "Green"
            }
        }
    }

# Usage

Include the style helper:

    var styleHelper = require("synchro-api/style-helper");

Call the all-in-one helper function (passing your style mappings and default styles, if any):

    exports.InitializeView = function(context, session, viewModel, view, metrics, isViewMetricsUpdate)
    {
        console.log("Processing styles");
        styleHelper.processViewAndViewModelStyles(viewModel, view, metrics, appStyleMappings, appStyles);
    }

There are also functions provided to do each of the functions of the Style Helper individually:

    addDefaultStylesToView (view, defaultStyleMapping)

Given a view, visit each control element, and if there is a default style mapping cooresponding to the control name, add the
default style to the control (if any styles are defined on the control, add to end of list, else create new style attribute and
set it to the default style). The passed-in view is modified in place.

    mergeStyles (viewModel, appStyles, viewOrList)

Merges the provided app-level styles into the viewModel (in place). You may specify which of the provided styles are to be merged
via with "viewOrList" parameter:

* If "viewOrList" is undefined (not provided in call) or null, all app styles will be merged.
* If "viewOrList" is an object (typically a View), then all styles referenced by the object will be merged.
* If "viewOrList" is an array, then the app styles matching elements of the array will be merged. If the array is empty, then of course no app styles will be merged.

Individual settings for styles defined in the viewModel will override any corresponding app style settings.

    filterStyles (viewModel, deviceMetrics)

Apply filters to the supplied viewModel (in place)
 

# Applying Styles in an Application Hook

In practice, the best way to apply application-wide styles using the Style Helper is via an application hook.  In this way, the Style
Helper will be called for you on each page automatically.  

For more information on how application hooks work, see [Application Hooks](application-hooks).

Below is an example of such a hook. 

    // App-wide Style Hook
    //
    // This module illustrates using application hook functionality to apply styles across an application.
    //
    var styleHelper = require("synchro-api/style-helper");

    // The mappings below define the default style to add to each control of the key type in the view.
    //
    var appStyleMappings = 
    {
        "button": "btnStyle",
        "text": "txtStyle"
    }

    // The "app" styles below will be merged in to any styles provided in the viewModel.  Only app styles that are actually 
    // referenced from the view will be merged.  Also, the app styles are merged in such that any style values provided in the
    // viewModel will override the cooresponding app style.
    //
    var appStyles = 
    {
        btnStyle:
        {
            color: "CornflowerBlue",
            background: "DarkSlateGray",
        },
        txtStyle:
        {
            fontsize: 12
        },
        stackStyle:
        {
            orientation: "Horizontal"
        },
        editStyle:
        {
            // These aren't really meaningful style values - they're just included as an example of how platform filtering
            // can be done on style values.
            //
            fontsize: { os_value: { iOS: 9, Android: 10, Windows: 11, default: 12 } },
            os_merge: 
            {
                iOS: 
                {
                    color: "Blue"
                },
                Windows:
                {
                    color: "Blue",
                    background: "Black"
                },
                default:
                {
                    background: "Green"
                }
            }
        }
    }

    exports.AfterInitializeView = function(route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
    {
        console.log("Processing styles");
        styleHelper.processViewAndViewModelStyles(viewModel, view, metrics, appStyleMappings, appStyles);
    }
 