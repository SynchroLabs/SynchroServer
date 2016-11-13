---
title: Canvas Control
description: The canvas control is a container that holds one or more controls, which can be positioned relative to the canvas itself 
---

{{ page.description }}

Most notably, controls in a canvas container can be made to overlap.

The Canvas control contains any number of child controls, which are positioned absolutely via `top` and `left` attributes on such contained
child controls. This kind of layout is very easy to abuse and care should be take to use it only when necessary and/or when you will be
handling any flexible layout issues in code.

## Attributes:

* [Common Control Attributes](common)
* `contents`

## Example:

    { type: "canvas", contents: [
        { type: "text", value: "Somevalue", top: 10, left: 25 },
        { type: "text", value: "Othervalue", top: 20, left: 5 },
    ] };
