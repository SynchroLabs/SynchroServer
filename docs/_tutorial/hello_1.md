---
title: 'Hello 1: Static View'
---

The simplest possible Synchro app module does nothing more than serve a static View, as shown below.  The Synchro client app (native or web)
will request a View from the Synchro Server, which will call the appropriate Synchro app module to provide the View object.  The client then
renders the View as appropriate for the client environment, using native themes and controls.

It is possible to provide detailed styling to View elements to override the native themes and native control style, but by default, the view
will have a native look and feel.

If you want to get an idea of the controls supported in Synchro Views, check out our [Controls](../controls) documentation.

__Module: hello1.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello1.js)__

<pre><code>
exports.View =
{
    title: "Hello World 1",
    elements:
    [
        { control: "text", value: "Hello World" },
    ]
}
</code></pre>

The View above would be rendered on native mobile clients like this: 

![Hello 1]({{ site.baseurl }}/assets/img/hello1.png)

__Next - [Hello 2: View populated from ViewModel](hello-2)__ 