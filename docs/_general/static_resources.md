---
title: Static Resources
weight: 21
---

Synchro applications often refer to static resources (most often image files).  You are certainly free to use fully qualified URLs
pointing to resources hosted on the Internet (or otherwise reachable from your mobile client apps) if you like.  And if you only do
that, you may ignore this article entirely.

However, it may be useful to take advantage of Synchro Server's resource mapping and local development resource serving functionality.

If you put your Synchro app resources in a directory called "resources" in your app, and you use `Synchro.getResourceUrl()` in your Synchro
app code to get the paths to your resources, everything should magically work.  For more details, including troubleshooting and migration
to production environments, read on.

Note: Capitalized values below represent configuration settings.  For more information on these settings, see: 
[Server Configuration Settings](server-configuration-settings).  For information on how to set/modify these settings in your environment, 
see: [Server Configuration](server-confguration).

# Local Development / Out of the Box

For local development purposes, you should place any static resources for a Synchro app in a directory called "resources" inside your app.
Your Synchro Server will then serve those resource files at a path composed as follows:

/API_PATH_PREFIX/yourAppPath/resources 

When you use `Synchro.getResourceUrl()` to specify a resource URL, it will produce a URL composed as follows:

PROTOCOL://HOST:PORT/API_PATH_PREFIX/yourAppPath/resources/yourResource 

For example:

http://192.168.1.20:1337/api/youApp/resources/user.png

WARNING: The most common issue with this approach is that in some environments Synchro is unable to properly determine the correct HOST
value (one that is reachable from the client devices accessing your Synchro app).  The HOST value should be whatever you use in your Synchro
app endpoints for the host.  For local testing from simulators running on the same machine on which Synchro Server is running, "localhost"
should work fine.  For testing with external devices, you will need either your external IP address or a hostname that will be resolvable
by the client devices.  Synchro Server defaults the HOST to what it thinks your external IP address is, but the result of that process is
not always correct (or reachable externally).

Assuming your HOST is either correctly determined automatically, or set explicitly in your configuration, there is no other configuration
required to serve static resources using Synchro Server and access them from your apps using `Synchro.getResourceUrl()`.

# Moving to Hosted Apps / Production

When moving your Synchro apps to hosted or production servers, you will probably not want to continue serving your static resources using
Synchro Server.  Synchro Server is serving those resources via Node.js using `sendFile` and is generally not as smart or efficient as a
production web server or content distribution network (CDN) would be.  So you will probably want to think about moving your static resources,
and then setting the Synchro Server configuration to allow `Synchro.getResourceUrl()` to resolve to the location from which you are serving them.

The configuration setting APP_RESOURCE_PREFIX specifies where Synchro should look for resources.  You may set this as a top level
configuration element to cause all Synchro apps running on the server to use the same location.  You may also provide this value inside
of the configuration for a given Synchro app to use that location for resources used by that Synchro app.  

You may of course combine these techniques, with a global default and overrides for one or more Synchro apps. 

Here is an example config:

    {
      ...
      "APP_RESOURCE_PREFIX": "http://cdn.site.com/static1",
      "APPS": {
        "my-app1": {
          ...        
        },
        "my-app1-test": {
          ...
        },
        "my-app2": {
          ...
          "APP_RESOURCE_PREFIX": "http://cdn.site.com/static2",
        },
      }
    }

In the example above, `my-app1` and `my-app1-test` will both use the system default resource location (static1), while `my-app2` will
override that and use a different location (static2).
