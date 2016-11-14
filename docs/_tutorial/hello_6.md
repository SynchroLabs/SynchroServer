---
title: 'Hello 6: Complex view with container controls'
---

Up to this point, our View specifications have just been simple lists of controls with no layout information or styling.  When you build
real-world applications, you will arrange your controls in containers and indicate layout constraints (including sizing, alignment, margins, etc).

See the [Control Sizing and Layout](../general/control-sizing-and-layout) and [Coordinate System and Layout](../general/coordinate-system-and-layout)
documentation for more information on these topics.

Below we use `stackpanel` container controls along with new `text` captions, and use layout constraints on the `text` and `edit` controls, to make
what is essentially a table style layout.  With Synchro, it is possible to make complex layouts that are still platform-independent and responsive. 

__Module: hello6.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello6.js)__

    exports.InitializeViewModel = function(context, session) {
        return {
            firstName: "Jane",
            lastName: "Smith",
        }
    }

    exports.View =
    {
        title: "Hello World 6",
        elements:
        [
            { control: "text", value: "Enter your name:", font: { bold: true } },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "First name:", verticalAlignment: "Center", width: 200 },
                { control: "edit", binding: "firstName", verticalAlignment: "Center", width: 240 },
            ] },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "Last name:", verticalAlignment: "Center", width: 200 },
                { control: "edit", binding: "lastName", verticalAlignment: "Center", width: 240 },
            ] },
            { control: "text", value: "eval('Hello ' + ({firstName} + ' ' + {lastName}).toUpperCase())" },
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

![Hello 6]({{ site.baseurl }}/assets/img/hello6.png)

__Next - [Hello 7: View with shared styles](hello-7)__