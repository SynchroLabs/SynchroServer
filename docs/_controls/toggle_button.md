---
title: Toggle Button Control
description: An on/off toggle control implemented as a button
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `caption` - Button caption text
* `checkedcaption` - Button caption text (when checked)
* `uncheckedcaption` - Button caption text (when unchecked)
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `checkedicon` - Button icon name (when checked)
* `uncheckedicon` - Button icon name (when unchecked)
* `color` ([color](../general/color)) - Caption font color
* `checkedcolor` ([color](../general/color)) - Caption font color (when checked)
* `uncheckedcolor` ([color](../general/color)) - Caption font color (when unchecked)
* `borderless` - boolean, if true, button will have no border or background (defaults to true)

## Bindings:

* `value` - boolean - the "checked" state
* `onToggle` (command + params)

## Example:

```
{ control: "togglebutton", icon: "thump_up", caption: "Like", borderless: true, binding: "doesLike" },
```

```
{ control: "togglebutton", checkedicon: "thumb_up", uncheckedicon: "thumb_down", caption: "Like", binding: { value: "doesLike", onToggle: "likeToggled" } }
```

## Notes

To reference an icon, use the name from the Material Design icons set (all lower case, with underscores between words, such as "camera_alt").

You may specify a static caption, icon, or color (that doesn't change based on the checked state of the toggle button).  Alternatively, you may
specify the checked AND unchecked values for any or all of these items, where the toggle button will update its visual state based on those values.

Note that if you do not specify any checked/unchecked visual state attributes, the toggle button will be shown in the specified (or default)
color when checked, or in gray with unchecked (modelled after the Facebook "Like" button).
