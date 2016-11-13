---
title: Password Control
description: A standard text editing control that does not disclose values entered into the control
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `font` ([font](../general/font))
* `placeholder`

## Bindings:

* `value`

## Example:

```
{ control: "password", binding: "userpass", width: 200 },
```

```
{ control: "password", binding: { value: "userpass" }, placeholder: "enter password", width: 200 },
```
