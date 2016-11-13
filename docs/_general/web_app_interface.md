---
title: Using and Integrating the Web App Interface
weight: 22
---

Synchro can provide web app interfaces along with support for native applications.  These web apps can be served from Synchro Server or
your own Node server, and can even be integrated with your own web app or framework (no external dependencies and Node.js or Synchro required). 

# Turn-Key Synchro Web Apps from your Synchro Server

The Synchro configuration variable `APP_PATH_PREFIX` determines whether, and from where, Synchro Server will serve turn-key web apps for
each installed Synchro app. By default, this value is set to "/app", meaning that web apps will be served from host:port/app/[synchro-app-path].
If you set this configuration value to `null`, then Synchro Server will not serve web apps.

When serving turn-key web apps from your Synchro Server, the Synchro app list on the main web page provided by that server will now include
a "Web App" link that will take you to the web app for each Synchro app/endpoint.

# Turn-Key Synchro Web Apps from your own Node server

Synchro Server includes a dependency called synchro-web, which provides Synchro web app code and services.  This module can be found in
node_modules/synchro-web under your Synchro Server installation.  Synchro Web contains a module called app.js that you can run under your
own Node server by doing:

    node app.js

This will serve the same turn-key Synchro web apps as above, but from your own Node.js instance (with no dependencies on Synchro Server
or any of its components).  You would likely need to customize app.js for a real deployment, including providing the Synchro app endpoint
and choosing an appropriate port, etc. 

# Integrating Synchro Web Apps into an existing web application

Synchro Web Apps can be integrated with existing web applications and served from the same framework that serves those applications.  Synchro
Web Apps have no dependencies on Synchro Server or Node.js, and no external dependencies (they do not rely on JQuery, etc).

The following instructions refer to the Synchro Web directory, which is located in your Synchro Server directory under node_modules/synchro-web. 

The only requirements for integration of a Synchro Web App are as follows:

1) Your page must include the Synchro css file, located at public/stylesheets/synchro.css in the Synchro Web directory (you may serve this
file from anywhere you like).

2) Your page must define the SynchroInit function, which the Synchro Web App will call on startup: 

    function SynchroInit(synchro)
    {
        // Wire your back button, if any, to synchro.goBack()

        var synchroApp =
        {
            endpoint: ???,  // required
            container: ???, // required
            onSetPageTitle: function(title) // optional
            {
            },
            onSetBackEnabled: function(isEnabled) // optional
            {
            },
            onMessageBox: function(messageBox, execCommand) // optional
            {
            },
        }
        return synchroApp;
    }

3) Your page must include the Synchro web app JavaScript support module, located at public/script/synchro.js in the Synchro Web directory
(you may serve this file from anywhere you like).

For an example page template, including a working implementation of SynchroInit, please see the template used for the turn-key Synchro web
interface, located at views/index.hbs in the Synchro Web directory.  You are free to use or modify this template as needed.
