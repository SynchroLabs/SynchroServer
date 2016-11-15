---
title: 'Hello 3: View dynamically updated from ViewModel'
---

In the previous example we saw View elements populated with data from the ViewModel data object.  It is also possible for View elements to
set data in the ViewModel data object.

In the module below, we have added an edit control to the View that is bound to the userName value of the ViewModel.  That means that the
edit control will be initially populated with the value of the userName from the ViewModel.  And it also means that when the content of the
edit control changes, it will be immediately reflected in the userName field of the ViewModel data object (and any other View elements bound
to that item will thus be updated in real-time).  In the example below, as you change the contents of the edit control, you will see the
Hello message updated in real-time.

The other concept demonstrated below is that any View control attribute may be bound to any ViewModel data element, with appropriate
conversion performed automatically.  The visibility attribute of the text control is bound to the userName, such that if the userName
is empty, the text field will be invisible, otherwise it will be visible.  

Both of these techniques demonstrate that it is possible to write responsive interfaces that do not require procedural code (or communication
between client and server). 

__Module: hello3.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello3.js)__

<pre><code>
exports.InitializeViewModel = function(context, session)
{
    return {
        userName: "Jane Smith"
    };
}

exports.View = {
    title: "Hello World 3",
    elements: [
        <span class="mark">{ control: "edit", binding: "userName", placeholder: "enter name" },</span>
        { control: "text", value: "Hello {userName}", <span class="mark">visibility: "{userName}"</span> }
    ]
};
</code></pre>

This module will look like this on mobile client (and will update in real-time as the the user name is edited): 

![Hello 3]({{ site.baseurl }}/assets/img/hello3.png)

__Next - [Hello 4: View that executes a command](hello-4)__ 