---
title: 'Hello 7: View with shared styles'
---

While you can specify every layout attribute of every View control explicitly, it is often useful to define a set of attributes centrally
(in the ViewModel) and have View elements refer to those attributes.  Not only does this technique require less code, but it makes it easy
to maintain consistency between related controls in a View (for example, if several controls have the same styling or the same width, you
can make a change in one place to control all of them).

For details on this mechanism, see: [View Styles](../general/view-styles).  A more advanced version of this functionality, including the 
ability to apply styles to control types automatically (without a `style` attribute) and to filter styles based on client characteristics, 
see the [View Style Helper](../general/view-style-helper) documentation.

Below we have added some more styling (including font sizes and text alignment), and we have centralized the styles in the ViewModel and
referred to them using the `style` attribute of the relevant controls.

__Module: hello7.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello7.js)__

    exports.InitializeViewModel = function(context, session) {
        return {
            firstName: "Jane",
            lastName: "Smith",
            textStyle: { fontsize: 12, verticalAlignment: "Center" },
            labelStyle: { width: 200, textAlignment: "Right" },
            editStyle: { width: 240 }
        }
    }

    exports.View =
    {
        title: "Hello World 7",
        elements:
        [
            { control: "text", value: "Enter your name:", font: { size: "{textStyle.fontsize}", bold: true } },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "First name:", style: "textStyle, labelStyle" },
                { control: "edit", binding: "firstName", style: "textStyle, editStyle" },
            ] },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "Last name:", style: "textStyle, labelStyle" },
                { control: "edit", binding: "lastName", style: "textStyle, editStyle" },
            ] },
            { control: "text", value: "eval('Hello ' + ({firstName} + ' ' + {lastName}).toUpperCase())", style: "textStyle" },
            { control: "button", caption: "Submit", binding: "onSubmit", enabled: "eval({firstName} && {lastName})" },
        ]
    }

    exports.Commands =
    {
        onSubmit: function(context, session, viewModel)
        {
            Synchro.showMessage(context, { 
                title: "Hello World", 
                message: "User name: " + viewModel.firstName + " " + viewModel.lastName 
            });
        }
    }

![Hello 7]({{ site.baseurl }}/assets/img/hello7.png)

__Next - [List 1: List view from static array](list-1)__