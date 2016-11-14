---
title: 'List 3: List view with nav to detail view'
---

In the example below we demonstrate the mechanisms for navigating between Views, as well as for maintaining View state and passing data between
Views.  For more details on these mechanisms and techniques, see [Navigation Support](../general/navigation-support).

Navigation from a view to a child view is accomplished via `Synchro.pushAndNavigateTo()`.  Navigation from the child view back to the parent
view is accomplished via `Synchro.pop()`.

When navigating to a child view via `Synchro.pushAndNavigateTo()`, the parent view can specify a params object to be passed to the child
view's `InitializeViewModel` function, as well as its own "state", which will be preserved and passed back to it when its own `InitializeViewModel`
function is called upon return.  In the example below, the parent specifies its entire ViewModel as "state", but in practice this can be any data
(including a subset or superset of the ViewModel) that is required.  Storing and restoring state allows applications to avoid lengthy repopulation
of parent ViewModels, as in our example here (note that we don't have the simulated 4 second wait when we come back to the list view from the
detail view).

In the `IntializeViewModel` of the list view below, a check is done to determine whether the view state is being restored or needs to be
regenerated (reloaded).  In addition, any changes made by a child view (and stored in the session) are processed.

__Module: list3.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/list3.js)__

    var imgUser = Synchro.getResourceUrl("user.png");

    exports.InitializeViewModel = function(context, session, params, state)
    {
        var viewModel = state;
        if (viewModel == null)
        {
            viewModel = { isLoading: true };
        }
        else if (session.updatedPerson)
        {
            viewModel.people[session.updatedPerson.index] = session.updatedPerson.person;
            delete session.updatedPerson;
        }

        return viewModel;
    }

    exports.LoadViewModel = function * (context, session, viewModel)
    {
        if (viewModel.people === undefined)
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
        }
    }

    exports.View =
    {
        title: "List 3",
        elements:
        [
            { control: "stackpanel", orientation: "Vertical", visibility: "{isLoading}", contents: [
                { control: "progressring", value: "{isLoading}", verticalAlignment: "Center" },
                { control: "text", value: "Loading...", color: "Red", font: { size: 24, bold: true }, verticalAlignment: "Center" },
            ] },
            { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
                { control: "listview", select: "None", width: "*", 
                  binding: { items: "people", onItemClick: { command: "onSelected", person: "{$data}", index: "{$index}" } }, 
                  itemTemplate:
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

    exports.Commands = 
    {
        onSelected: function (context, session, viewModel, params)
        {
            return Synchro.pushAndNavigateTo(context, "hello8", params, viewModel);
        },
    }

The view will be generated as in the previous example with a 4 second delay and "loading" status, unless we are returning from a child view,
in which case the list view will be restored instantly.

When an item in the list is clicked, the onSelected command will be called, and the child view will be activated. 

![List 3]({{ site.baseurl }}/assets/img/list3.png)

The detail view below receives its initial data from the parent view by way of `params`, which it uses to populate its ViewModel.  When "Submit"
is pressed, any edits are stored in the session object (for the parent to process upon return), then `Synchro.pop()` returns control to the parent.

__Module: hello8.js - [View on GitHub](https://github.com/SynchroLabs/SynchroTutorial/blob/master/hello8.js)__

    exports.InitializeViewModel = function(context, session, params, state) {
        return {
            firstName: params.person.first,
            lastName: params.person.last,
            index: params.index,
            textStyle: { fontsize: 12, verticalAlignment: "Center" },
            labelStyle: { width: 200, textAlignment: "Right" },
            editStyle: { width: 240 }
        }
    }

    exports.View =
    {
        title: "Hello World 8",
        elements:
        [
            { control: "text", value: "Enter name:", font: { size: "{textStyle.fontsize}", bold: true } },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "First name:", style: "textStyle, labelStyle" },
                { control: "edit", binding: "firstName", style: "textStyle, editStyle" },
            ] },
            { control: "stackpanel", orientation: "Horizontal", contents: [
                { control: "text", value: "Last name:", style: "textStyle, labelStyle" },
                { control: "edit", binding: "lastName", style: "textStyle, editStyle" },
            ] },
            { control: "button", caption: "Submit", binding: "onSubmit", enabled: "eval({firstName} && {lastName})" },
        ]
    }

    exports.Commands =
    {
        onSubmit: function(context, session, viewModel)
        {
            session.updatedPerson = { index: viewModel.index, person: { first: viewModel.firstName, last: viewModel.lastName }};
            Synchro.pop(context);
        }
    }

The name can be edited in the child view below, and the changes will be displayed on the parent list view page. 

![Hello 8]({{ site.baseurl }}/assets/img/hello8.png)

__Next - [Conclusion](conclusion)__ 