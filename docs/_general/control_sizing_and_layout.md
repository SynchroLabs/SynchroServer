---
title: Control Sizing and Layout
weight: 13
---

Every control is contained in a parent control and arranged by that parent control based on attributes of the contained child
controls.  The following describes how controls are positioned within their parent controls.  

The container controls in Synchro include: [Border](../controls/border), [Canvas](../controls/canvas), [ListView (itemTemplate)](../controls/listview),
[ScrollView](../controls/scrollview), [StackPanel](../controls/stackpanel), and [WrapPanel](../controls/wrappanel).

_Note on the page level container:_

Each page has a top-level container that is sized based on the available page size automatically.  If your page definition contains multiple
top-level controls, then the page container will be a vertical stackpanel created by Synchro to organize those controls.  If your page definition
contains a single top-level control, then that control will be the page container.

# Size

Every control has a size, as specified in its `height` and `width` attributes.

* If a dimension is unspecified, the control will size to the minimum size possible to contain its contents ("wrap contents" sizing), whether that contents is its own intrinsic contents, such as the text in a text control, or that contents consists of other controls, such as the child controls in a stack panel.
* If a dimension is specified as a numeric value, it will represent absolute Synchro units - see [Coordinate System and Layout](coordinate-system-and-layout).
* If a dimension is star ("*"), then the control will expand to fill its container ("fill parent" sizing).

Note: A "star-sized" dimension will not cause a parent container to expand to accommodate content that could grow larger than the size the parent
would otherwise be; it will only allocate an amount of space (limited to the size of the parent) that the child can use. This is true even if the
parent size is unspecified ("wrap content").  A "fill parent" (star-size) child will not cause a "wrap content" parent to grow to contain it.

# Alignment

Controls are aligned to their parents via these attributes:

* `horizontalAlginment`: Left, Center, Right - default: Left
* `verticalAlignment`: Top, Center, Bottom - default: Top

Note: A star-size (fill parent) height/width can be considered the equivalent of a "stretch" alignment

# Margins

Every control may have margins (in all four directions) as specified in the `margin` attribute and configured as a [thickness](thickness).  For example:

    { control: "text", value: "Hello", margin: 10 }
    { control: "text", value: "Hello", margin: { top: 5, left: 10, bottom: 5, right: 10 }

By default, container controls have no margin, and non-container controls have a margin of 5 Synchro units in all directions.  You may override
the margin in certain specified directions as desired:

    { control: "text", value: "Hello", margin: { left: 0 }

# Exceptions

The Canvas control positions explicitly sized items relative to its origin, and thus ignores any alignment or margins.  The ScrollView contains
only a single item (the item to be scrolled), and also ignores alignment and margins by design.  Other container control types may have different
or additional positioning behaviors - see the documentation for the container control in question for details.