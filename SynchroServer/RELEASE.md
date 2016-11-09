## Synchro Server Release Process

To set/increment the version number and check in a tagged release:

    ./release.sh

To publish the release to npm:

    ./publish.sh

This will leave the published release of synchro-server tagged as "next".  Test installing that release by doing:

    synchro init -v x.x.x

where x.x.x is the version you just published.  Verify that the proper version was installed, including 
versions of Synchro modules.

Create a test app and run:

    synchro new hello
    npm start

Verify by accessing server via web at http://localhost:1337, navigate to app web UX and test.

If all goes well, promote the published synchro-server version to "latest":

    npm dist-tag add synchro-server@x.x.x latest
    npm dist-tag rm synchro-server next

Finally, test `synchro init` without a version specified (in new test directory):

    synchro init

Verify that the proper version was installed, including versions of Synchro modules.

Create a test app and run

    synchro new hello
    npm start

Verify by accessing server via web at http://localhost:1337, navigate to app web UX and test.

If no issues, you are done!
