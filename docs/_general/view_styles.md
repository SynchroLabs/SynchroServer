---
title: View Styles
weight: 10
---

View styles provide a way to separate the specification of some or all attributes of a View control from the control definition. This can
be useful in a number of ways, including separating layout/style from content, and sharing styling across multiple controls.

# Control Attributes

Each control in a View definition has a series of attributes that may be used to specify the look, feel, and function of the control.
Consider the example below:

    { control: "text", value: "Hello", fontsize: 12, color: "Blue" }

# Control Attributes using Data Binding

It is often useful to take advantage of data binding to populate the value of a control attribute from your ViewModel.  For example:

    { control: "text", value: "{message}", fontsize: 12, color: "Blue" }

Where your ViewModel contains:

    {
        message: "Hello"
    }

One of the benefits of the data binding approach is that whenever the bound value in the ViewModel changes, the control value is
automatically updated.

For more information, see [Data Binding](data-binding).

# Styles

By using styles (via the "style" attribute), it is possible to define a ViewModel object containing multiple attribute values and
to direct a control to refer to that set of values when populating its attributes.  For example:

    { control: "text", style: "textStyle" }

Where your ViewModel contains:

    {
        textStyle: { value: "Hello", fontsize: 12, color: "Blue" }
    }

In this example, the control will look for an object called textStyle in the ViewModel, and will then look inside of textStyle for
values corresponding to the name of each of the control's attributes.

It should be noted that when a control uses an attribute value found in a style definition, it actually binds to that value (such
that any subsequent changes to the value in the style will be reflected in the control automatically).  Using the style textStyle
as above is equivalent to doing:

    { 
        control: "text",
        value: "{textStyle.value}", fontsize: "{textStyle.fontsize}", color: "{textStyle.color}" 
    }

In fact it would do the equivalent of that binding for every attribute supported by the text control for which a cooresponding value
specification was present in the style definition.

# Multiple Styles

Multiple styles can be indicated by separating them with commas.  If multiple styles are specified, the control will look for the
style value corresponding to each of its attributes individually, starting with the first listed style and continuing with subsequent
styles, until it finds one with a value corresponding the the specific attribute.

A common use of multiple styles is to have one style that applies to all controls of a particular type, and then individual styles
specific to each control.  Following is an example of using multiple styles in this way.

    { control: "text", style: "labelStyle, textStyle" },
    { control: "text", style: "nameStyle, textStyle" }

Where the ViewModel contains:

    {
        textStyle: { fontsize: 12, color: "Blue" },
        labelStyle: { value: "Hello" },
        nameStyle: { value: "Mr. Smith", font: { bold: true } }
    }

Here both controls will use a font size of 12 and a color of blue. The label control will have a value of "Hello", and the name
control will have a value of "Mr. Smith" and will be bold.

# Combining Attribute Definition Approaches

It is possible (and common) to combine the use of styles, data bound attribute values, and static attribute values.  Consider the
following example:

    { control: "text", style: "textStyle", value: "Hello" },
    { control: "text", style: "nameStyle, textStyle", value: "{name}" }

Where the ViewModel contains:

    {
        // Styles
        textStyle: { fontsize: 12, color: "Blue" },
        nameStyle: { font: { bold: true } },
        // Data
        name: "Mr. Smith"
    }

It should be noted that an explicit attribute value will override any value specified in a style.

In this example, both text controls will have the same font size and color values, as specified in the style textStyle.  The name
control will also be bold, as specified in the style nameStyle.  The first control has the value attribute specified explicitly as
the static value "Hello", whereas the second control value is specified explicitly as being bound to the "name" value from the ViewModel. 

# View Style Helper Module

There is a convenience module to help in implementing styles application-wide.  For more information, see [View Style Helper](view-style-helper).
