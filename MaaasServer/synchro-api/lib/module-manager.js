// Following is code to load Synchro modules that do not (necessarily) exist in physical disk files.
//
// Reference: https://github.com/joyent/node/blob/master/lib/module.js
//
// Here is some higher order cache invalidation thinking...
//
//     http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
//
var path = require('path');
var Module = require('module');

var logger = require('log4js').getLogger("module-manager");

// This is the directory (under the current directory of this module) where we pretend the module files are
var moduleSubDir = "routes";

// This is the full path to the directory where we pretend the module files area
var moduleDir = path.resolve(__dirname, moduleSubDir);

// -----------------------------------------------------------

// Note: The module loader below loads modules from the provided moduleStore.  It keeps a route map, and uses
//       that to give to processors.  In this way, if a module representing a route is reloaded, new processors
//       will get the reloaded module, while existing processors can finish their transactions using the previous
//       version, to which they still have a reference.  So the server can hum along happily with a restart.
//
//       One limitation of this is that if one of these route modules references another route module (perhaps
//       because they share some common code), when the referenced module is reloaded it will not trigger the 
//       dependent module to be reloaded (the dependent module will have a reference to the old referenced 
//       module until the dependent module itself is reloaded).  This is not ideal.  One solution would be to
//       understand the dependency relationship so we know which dependent modules, if any, also need to be reloaded
//       when we reload a module.
//
//       Another issue is that we currently do not support any kind of route module path or subdirectory notation
//       in the module stores, so everything has to be a the top level.  It would be nice if we could both group
//       our modules into folders, and if we could have a node_modules folder that allowed local packages.  Either
//       of these things, when implemented, probably imply a reworking of the route/mapper (so that we treat actual
//       routes to pages differently potentially than we treat the loading/management of supporting modules).
//       

module.exports = function(moduleStore, resourceResolver)
{
    // This is the route dictionary (routePath: module)
    var routes = {};
    
    // This is the list of files that exist in the module store and may be loaded from it
    var moduleFiles = [];

    var supportModule;
    
    function isModuleFile(filename)
    {
        if (path.dirname(filename) == moduleDir)
        {
            var moduleName = path.basename(filename);
            if (moduleFiles.indexOf(moduleName) >= 0)
            {
                return true;
            }
        }
        return false;
    }    
    
    // Node.js is *very* excited about associating every loaded module with a physical file on disk.
    // In order to work around this, we monkey-patch _resolveFilename to return the "virtual" filename
    // for modules that we will later be able to load (in the extension loader below).
    //
    Module._resolveFilename = (function (original)
    {
        return function (request, parent)
        {
            if (parent.filename) // Check to see if this is relative path that resolves to a module file
            {
                var filename = path.resolve(path.dirname(parent.filename), request);
                if (path.extname(filename) == "")
                {
                    filename = filename + ".js";
                }           
                if (isModuleFile(filename))
                {
                    return filename;
                }
            }
            return original.apply(this, arguments)
        }
    })(Module._resolveFilename);
    
    // This is a monkey-patching of the extension loader that allows us to load our own js modules.
    //
    Module._extensions['.js'] = (function (original)
    {
        return function (module, filename)
        {
            if (isModuleFile(filename))
            {
                var moduleSource = moduleStore.getModuleSource(path.basename(filename));

                // When a module is loaded by Node, it is wrapped in this function:
                //
                //    (function (exports, require, module, __filename, __dirname) { -- your module code goes here --    
                //    });
                //
                // This happens as part of NativeModule.wrap() - see: https://github.com/joyent/node/blob/master/src/node.js
                //
                // Below we take advantage of this to jam in the Synchro module reference.  It is tempting to add a newline, 
                // but that would interfere with the line numbering of the file, which is important for debugging/breakpoints.
                //
                module.supportModule = supportModule;
                var source = " var Synchro = module.supportModule; " + moduleSource;
                module._compile(source, filename);
            }
            else
            {
                return original.apply(this, arguments)
            }
        }
    })(Module._extensions['.js']);

    function loadModule(moduleName)
    {
        var filename = path.resolve(moduleDir, moduleName);
        var synchroModule = require(filename);

        var routePath = path.basename(moduleName, path.extname(moduleName));
        logger.info("Found and loaded route processor for: " + routePath);
        routes[routePath] = synchroModule;
    }

    var moduleManager = 
    {
        loadModules: function(apiProcessor)
        {
            supportModule = require('./app-services')(apiProcessor, resourceResolver);

            var moduleNames = moduleStore.listModules();
            moduleFiles = moduleNames;
            for (var i = 0; i < moduleNames.length; i++) 
            {
                loadModule(moduleNames[i]);
            }

            var appDefinition = moduleStore.getAppDefinition();
            return appDefinition;
        },

        reloadModule: function(moduleName, source) 
        {
            var filename = path.resolve(moduleDir, moduleName);

            // Delete from cache to allow us to re-require the module...
            //
            if (require.cache[filename])
            {
                delete require.cache[filename];
            }

            loadModule(moduleName);
        },

        getModule: function(routePath)
        {
            return routes[routePath];
        }
    }

    return moduleManager;
}
