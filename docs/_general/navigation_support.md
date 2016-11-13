---
title: Navigation Support
weight: 5
---

Synchro provides the ability to implement any desired navigation scheme, while also providing built-in functionality that makes it very
easy to support common navigation schemes with minimal application logic.

# Basic Navigation

The base method used to navigate from one view to another is `Synchro.navigateTo`.

# Navigation Using the Back Stack

Synchro also has support for a "back stack", which is a list of ancestor views that can easily be navigated back to from a child view
(either directly, or indirectly). When you call `Synchro.pushAndNavigateTo`, the current view is pushed on to the back stack before navigating
to the new view. The new view can then simply call `Synchro.pop` to navigate back to the calling page. If a page wants to navigate to an ancestor
other than its immediate parent, it can call `Sychro.popTo` to search the back stack for the closest view matching the supplied path, then 
navigate to that view.

# User "Back" handling

Many mobile devices have a "back" button that the user can press at any time. In addition, Synchro pages can feature a back navigation control
element (platform dependent, but typically in the top menu/command bar). By default, a Synchro view will simply do a `Synchro.pop` in response
to the user back action.

If desired, a Synchro module can implement an `OnBack` handler to handle the back action. For example, if the goal was to have the back action
navigate one or more levels up to a menu page, an `OnBack` handler could be supplied that does `Synchro.popTo()`.  The `OnBack` handler should return
`true` if it handles the back navigation, otherwise the system will take the default back navigation action - `Synchro.pop()`.

# Advanced Back Stack Navigation

It is sometimes useful to navigate to an intermediate view, where that view is inappropriate to see again when navigating back. For example,
say that a user is on "menu" view and attempts navigate to a "resource" view, but your app determines that it needs to authenticate the user
or collect some additional information using an "intermediate" view before proceeding to the resource view. Once the user is on the resource
view and they hit back, you don't want them to return to the intermediate authentication/data collection view, but rather to its parent menu
view. There are two ways to accomplish this using back stack navigation:

First, you could navigate from the intermediate view to the resource view using `Synchro.navigateTo` instead of `Synchro.pushAndNavigateTo`. In
this way, the intermediate view will not be pushed on to the back stack, such that when the resource page calls `Synchro.pop`, it will return to
the menu view (assuming that `Synchro.pushAndNavigateTo` was used to get from the menu view to the intermediate view, so that the menu view is on
the back stack).

Second, you could navigate from the intermediate view to the resource view using `Synchro.pushAndNavigateTo`, pushing the intermediate view on
to the back stack. You could them implement a custom OnBack handler on the resource view that did a `Synchro.popTo`, specifying the menu as the
target (such that it would navigate back to the menu view, skipping the intermediate view).

In this simple case, either solution would be satisfactory. There may be more advanced cases where one approach works better than the other.
For instance, if there was more than one way to arrive at the resource view, the first approach of just not putting the intermediate view on
the back stack is preferable (so that pop navigation can be used to travel back whichever path was used to get to the resource view). 
Alternatively, if there were some cases where you did want to navigate back to the intermediate page and others where you did not, then
putting it on the back stack and skipping over it using popTo only when appropriate is the correct solution.

# Custom Navigation

It is possible to use a combination of `Synchro.navigateTo` and custom `OnBack` handlers to implement completely custom navigation schemes that
make no use of the back stack.  With this kind of navigation scheme, you may also set a View element called "back" to true or false to
indicate whether a back navigation element should be shown.

# Preserving State on Navigation

It is sometimes necessary to store some view state when navigating away from a view, so that the view can be accurately and quickly restored
when navigating back to it from a descendant view. There is a built-in mechanism to support this when using back stack navigation. You may
supply a `state` value as the last parameter to `Synchro.pushAndNavigateTo`, then when and if the view is navigated back to, that value will be
passed back as the last parameter to `InitializeViewModel`.

For example, lets assume we have an item list view that has to load a list of items from a remote resource, possibly a database or a REST API,
and that that activity is moderately time consuming (a second or two), such that we would not want to reload the item list when navigating back,
presenting the user with a delay that they do not expect. When navigating to a child detail view, we would supply the item list as our state
value. When/if the list view is navigated back to, that state value will be passed back to the list view in InitializeViewModel. If the state
value is present, we can populate our user interface immediately from the state value, and if not, we can load the item list normally.

Because any `state` value must be maintained as part of the user session, it is recommended that it be used only when necessary, and only to
store the necessary data when using it. The serialized size of the data maintained using the state mechanism impacts both the session storage
capacity requirements of the system, as well as overall system performance (due to reading/writing the session per transaction).

It would of course be possible to implement a comparable solution if back stack navigation is not being used, such as by writing the state
data directly to the session when navigating away and then reading it back from the session upon return. The same caveats would apply, and in
addition, care must be given to ensure that no extraneous data is left behind in the session.
