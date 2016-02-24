# Synchro Server

## Install and run from repo:

1) Clone repo

2) Install npm dependencies

    npm install

navigate to each of the following directories and run "npm install" there also:

    node_modules/synchro-api
    node_modules/synchro-aws
    node_modules/synchro-azure
    node_modules/synchro-studio

    synchro-apps

## Configuration Mechanism

Synchro supports several mechanisms for configuration, and those mechanisms can even be combined as appropriate.  Synchro configuration is processed with the following precedence:

1) Command-line parameters

To see the list of supported command line parameters:

    node app.js --help

2) Environment variables

When setting a Synchro config element using an environment variable, you must prefix the element name with "SYNCHRO__".  If the element is located in an object hierarchy, you may represent the element path by using the "__" separator.  For example, to set an element that would be expressed in JSON like this:

    "MODULESTORE":
    {
    	"DIRECTORY": "somedir"
    }

You would set an environment variable like so:

    set SYNCHRO__MODULESTORE__DIRECTORY=somedir

3) Configuration file

The configuration file is JSON encoded.  It can be specified via the command line, using the -c parameter.  It can also be specified using the `SYNCHRO_CONFIG` environment variable.  If no configuration file is specified, Synchro will look for a file called `synchro.json`.  If that file is not found, no configuration file will be used.

4) Defaults

Synchro contains reasonable defaults that allow it to run in local, development mode with no explicit configuration.  If you just want to get up and running, you can ignore configuration for now and just run.

## Configuration Elements

!!! Document settings, including all services and their config elements
