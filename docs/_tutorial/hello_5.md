---
title: 'Hello 5: View with value conversion'
---

It is sometimes the case that we want to build responsive Views that require more than just binding attributes directly to ViewModel data
elements.  In these cases, we can employ an advanced binding syntax using _eval()_.  The _eval_ contents must be valid JavaScript code,
and typically also contain binding tokens that correspond to ViewModel data elements.  Because the _eval_ code converts ViewModel data
(optionally in combination) into View attribute values, we refer to this technique as "value conversion".

In the example below, we have divided the user name into two fields.  The Hello text will show the uppercase concatenation of the two
fields.  And the Submit button will only be enabled if BOTH fields contain a value.

__Module: hello5.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello5.js)__

<pre><code>
exports.InitializeViewModel = function(context, session) {
    return {
        <span class="mark">firstName: "Jane",</span>
        <span class="mark">lastName: "Smith",</span>
    }
}

exports.View =
{
    title: "Hello World",
    elements:
    [
        <span class="mark">{ control: "edit", binding: "firstName", placeholder: "first name" },</span>
        <span class="mark">{ control: "edit", binding: "lastName", placeholder: "last name" },</span>
        { control: "text", value: "<span class="mark">eval('Hello ' + ({firstName} + ' ' + {lastName}).toUpperCase())</span>" },
        { control: "button", caption: "Submit", binding: "onSubmit", enabled: "<span class="mark">eval({firstName} && {lastName})</span>" },
    ]
}

exports.Commands =
{
    onSubmit: function(context, session, viewModel)
    {
        Synchro.showMessage(context, { 
            title: "Hello World", 
            message: "User name: " + <span class="mark">viewModel.firstName + " " + viewModel.lastName</span> 
        });
    }
}
</code></pre>

This module will appear as below on mobile devices (the Welcome text and "Submit" button state will reflect to contents of the first and last
name fields, in real-time): 

![Hello 5]({{ site.baseurl }}/assets/img/hello5.png)

__Security note__: The _eval()_ code is executed in a secure sandbox on the client, such that the code has no access to any data or state
in the client environment and can only impact the View attribute which contains it (and cannot, for example, impact the ViewModel).  One
implication of this is that no user-provided data can ever be evaluated as JavaScript (so injection attacks are not possible).  

__Next - [Hello 6: Complex view with container controls](hello-6)__
