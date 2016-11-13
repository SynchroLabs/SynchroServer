---
title: WrapPanel Control
description: A container control that flows contents either vertically or horizontally, and wraps overflowing content onto the next row/column
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `orientation` - [Horizontal], Vertical
* `itemHeight` - optional
* `itemWidth` - optional

## Example:

    { control: "wrappanel", orientation: "Horizontal", contents: [
        { control: "button", caption: "Login", width: 125, binding: "login" },
        { control: "button", caption: "Cancel", width: 125, binding: "cancel" },
    ] },
