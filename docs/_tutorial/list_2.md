---
title: 'List 2: List view loaded asynchronously'
---

In real-world apps, it is often the case that ViewModel data needs to be populated asynchronously (such as when loading data from a database,
or by calling a network API).  Synchro accommodates asynchronous processing in app code using a variety of mechanisms to allow an immediate
response, with optional interim responses, and then a final response, over time.  For details on the various types of asynchronous support
provided in Synchro (and used in this example), see: [Asynchronous Processing](../general/asynchronous-processing).

_Note_: The budget for composing a response to any Synchro app function is 25ms.  If the process cannot be completed in that amount of time,
then asynchronous techniques should be employed. 

The asynchronous technique demonstrated below is called "delayed ViewModel initialization".  With this technique, the response to 
`InitializeViewModel` is returned immediately, and then since `LoadViewModel` is present, that function will automatically be called
so that the asynchronous loading of the ViewModel may continue/complete.

It is common to employ a value in the ViewModel to indicate to the View that it is in a "loading" state.  Below, we use the `isLoading`
member of the ViewModel for that purpose, and we use two sets of controls whose visibility is bound to that value to show the "loading"
and "loaded" states. 

The call to `Synchro.yieldAwaitable` is just a mechanism to generate a delay before we load the ViewModel.  In a real application, 
`Synchro.yieldAwaitable` would yield to your asynchronous thunk, generator, Promise, etc.

__Module: list2.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/list2.js)__

<pre><code>
var imgUser = Synchro.getResourceUrl("user.png");

exports.InitializeViewModel = function(context, session, params, state)
{
    return {
        <span class="mark">isLoading: true</span>
    }
}

<span class="mark">exports.LoadViewModel = function * (context, session, viewModel)
{
    yield Synchro.yieldAwaitable(context, function(callback){ setTimeout(callback, 4000) });
    viewModel.people = [
         { first: "Betsy", last: "Braddock" }, 
         { first: "Steven", last: "Rogers" }, 
         { first: "Natasha", last: "Romanoff" }, 
         { first: "Tony", last: "Stark" }, 
         { first: "Wade", last: "Wilson" }, 
    ];
    viewModel.isLoading = false;
}</span>

exports.View =
{
    title: "List 2",
    elements:
    [
<span class="mark">        { control: "stackpanel", orientation: "Vertical", visibility: "{isLoading}", contents: [
            { control: "progressring", value: "{isLoading}", verticalAlignment: "Center" },
            { control: "text", value: "Loading...", color: "Red", font: { size: 24, bold: true }, verticalAlignment: "Center" },
        ] },</span>
        { control: "stackpanel", orientation: "Vertical", width: "*", <span class="mark">visibility: "{!isLoading}",</span> contents: [
            { control: "listview", select: "None", width: "*", binding: "people", itemTemplate:
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

In the interval between when `IntializeViewModel` returns and `LoadViewModel` returns (approximately 4 seconds), this module
will show a "Loading" view, as below: 

![List 2]({{ site.baseurl }}/assets/img/list2.png)

After `LoadViewModel` returns the ViewModel with the populated list (and `isLoading` set to false), this module will display the loaded list as below:

![List 2a]({{ site.baseurl }}/assets/img/list2a.png)

__Next - [List 3: List view with nav to detail view](list-3)__