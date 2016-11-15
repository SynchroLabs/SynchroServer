---
title: How does Synchro compare to React Native?
weight: 4
---

We often get questions about how Synchro compares to other mobile app development platforms, including Cordova, Xamarin,
Appcelerator, and others.  Lately, the most common question we get in this category has to do with React Native, in large
part because we’re a Node.js solution and React Native is getting better known in the Node community. 
 
React Native is a cross platform development environment that uses declarative user interface descriptions to render native
controls and themes, with app code written in JavaScript.  And React Native uses Node.js.  On the surface, that sounds a
lot like Synchro.  When you dig a little deeper, not so much.
 
# Build Better Apps, Faster
 
The biggest difference between React Native (and most other mobile app platforms) and Synchro is that Synchro apps run on
the server.  If you are an enterprise developer, this is a pretty big deal.  Your Synchro apps will be running inside of
your secure server environment, right next to your APIs, databases, and other resources.  So instead of writing
client-server apps, where you have to build APIs for your clients to talk to, then build the clients themselves, you’re
just writing an app on the server (that happens to render on a mobile device).  This architecture results in apps that
are smaller, tighter, and better integrated with the services they use, are quicker and easier to create, are secure, and
are easier to deploy and manage.
 
With Synchro apps, the part of the solution that runs on the mobile device can be considered a very thin client, not
unlike, say, a terminal emulator.  While Synchro apps render their user interface using native themes and controls and can
present interfaces that are very responsive and dynamic, they are fundamentally just presenting a view of an application
which is itself running on the server.  None of your application code ever runs on the client.
 
When you use a platform like React Native to write the client part of a client-server application, you take on a whole
host of responsibilities of being a client.  You have to manage application lifecycle, persistence of state, communications,
etc.  You have to figure out how you’re going to authenticate to the services you use, and how you’re going to persist
that authentication state between calls to the service and between session of your app, and do that all securely.  You
have to figure out how you’re going to handle failures in talking to services, how you’re going to manage timeouts and
retries, and what the user is going to see in all of these cases.  In short, you have to deal with all of the complexities
that arise from the fact that your app is on the other side of the Internet from where the underlying services live.
 
When you look at code examples of client-server apps, you will typically see a simple client that talks to some REST API
endpoint.  And you can certainly compare these kinds of solutions against each other to see how much work it is to make
a good looking, responsive app that talks to that endpoint (we’re as guilty of doing this as everyone else).  But for an
enterprise app where your organization is providing the client, the server resources, and the API that sits between them,
Synchro offers a great opportunity to massively integrate and streamline the overall solution (eliminating the client,
and even the API if desired).  No amount of client-side app development magic is going to allow you to approach the kind
of streamlining that Synchro can offer.
 
While we are impressed by the concise expression of React Native applications (as compared to native solutions, and to
other mobile app development platforms), we still think Synchro apps are simpler, more clear, and more concise.  At Synchro
we hate code that doesn’t carry its own weight.  We hate boilerplate code.  We hate code that’s doing a job that could be
done by metadata.  We look at every line of code in every app we create on our platform as ask if that line of code really
needs to be there, and if there isn’t some way the platform could understand what we’re doing and take care of that for us.
Through a lot of refinement, we think we’ve arrived at a solution that is both concise and clear; that’s easy to understand
and easy to create.
 
Following is the React Native sample “Movies” app from the
[React Native tutorial](https://facebook.github.io/react-native/docs/tutorial.html): 
 
    /**
     * Sample React Native App
     * https://github.com/facebook/react-native
     */
    'use strict';

    var React = require('react-native');
    var {
      AppRegistry,
      Image,
      ListView,
      StyleSheet,
      Text,
      View,
    } = React;

    var API_KEY = '7waqfqbprs7pajbz28mqf6vz';
    var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
    var PAGE_SIZE = 25;
    var PARAMS = '?apikey=' + API_KEY + '&page_limit=' + PAGE_SIZE;
    var REQUEST_URL = API_URL + PARAMS;

    var AwesomeProject = React.createClass({
      getInitialState: function() {
        return {
          dataSource: new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
          }),
          loaded: false,
        };
      },

      componentDidMount: function() {
        this.fetchData();
      },

      fetchData: function() {
        fetch(REQUEST_URL)
          .then((response) => response.json())
          .then((responseData) => {
            this.setState({
              dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
              loaded: true,
            });
          })
          .done();
      },

      render: function() {
        if (!this.state.loaded) {
          return this.renderLoadingView();
        }

        return (
          <ListView
            dataSource={this.state.dataSource}
            renderRow={this.renderMovie}
            style={styles.listView}
          />
        );
      },

      renderLoadingView: function() {
        return (
          <View style={styles.container}>
            <Text>
              Loading movies...
            </Text>
          </View>
        );
      },

      renderMovie: function(movie) {
        return (
          <View style={styles.container}>
            <Image
              source={uri: movie.posters.thumbnail}
              style={styles.thumbnail}
            /<
            <View style={styles.rightContainer}>
              <Text style={styles.title}>{movie.title}</Text>
              <Text style={styles.year}>{movie.year}</Text>
            </View>
          </View>
        );
      },
    });

    var styles = StyleSheet.create({
      container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
      },
      rightContainer: {
        flex: 1,
      },
      title: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
      },
      year: {
        textAlign: 'center',
      },
      thumbnail: {
        width: 53,
        height: 81,
      },
      listView: {
        paddingTop: 20,
        backgroundColor: '#F5FCFF',
      },
    });

    AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
 
And here is a version of the same app implemented in Synchro: 
 
    // React Movies sample app implementation
    // https://facebook.github.io/react-native/docs/tutorial.html
    //
    var request = require('request');
    var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';

    exports.View =
    {
        title: "Movies",
        elements:
        [
            { control: "stackpanel", orientation: "Vertical", width: "*", height: "*", contents: [
                { control: "text", value: "Loading movies...", fontsize: 10, visibility: "{!responseData.movies}" },
                { control: "listview", select: "None", height: "*", width: "*", margin: 0, binding: "responseData.movies", itemTemplate:
                    { control: "stackpanel", orientation: "Horizontal", width: "*", margin: 0, contents: [
                        { control: "image", resource: "{posters.thumbnail}", height: 100, width: 75 },
                        { control: "stackpanel", orientation: "Vertical", width: "*", contents: [
                            { control: "text", value: "{title}", width: "*", font: { bold: true, size: 8 } },
                            { control: "text", value: "{year}", width: "*", fontsize: 7 },
                        ]}
                    ]}
                }
            ]}
        ]
    }

    exports.InitializeViewModel = function(context, session)
    {
        return { responseData: null };
    }

    exports.LoadViewModel = function(context, session, viewModel)
    {
        viewModel.responseData = JSON.parse(Synchro.waitFor(context, request, { url: REQUEST_URL }).body);
    }
 
You may notice that the Synchro version of the app does not use “styles” in the same way as the React Native version.  We do
support styles in Synchro, though we do not force you to use them (any attribute can be specified explicitly on a control, or
it can be defined in a style linked to the control).  We generally advocate using styles when the goal is to share styles
between controls (for app-wide styling and/or platform-specific styling).
 
If you really wanted to break out every attribute into styles using Synchro (as in React Native) you could do so as follows:
 
    // React Movies sample app implementation (using styles)
    // https://facebook.github.io/react-native/docs/tutorial.html
    //
    var request = require('request');
    var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';

    exports.View =
    {
        title: "Movies",
        elements:
        [
            { control: "stackpanel", style: "container", contents: [
                { control: "text", style: "loading", visibility: "{!responseData.movies}" },
                { control: "listview", style: "listView", binding: "responseData.movies", itemTemplate:
                    { control: "stackpanel", style: "listItem", contents: [
                        { control: "image", style: "thumbnail", resource: "{posters.thumbnail}" },
                        { control: "stackpanel", style: "rightContainer", contents: [
                            { control: "text", style: "title", value: "{title}" },
                            { control: "text", style: "year", value: "{year}" },
                        ]}
                    ]}
                }
            ]}
        ]
    }

    exports.InitializeViewModel = function(context, session)
    {
        var viewModel =
        {
            /* Styles */
            container: { orientation: "Vertical", width: "*", height: "*" },
            loading: { value: "Loading movies...", fonsize: 10 },
            listView: { select: "None", height: "*", width: "*", margin: 0 },
            listItem: { orientation: "Horizontal", width: "*", margin: 0 },
            thumbnail: { height: 100, width: 75 },
            rightContainer: { orientation: "Vertical", width: "*" },
            title: { font: { bold: true, size: 8 }, width: "*" },
            year: { fontsize: 7, width: "*" },
            /* Data */
            responseData: null,
        }
        return viewModel;
    }

    exports.LoadViewModel = function(context, session, viewModel)
    {
        viewModel.responseData = JSON.parse(Synchro.waitFor(context, request, { url: REQUEST_URL }).body);
    }
 
# Native Apps on Every OS
 
Synchro and React Native have similar approaches to building native interfaces using native themes and controls, driven by a
declarative description of the user interface.  But there are some differences worth noting in how the technologies relate
to the native platforms. 
 
React Native supports iOS and Android.  Synchro supports those platforms, as well as Windows and Windows Phone.  While the
demand for native Windows Phone apps may not be strong enough to warrant support by many development platforms, we feel that
in an enterprise BYOD environment supporting Windows and Windows Phone is important.  This is particularly true regarding
tablet deployments where the Windows OS is more prevalent (including the Microsoft Surface and Surface Book, as well as many
third party Windows tablets or convertibles).
 
React Native takes pride in saying that they are not “Write Once, Run Everywhere”, but rather “Learn Once, Write Everywhere”.
Their focus is on building very tuned, native apps for each platform (they even talk about how easy it is to “port” from
one platform to another).  Synchro takes the opposite approach.  We believe that it is important to be able to get your
app up and running as quickly as possible on all platforms.  When you deploy your Synchro app, it works immediately on all
platforms from one codebase.  If you then want to tune and tweak the app to make it look and feel more native, we give you
access to the platform specific controls you need, as well as view filtering support that make it easy for you to support
highly tuned native apps on every platform from a single codebase. 
 
With React Native, your application code is written in JavaScript and executed on the mobile device.  The React Native team
had to create some pretty impressive technology to actually make running JavaScript on native mobile environments workable
and keep the apps responsive (including techniques to get your code off of the main thread).  With Synchro, all of the code
running on the mobile client is native code (that we provide), and that code uses native platform-appropriate mechanisms
to keep the user interface responsive (including using background threads for IO, decoding, etc).  The difference is that
with Synchro, a) it’s native code, and b ) you didn’t have to write it.  While React Native does provide more functionality
and flexibility for your client code to interact with the native environment, you should consider that if Synchro does what
you need, the Synchro version is going to be more native and more performant (and done for you automatically).
 
# Deploy Updates Instantly
 
The most exciting feature of React Native is probably live code reloading.  Being able to make a code change and see it
reflected live, instantly, on a mobile device is pretty awesome.  But unfortunately React Native apps don’t update that way
in production.  When you build a React Native app, it packages all of your code into an app bundle that itself gets
packaged into your binary app that you put in the store.
 
But since React Native app views are generated from code, and since code can be downloaded, it stands to reason that you
could have a dynamically updated app (where you can push new code without having to redistribute the app through the app
store).
 
People have [explored techniques](https://medium.com/ios-os-x-development/so-you-want-to-dynamically-update-your-react-native-app-d1d88bf11ede#.drk80ut64)
for doing this.  And there are even services under development that manage this for you (for both React Native and Cordova), such as
[Code Push](http://microsoft.github.io/code-push).
 
The typical approach is to have your app download a new app bundle to the local device and then run that app bundle.
Depending on a number of factors, that download could take some time.  So do you make your users wait to download the
update, or do you let them run the old code while downloading the update?  If you choose the latter, that means you might
have some users running the old code and other users running the new code, which could introduce issues if you are
changing the client to correspond to changes in the back end, as just one example.
 
Can dynamic updating of your deployed React Native app be done?  Sure.  Is if free and easy and secure and baked-in?
Not really.  It’s still something you’re going to have to think about and manage.
 
With Synchro, being able to deploy updates to your entire installed base, simultaneously and instantly, was one of our
core principles from the outset.  And with Synchro you can do these deployments in a number of ways, including using our
Synchro Studio (typically for local development, and test/staging deployments), publishing from your version control
system, or any other mechanism that you use for configuration control of Node.js or other cloud services.
 
In summary, React Native apps can be updated dynamically with some effort on your part.  But with Synchro it’s not
some homework assignment that you have to go figure out.  It’s something that’s core to our platform, and that we
think a lot about and try to make easy for you.
 
# Provable Security
 
React Native is a tool for building client applications that run on mobile devices, and it is subject to the same
security concerns as other similar development platforms (including native development environments).   It is very
easy to make a mistake in mobile client code and inadvertently create an attack vector.  Someone could forget to use
the https URI scheme and end up transferring your application data in the clear.  Someone could use the https scheme,
but not understand that additional work was required to validate the server certificate when establishing a connection
(maybe assuming that the underlying network library was doing that), and make your app subject to a DNS hijacking /
man-in-the-middle attack.  Someone could get some highly sensitive data from a REST API not realizing that the
networking library also wrote it to a cache on the device, thus exposing another attack vector.  There are endless
examples of these kinds of simple, hard to find, mistakes.  With React Native, as with almost any mobile client
platform, your application security is equal to your ability to catch the subtle mistakes made by your worst developer
on their worst day.  If your app is primarily about hosting cat videos and showing ads, then this is probably not
going to keep you up at night.  If your app is running your enterprise, then it probably should. 
 
One area that should cause increased security concern is the fact that React Native is designed to support highly
modular, distributed development.  The example of the “like” button being a modular feature with its own developer,
where that control manages its own state, handles talking to the network to perform its function, etc., is a good
illustration of where React Native shines, and of best practices for using React Native.  The fact that Facebook
likes to brag about a new developer being able to drop a feature into a very complex app on their first day is really
exciting from a productivity standpoint, while at the same time being absolutely horrifying from a security
standpoint.  Again, it depends on what your app does, and how important security is to you, but if security is
important, you should seriously consider how the development environment and best practices contribute to your
app’s attack surface.
 
With Synchro, we address the concept of client security as one of our founding design principles.  Our position is
that because the interaction of our native client with the network and local storage is centralized, we can say with
some confidence that that code is secure (we know that it can only ever talk to a single network endpoint, your app
endpoint, and that it will only do so securely, for example).  Most importantly, since none of your app code ever
runs on the device, it is impossible for you to introduce an attack vector on the client.  That’s what we mean when
we say that Synchro client apps are “provably secure”, as opposed to other development platforms where the best you
can hope for if you are very skilled and very careful is “probably secure”.
 
You do have to secure the Synchro Server, but that is a challenge with which Node.js developers should already be
familiar.  You are likely already running and securing web sites or mobile app API endpoints, and securing your Synchro
server should look a lot like securing those services.
 
# Built with Node.js
 
React Native is installed using NPM and uses Node.js to build your JavaScript code.  It also runs a Node server
during debugging to enable live code reloading.  And the apps that you build with React Native can even use some
Node modules.  That all sounds pretty Node friendly.  But, while React Native does use a Node-like module loader
for your apps, it does not run your apps in a Node.js environment.  This means that you can only use Node modules
implemented in pure JavaScript and that do not rely on a Node environment.  Many Node modules that you’re probably
used to using in your server apps are not going to run in a React Native environment.  This includes core modules
like “request” and “bcrypt”, among many others, and means that no modules with this type of module anywhere in
their dependency tree are going to work in React Native apps.
 
By contrast, your apps running under Synchro have access to a full Node.js environment, and your Synchro apps can
use any Node package, including those with native code or that require a Node environment.
 
# Summary
 
React Native is a very exciting platform, and it has a lot to offer, especially for Node.js developers.  But it also
has a lot of the same limitations and constraints of other mobile app development platforms.  We at Synchro Labs feel
that for the class of apps that can be implemented with our platform, we beat React Native, and every other platform,
hands down.  If you’re an enterprise developer with a backlog of apps to mobilize, we can get you there faster and
easier than any other solution.  And if you’re a Node developer, that’s even more true.
