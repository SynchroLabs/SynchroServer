---
title: Data Binding
weight: 4
---

# What is data binding?

Data binding is the mechanism that allows user interface elements in a "View" to be linked directly to data and/or commands in a "View Model".

Consider the following View and View Model:

View:

    { control: "stackpanel", orientation: "Horizontal", contents: [
        { control: "text", value: "First name:" },
        { control: "edit", binding: "firstName" }, // << Edit control bound to firstName
    ] },
    { control: "stackpanel", orientation: "Horizontal", contents: [
        { control: "text", value: "Last name:" },
        { control: "edit", binding: "lastName" }, // << Edit control bound to lastName
    ] },
    { control: "text", value: "Welcome {firstName} {lastName}" }, // << Text composed from bound values

View Model:

    viewModel =
    {
        firstName: "John",
        lastName: "Smith",
    }

In this example, edit controls for first and last name will be pre-populated with the values "John" and "Smith" respectively, and the
welcome string will be set to "Welcome John Smith". As the end user changes the value in either edit control, the associated value in
the view model will be updated in real time, and that will trigger the simultaneous update of the welcome string.

In Synchro, data binding is the only method that applications have to populate and interact with user interface elements, and for that
reason the Synchro data binding system is necessarily comprehensive (supporting literally every possible interaction).

# Types of data binding

## Value Binding

Value binding binds a control to a single data item in the view model (the view model data item "backs" the control).  For example, the
edit controls in the example above use value binding to bind themselves to the corresponding view model items.  This means those controls
are populated from the view model items when the view is initially rendered, and that the view model items backing the controls are updated
in real-time whenever the control contents change.

Value Binding:

* Can be used on certain elements
* Specified in the "binding" attribute
* Value binding (if any) is two-way, linked to a single data item in the view model

## Property Binding

Property binding is a way of populating an attribute of a control using one or more binding tokens that represent view model data items
(in addition to static text, if desired).  For example, the `text` control that displays the "Welcome" message in the example above uses
property binding to populate itself.

When using property binding, "binding tokens" are used to represent values from the view model.  These tokens are encapsulated in braces,
and can use path syntax to navigate the view model (see "Binding Paths" below).  They can also use format specifiers.

Propery Binding:

* Can be used in any attribute of any element
* Multiple bindings can be aggregated in an attribute
* One way (or one time using `^` notation)
* Can use format specifiers, for example `{screenSizeInches:F2}` (formats as a fixed point number with two decimal places).

For supported format specifiers, see: <http://msdn.microsoft.com/en-us/library/dwhawy9k(v=vs.110).aspx>

# Binding Paths

Accessing view model data in a binding specification uses a path syntax. Consider the view model below:

    viewModel = 
    {
        person: 
        {
            firstName: "John",
            lastName: "Smith"
        },
        colors: 
        [
            { name: "Red", value: "FF0000" },
            { name: "Green", value: "00FF00" },
            { name: "Blue", value: "0000FF" }
        ],
        answer: 42
    }

* To access a simple value, use the property name, for example: `answer`
* To access an object property, use dot notation, for example: `person.firstName`
* To access an array element, use square bracket notation with a numeric (0-based) index, for example: `colors[1]`
* These notations can be combined as required, for example: `colors[1].name`

# The Binding Context

Each user interface element has a "binding context", provided by its container or parent element, which specifies the item in the
view model on which its bindings will be based. At the top level, the binding context is the view model itself (as in the binding
paths examples above).

Generally, the binding context for a given element is passed on to any child or contained element. However, some container elements
modify the binding context passed their child or contained elements. For example, a list view element might create a binding context
for each item in the underlying bound array, and pass those binding contexts to each child element (so each list item element is bound
to a corresponding item in the array).

Elements can also alter their own binding context by using the `foreach` and/or `with` attribute in their binding specification. These binding
context operations are applied before any property or value binding is processed for the element.

The `foreach` binding attribute creates an instance of the element for each instance of the array referenced by foreach. For example, using
the View Model above:

    { control: "text", value: "Color: {name}", binding: { foreach: 'colors' } }

will yield three text controls, one for each color, each displaying the name of the color.

The `with` binding attribute selects a new context by applying the provided path to the current binding context. For example, using the view
model above:

    { control: "text", value: "Hello {firstName} {lastName}", binding: { with: 'person' } }

will yield a text control with a welcome value using the first and last name from the 'person' property of the view model. Since with
specified 'person', the binding context for the element was the person property, and the name values referenced are relative to that
binding context.

It is possible to used both `foreach` and `with` in a single binding specification, using the `foreach` to select the context to be iterated,
and then using `with` to further select properties of each iterated item to become the binding context.

# Special binding path tokens

It should be clear that each element has a binding context, and that that binding context can refer to any item anywhere in the view model.
It is sometimes necessary to refer to values relative to either the root binding context (the view model itself) or the current binding
context. The following special binding path tokens allow for this:

* `$root` - Selects the root of the view model.
* `$parent` - Selects the parent of the current binding context.
* `$data` - Selects the value of the current binding context.
* `$index` - Produces a numeric value representing the position (zero-based index) of an iterated binding context

# Advanced Property Binding

## Negation

Any binding token may be negated by preceding it with an exclamation point. For example: `visibility="{!isVisible}"`

## One-Time

Any binding token may be specify that its value should only be set upon initial rendering of the view, and not further updated, by preceding
it with a caret. For example: `value="{^firstName}"`

## Automatic Value Conversion

When an attribute consists of a single binding token, the value of that attribute will be converted from the value represented by the
token to the type required by the attribute if necessary.  A common example is to value bind an edit control to a view model data item,
then property bind the enabled attribute of a button using a token that refers to the same data item.

    { control: "edit", placeholder: "enter message", binding: "message"},
    { control: "button", caption: "Send", binding: "onSend", enabled: "{message}" }

In the example above, the "Send" button will only be enabled when the user has entered characters in the "message" edit control.

## Complex Data Conversion using JavaScript eval( )

When complex property binding is required that cannot be achieved using the above techniques, you may use JavaScript expressions
surrounded by eval( ).  When using eval, the entire attribute must be the eval (with no static text or tokens before or after the eval).
The contents of the eval may contain binding tokens.

Consider the case where you want to display a Twitter-style counter of the number of characters remaining available.  For that, you could
do something like:

    { control: "text", value: "eval('Characters remaining: ' + (140 - {text}.length))" }

Consider the case where you only want your "submit" button enabled if the user has entered text into both of two fields:

    { control: "button", caption: "Submit", enabled: "eval({subject}.length && {body}.length)" }

The JavaScript eval is performed on the client.  It is performed when the view is initially rendered, and also any time the underlying
value of any token contained in the eval is updated (providing optimal real-time updates).

It should be noted that the Synchro mobile clients do not actually use the JavaScript eval function internally.  They set up a JavaScript
context and use it to evaluate the code.  They also do not expand binding tokens into the code.  They replace those tokens with variable
references, and define those variables in the JavaScript context to contain the values to which they resolve.  This means, among other things,
that there is no exposure to code injection (for example, if a token expanded to some JavaScript code, that code would never be executed by
the Synchro eval mechanism).
