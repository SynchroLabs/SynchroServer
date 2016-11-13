---
title: Thickness Specification
weight: 14
---

A thickness attribute can contain a single value to represent a desired thickness in units. Alternatively, it can specify one or more
specific thickness attributes:

* `top`
* `left`
* `bottom`
* `right`

For example, a border with a thickness of 5 units in all dimensions could be specified as `border: 5`, but could also be specified as 
`border: { top: 5, left: 5, bottom: 5, right: 5 }`. And of course, in the latter model, different values can be provided for each sub-attribute.