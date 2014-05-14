// Following is code to load Maaas modules that do not (necessarily) exist in physical disk files.
//
// Reference: https://github.com/joyent/node/blob/master/lib/module.js
//
var path = require('path');
var Module = require('module');

var logger = require('log4js').getLogger("maaas-modules");


// This is where we keep the dictionary of pending modules, where the index is the filename (full path) 
// of the module to be loaded, and the value is the module source.
//
var pendingModules = { };

function pushModuleSource(filename, source, maaasSupportModule)
{
    pendingModules[filename] = { source: source, maaasSupportModule: maaasSupportModule };
}

function popModuleSource(filename)
{
    if (pendingModules[filename])
    {
        var source = pendingModules[filename];
        delete pendingModules[filename];
        return source;
    }
    return false;
}

function isModuleSourcePending(filename)
{
    return pendingModules[filename];
}

// Node.js is *very* excited about associating every loaded module with a physical file on disk.
// In order to work around this, we monkey-patch _resolveFilename so that we can return the 
// "virtual" filename for modules that we are in the process of loading using this mechanism.
//
Module._resolveFilename = (function(original) 
{
    return function(request, parent) 
    {
        if (isModuleSourcePending(request)) // Full path to a pending module?
        {
            return request;
        }
        else if (parent.filename) // Check to see if this is relative path that resolves to a pending module
        {
            var filename = path.resolve(path.dirname(parent.filename), request);
            if (isModuleSourcePending(filename))
            {
                return filename;
            }
        }
        return original.apply(this, arguments)
    }
})(Module._resolveFilename);

// This is a monkey-patching of the extension loader that allows us to load our own js modules from
// the pendingModules list.
//
Module._extensions['.js'] = (function(original)
{
    return function(module, filename) 
    {
        var moduleSource = popModuleSource(filename);
        if (moduleSource)
        {
            // When a module is loaded by Node, it is wrapped in this function:
            //
            //    (function (exports, require, module, __filename, __dirname) { -- your module code goes here --    
            //    });
            //
            // This happens as part of NativeModule.wrap() - see: https://github.com/joyent/node/blob/master/src/node.js
            //
            // Below we take advantage of this to jam in the Maaas module reference.  It is tempting to add a newline, 
            // but that would interfere with the line numbering of the file, which is important for debugging/breakpoints.
            //
            module.maaasSupportModule = moduleSource.maaasSupportModule;
            var source = " var Maaas = module.maaasSupportModule; " + moduleSource.source;
            module._compile(source, filename);
        }
        else
        {
            return original.apply(this, arguments)
        }
    }
})(Module._extensions['.js']); 

// -----------------------------------------------------------

// This is the directory (under the current directory of this module) where we pretend the module files are
var moduleSubDir = "routes"; 

// This is the full path to the directory where we pretend the module files area
var moduleDir = path.resolve(__dirname, moduleSubDir); 

module.exports = function(moduleStore, resourceResolver)
{
    // This is the route dictionary (routePath: module)
    //
    var routes = {};

    var maaasSupportModule;

    function loadModule(moduleName, source)
    {
        var filename = path.resolve(moduleDir, moduleName);

        logger.info("Pushing source for module: " + moduleName + " with Maaas support module: " + maaasSupportModule);
        pushModuleSource(filename, source, maaasSupportModule);
        var maaasModule = require(filename);
        popModuleSource(filename); // Should get popped in module load, this is just in case module was cached (and not loaded/popped)

        var routePath = path.basename(moduleName, path.extname(moduleName));
        logger.info("Found and loaded route processor for: " + routePath);
        routes[routePath] = maaasModule;
        maaasModule.View["path"] = routePath;
    }

    var moduleManager = 
    {
        loadModules: function(apiProcessor, cb)
        {
            cb = cb || function() {};

            maaasSupportModule = require('./maaas')(apiProcessor, resourceResolver);

            var moduleNames = moduleStore.listModules();
            for (var i = 0; i < moduleNames.length; i++) 
            {
                var moduleName = moduleNames[i];
                var source = moduleStore.getModuleSource(moduleName);
                loadModule(moduleName, source);
            }

            var appDefinition = moduleStore.getAppDefinition();
            cb(null, appDefinition);
        },

        reloadModule: function(moduleName, source) 
        {
            var filename = path.resolve(moduleDir, moduleName);
            var moduleSource = source || moduleStore.getModuleSource(moduleName);

            // Delete from cache to allow us to re-require the module...
            //
            if (require.cache[filename])
            {
                delete require.cache[filename];
            }

            loadModule(moduleName, moduleSource);
        },

        getModule: function(routePath)
        {
            return routes[routePath];
        }
    }

    return moduleManager;
}
