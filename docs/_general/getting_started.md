---
title: Getting Started
weight: 0
---

If you just want to get a feel for the kind of apps you can create with Synchro, [kick the tires](#kick-tires).

If you want to install Synchro and serve your own app, [take a test drive](#test-drive).

Either way, you'll be running Synchro in just a few minutes!

----

# <a name="kick-tires"></a>Kick the Tires

## Download and Explore an App Built with Synchro

__Synchro Civics__ is an app built on the Synchro platform and running in the cloud. Its uses the Google 
[Civic Information API](https://developers.google.com/civic-information/) to show your representatives at every level of 
government based on your address. Synchro Civics leverages location services on your device and the Google reverse geolocation
API to determine your approximate street address. It also allows you to mark certain government officials as favorites, and
it remembers your favorites and recently used addresses between sessions. Synchro Civics will even launch other apps on your
device to interact with your represenatives.

__Synchro Civics__ does all of this on all three mobile platforms in less than 
[200 lines of JavaScript](https://github.com/SynchroLabs/SynchroCivics) code, all running in the cloud.

![Civics Mobile]({{ site.baseurl }}/assets/img/CivicsMobileNative.png)

<p style="margin-top: 20px">
    <img src="/assets/img/CircleFlag64.png" />
    <a href="https://itunes.apple.com/us/app/synchro-civics/id1059308501?ls=1&mt=8"><img src="/assets/img/iOSAppStoreBadge135x40.svg" /></a>
    <a href="https://play.google.com/store/apps/details?id=io.synchro.client.android.customer.synchro.civics"><img src="/assets/img/GooglePlay120x40.png" /></a>
    <a href="https://www.microsoft.com/store/apps/9nblggh6gxfx"><img src="/assets/img/WindowsStore155x40.jpg" /></a>
</p>

----

# <a name="test-drive"></a>Take a Test Drive

## Install a Development Environment and Start Building Your Own Apps in 10 Minutes

### Install Node.js

If you haven't already done so, install [Node.js](https://nodejs.org/)

### Install the Synchro Command Line Interface (CLI)

    $ npm install -g synchro

### Create a new Synchro app

Create a directory and switch to it, then in the new directory:

    $ synchro init
    $ synchro new hello

This will install Synchro as a Node.js app in the directory, and create a new Synchro app called "hello".

### Run Synchro

    $ npm start

This will start a Node.js server instance running the Synchro server, which will be serving your new app.

### Verify that Node.js and Synchro are running

Using a web browser, navigate to the host/port on which Node.js and Synchro are running. This will typically be <http://localhost:1337>.

The Synchro web app server will be running by default, so you may choose the "Web App" link from the app list page to visit the web
form of the hello app you created above.

### Download the Synchro Explorer Mobile App to your Device

When you are ready to deploy your app to end users, you will use the __Synchro App Builder__ to create custom branded application
packages for each desired mobile platform. The __Synchro Civics__ app is an example of an app created with the __Synchro App Builder__.

For development and testing purposes, you will download the __Synchro Explorer__ app onto your mobile device from the appropriate app
store. Synchro Explorer is preconfigured with the Synchro Civics endpoint, as well as the Synchro Samples endpoint.

<p>
    <img src="/assets/img/synchro-logo-cloud-NEW-64.png" />
    <a href="https://itunes.apple.com/us/app/synchro-explorer/id1018974588?ls=1&mt=8"><img src="/assets/img/iOSAppStoreBadge135x40.svg" /></a>
    <a href="https://play.google.com/store/apps/details?id=io.synchro.client.android"><img src="/assets/img/GooglePlay120x40.png" /></a>
    <a href="https://www.microsoft.com/store/apps/9nblggh38qqw"><img src="/assets/img/WindowsStore155x40.jpg" /></a>
</p>

### Use Synchro Explorer to Access your App

From the Synchro Explorer main screen, select "add" and enter the endpoint of your application running on your server. The address
must be reachable by the device on which you're running Synchro Explorer (i.e. not a localhost or loopback address), and the app must
be running on your server when you add it to Synchro Explorer. Your endpoint will typically be in the form: `http://[host_or_ip_addr]:1337/api/hello`

Once you've found and added your app, it will show up in the app list in Synchro Explorer. You can then launch it from there by tapping.

### Optional: Install and Explore our Samples

If you would like to install and run the Synchro Samples app locally, you can do so by stopping your Synchro server instance, then doing:

    $ synchro install https://github.com/SynchroLabs/SynchroSamples/archive/master.zip

When you restart your Synchro server, you will be serving the Synchro Samples on your own endpoint. You can then add this endpoint to
Synchro Explorer as above.

### Optional: Work through the Synchro Tutorial

Review the [Synchro Tutorial](../tutorial) to get a step-by-step walk through of Synchro concepts, mostly outlined in code.

If you would like to install and run the Synchro Tutorial app locally, you can do so by stopping your Synchro server instance, then doing:

    $ synchro install https://github.com/SynchroLabs/SynchroTutorial/archive/master.zip

When you restart your Synchro server, you will be serving the Synchro Tutorial on your own endpoint. You can then add this endpoint to
Synchro Explorer as above.

### Optional: Debug, Modify and Redeploy on the Fly

When you visit the web site provided by the Synchro server, as you did above to verify it was running, you will see a list of the Synchro
apps running on that server. If you click one of these apps, you will enter a debugging and editing environment for the selected app. Note
that this feature can be either disabled or protected by a login for production systems.

You can select modules to view in the list on the left. Experiment by setting breakpoints and running the debugger, then accessing the app
via Synchro Explorer. You can also edit these modules in place and deploy them, even while a client is running, with the client behavior
reflecting the updated code in real time.
