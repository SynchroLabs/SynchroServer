﻿// API request delegator - return processor object to route API requests
//
// We have two modes of operation.  We can fork a child process, optionally putting it into debug mode on a specified
// port, or we can run the same handlers in-proc (useful for debugging the child code in the local debugger).
//
// Returned processor has the interface:
//
//     debugPort
//     processHttpRequest(request, response);
//     processWebSocket(request, socket, body);
//     
module.exports = function(fork, debugPort)
{
    var child = require("./api-request-delegatee");

    var childProcessor = null;
    if (fork)
    {
        var args = ['1']; // Child id (argv[2] in child process)
        var options = {};
        if (debugPort)
        {
            options['execArgv'] = ['--debug=' + debugPort];
            options['silent'] = true;
        }

        var childProcess = require('child_process').fork(__dirname + '/api-request-delegatee.js', args, options);

        childProcess.stdout.on('data', function(data) {
            console.log("[API]" + data.toString()); 
        });

        childProcess.stderr.on('data', function(data) {
            console.log("[API]" + data.toString()); 
        });

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

        var requestId = 0;
        var pendingRequests = {};

        // Listen for messages back from the child process indicating request processing complete
        //
        childProcess.on('message', function(message) 
        {
            // Look up the pending request info bound to this id, call the child module to process it, and remove the pending request
            //
            console.log("Processing pending request id: " + message.id);
            var pendingRequest = pendingRequests[message.id];
            delete pendingRequests[message.id];
            child.postProcessHttpRequest(pendingRequest.request, pendingRequest.response, message.err, message.data);
        });

        childProcessor =
        {
            debugPort: debugPort,

            processHttpRequest : function(request, response)
            {
                console.log("Process forked child http request");

                // Record the request/response in pendingRequests, then post a message to the child process with the request
                //
                var id = requestId++;
                pendingRequests[id] = { request: request, response: response };
                childProcess.send({cmd: "processHttpRequest", id: id, request: getRequestDataObject(request)});
            },

            processWebSocket: function(request, socket, body)
            {
                console.log("Process forked child web socket");
                childProcess.send({cmd: "processWebSocket", request: getRequestDataObject(request), body: body}, socket);
            }
        }
    }
    else
    {
        childProcessor =
        {
            debugPort: null,

            processHttpRequest : function(request, response)
            {
                console.log("Process in-proc child http request");
                child.processHttpRequest(request, function(err, data)
                {
                    child.postProcessHttpRequest(request, response, err, data);
                });
            },

            processWebSocket: function(request, socket, body)
            {
                console.log("Process in-proc child web socket");
                child.processWebSocket(request, socket, body);
            }
        }
    }

    return childProcessor;
}