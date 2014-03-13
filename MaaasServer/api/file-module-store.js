// This is the file-based module store.  It works with modules in the "routes" directory under the directory
// of this module.
//
var fs = require('fs');
var path = require('path');

var modulesSubDir = "routes";
var moduleDir = path.resolve(__dirname, modulesSubDir);

exports.listModules = function()
{
    var modules = [];

    var files = fs.readdirSync(moduleDir);
    for (var i = 0; i < files.length; i++) 
    {
        modules.push(files[i]);
    }

    return modules;
};

exports.getModuleSource = function(moduleFilename)
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
};

exports.putModuleSource = function(moduleFilename, content)
{
    var moduleFilePath = path.resolve(moduleDir, moduleFilename);
    var result = fs.writeFileSync(moduleFilePath, content, 'utf8');
};
