// This is the file-based module store. 
//
// Note: This requires write access to the local file system for putModuleSoure support (required if
//       using Studio with save/update).
//
var fs = require('fs');
var path = require('path');
var util = require('./util');

var logger = require('log4js').getLogger("file-module-store");

module.exports = function(params)
{
    var moduleDir = params.moduleDirectory;

    var moduleStore = 
    {
        getAppDefinition: function()
        {
            var appDefinitionPath = path.resolve(moduleDir, "synchro.json");
            var content = util.removeBOM(fs.readFileSync(appDefinitionPath, 'utf8'));
            //logger.info("Got app definition content: " + content);
            return JSON.parse(content);
        },

        listModules: function()
        {
            var modules = [];

            var files = fs.readdirSync(moduleDir);
            for (var i = 0; i < files.length; i++) 
            {
                if (path.extname(files[i]) === ".js") 
                {
                    modules.push(files[i]);
                }
            }

            return modules;
        },

        getModuleSource: function(moduleFilename)
        {
            var moduleFilePath = path.resolve(moduleDir, moduleFilename);
            var content = util.removeBOM(fs.readFileSync(moduleFilePath, 'utf8'));
            return content;
        },

        putModuleSource: function(moduleFilename, content)
        {
            var moduleFilePath = path.resolve(moduleDir, moduleFilename);
            fs.writeFileSync(moduleFilePath, content, 'utf8');
        },

        removeModuleSource: function(moduleFilename)
        {
            var moduleFilePath = path.resolve(moduleDir, moduleFilename);
            fs.unlinkSync(moduleFilePath);
        }
    }

    return moduleStore;
}
