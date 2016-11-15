---
title: 'Hello 4: View that executes a command'
---

View controls may be configured to trigger a "command" in their corresponding Synchro module.  The kind of action that may be configured
to trigger a command varies based on the control, and can be anything from a button being pushed, to a text control be edited, to location
services being detected.

In the example below, when the button is pushed, the _onSubmit_ command will be called.  The actual implementation of the command runs in the
context of the Synchro app module on the Synchro Server.  The viewModel passed to the command will always reflect the current state of the
ViewModel on the client.

Note that we have also bound the _enabled_ attribute of the button to the _userName_, such that the button will only be enabled when the
_userName_ has a value.

__Module: hello4.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello4.js)__

<pre><code>
exports.InitializeViewModel = function(context, session)
{
    return {
        userName: "Jane Smith"
    };
}

exports.View = {
    title: "Hello World 4",
    elements: [
        { control: "edit", binding: "userName", placeholder: "enter name" },
        { control: "text", value: "Hello {userName}", visibility: "{userName}" },
        <span class="mark">{ control: "button", caption: "Submit", binding: "onSubmit", enabled: "{userName}" }</span>
    ]
};

<span class="mark">exports.Commands =
{
    onSubmit: function(context, session, viewModel)
    {
        Synchro.showMessage(context, {
            title: "Hello World",
            message: "User name: " + viewModel.userName
        });
    }
}</span>
</code></pre>

The module will look like this on mobile client (the Hello message and "Submit" button state will reflect the contents of the user name
in real-time): 

![Hello 4]({{ site.baseurl }}/assets/img/hello4.png)

When the "Submit" button is clicked, you will see a platform-specific form of message box, as below:

![Hello 4a]({{ site.baseurl }}/assets/img/hello4a.png)

__Next - [Hello 5: View with value conversion](hello-5)__