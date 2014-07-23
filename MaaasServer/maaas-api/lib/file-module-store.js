// This is the file-based module store. 
//
var fs = require('fs');
var path = require('path');

module.exports = function(params)
{
    var moduleDir = params.moduleDirectory;

    var moduleStore = 
    {
        getAppDefinition: function()
        {
            var appDefinitionPath = path.resolve(moduleDir, "synchro.json");
            var content = fs.readFileSync(appDefinitionPath, 'utf8');
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
            var content = fs.readFileSync(moduleFilePath, 'utf8');

            // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM) because the buffer-to-string
            // conversion in `fs.readFileSync()` translates it to FEFF, the UTF-16 BOM.
            //
            if (content.charCodeAt(0) === 0xFEFF) 
            {
                content = content.slice(1);
            }

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
