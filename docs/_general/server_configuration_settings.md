---
title: Server Configuration Settings
weight: 20
---

This article covers the Synchro server configuration settings and their default values. For more information on the mechansims that you
can use to set these values, see [Server Configuration](server-configuration).

# General Settings

### `CLIENT_VERSION`

Default value: ">=1.1"

### `PROTOCOL`

Default value: http

### `HOST`

Default value: The first external IP address found on the system

### `PORT`

Default value: 1337

### `NOFORK`

Default value: false

### `DEBUG_BASE_PORT`

Default value: 6868

# App Configuration

### `APP_ROOT_PATH`

Default value: 'synchro-apps'

This value is covered in much more detail in [Application Packaging and Dependencies](application-packaging-and-dependencies).

### `API_PATH_PREFIX`

Default value: "/api"

### `APPS`

Default value: {}

# Synchro Studio Settings

### `NOSTUDIO`

Suppress Studio user interface.

### `STUDIO_USERS`

Default value: []

### `STUDIO_PATH_PREFIX`

Default value: "/studio"

### `STUDIO_NOAUTH`

Default value: true if no users defined, otherwise false (by default, we will require authentication only if there are any users defined)

### `STUDIO_TITLE`

The main title displayed on the Synchro Studio landing page

Default value: "Synchro API Server"

### `STUDIO_SUBTITLE`

The secondary title displayed on the Synchro Studio landing page

Default value: "The following Synchro apps are being served here:"

# App Resource Settings

For more information on how the values below are used in serving resources, see: [Static Resources](static-resources).

### `API_URI_BASE`

Default value: Composed by combing the PROTOCOL, HOST, and PORT, plus the API_PATH_PREFIX.

### `APP_RESOURCE_PREFIX`

Default value: API_URI_BASE plus a URI path element representing the app being served, plus the static string "resources/". For
example: http://192.168.1.20:1337/api/samples/resources/

Note that this configuration element can also be provided at the app level to override the resource location for a specific app.

For more information about this setting, please see: [Static Resources](static-resources).

# Logging Configuration

### `LOG4JS_CONFIG`

Default value:

    { 
        // Redirect console.log to log4js, turn off color coding appenders:
        [
            { type: "console", layout: { type: "basic" } }
        ],
        replaceConsole: true,
        levels:
        {
            '[all]': 'INFO'
        }
    }

# Session Store Configuration

### `SESSIONSTORE_PACKAGE`

Default value: 'synchro-api'

### `SESSIONSTORE_SERVICE`

Default value: 'MemorySessionStore'

# Module Store Configuration

### `MODULESTORE_PACKAGE`

Default value: 'synchro-api'

### `MODULESTORE_SERVICE`

Default value: 'FileModuleStore'

### `MODULESTORE`

Default value:

    {
        'directory': 'synchro-apps'
    }
