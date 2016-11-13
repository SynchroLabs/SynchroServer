---
title: 'iOS: NavBar and ToolBar Controls'
description: iOS NavBar and ToolBar Controls
slug: ios-navbar-toolbar
---

{{ page.description }}

For more information about iOS toolbars and navigation bars, see: [iOS Human Interface Guidelines - Bars](https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/Bars.html#//apple_ref/doc/uid/TP40006556-CH12-SW33).

For a list of the icons bundled with Synchro (which can be used in the icon attribute of any controls below), see: 
[Material Design icons](https://design.google.com/icons/) set. To reference an icon, use the name from the Material Design icons set
(all lower case, with underscores between words, such as "camera_alt").

----

# navBar.button and toolBar.button

## Overview:

The `navBar.button` control represents an iOS NavBar button.  You will generally have at most one such button, which will be positioned at
the right of the navigation bar.

The `toolBar.button` control represents an iOS ToolBar button.

## Attributes:

* [Common Control Attributes](common)
* `systemItem`
* `text`
* `icon`

## Bindings:

* `onClick` (command + params)

## Notes:

If systemItem is used, you may specify any of the system defined buttons, including: Action, Add, Bookmarks, Camera, Cancel, Compose, 
Done, Edit, FastForward, FixedSpace, FlexibleSpace, Organize, PageCurl, Pause, Play, Redo, Refresh, Reply, Rewind, Save, Search, Stop,
Trash, and Undo.

Alternatively, you may specify text and/or an icon to make a custom button.

## Example:

    { control: "navBar.button", systemItem: "Camera", binding: "doOnClick" }

----

# navBar.toggle and toolBar.toggle

## Overview:

The `navBar.toggle` control represents an iOS NavBar toggle button.  You will generally have at most one such button, which will be positioned
at the right of the navigation bar.

The `toolBar.toggle` control represents an iOS ToolBar button.

## Attributes:

* [Common Control Attributes](common)
* `text`
* `icon`
* `uncheckedtext`
* `checkedtext`
* `uncheckedicon`
* `checkedicon`

## Bindings:

* `value`
* `onToggle` (command + params)

## Notes:

If text and/or icon are used, the system will attempt to style those values to show the checked/unchecked state. Alternatively, if you
specify pairs of values using uncheckedtext and checkedtext or uncheckedicon and checkedicon then the system will use those values to
show the unchecked/checked state.

## Example:

    { control: "navBar.toggle", checkedicon: "star-mini", uncheckedicon: "star-empty-mini", 
      binding: { value: "fav", onToggle: "favToggled" } }
