---
title: Color Specification
weight: 16
---

A color specification can contain the name of a CSS SilverLight color, as detailed here:

* <http://www.w3schools.com/colors/colors_names.asp>

These color definitions are the same as the Microsoft XAML/SilverLight colors, as detailed here:

* <http://msdn.microsoft.com/en-us/library/system.windows.media.colors(v=vs.110).aspx>

Note that the special name `"Transparent"` from the Microsoft color definitions is supported (though rarely needed).

Alternatively, a color specification can define a color explicitly by prefixing a hexadecimal definition in the form AARRGGBB or RRGGBB with #.

For example, the following will all result in the same color:

    { control: "rectangle", height: "*", width: "*", fill: "CornflowerBlue" }
    { control: "rectangle", height: "*", width: "*", fill: "#FF6495ED" }
    { control: "rectangle", height: "*", width: "*", fill: "#6495ED" }
