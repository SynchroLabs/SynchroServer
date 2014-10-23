﻿// API request delegator - return processor object to route API requests
//
// We have two modes of operation.  We can fork a child process, optionally putting it into debug mode on a specified
// port, or we can run the same handlers in-proc (useful for debugging the child code in the local debugger).
//
// Returned processor has the interface:
//
//     debugPort
//     processHttpRequest(request, response);
//     
var wait = require('wait.for');
var util = require('./util');

var log4js = require('log4js');
var logger = require('log4js').getLogger("api-request-delegator");

function createForkedRequestProcessorAsync(params, debugPort, loggingConfig, onCreated)
{
    // This ref to the processor proxy is so we can call the http post processing in-proc
    var apiRequestProcessorProxy = require("./api-request-processor-proxy"); 

    var args = [JSON.stringify(params), JSON.stringify(loggingConfig)]; // args passed to child process (will start at argv[2] in child process)
    var options = {};
    if (debugPort)
    {
        options['execArgv'] = ['--debug=' + debugPort];
    }
    options['silent'] = true;
            
    logger.info("Launching child process...");

    var childProcess = require('child_process').fork(__dirname + '/api-request-processor-proxy.js', args, options);
    if (!childProcess)
    {
        logger.info("Child process fork failed!");
        return null;
    }

    // Supposedly when silent == false the child "inherits" the main process stdout/stderr, but in practice
    // I see no console/log output over stdout when I run that way.  Running with silent == true and piping
    // the child streams seems to work fine.
    //
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);

    // This mechanism is supposed to put the child process into debug mode, but doesn't seem to work.
    // This would be particularly useful if there was a way to talk to the child process debugger without
    // using a port (such as by using streams of some kind).
    //
    //     process._debugProcess(child.pid); // Error: The system cannot find the file specified.
    //

    function getRequestDataObject(request)
    {
        // The http "request" object is a giant sloppy pig full or ciruclar references, class getters that rely on other
        // complex members, and lots of redundancy and other madness.  We're going to create a data-only object that can
        // be passed over the wire (including via parent->child message) containing the basic request content.
        //
        var requestData = 
        {
            httpVersion: request.httpVersion,
            httpVersionMajor: request.httpVersionMajor,
            httpVersionMinor: request.httpVersionMinor,
            method: request.method,
            url: request.url,
            secure: request.secure,
            headers: request.headers,
            body: request.body
        }

        return requestData;
    }

    var requestProcessor =
    {
        sessionStoreSpec: params.sessionStoreSpec,
        moduleStoreSpec: params.moduleStoreSpec,
        isForked: true,
        isDebug: debugPort > 0,
        debugPort: debugPort,

        processHttpRequest : function(request, response)
        {
            logger.info("Process forked child http request");

            // Record the request/response in pendingRequests, then post a message to the child process with the request
            //
            var id = requestId++;
            pendingRequests[id] = { request: request, response: response };
            childProcess.send({cmd: "processHttpRequest", id: id, request: getRequestDataObject(request)});
        },

        reloadModule: function(moduleName)
        {
            // !!! Also need a way to get signalled that it got done?
            logger.info("Notify child process to reload module: " + moduleName);
            childProcess.send({cmd: "reloadModule", moduleName: moduleName});
        }
    }

    var requestId = 0;
    var pendingRequests = {};

    // Listen for messages back from the child process indicating request processing complete
    //
    childProcess.on('message', function(message) 
    {
        switch (message.type)
        {
            case "status":
            {
                if (message.status == "Started")
                {
                    logger.info("Got started message from child process: " + JSON.stringify(message));
                    // Child process has signalled that it's ready to go
                    onCreated(null, requestProcessor);
                }
            }
            break;

            case "httpRequest":
            {
                // Look up the pending request info bound to this id, call the child module to process it, and remove the pending request
                //
                logger.info("Processing pending request id: " + message.id);
                var pendingRequest = pendingRequests[message.id];
                delete pendingRequests[message.id];
                apiRequestProcessorProxy.postProcessHttpRequest(pendingRequest.request, pendingRequest.response, message.err, message.data);
            }
            break;
        }
    });
}

function createInProcRequestProcessorAsync(params, onCreated)
{
    var apiRequestProcessorModule = require("./api-request-processor");
    var apiRequestProcessor = apiRequestProcessorModule.createApiRequestProcessorAsync(params);

    var requestProcessor =
    {
        sessionStoreSpec: params.sessionStoreSpec,
        moduleStoreSpec: params.moduleStoreSpec,
        isForked: false,
        isDebug: false,
        debugPort: 0,

        processHttpRequest : function(request, response)
        {
            logger.info("Process in-proc child http request");
            apiRequestProcessor.processHttpRequest(request, function(err, data)
            {
                apiRequestProcessorModule.postProcessHttpRequest(request, response, err, data);
            });
        },

        reloadModule: function(moduleName)
        {
            apiRequestProcessor.reloadModule(moduleName);
        }
    }

    onCreated(null, requestProcessor);
}

module.exports = function(sessionStoreSpec, moduleStoreSpec, resourceResolverSpec, fork, debugPort, loggingConfig, onCreated)
{ 
    var params = 
    {
        sessionStoreSpec: sessionStoreSpec,
        moduleStoreSpec: moduleStoreSpec,
        resourceResolverSpec: resourceResolverSpec
    };

    if (fork)
    {
        createForkedRequestProcessorAsync(params, debugPort, loggingConfig, onCreated);
    }
    else
    {
        wait.launchFiber(createInProcRequestProcessorAsync, params, onCreated);
    }
}