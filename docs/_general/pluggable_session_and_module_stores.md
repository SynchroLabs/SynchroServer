---
title: Pluggable Session and Module Stores
weight: 24
---

Synchro uses a __session store__ to track client sessions, which includes all live application state.  Synchro also uses a __module store__
to load (and deploy/update) its modules (your Synchro app code).  By default, Synchro uses built-in lightweight implementations of
these stores (an in-memory session store, and a local-file module store) that require no configuration.

Other session store and module store implementations are provided for use in production deployments, including support for a session
store on Redis, and module stores on Microsoft Azure, Amazon AWS, Google GCloud, OpenStack (including IBM BlueMix), and more.  

Note: Configuration examples given below are in JSON format, as they would appear in your config.json file.  These configuration
settings may also be specified via environment variables.  It is even possible to specify some of the configuration in config.json
and some in environment variables (a common use case of this model would be to put the passwords in environment variables and everything
else in config.json).  For more information about how to specify configuration information, see: [Server Configuration](server-configuration).

# Session Stores

### `MemorySessionStore`

In memory, lightweight, not persistent.  No configuration.

### `FileSessionStore`

In memory, disk backed, lightweight, persistent.  This session store is typically used for testing where persistence is required
across instances (restarts).  It also allows inspection of the session data in real-time or post-mortem.

Configuration: 

    "SESSIONSTORE_SERVICE": "FileSessionStore"
    "SESSIONSTORE": {
      "sessionStateFile": "sessions.json"
    }

### `RedisSessionStore`

Robust, highly scalable production session store on Redis.  All production deployments should use this session store.  Managed Redis
services are available on every integrated cloud service platform (including Azure, Amazon AWS, IBM BlueMix, and many others), or you
may choose to use a Redis server that you manage.

Configuration:

    "SESSIONSTORE_SERVICE": "RedisSessionStore"
    "SESSIONSTORE": {
      "host": "xxxxxx",
      "port": 6379,
      "password": "xxxxxx"
    }
 
# Module Stores

### `FileModuleStore`

Lightweight, local file storage.  No configuration is required, unless you want to change the root directory of the module store.

Configuration:

    "MODULESTORE_SERVICE": "FileModuleStore"
    "MODULESTORE": {
      "directory": "synchro-apps"
    }

### `PkgCloudModuleStore`

Using PkgCloud module to access storage across a wide variety of storage backends, including Amazon, Azure, Google, HP, OpenStack 
(including IBM BlueMix), and RackSpace.  For details on configuring this module store to use a storage option not detailed below, see
the [PkgCloud project docs](https://github.com/pkgcloud/pkgcloud#storage).

Configuration:

For all module stores using PkgCloud: 

    "MODULESTORE_SERVICE": "PkgCloudModuleStore"

For Azure add:

    "MODULESTORE": {
      "provider": "azure",
      "storageAccount": "xxxxxx",
      "storageAccessKey": "xxxxxx"
    } 

For Amazon S3 add:

    "MODULESTORE": {
      "provider": "amazon",
      "keyId": "xxxxxx", // access key id
      "key": "xxxxxx", // secret key
      "region": "xxxxxx" // region
    }

For IBM BlueMix (OpenStack) add:

    "MODULESTORE": {
      "provider": "openstack",
      "keystoneAuthVersion": "v3",
      "authUrl": "https://identity.open.softlayer.com/",
      "region": "xxxxxx",
      "tenantId": "XXXXXXXX", // projectId as provided in your Service Credentials
      "username": "XXXXXXXX",
      "password": "XXXXXXXX",
      "domainId": "XXXXXXXX",
      "domainName": "XXXXXXXX"
    }
