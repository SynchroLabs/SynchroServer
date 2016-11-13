---
title: Synchro Command Line Interface
weight: 18
---

`synchro` is a command-line tool for installing and managing your Synchro Node servers and applications.

# Synchro Quick Start

## Install the Command Line Interface (CLI)

    npm install synchro -g

## Documentation

Use the --help command to get basic comand help:

    synchro --help

## Creating a Synchro server on your machine

Create a new directory and switch to it, then run:

    synchro init

This will install the Synchro server application and use npm to install all required packages.

## Creating your first Synchro App

Once Synchro has been initialized, you can create your first Synchro app by doing:

    synchro new hello-world

## Running the Synchro server

You can start the server to play with your new app by doing:

    node app.js

Or if you prefer:

    npm start

# Commands

Note: Use the -h option to get detailed help on an individual command. For example:

    synchro new -h

`synchro add`

Add an app whose container exists in the module store to the current configuration

`synchro delete`

Remove the app from the current config (if installed there) and remove the container from the module store (whethere or not the
app was installed in the current config).

`synchro init`

Download, install, and configure a Synchro server in the current working directory.

`synchro install`

Retreive a remote Synchro application and install it in the current configuration and module store. Not implemented yet!

`synchro ls`

List installed apps.

`synchro new`

Create a new application in the module store and add it to the current configuration.

`synchro remove`

Remove an app from the current config without removing its container from the module store.

`synchro syncdeps`

Ensure that the dependencies of a specified Synchro app are installed on the local server. Not implemented yet!

`synchro update`

Update a Synchro server in the current working directory to the most current version.

`synchro userpass`

Sets/clears a username/password combination in the current configuration, where such username/password is used by the default Synchro
Studio auth. Username and hash of password are written under STUDIO_USERS in current config.
