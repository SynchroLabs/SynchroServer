---
title: Edit Control
description: A standard text editing control
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `font` ([font](../general/font))
* `lines`
* `multiline`
* `placeholder`

## Bindings:

* `value`
* `sync` (value: "change")

Notes:

`multiline` is a boolean value to indicate whether the edit control should allow multiple lines (and accept the return character). If set,
you may also specify a numeric value in the `lines` attribute to indicate how tall the control should be in lines of text. If a `height` attribute
is set, that will override the `lines` setting for height.

If the `sync` attribute has the value "change", then any change to the edit control will by synchronized to the server. This is useful for
things like autocompletion.

## Example:

```
{ control: "edit", binding: "username", width: 200 },
```

```
{ control: "edit", binding: { value: "username", sync: "change" }, placeholder: "enter user name", width: 200 },
```
