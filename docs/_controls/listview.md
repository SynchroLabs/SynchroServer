---
title: ListView Control
description: A control to display, and potentially allow interaction with, a list of view items (items that are themselves composed of one or more controls)
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `select` - None, [Single], Multiple

## Binding

* `items` - the array of elements in the list.
* `itemTemplate` - layout specification for each item (must be a single element, though that element can be a container that contains other
  layout elements).
* `selection` - the location in the view model where the current selection is maintained. If select is Single, then the location referred to by
  selection should contain a single item. If select is Multiple, then the location referred to by selection should contain an array of zero or more items.
* `selectionItem` (defaults to $data) - This is what is placed into "selection" (per item) and this is applied to each item in "items" for the
  purpose of matching items with selection items when setting selection state for the control. For example, if the selectionItem was "{itemId}", 
  then the selection binding would be one or more elements of the "{itemId}" applied to the selected items. When resetting item selection, "{itemId}"
  will be applied to each list item, and the result will be compared with the value(s) in "selection" to see if the item should be selected. In the
  case of the default, the selection list will contain deep copies of the list view items, and the selection comparison will be a deep compare of
  those items with the list view items.

## Commands

If select is __None__: `onItemClick` command - context is the item clicked

If select is __Single__: `onSelectionChange` command - context is the item that is now selected

If select is __Multiple__: `onSelectionChange` command - context is the listbox/listview context (not item-specific)

## Example:

```
{ control: "listview", select: "Single", width: "*", binding: "people", itemTemplate:
    { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 5, contents: [
        { control: "image", resource: imgUser, height: 50, width: 50, verticalAlignment: "Center" },
        { control: "stackpanel", orientation: "Vertical", contents: [
            { control: "text", value: "{first}" },
            { control: "text", value: "{last}" },
        ] },
    ] },
}
```

```
{ control: "listview", select: "None", width: "*", 
   binding: { items: "people", onItemClick: { command: "onSelected", person: "{$data}" } }, 
   itemTemplate:
    { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 5, contents: [
        { control: "image", resource: imgUser, height: 50, width: 50, verticalAlignment: "Center" },
        { control: "stackpanel", orientation: "Vertical", contents: [
            { control: "text", value: "{first}" },
            { control: "text", value: "{last}" },
        ] },
    ] },
}
```
