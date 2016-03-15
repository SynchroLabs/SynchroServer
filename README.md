# Synchro

## Install and run server

Test [#40](//github.com/SynchroLabs/SynchroServer/issues/40)

Go to the SynchroServer directory under this directory and follow the installation instructions in the README found there.

## Deploy to Azure Web Service (api.synchro.io)

1) Update the Synchro app code in synchro-apps (Samples, Civics, etc) on the Azure blob store, as appropriate

2) Copy config_azure.json (not checked in) over config.json

3) Publish SynchroServer project using VS

## Installation Notes

There can be long path issues in Azure packaging and publishing.  To avoid these:

1) Project should be in as shallow a directory as possible (C:\Dev\SynchroServer)

2) TEMP and TMP environment vars should both point to a shallow directory (C:\Temp)

3) ServiceOutputDirectory should be something short (C:\Azure\) - see: http://govada.blogspot.com/2011/12/windows-azure-package-build-error.html
