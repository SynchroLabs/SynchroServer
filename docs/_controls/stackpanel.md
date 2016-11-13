---
title: StackPanel Control
description: A container control for organizing a set of container controls either horizontally or vertically
---

{{ page.description }}

## Overview:

The `stackpanel` control is a container control for organizing child controls in a linear layout on a single line. The `orientation` of that
linear layout can be either horizontal or vertical.

Child controls can align themselves perpendicular to the layout direction via their `horizontalAlignment` or `verticalAlignment` attributes. 
So, for example, in a vertical stackpanel, child controls can set the `horizontalAlignment` property to indicate how they should be aligned
horizontally.

## Attributes:

* [Common Control Attributes](common)
* `orientation` = [Vertical], Horizontal
* `padding` ([thickness](../general/thickness))
* `contents`

## Example:

    { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
        { control: "button", caption: "Login", width: 125, binding: "login" },
        { control: "button", caption: "Cancel", verticalAlignment: "Top", width: 125, binding: "cancel" },
    ] },

## Notes:

### Flexible Space Allocation

Any space remaining in the layout direction will be divided between any "star-sized" children based on their specified weight.

A dimension specified as `"*"` will have a weight of 1. If a quantity precedes the star size, then that quantity specifies the weight. For 
example, `"3*"` specifies a weight of 3. Each control gets a proportion of the space equal to the proportion of their specified weight to
the total of all specified weights.

In the example below, the text control width will be computed, then any remaining width available in the stackpanel with be divided
between the edit control and the rectangle, with the edit control receiving 1/4 of that space, and the rectangle receiving 3/4.

    { control: "stackpanel", width: "480", height: "*", orientation: "Horizontal", contents: [
        { control: "text", value: "Caption" },
        { control: "edit", binding: "userName", width: "*" },
        { control: "rectangle", fill: "Green", width: "3*", height: "25" }, 
    ] }

### Alignment

Controls in a `stackpanel` will always be aligned with the start of the stackpanel in the orientation direction. That is to say that in a
vertical stackpanel, child controls will start at the top, and in a horizontal stackpanel, child controls will start at the left. If you
would like to add space before, between, or after the stackpanel contents, there are a couple of ways to do that.

If you simply want to align the controls as a group, you can surround your stackpanel with a `border` control and then align the child
stackpanel within the border. If you want more flexibility, you can instead add "spacer" elements around your stackpanel contents (such
as `rectangle` controls with no `fill` color set) and you can even use star sizing on those controls to get flexible spacing.

Items in a `stackpanel` may be aligned in the opposite dimension of the `stackpanel` orientation.  For example, in a vertical `stackpanel`,
each item may be horizontally aligned Left, Center, or Right (via the `horizontalAlignment` attribute), or might have a `width` set to `"*"` to
indicate that it should stretch to fill the panel horizontally.
