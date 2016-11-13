---
title: Button Control
description: A standard button control
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `caption` - Button caption text
* `icon` - Button icon name from [Material Design icons](https://design.google.com/icons/) set
* `borderless` - boolean, if true, button will have no border or background (defaults to false)
* `color` ([color](../general/color)) - Caption font color
* `resource` - A URL reference to the image location

## Bindings:

* `onClick` (command + params)

## Examples:

```
{ control: "button", caption: "Login", width: 125, binding: "login" },
```

```
{ control: "button", caption: "Login", width: 125, binding: { command: "login", param: "foo" } },
```

```
{ control: "button", icon: "thump_up", caption: "Like", borderless: true, binding: "setLike" },
```

## Notes:

Either a combination of `icon` and/or `caption` (for a text button) or `resource` (for an image button) may be specified, but not both.

To reference an icon, use the name from the Material Design icons set (all lower case, with underscores between words, such as "camera_alt").
