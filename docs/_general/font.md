---
title: Font Specification
weight: 15
---

# Supported attributes

* `face` = Mono, Serif, SanSerif
* `size` = float (typographic points)
* `bold` = true/false
* `italic` = true/false

```
font: { face: "Serif", size: 12, bold: true, italic: false }
```

Note: If no "face" value is provided, the font face will be the default face for the control/element (which will vary by control/element
type and by platform, and is usually what you want).

The `fontsize` attribute is supported as convenience to any element that can contain a font specification (since it is common to specify only
the size). The following are equivalent:

    { control: "text", value: "Hello", font: { size: 12 } )
    { control: "text", value: "Hello", fontsize: 12 }
