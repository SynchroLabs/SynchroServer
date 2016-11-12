---
title: Border Control
description: The border control is a container that holds a single control and displays a visible border around it
---

{{ page.description }}

# Attributes:

* [Common Control Attributes](common)
* `border` (color)
* `borderThickness` (thickness)
* `cornerRadius`
* `padding` (thickness)
* `background` (color)
* `contents`

# Bindings:

* `onTap` (command + params)

# Example:

    { control: "border", border: "Red", borderThickness: 10, cornerRadius: 5, padding: 10, background: "Blue", contents: [
        { control: "rectangle", width: "{content}", height: "{content}", fill: "Green" },
    ] }

# Note:

The child of a border control can align itself within the border via the child control's `horizontalAlignment` or `verticalAlignment` attributes.
