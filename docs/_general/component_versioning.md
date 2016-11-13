---
title: Component Versioning
weight: 17
---

A running Synchro solution employs three components: The Synchro server, the Synchro app, and the Synchro mobile client.  Each of these
components interacts with other components and may have expectations about the protocol and level of service offered by those components.

For example, a Synchro app may use certain controls, and it needs to be able to confirm that the client version is sufficient to supply
those controls.  Or the Synchro server may expect that the Synchro app modules implement certain exported functions that comply to a certain
definition.

To the extent possible, all components of a Synchro solution are as lenient as possible, and work to be backward and forward compatible.
But some situations arise where specified version requirements must be defined and enforced to ensure proper app operation (particularly
if you have deployed custom Synchro mobile apps to your end users, and then later upgrade to a newer version of Synchro server and begin
to use new features or controls available in the mobile clients that correspond to that server release).

The Synchro server and the Synchro mobile client application each have version numbers, defined in the form: x.x.x (and complying with the
[semver](http://semver.org/) versioning semantic).  The Synchro app definition may impose version requirements on both the Synchro server
and the Synchro mobile client, as illustrated below in the package.json of the "Civics" sample app:

 
    {
      "name": "synchro-civics",
      "version": "0.1.0",
      "description": "Synchro Civics",
      "main": "civics_main",
      "private": true,
      "engines": { "synchro": "*" },
      "synchro": 
      {
        "clientVersion": ">=1.1"
      } 
    }

The `engines` key, typically used to define the version of the Node framework required, in this case specifies that this app is to be run
by the Synchro server. In the example above, the semver constraint of "*" indicates that any version is acceptable.

The "synchro" key contains Synchro app specific settings. If the `clientVersion` is specified, then its value is a semver constraint indicating
the version requirements that this Synchro app places on the Synchro mobile client.

Lastly, the Synchro server may have constraints as to whiat level of the Synchro mobile client it requires, as defined in the server
configuration element `CLIENT_VERSION`. This will default to a fairly lenient client version requirement, as the Synchro server is good
at being backward compatible. However, if you want to set a constraint at the server level on behalf of your apps, that may be preferable
to defining such constraints for each app (assuming they are all the same).

In any event, if the mobile client does not meet the constraints either of the Synchro server or of the Synchro app to which it is trying to
connect, the end user will receive an appropriate message indicating that they need a newer version of the mobile client application.
