# Synchro Server

## Install and run from repo:

1) Clone this repo to your machine

2) Go to SynchroServer/SynchroServer and install npm dependencies:

    npm install

navigate to each of the following directories and run "npm install" there also:

    node_modules/synchro-api
    node_modules/synchro-aws
    node_modules/synchro-azure
    node_modules/synchro-studio

    synchro-apps

3) Install SynchroSamples

Clone the [SynchroSamples repo](https://github.com/SynchroLabs/SynchroSamples) into your SynchroServer/SynchroServer/synchro-apps directory.

Then install SynchroSamples into your config by doing:

```
$ synchro add SynchroSamples samples
```

4) Run

In SynchroServer/SynchroServer do either `npm start` or `node app.js` to run Synchro server.

5) Verify

You should be able to point a client at api/samples on your server and verify that everything is working.  If you don't see the Synchro cloud image on the Samples menu page, then you may need to modify your HOST config value.

## WARNING

The SynchrServer project has a gitignore setting that will ignore any apps you install in synchro-apps.  This will allow you to install and run apps in your server dev environment without those apps being part of the SynchroServer project.  You may either install apps using `synchro install` or by cloning repos into synchro-apps and using `synchro add` (as described above).  The one potential issue here is that since the SynchroServer git project believes that it owns the entire directory structure, certain commmands (like `git clean`) could cause any uncommitted changes in repos located inside of the synchro-apps directory to be lost.
