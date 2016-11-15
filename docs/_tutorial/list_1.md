---
title: 'List 1: List view from static array'
---

The [listview](../controls/listview) control is one of several controls (including [listbox](../controls/listbox) and [picker](../controls/picker))
that operate on a JavaScript array in the ViewModel.  The listview iterates the array to which it is bound, and creates a list element with
a corresponding view item container for each item in the underlying array.  The "context" of the view for each item is the corresponding
array member.  For more details, see the "Binding Context" discussion in [Data Binding](../general/data-binding).

In the example below, we have bound a `listview` in the View to the "people" array in the ViewModel.  The `itemTemplate` defines the view for
each item in the list.

Note that there is an `image` control in our item view, which we populate using the value from the `Synchro.getResourceUrl` helper function.  For
more information, see: [Static Resources](../general/static-resources).

__Module: list1.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/list1.js)__

<pre><code>
var imgUser = Synchro.getResourceUrl("user.png");

exports.InitializeViewModel = function(context, session, params, state)
{
    return {
        people: [
             { first: "Betsy", last: "Braddock" }, 
             { first: "Steven", last: "Rogers" }, 
             { first: "Natasha", last: "Romanoff" }, 
             { first: "Tony", last: "Stark" }, 
             { first: "Wade", last: "Wilson" }, 
        ],
    }
}

exports.View =
{
    title: "List 1",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
            { control: "listview", select: "Single", width: "*", binding: "people", itemTemplate:
                { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 5, contents: [
                    { control: "image", resource: imgUser, height: 50, width: 50, verticalAlignment: "Center" },
                    { control: "stackpanel", orientation: "Vertical", contents: [
                        { control: "text", value: "{first}" },
                        { control: "text", value: "{last}" },
                    ] },
                ] },
            },
        ] },
    ]
}
</code></pre>

This module will appear as below: 

![List 1]({{ site.baseurl }}/assets/img/list1.png)

__Next - [List 2: List view loaded asynchronously](list-2)__