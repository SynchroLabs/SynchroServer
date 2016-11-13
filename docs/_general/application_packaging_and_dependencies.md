---
title: Application Packaging and Dependencies
weight: 23
---

There is a directory, specified via the APP_ROOT_PATH configuration setting, that indicates where Synchro apps can be found on the server.
This directory contains a package.json file and a corresponding node_modules directory. Together, they define and manage the set of
dependencies made available to all Synchro apps running on that server. By default, the npm packages "request" and "lodash" are included
there. You may add additional dependencies there just like you would to a node application: by using `npm install <package> --save`.

If using the file-based module store, each Synchro application will be contained in a directory under the APP_ROOT_PATH directory. If using
another module store (such as Azure or AWS), any application with dependencies will have a directory under the APP_ROOT_PATH directory which
contains its package.json and node_modules. Note that while the package modules themselves may reside somewhere else (depending on the module
store used), the node dependencies must exist on-disk at this location.

As outlined above, each individual Synchro app has a package.json, and if it has any dependencies, will have a node_modules directory.
You may add dependencies to a Synchro app just like you would to any node application: by using `npm install <package> --save`.

When a Synchro application is installed from another location using `synchro install`, the install command will write the Synchro app modules
(including package.json) to the module store currently being used. In addition, if the active module store is not the file module store, the
install command will create a directory for the Synchro app under APP_ROOT_PATH, and copy package.json there. Finally, it will then install
any dependencies there (using npm install).
