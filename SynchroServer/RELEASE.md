## Synchro Server Release Process

### Remove dev dependencies and shrink-wrap

    npm prune —production
    npm shrinkwrap

### Copy files to /dist

    cp app.js dist
    cp npm-shrinkwrap.json dist

### Verify dist/package.json deps are same as package.json deps

### Update package version in all locations:

* package.json
* dist/package.json (also update synchro module versions)
* dist/synchro-apps/package.json
* node_modules/synchro-api/package.json
* node_modules/synchro-studio/package.json
* node_modules/synchro-web/package.json

### Publish synchro modules (as "@next")

    npm publish node_modules/synchro-api —tag next
    npm publish node_modules/synchro-studio —tag next
    npm publish node_modules/synchro-web —tag next

### Create and upload "versioned" Synchro Server

    cd dist
    npm pack
    
Upload created synchro-server-x.x.x.tgz to blob.synchro.io/dist (use Visual Studio on PC, or Microsoft Azure Storage Explorer on Mac)

### Test `synchro init` specifying new version
In new test directory:

     synchro init -v x.x.x # <- use actual version number

Verify that the proper version was installed, including versions of Synchro modules.

Create a test app and run

    synchro new hello
    npm start

Verify by accessing server via web at http://localhost:1337, navigate to app web UX and test.

If all goes well, continue below to promote release to production

### Promote published Synchro modules to "latest"

Note: use actual version number in place of x.x.x below

    npm dist-tag add synchro-api@x.x.x latest
    npm dist-tag add synchro-studio@x.x.x latest
    npm dist-tag add synchro-web@x.x.x latest
    npm dist-tag rm synchro-api next
    npm dist-tag rm synchro-studio next
    npm dist-tag rm synchro-web next

### Update dist version of Synchro Server to "current" (unversioned)

Copy dist/synchro-server-x.x.x.tgz over blob.synchro.io/dist/synchro-server.tgz

### Test `synchro init` without a version specified
In new test directory:

    synchro init

Verify that the proper version was installed, including versions of Synchro modules.

Create a test app and run

    synchro new hello
    npm start

Verify by accessing server via web at http://localhost:1337, navigate to app web UX and test.

If no issues, you are done!
