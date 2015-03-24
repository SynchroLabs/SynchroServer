# Synchro

## Install and run server

Go to the SynchroServer directory under this directory and follow the installation instructions in the README found there.

## Deploy to Azure Cloud (api.synchro.io)

Install and run locally, per above (under Azure Cloud Service emulation or just under node directly), then:

1) Copy Synchro apps (SynchroServer/synchro-app/*) to appropriate blob storage containers

2) Copy azure.json (not checked in) over SynchroServer/config.json

3) Include synchro-apps node_modules in the project:

    SynchroServer/synchro_apps/node_modules -> Include in project
    SynchroServer/synchro_apps/field-engineer/node_modules -> Include in project

4) Publish SynchroServer.Azure

To debug:

Conntect to cloud service via Remote Desktop

Active configuration will be in either E: or F: under \sitesroot\0\

Note: There can be long path issues packaging and publishing.  To avoid these:

1) Project should be in as shallow a directory as possible (C:\Dev\SynchroServer)

2) TEMP and TMP environment vars should both point to a shallow directory (C:\Temp)

3) ServiceOutputDirectory should be something short (C:\Azure\) - see: http://govada.blogspot.com/2011/12/windows-azure-package-build-error.html

4) You will still need to delete the following directories (test files not needed in deployment) due to long path: 

    C:\Dev\SynchroServer\SynchroServer\node_modules\synchro-azure\node_modules\azure\node_modules\request\node_modules\form-data\node_modules\combined-stream\node_modules\delayed-stream\test\
    C:\Dev\SynchroServer\SynchroServer\node_modules\synchro-azure\node_modules\azure-storage\node_modules\request\node_modules\form-data\node_modules\combined-stream\node_modules\delayed-stream\test\
