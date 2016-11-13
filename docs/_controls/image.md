---
title: Image Control
description: A control to display and image resource 
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `scale` - one of Stretch, [Fit], or Fill
* `resource` - A URL reference to the image location

If only one dimension of an image control specification is provided, the other dimension will be set based on the aspect ratio of the
image at such time as the image is loaded, such that the resulting image control exactly contains the image.

If both dimentions are set in the image control specification, then the `scale` will be used to determine how to fit the image into the defined shape.

## Bindings:

* `onTap` (command + params)

## Example:

    { control: "image", height: 300, width: 300, resource: "{image}" },
