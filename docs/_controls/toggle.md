---
title: Toggle Control
description: An on/off toggle control
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `caption`
* `font` ([font](../general/font))
* `onLabel` (Windows/Android only)
* `offLabel` (Windows/Android only)

## Bindings:

* `value`
* `onToggle` (command + params)

## Example:

```
{ control: "toggle", caption: "Is On", binding: "isSwitchOn" }
```

```
{ control: "toggle", caption: "Is On", binding: { value: "isSwitchOn", onToggle: "wasToggled" } }
```
