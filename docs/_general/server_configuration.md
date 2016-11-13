---
title: Server Configuration
weight: 19
---

This article covers the configuration mechanism used by Synchro Server.  For more information about the actual configuration settings, 
please see: [Server Configuration Settings](server-configuration-settings).

Configuration works the same (and is shared) between Synchro server (app.js) and Synchro CLI commands.

Each configuration value is determined by evaluating the following, in order, until a value is found:

1. Command line parameters
1. Environment variables
1. The Configuration File
1. Built-in, Default Values

# Specifying the Configuration File

By default, both the Synchro server and all Synchro CLI commands will use a configuration file named "config.json" in the main application
directory of the Synchro server (which is also the directory where Synchro CLI commands for that server will be executed).

You may specify a different configuration file as a command line parameter, or set a reference to the configuration file to be used in an
environment variable. In addition to any general configuration settings, the configuration file may contain service definition/configuration,
and the list of installed apps for that configuration. This makes it easy to define multiple configurations which might use different services
and serve different sets of applications (such as “local”, “azure”, “azure-dev”, etc).

Example: Synchro server with config on command line:

    node app.js -c config.json

Example: Synchro CLI with config on command line:

    synchro new hello-world -c azure.json

Example: Setting the config via an environment variable:

    set SYNCHRO_CONFIG=azure-dev.json

If set via an environment variable (and not overridden on the command line), both the Synchro server and Synchro CLI will use that configuration.

# Environment Variables

To define a configuration setting via an environment variable, prefix the setting with `SYNCHRO__` and use the __ (double underscore) separator
as needed to represent any configuration member paths.

For example, to set the value MODULESTORE.storageAccount (for the Azure module store), you would do:

    set SYNCHRO__MODULESTORE__storageAccount=xxxxxxxxxx

A common approach is to use a config file for many settings, but to supplement those settings using environment variables for things that
are either deployment-specific or secure/secret. For example, if you had a configuration element that contained an API key, and you didn't
want that value contained in the files you push to your cloud server, or checked in to your revision control system, your could just specify
that particular value using an environment variable.

# Configuration Setting Example

A commonly used and easy to understand configuration setting is `PORT`, which defines the port on which the server will listen.

## Default Value

The default value for `PORT` is 1337. This value will be used unless it is overridden by one of the methods below.

## Configuration File

The PORT can be defined in your configuration file, for example:

    {
        PORT: 8000
    }

This will override the default value.

## Environment Variable

You can set the value for `PORT` via an environment variable (as described above), which will override any default or 
config-file-specified `PORT`. For example:

    set SYNCHRO__PORT=8080

## Command Line

The PORT can be set via the command line using the "-p" or "--port" flags. If set via the command line, that setting will override any other
method of setting the port. For example:

    $ node app.js -p 8888

# Application Configuration

The set of Synchro apps being served is represented by the top level configration element `APPS`, which is itself a dictionary of path mappings,
each of which contains a dictionary of data related to the app being served at that path.

For example:

    {
        "APPS": {
            "samples": {
                "container": "samples"
            }
            "samples2": {
                "container": "samples"
            }
            "civics": {
                "container": "civics",
                "GOOGLE_API_KEY": "meowquackwoof"
            }
        }
    }

The set of keys under `APPS` define the endpoint suffix at which an app will be served and contain the configuration for the app to be served
at that endpoint.

The only required element in the configuration of an app is `container`, which indicates the module store container in which the app is
defined (in the default file module store, this will just be the name of the directory under "synchro-apps" in which the app resides).

In the example above, we see that the server is serving three apps. The first one is from the container "samples" and is being served at
the endpoint `/api/samples`. The second one is also from the container "samples", but is being served from the endpoint `/api/samples2`. The
third one is from the container "civics" and is being server at `/api/civics`.

The "civics" app definition also contains some app-specific configuration (the GOOGLE_API_KEY). The civics app can access that configuration
setting within the app by doing

    var myKey = Synchro.getConfig("GOOGLE_API_KEY");

You might be wondering why it would be useful to serve more than one instance of an app. The main reason is that you might want to serve
multiple instances of the same app, but with different configuration. For example:

    {
        "APPS": {
            "inventory": {
                "container": "inventoryApp",
                "DB_PATH": "productionDb"
            }
            "inventorytest": {
                "container": "inventoryApp"
                "DB_PATH": "testDb"
            }
        }
    }
