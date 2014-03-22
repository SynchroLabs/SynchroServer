// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// RDD - originally derived from code in Node.js internal _debugger module
//       https://github.com/joyent/node/blob/master/lib/_debugger.js
//

// V8 debugging API documented here: https://code.google.com/p/v8/wiki/DebuggerProtocol
//

var util = require('util');
var path = require('path');
var net = require('net');
var inherits = util.inherits;
var natives = process.binding('natives');
var Protocol = require('./v8protocol');

var NO_FRAME = -1;

module.exports = Client;

function Client() 
{
    net.Stream.call(this);
    var protocol = this.protocol = new Protocol(this);
    this._reqCallbacks = [];
    var socket = this;

    // Path of Node app - even when launched from another process (supervisor, pm2, forever, mocha, etc)
    this.appDir = path.dirname(Object.keys(require.cache)[0]);

    this.currentFrame = NO_FRAME;
    this.currentSourceLine = -1;
    this.currentSource = null;
    this.handles = {};
    this.scripts = {};
    this.scriptIdFromName = {};
    this.watches = [];
    this.resolvedWatches = [];

    // !!! Currently, breakpoints are not tracked by the client (the are tracked in the Interface definition in the 
    //     old code).  It might be a good idea to track them here, since we handle all of the setting and clearing
    //     and could track the exact state (it's not like the V8 debugger changes them underneath of us).  This
    //     would also facilitate things like clearAllBreakpoints, and getting the breakpoints for a particular
    //     module (which we could then do synchronously).
    //
    this.breakpoints = [];

    // Note that 'Protocol' requires strings instead of Buffers.
    socket.setEncoding('utf8');
    socket.on('data', function(d) 
    {
        protocol.execute(d);
    });

    protocol.onResponse = this._onResponse.bind(this);
}
inherits(Client, net.Stream);

Client.prototype._addHandle = function(desc) 
{
    if (typeof desc != 'object' || typeof desc.handle != 'number') 
    {
        return;
    }

    this.handles[desc.handle] = desc;

    if (desc.type == 'script') 
    {
        this._addScript(desc);
    }
};

Client.prototype._convertFullToRelativePath = function(scriptPath)
{
    // Change path to relative, if possible
    if (scriptPath && (scriptPath.indexOf(this.appDir) === 0))
    {
        return path.relative(this.appDir, scriptPath);
    }

    return scriptPath;
}

Client.prototype._addScript = function(script) 
{
    this.scripts[script.id] = script;
    if (script.name) 
    {
        script.name = this._convertFullToRelativePath(script.name)
        script.isNative = (script.name.replace('.js', '') in natives) || script.name == 'node.js';
        this.scriptIdFromName[script.name] = script.id;
    }
};

Client.prototype._removeScript = function(script) 
{
    this.scripts[script.id] = undefined;
};

Client.prototype._handleBreak = function(r) 
{
    var self = this;

    if (r.body.script)
    {
        r.body.script.name = self._convertFullToRelativePath(r.body.script.name)
    }

    // Save execution context's data
    this.currentSourceLine = r.body.sourceLine;
    this.currentSourceLineText = r.body.sourceLineText;
    this.currentSourceColumn = r.body.sourceColumn;
    this.currentFrame = 0;
    this.currentScript = r.body.script && r.body.script.name;

    // Update watched values
    console.log("Processing " + this.watches.length + " watches");
    this.updateWatches(this.currentFrame, function(err, resolvedWatches) 
    {
        // This can't return err (just populates watch value with "<error>" on error).
        this.resolvedWaches = resolvedWatches;
    });
};

Client.prototype._onResponse = function(res)
{
    var cb;
    var index = -1;

    this._reqCallbacks.some(function(fn, i) 
    {
        if (fn.request_seq == res.body.request_seq) 
        {
            cb = fn;
            index = i;
            return true;
        }
    });

    var self = this;
    var handled = false;

    if (res.headers.Type == 'connect') 
    {
        // Request a list of scripts for our own storage.
        self.reqScripts(function() 
        {
            self.emit('ready', res);
        });
        handled = true;
    } 
    else if (res.body && res.body.event == 'break') 
    {
        this._handleBreak(res.body);
        this.emit('break', res.body);
        handled = true;
    } 
    else if (res.body && res.body.event == 'exception') 
    {
        this._handleBreak(res.body);
        this.emit('exception', res.body);
        handled = true;
    }
    else if (res.body && res.body.event == 'afterCompile') 
    {
        this._addScript(res.body.body.script);
        handled = true;
    }
    else if (res.body && res.body.event == 'scriptCollected') 
    {
        // ???
        this._removeScript(res.body.body.script);
        handled = true;
    }

    if (cb) 
    {
        this._reqCallbacks.splice(index, 1);
        handled = true;

        var err = res.success === false && (res.message || true) || res.body.success === false && (res.body.message || true);
        cb(err, res.body && res.body.body || res.body, res);
    }

    if (!handled) 
    {
        this.emit('unhandledResponse', res.body);
    }
};

Client.prototype.req = function(req, cb) 
{
    this.write(this.protocol.serialize(req));
    cb.request_seq = req.seq;
    this._reqCallbacks.push(cb);
};

Client.prototype.reqVersion = function(cb) 
{
    cb = cb || function() {};
    this.req({ command: 'version' } , function(err, body, res) 
    {
        if (err)
        { 
            return cb(err);
        }
        cb(null, res.body.body.V8Version, res.body.running);
    });
};

Client.prototype.reqLookup = function(refs, cb) 
{
    var self = this;
    cb = cb || function() {};

    // TODO: We have a cache of handle's we've already seen in this.handles
    // This can be used if we're careful.
    var req = 
    {
        command: 'lookup',
        'arguments': { handles: refs, includeSource: true }
    };

    this.req(req, function(err, res) 
    {
        if (err)
        {
            return cb(err);
        }

        for (var ref in res) 
        {
            if (typeof res[ref] == 'object') 
            {
                self._addHandle(res[ref]);
            }
        }

        cb(null, res);
    });
};

Client.prototype.reqFrame = function(frameIndex, cb)
{
    var self = this;
    cb = cb || function() {};

    var req = 
    {
        command: 'frame',
        'arguments': { number: frameIndex }
    };

    this.req(req, function(err, res)
    {
        var frame = res.body;
        self.resolveFrame(frame, function(err)
        {
            if (err)
            {
                cb(err);
            }
            self.currentFrame = frame.index;
            cb(null, frame);
        });
    });

}

Client.prototype.reqScopes = function(cb) 
{
    var self = this;
    cb = cb || function() {};

    var req = 
    {
        command: 'scopes',
        'arguments': {}
    };

    this.req(req, function(err, res) 
    {
        if (err)
        {
            return cb(err);
        }
        var refs = res.scopes.map(function(scope) 
        {
            return scope.object.ref;
        });

        self.reqLookup(refs, function(err, res) 
        {
            if (err)
            {
                return cb(err);
            }

            var globals = Object.keys(res).map(function(key) 
            {
                return res[key].properties.map(function(prop) 
                {
                    return prop.name;
                });
            });

            cb(null, globals.reverse());
        });
    });
};

// This is like reqEval, except it will look up the expression in each of the
// scopes associated with the current frame.
Client.prototype.reqEval = function(expression, cb) 
{
    var self = this;
    cb = cb || function() {};

    if (this.currentFrame == NO_FRAME) 
    {
        // Only need to eval in global scope.
        this.reqFrameEval(expression, NO_FRAME, cb);
        return;
    }

    // Otherwise we need to get the current frame to see which scopes it has.
    this.reqBacktrace(function(err, bt) 
    {
        if (err || !bt.frames) 
        {
            // ??
            return cb(null, {});
        }

        var frame = bt.frames[self.currentFrame];

        var evalFrames = frame.scopes.map(function(s) 
        {
            if (!s) 
            {
                return;
            }
            var x = bt.frames[s.index];
            if (!x)
            {
                return;
            }
            return x.index;
        });

        self._reqFramesEval(expression, evalFrames, cb);
    });
};

// Finds the first scope in the array in which the epxression evals.
Client.prototype._reqFramesEval = function(expression, evalFrames, cb)
{
    if (evalFrames.length === 0) 
    {
        // Just eval in global scope.
        this.reqFrameEval(expression, NO_FRAME, cb);
        return;
    }

    var self = this;
    cb = cb || function() {};

    var i = evalFrames.shift();

    this.reqFrameEval(expression, i, function(err, res) 
    {
        if (!err)
        {
            return cb(null, res);
        }
        self._reqFramesEval(expression, evalFrames, cb);
    });
};

Client.prototype.reqFrameEval = function(expression, frame, cb) 
{
    var self = this;
    cb = cb || function() {};

    var req = 
    {
        command: 'evaluate',
        'arguments': { expression: expression }
    };

    if (frame == NO_FRAME) 
    {
        req.arguments.global = true;
    }
    else 
    {
        req.arguments.frame = frame;
    }

    this.req(req, function(err, res) 
    {
        if (!err)
        {
            self._addHandle(res);
        }
        cb(err, res);
    });
};


// reqBacktrace(cb)
// TODO: from, to, bottom
Client.prototype.reqBacktrace = function(cb) 
{
    this.req({ command: 'backtrace', 'arguments': { inlineRefs: true } } , cb);
};


// reqSetExceptionBreak(type, cb)
// TODO: from, to, bottom
Client.prototype.reqSetExceptionBreak = function(type, cb) 
{
    this.req({ command: 'setexceptionbreak', 'arguments': { type: type, enabled: true } }, cb);
};

// Returns an array of objects like this:
//
//   { handle: 11,
//     type: 'script',
//     name: 'node.js',
//     id: 14,
//     lineOffset: 0,
//     columnOffset: 0,
//     lineCount: 562,
//     sourceStart: '(function(process) {\n\n  ',
//     sourceLength: 15939,
//     scriptType: 2,
//     compilationType: 0,
//     context: { ref: 10 },
//     text: 'node.js (lines: 562)' }
//
Client.prototype.reqScripts = function(cb) 
{
    var self = this;
    cb = cb || function() {};

    this.req({ command: 'scripts', arguments: {'includeSource': true} } , function(err, scripts) 
    {
        if (err)
        {
            return cb(err);
        }

        for (var i = 0; i < scripts.length; i++) 
        {
            self._addScript(scripts[i]);
        }
        cb(null, scripts);
    });
};


Client.prototype.reqContinue = function(cb) 
{
    this.currentFrame = NO_FRAME;
    this.req({ command: 'continue' }, cb);
};

Client.prototype.listbreakpoints = function(cb) 
{
    this.req({ command: 'listbreakpoints' }, cb);
};

Client.prototype.setBreakpoint = function(req, cb) 
{
    this.req({ command: 'setbreakpoint', arguments: req }, cb);
};

Client.prototype.clearBreakpoint = function(req, cb) 
{
    this.req({ command: 'clearbreakpoint', arguments: req }, cb);
};

Client.prototype.reqSource = function(frame, from, to, cb) 
{
    frame = (frame === NO_FRAME) ? null : frame;
    this.req({ command: 'source', frame: frame, fromLine: from, toLine: to }, cb);
};

// client.next(1, cb);
Client.prototype.step = function(action, count, cb) 
{
    this.currentFrame = NO_FRAME;
    this.req({ command: 'continue', arguments: { stepaction: action, stepcount: count } }, cb);
};

Client.prototype.mirrorObject = function(handle, depth, cb) 
{
    var self = this;
    cb = cb || function() {};

    var val;

    if (handle.type === 'object') 
    {
        // The handle looks something like this:
        // { handle: 8,
        //   type: 'object',
        //   className: 'Object',
        //   constructorFunction: { ref: 9 },
        //   protoObject: { ref: 4 },
        //   prototypeObject: { ref: 2 },
        //   properties: [ { name: 'hello', propertyType: 1, ref: 10 } ],
        //   text: '#<an Object>' }

        // For now ignore the className and constructor and prototype.
        // TJ's method of object inspection would probably be good for this:
        // https://groups.google.com/forum/?pli=1#!topic/nodejs-dev/4gkWBOimiOg

        var propertyRefs = handle.properties.map(function(p) 
        {
            return p.ref;
        });

        this.reqLookup(propertyRefs, function(err, res) 
        {
            if (err) 
            {
                console.error('problem with reqLookup');
                cb(null, handle);
                return;
            }

            var mirror;
            var waiting = 1;

            if (handle.className == 'Array') 
            {
                mirror = [];
            }
            else if (handle.className == 'Date') 
            {
                mirror = new Date(handle.value);
            }
            else 
            {
                mirror = {};
            }

            var keyValues = [];
            handle.properties.forEach(function(prop, i) 
            {
                var value = res[prop.ref];
                var mirrorValue;
                if (value) 
                {
                    mirrorValue = value.value ? value.value : value.text;
                }
                else 
                {
                    mirrorValue = '[?]';
                }

                if (Array.isArray(mirror) && typeof prop.name != 'number') 
                {
                    // Skip the 'length' property.
                    return;
                }

                keyValues[i] = { name: prop.name, value: mirrorValue };
                if (value && value.handle && depth > 0) 
                {
                    waiting++;
                    self.mirrorObject(value, depth - 1, function(err, result) 
                    {
                        if (!err)
                        {
                            keyValues[i].value = result;
                        }
                        waitForOthers();
                    });
                }
            });

            waitForOthers();

            function waitForOthers() 
            {
                if (--waiting === 0 && cb) 
                {
                    keyValues.forEach(function(kv) 
                    {
                        mirror[kv.name] = kv.value;
                    });
                    cb(null, mirror);
                }
            };
        });
        return;
    }
    else if (handle.type === 'function') 
    {
        val = function() {};
    }
    else if (handle.type === 'null') 
    {
        val = null;
    }
    else if (handle.value !== undefined) 
    {
        val = handle.value;
    }
    else if (handle.type === 'undefined') 
    {
        val = undefined;
    }
    else 
    {
        val = handle;
    }

    process.nextTick(function() 
    {
        cb(null, val);
    });
};

// Resolve all arguments and locals for the specified frame, and mirror their contents.  Also resolve watches
// in the context of the specified frame and attached them as "watches".
//
Client.prototype.resolveFrame = function(frame, cb)
{
    console.log("Frame[" + frame.index + "]");

    var self = this;

    // Record arguments and locals references
    //
    var refs = [];
    frame.arguments.forEach(function(argument)
    {
        refs.push(argument.value.ref);
    }); 
    frame.locals.forEach(function(local)
    {
        refs.push(local.value.ref);
    }); 

    // Resolve the references (handles) to values
    //
    self.reqLookup(refs, function(err, res) 
    {
        if (err)
        {
            return cb(err);
        }

        resolvedEntities = [];

        frame.arguments.forEach(function(argument)
        {
            argument.value = res[argument.value.ref];
            resolvedEntities.push(argument);
        }); 

        frame.locals.forEach(function(local)
        {
            local.value = res[local.value.ref];
            resolvedEntities.push(local);
        });

        var waiting = resolvedEntities.length;
        if (!waiting) 
        {
            waiting = 1;
            wait();
        }

        // Construct local objects ("mirror" objects)
        //
        resolvedEntities.forEach(function(resolvedEntity) 
        {
            self.mirrorObject(resolvedEntity.value, 3, function(err, mirror)
            {
                resolvedEntity.value = mirror;
                wait();
            });
        });

        function wait() 
        {
            if (--waiting === 0) 
            {
                // Done updating arguments and locals (if any), now let's update the watches for the specified frame and
                // attach them to the frame.
                //
                self.updateWatches(frame, function(err, resolvedWatches)
                {
                    if (err)
                    {
                        cb(err);
                    }

                    frame.watches = resolvedWatches;
                    cb();
                });
            }
        }
    });
}

Client.prototype.fullTrace = function(cb) 
{
    var self = this;
    cb = cb || function() {};

    this.reqBacktrace(function(err, trace) 
    {
        if (err)
        {
            return cb(err);
        }
        if (trace.totalFrames <= 0)
        {
            return cb(Error('No frames'));
        }

        var refs = [];
 
        for (var i = 0; i < trace.frames.length; i++) 
        {
            var frame = trace.frames[i];
            // looks like this:
            // { type: 'frame',
            //   index: 0,
            //   receiver: { ref: 1 },
            //   func: { ref: 0 },
            //   script: { ref: 7 },
            //   constructCall: false,
            //   atReturn: false,
            //   debuggerFrame: false,
            //   arguments: [],
            //   locals: [],
            //   position: 160,
            //   line: 7,
            //   column: 2,
            //   sourceLineText: '  debugger;',
            //   scopes: [ { type: 1, index: 0 }, { type: 0, index: 1 } ],
            //   text: '#00 blah() /home/ryan/projects/node/test-debug.js l...' }
            refs.push(frame.script.ref);
            refs.push(frame.func.ref);
            refs.push(frame.receiver.ref);
        }

        self.reqLookup(refs, function(err, res) 
        {
            if (err)
            {
                return cb(err);
            }

            for (var i = 0; i < trace.frames.length; i++) 
            {
                var frame = trace.frames[i];
                frame.script = res[frame.script.ref];
                frame.func = res[frame.func.ref];
                frame.receiver = res[frame.receiver.ref];
            }

            cb(null, trace);
        });
    });
};

// Used to evaluate watches
Client.prototype.debugEval = function(code, frame, callback) 
{
    var self = this;

    // Request remote evaluation globally or in current frame
    this.reqFrameEval(code, frame, function(err, res) 
    {
        if (err) 
        {
            callback(err);
            return;
        }

        // Request object by handles (and it's sub-properties)
        self.mirrorObject(res, 3, function(err, mirror) 
        {
            callback(null, mirror);
        });
    });
};

// Watch
Client.prototype.watch = function(expr) 
{
    this.watches.push(expr);
};

// Unwatch
Client.prototype.unwatch = function(expr) 
{
    // Unwatch by expression or by watcher number/id
    var index = this._watchers.indexOf(expr);
    this.watches.splice(index !== -1 ? index : +expr, 1);
};

Client.prototype.updateWatches = function(frame, cb) 
{
    var self = this;
    cb = cb || function() {};

    var resolvedWatches = [];

    var waiting = this.watches.length;
    if (!waiting) 
    {
        return cb();
    }

    this.watches.forEach(function(watch, i) 
    {
        self.debugEval(watch, frame, function(err, value) 
        {
            resolvedWatches[i] = { id: i, watch: watch, value: err ? '<error>' : value };
            wait();
        });
    });

    function wait() 
    {
        if (--waiting === 0) 
        {
            resolvedWatches.forEach(function(resolvedWatch) 
            {
                console.log('Watch[' + resolvedWatch.id + ']: ' + resolvedWatch.watch + ' = ' + JSON.stringify(resolvedWatch.value));
            });

            cb(null, resolvedWatches);
        }
    }
};
