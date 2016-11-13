---
title: ScrollView Control
description: A container that holds a single control and scrolls that control within the area of the scroll control
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `orientation` = [Vertical], Horizontal
* `contents`

## Example:

    { control: "scrollview", orientation: "Horizontal", height: 150, width: 150, contents: [
        { control: "image", height: 300, width: 300, resource: "{image}" },
    ] },
