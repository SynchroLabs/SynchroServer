---
title: Asynchronous Processing
weight: 6
---

When Synchro calls one of your module entry points, the expectation is that you will complete your logic as quickly as possible without
blocking, and in no case take more than 100 milliseconds. This is necessary both for the client interface to appear responsive and to avoid
blocking Node from processing other requests.

If you need to perform long-running / asynchronous processing, you will need to do so using `Synchro.yieldAwaitable()` and associated helpers
as provided below. Using `yieldAwaitable` will both streamline your module design and automatically share the session and view model state
between potentially multiple processors running against a given module instance. 

# Synchro Asynchronous Processing with Generators/Yield+CO

There are a number of different approaches to doing asynchronous processing in Node.  A true async/await solution for Node is coming in
the future, but until then we can do better than the de facto standard of “callback hell”.  For a good overview of possible approaches
to asynchronous processing in Node, see [this article](https://thomashunter.name/blog/the-long-road-to-asyncawait-in-javascript/).
 
Synchro provides a mechanism for asynchronous processing in user code that is based on 
[generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) and the
[yield](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield) keyword, combined with the
[co library](https://www.npmjs.com/package/co).  Generator functions and yield are available in contemporary versions of Node (they
have been fully supported since v0.12.0).  The co library is stable and widely used (820+ npm libraries depend on co as of early 2016). 
 
A generator function is a special kind of function which can be exited and later re-entered, and is most commonly used to implement
asynchronous operations.  A generator function is declared by placing an asterisk after the “function” keyword in the function declaration.
The “yield" keyword may be used inside of a generator function, allowing asynchronous processing of a variety of objects or functions.
Since Synchro use the co library wrapper to call all user code, a generator function in Synchro user code may yield anything that
[co considers yieldable](https://www.npmjs.com/package/co#yieldables) (including thunks to async callbacks, Promises, other generator 
functions, and more).  
 
This is what a generator function looks like:
 
    function * doStuffAwaitable (param) // <- Generator
    {
        var foo = yield doFirstThingAwaitable(); // <- yield
        doSecondThing();
        return yield doThirdThingAwaitable(foo, param); // <- yield
    }
 
All Synchro module entry points, including application hook functions, can be implemented as either plain functions or as  generator functions.
If the user code provided at the entry point will yield at any point, then it must be implemented as a generator function. 

# Concurrent Request Processing and Synchronization

There are two aspects of asynchronous processing that are important to understand and handle appropriately in any Node application, including
a Synchro app.  The first is “flow of control”, which is the mechanism used to execute the instructions of processing functions and to report
completion and any results to the system.  The generator/yield+co support outlined above is how we deal with flow of control in Synchro,
allowing you to enter your function at the top and exit at the bottom, with the ability to yield asynchronously in between as needed, without
having to worry about callbacks or any other signaling.
 
The other issue is “concurrent request processing”, which is the mechanism of dealing with the prospect of other requests being processed
while your request is yielding to an asynchronous operation.  Node is single-threaded with respect to request processing.  As long as you do
not yield, you can guarantee that no other request is being processed while your request is being processed.  But as soon as you perform an
asynchronous operation in your processing, then you have to account for the fact that other requests could have been processed while your
request was waiting, and those other requests could have changed the state of the system (this is true irrespective of the async approach
being used). 
 
In Synchro, we provide helper functions for asynchronous processing that deal with synchronizing access to the system state (namely the
session and the viewModel).  When you call `yieldAwaitable` or `interimUpdateAwaitable`, those functions write the session and viewModel state
before yielding, and recover them after yielding, meaning that any requests being processed while your request is waiting will see any changes
your request had made to the session or viewModel before it yielded, and that your request will in turn see any changes made by other requests
when control is returned.  This can be very useful, for example in a case where you are doing a long running operation and the user can elect
to cancel the operation (after each stage of the operation you can check the viewModel to see if another request indicated that the operation
should terminate).  A major caveat related to this is that you should not write to the session or viewModel inside of any asynchronous
processing code (anything processed inside of a call to `yieldAwaitable`), as those changes will be lost when control is returned from the
Synchro async helper functions.

# Asynchronous Processing using Synchro Helper Functions

To implement asynchronous processing in your Synchro user code you must implement your entry point as a generator function and you must then
yield using `yieldAwaitable`.  You may provide interim/partial updates to the client during asynchronous processing using `interimUpdateAwaitable`.
Lastly, you may use `isActiveInstance` during asynchronous processing to determine whether the user has navigated away from your module instance
(and you should stop any ongoing operation).  You must use the "yield" keyword when calling any Synchro helper function implemented as a generator,
which are those functions with the suffix "Awaitable".
 
Detailed documention for these and other functions can be found in [Built-in Helper Functions](built-in-helper-functions). 

## Synchro.yieldAwaitable

    yield Synchro.yieldAwaitable(context, yieldable)

`yieldAwaitable` allows for asynchronous yielding to anything that the [co library considers yieldable](https://www.npmjs.com/package/co#yieldables),
including Promises, generator functions, etc.  

When you yield using `yieldAwaitable` you will pass the current context and the yieldable.  Any result produced by the yieldable will be
returned by `yieldAwaitabl`e.  Any error produced by the yieldable will be thrown from `yieldAwaitable`.

One of the most common uses of `yieldAwaitable` is to make asynchronous calls to functions implemented using
[Node-style async completion callbacks](http://thenodeway.io/posts/understanding-error-first-callbacks/). That is to say that it can be
used to call any async function that takes as its last argument a completion callback function, where that callback function takes two
parameters - an error and a result.  In order to call a Node-style async callback using `yieldAwaitable`, you must wrap your async function
call in a thunk (a function that takes a single parameter, the callback, and calls your async code in its body). 

Below is an example of wrapping a simple async function with a thunk and yielding to it.  The async function will, after a specified delay,
simulate a random dice roll of a die with the indicated number of sides:

    function slowDiceRollAsync(sides, delay, callback) // Standard Node-style async function
    {
        setTimeout(function()
        {
            var dieValue = Math.floor((Math.random() * sides) + 1);
            callback(null, dieValue);
        }, 
        delay);
    }

And below is how you might call that from a Synchro command: 

    exports.Commands = 
    {
        onRoll: function * (context, session, viewModel, params) // <- Generator function
        {
            // Roll a 6-sided die with a 100ms delay...
            //
            viewModel.roll = yield Synchro.yieldAwaitable(context, function(cb){ slowDiceRollAsync(100, 6, cb) }); // <- yield
        }
    }

Below is another example of yielding to a Promise.  It includes a simple function that produces a Promise that, when resolved, will after
a specified delay simulate a random dice roll of a die with the indicated number of sides:

    function slowDiceRollPromise(sides, delay) // Function that returns a Promise
    {
        return new Promise(function(resolve) 
        {
            setTimeout(function() 
            {
                var dieValue = Math.floor((Math.random() * sides) + 1);
                resolve(dieValue);
            }, 
            delay);
        });
    }

And below is how you might call that from a Synchro command:

    exports.Commands = 
    {
        onRoll: function * (context, session, viewModel, params) // <- Generator function
        {
            // Roll a 6-sided die with a 100ms delay...
            //
            viewModel.roll = yield Synchro.yieldAwaitable(context, slowDiceRollPromise(100, 6)); // <- yield
        }
    }

## Synchro.interimUpdateAwaitable

    yield Synchro.interimUpdateAwaitable(context)

`interimUpdateAwaitable` provides a partial viewModel update back to the client, while allowing the server module to continue processing.
It is important to call `interimUpdateAwaitable` before invoking an async or long running call using `yieldAwaitable` if there are any ViewModel
changes that need to be sent back to the client before the async processing completes (for example, if an indicator in the ViewModel is set
to communicate the waiting state back to the user's View).

## Synchro.isActiveInstance

    Synchro.isActiveInstance(context)

`isActiveInstance` indicates whether the page/instance being processed is the active instance. If it returns `false`, that means that the instance
that the calling code is processing is not current (has been navigated away from). In this case, no viewModel updates will be sent to the client.

If your async processing is incremental, such that you are calling `yieldAwaitable` in a loop, then you should check `isActiveInstance` each time
through the loop, and if it returns false, you should abandon the loop (as any further processing on behalf of the obsolete page/instance is
not useful).

Following is an example of a simple asynchronous loop demonstrating these principles:

    while (Synchro.isActiveInstance(context) && !viewModel.cancelled)
    {
        yield Synchro.interimUpdateAwaitable(context);
        yield Synchro.yieldAwaitable(context, someYieldable);
        viewModel.progress++;
    } 

# Delayed ViewModel Initialization

There is one very common case where modules implement async or long-running processing, which is during initialization of the view model. In
order to make this common task easy, and to make up for the fact that you cannot call `interimUpdate` before the view model has been initialized,
we have provided a mechanism for doing delayed viewmodel intialization.

If a page needs to perform an asynchronous or long-running task when it is loaded, it may establish an initial view model in `InitializeViewModel`
and then further populate that view model asynchronously in `LoadViewModel`. The initial view model and corresponding view will be returned to the
client at the completion of `InitializeViewModel` (and subsequent view rendering), so that the client can render the initial user interface. Then
`LoadViewModel` will be called to complete subsequent view model loading/population. It is common to set some kind of waiting indicator in the
initial view model, then clear that when the final view model is returned.

# Putting it all together

The Synchro sample countdown illustrates all of these principles in one fairly straighforward module:

    // Countdown page
    //
    exports.View =
    {
        title: "Countdown",
        elements: 
        [
            { control: "stackpanel", orientation: "Horizontal", visibility: "{isLoading}", contents: [
                { control: "progressring", height: 50, width: 50, value: "{isLoading}", verticalAlignment: "Center" },
                { control: "text", value: "Loading...", color: "Red", fontsize: 24, verticalAlignment: "Center" },
            ] },
            { control: "stackpanel", orientation: "Vertical", visibility: "{!isLoading}", contents: [
                { control: "text", value: "Count: {count}", color: "Green", font: { size: 24, bold: true } },
                { control: "progressbar", value: "{count}", minimum: 0, maximum: 10, width: 300 },
                { control: "button", caption: "Start Countdown", binding: "start", visibility: "{!isCounting}" },
                { control: "button", caption: "Pause Countdown", binding: "stop", visibility: "{isCounting}" },
            ] }
        ]
    }

    exports.InitializeViewModel = function(context, session)
    {
        var viewModel =
        {
            count: 0,
            isLoading: true,
            isCounting: false
        }
        return viewModel;
    }

    exports.LoadViewModel = function * (context, session, viewModel) // <- Generator function
    {
        yield Synchro.yieldAwaitable(context, function(cb){ waitInterval(4000, cb) }); // <- yield  
        viewModel.count = 10;
        viewModel.isLoading = false;
    }

    function waitInterval(intervalMillis, callback)
    {
        setTimeout(function(){callback()}, intervalMillis);
    }

    exports.Commands = 
    {
        start: function * (context, session, viewModel, params) // <- Generator function
        {
            viewModel.isCounting = true;

            while (Synchro.isActiveInstance(context) && viewModel.isCounting && (viewModel.count > 0))
            {
                yield Synchro.yieldAwaitable(context, funciton(cb){ waitInterval(1000, cb) }); // <- yield
                if (viewModel.isCounting)
                {
                    viewModel.count--;
                    yield Synchro.interimUpdateAwaitable(context); // <- yield
                }
            }

            viewModel.isCounting = false;
        },
        stop: function(context, session, viewModel, params)
        {
            viewModel.isCounting = false;
        },
    }

Note that this module is implemented such that the user may hit a button that invokes the __stop__ command while the async loop is running.
This can be accomplished because our loop in the __start__ command handler is yielding to Node such that the __stop__ command can be executed
during the loop, and further, since the Synchro async helpers insure proper sharing of the instance (view model) state, both commands can
access it.
