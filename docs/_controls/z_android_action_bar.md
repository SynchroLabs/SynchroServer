---
title: 'Android: ActionBar Control'
description: Android ActionBar controls
slug: android-action-bar
---

{{ page.description }}

----

# actionBar.item

## Overview:

The `actionBar.item` control represents an Android Action Bar item.

## Attributes:
* [Common Control Attributes](common)
* `text`
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `showAsAction` - Always, IfRoom
* `showActionAsText` - boolean

## Bindings:

* `onClick` (command + params)

----
  
# actionBar.toggle

## Overview:

The `actionBar.toggle` control represents an Android Action Bar item that can be toggled on and off.

## Attributes:

* [Common Control Attributes](common)
* `text`
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `uncheckedText`
* `uncheckedIcon`
* `checkedText`
* `checkedIcon`
* `showAsAction` - Always, IfRoom
* `showActionAsText` - boolean

## Bindings:

* `value`
* `onToggle` (command + params)

## Notes:

If `text` and/or `icon` are used, the system will attempt to style those values to show the checked/unchecked state. Alternatively, if you
specify pairs of values using `uncheckedtext` and `checkedtext` or `uncheckedicon` and `checkedicon` then the system will use those values to
show the unchecked/checked state.

To reference an icon, use the name from the Material Design icons set (all lower case, with underscores between words, such as "camera_alt").
