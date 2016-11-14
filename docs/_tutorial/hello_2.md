---
title: 'Hello 2: View populated from ViewModel'
---

Real-world Synchro app modules generally provide a ViewModel data object to back the View.  The View is populated from this ViewModel data object.

The View and ViewModel are linked together using [Data Binding](../general/data-binding).

The following code shows initialization of a simple ViewModel and shows a View populated from that ViewModel.

__Module: hello2.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello2.js)__

    exports.InitializeViewModel = function(context, session)
    {
        return {
            userName: "Jane Smith"
        };
    }

    exports.View = {
        title: "Hello World 2",
        elements: [
            { control: "text", value: "Hello {userName}" }
        ]
    };

As you can see below, the View is showing the data from the ViewModel. 

![Hello 2]({{ site.baseurl }}/assets/img/hello2.png)

__Next - [Hello 3: View dynamically updated from ViewModel](hello-3)__ 