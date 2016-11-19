# Synchro

[![Build Status](https://travis-ci.org/SynchroLabs/SynchroServer.svg?branch=master)](https://travis-ci.org/SynchroLabs/SynchroServer)

## Synchro - The Cloud-Based Mobile App Platform for Node.js

This project contains the Synchro application development platform, generally referred to as Synchro Server.  In addition the main app server, this project contains:

* Syncho Studio - A web-based IDE allowing for drag-drop UX creation and editing, and a debugger for Synchro apps.
* Synchro Web - An application server that serves Synchro apps as web apps (desktop and mobile optimized)

Documentation for Synchro Server is available at: http://docs.synchro.io/

Synchro Server is supported by Synchro Labs, Inc.  For more information, see https://synchro.io

## Synchro App Development

If you want to install Synchro Server in order to build and deploy Synchro apps, you should use the Synchro Command Line Interface.

Install the Synchro CLI:

    $ npm install -g synchro
    
Then install (initialize) Synchro in a directory:
    
    $ synchro init

For details on the Synchro CLI, see: https://www.npmjs.com/package/synchro

For step-by-step instructions on installing Synchro and creating your first app, see: http://docs.synchro.io/general/getting-started

## Synchro Server Core Development

If you want to modify the Synchro Server platform itself, go to the SynchroServer directory under this directory and follow the installation instructions in the README found there.
