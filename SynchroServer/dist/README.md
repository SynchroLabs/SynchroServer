# Synchro Server Dist

## To update current published version of server that will be used by Synchro CLI

### Update and publish the Synchro modules:

For each of synchro-api, synchro-aws, synchro-azure, and synchro-studio:

* Update version in package.json
* delete any previous tarball
* npm pack
* Upload resulting tarball to synchroncus\Blobs\dist

### Update and publish the Synchro Server (dist) package:

* Review dependency changes between SynchroServer package.json and dist\package.json, update dist\package.json as appropriate
* Regenerate npm-shrinkwrap.json in SynchroServer (npm shrinkwrap) and compare to dist\npm-shrinkwrap.json, update dist\npm-shrinkwrap.json as appropriate
* Update version in package.json
* Update versions for synchro module dependencies (to match the ones you created and uploaded above) in package.json and npm-shrinkwrap.json
* Copy app.js from the Synchro server project to dist
* Delete any previous synchro-server tarball
* npm pack
* Upload resulting tarball to synchroncus\Blobs\dist
* You may test at this point using the CLI and specifying that you want to init using the specific version: `synchro init -v X.X.X`
* Remove the version suffix (rename tarball) and upload the new synchro-server.tgz to synchroncus\Blobs\dist (thereby making it the new default)

### Update and publish sample apps

To update samples that can be downloaded/installed by Synchro CLI, go into each app directory (under synchro-apps) and

* Delete any previous tarball
* npm pack
* upload resulting tarball to synchroncus\Blobs\apps

To update versions of sample apps used by api.synchro.io

* Update the version of Synchro running there (as necessary)
* Upload contents of each sample app into cooresponding synchroncus\Blobs container

