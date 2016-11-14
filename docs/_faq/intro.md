---
title: Introduction to Synchro
weight: 1
---

# What is Synchro?

Synchro allows you to create feature-rich, robust, and secure cross-platform mobile apps that look and feel native on
mobile devices, but run on the server, and are updateble in real-time. And it allows you to do this in a fraction of the
amount of code required by other mobile application development platforms.

![Synchro Overview]({{ site.baseurl }}/assets/img/users.png)

To the user a Synchro-built app presents as a no-compromise native mobile app, and to developers and administrators it
presents as a web app. It's really the best of both worlds.

# How Do We Do It?

The short answer is that we do this by rendering your mobile client user interface on the mobile device, but running all
of your mobile client code, including user interaction logic, on the server. You provide a small amount of platform-neutral
UX code that we run on the server, and the Synchro platform provides the native mobile code and server framework to make
it all work.

# The Longer Version...

The long answer is, well, longer. In order to run the client logic on the server, but still render native, responsive
applications on mobile devices, we need a strong separation between the client view and the client application logic
(since they're running on different devices). We were inspired by contemporary data binding techniques and the MVVM
(Model-View-ViewModel) design pattern. We particularly liked [MVVM Light](http://www.mvvmlight.net/) in the DotNet world
and [Knockout.js](http://knockoutjs.com/) in the JavaScript world as examples of cleanly separating presentation from
data and interaction.

In this pattern, each page or screen is represented by a __View__ that defines the presentation of the user interface, 
including controls and their layout, and a __ViewModel__ that contains the data represented in the View, as well as commands
to process user interactions with the View. The View definition also contains declarative bindings that describe the
relationship between the View and the ViewModel (for example, which ViewModel elements are used to populate which View
controls, and which ViewModel commands are launched when users interact with various controls in different ways, etc).

These declarative bindings allow us to fully automate the View, meaning that there is no need for you to write any procedural
code to get or set View contents or state, and this is what allows us to render and run the View on the other site of a
network connection from the ViewModel. Also, unlike many other MVVM or similar systems, we don't require you to do anything
in your ViewModel implementation to make this happen (you don't have to notify anyone when you make a data change, and you
don't have to tell us which data elements we need to observe - we just figure it out and handle it automatically).

<p align="center">
    <img src="{{ site.baseurl }}/assets/img/synchro-mvvm.png"/>
</p>

The diagram above shows how we implement our client-server MVVM solution. Your Synchro app will consist of a View and
ViewModel implementation on the server. The Synchro platform provides the native mobile client apps and the server
infrastructure to make the magic happen.

# Why Should You Care?

----

![Cross Platform]({{ site.baseurl }}/assets/icon/cross-platform.png)

## Cross Platform

The code that runs on the mobile client is created and provided by us, and is not specific to your application. We offer
that code, packaged for you, linked to your server endpoint, and branded as your app, on Android, iOS, Windows, and
Windows Phone platforms via the __Synchro App Builder__. Your code runs on the server and is the same regardless of the
client OS your user is running. You do have the ability to tweak and tune your app based on the mobile client OS (or
other device metrics), but that's usually not necessary.

<p align="center">
    <img src="{{ site.baseurl }}/assets/img/platforms.jpg"/>
</p>

----

![Less Code]({{ site.baseurl }}/assets/icon/code.png)

## Less Code

We were frustrated in our own efforts writing enterprise mobile clients by the amount of code required that was not core
to the focus of the application. Most of this code fell into one of two categories: UX babysitting (setting up the UX and
populating it, writing various handlers, notifiers, etc), and the client side of network client-server functions (typically
talking to our own servers, usually via a REST API or some third-party tool that was supposed to make it easier). In Synchro,
we have dramatically reduced, and in many cases completely elimiated, the code required in both of those categories.

In one popular cross platform benchmark, the [PropertyCross](http://propertycross.com/) application, the Synchro
implementation was done in 1/20th the amount of code of the native implementation, 1/10th the amount of code of the
Xamarin implementation, and 1/4 the amout of code of the Appcelerator Titanium implementation. And our version stands
up to all of them in terms of native look-and-feel, functionality, and responsiveness.

<p align="center">
    <img src="{{ site.baseurl }}/assets/img/loc.png"/>
</p>

The Synchro implementation of PropertyCross is 242 lines of code, and that includes the view templates that define the page
layouts. Another Synchro app, [Synchro Civics](https://github.com/SynchroLabs/SynchroCivics), was implemented in under 200
lines of code. To install Synchro Civics on your mobile device and see what can be done in 200 lines of code, see
[Get Started](https://synchro.io/getstarted).

----

![Client-Server]({{ site.baseurl }}/assets/icon/client-server.png)

## Massively Streamlined Client-Server Development

Most enterprise mobile applications are client-server applications that revolve around the mobile client application
interacting with one or more existing enterprise resources (services, data sources, etc). Implementing the client side
of these interactions introduces many challenges, including authentication, access-control, connection/network management,
state management, caching, and more.

Consider a simple example: You have customer data stored in a SQL database, and the mobile application needs to be able to
search that database and display that customer data. If you implement something like this as a web app, your web app will
simply authenticate to the database (as an application), perform a query, and populate the response with the data. But you
can't very well let a mobile app talk directly to a SQL database for a number of reasons. You can't distribute
application-level access credentials to the mobile app (that it stores and uses for access). Since the mobile app has its
own release schedule, you can't have it rely on a specific database schema. For these and other reasons, you will typically
end up building some kind of front-end to the database for your mobile app to use (either building a custom REST API, or
perhaps by using some third-party tool to help). And that creates its own set of issues, including per-user access control,
API versioning, network/connection management, etc.

With Synchro, because your mobile client application logic is running in a server environment, much like a web application,
that code can talk directly to your enterprise resources without that extra layer of client-server logic. Your mobile app
code will look a lot more like the clean, simple web app version of that application.

----

![Security]({{ site.baseurl }}/assets/icon/security.png)

## Provable Security

In the Synchro model, the mobile client communicates with a single Synchro endpoint over a secure connection (in fact, the
mobile client device cannot communicate with any other server or network endpoint). Other than a session token, the mobile
client does not maintain any local state (no local data storage, no cached data, etc). None of your data is exposed on device
storage or over the connection. And since Synchro apps are running on the server, you can monitor usage and even revoke the
ability for any or all users to access the application, in real time.

----

![Enterprise]({{ site.baseurl }}/assets/icon/node.png)

## Enterprise-friendly Platform

The server side of Synchro is implemented in [Node.js](https://nodejs.org/), which is widely used in the enterprise. 
Node.js is a mature, well-supported platform with the ability to connect to just about anything. Your Synchro apps will
run under Node.js and be implemented in JavaScript. If you know and/or love Node.js or JavaScript, then you are going to
love Synchro as a mobile app solution. If you don't know anything about Node.js, you can still be up and running very
quickly (and you'll learn to love it - trust us).
