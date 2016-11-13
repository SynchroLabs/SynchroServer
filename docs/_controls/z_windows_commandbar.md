---
title: 'Windows: CommandBar Controlss'
description: Windows CommandBar Controls
slug: windows-commandbar
---

{{ page.description }}

----

# commandBar.button

## Overview:

The commandBar.button control represents a Windows CommandBar button.

## Attributes:

* [Common Control Attributes](common)
* `text`
* `winIcon` - from Segoe UI Symbol Font
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `commandBar` - Top, [Bottom] (Top not supported on WinPhone)
* `commandType` - [Primary], Secondary

## Bindings:

* `onClick` (command + params)

## Example:

    { control: "commandBar.button", text: "Add", icon: "Add", commandBar: "Bottom", commandType: "Secondary", binding: { command: "vary", amount: 1 } }
 
----

# commandBar.toggle

## Overview:

The commandBar.toggle control represents a Windows CommandBar button that can be toggled on and off.

## Attributes:

* [Common Control Attributes](common)
* `text`
* `winIcon` - from Segoe UI Symbol Font
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `commandType` - [Primary], Secondary

## Bindings:

* `value`
* `onToggle` (command + params)

## Example:

    { control: "commandBar.toggle", text: "Favorite", winIcon: "Favorite", binding: { value: "toggleState", onToggle: "onToggle" } }

