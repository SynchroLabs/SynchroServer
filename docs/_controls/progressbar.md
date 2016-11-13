---
title: ProgressBar Control
description: The ProgressBar control shows percent completion of a task
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)
* `minimum` - Defaults to 0.0
* `maximum` - Defaults to 1.0

## Bindings:

* `value`

## Example:

    { control: "progressbar", minimum: 0, maximum: 100, binding: "theValue", width: 300 },
