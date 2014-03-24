
/*
 * GET edit page.
 */

var maaasModules = require("../api/maaas-modules");
var moduleStore = maaasModules.getModuleStore();

// Using the ACE editor - http://ace.c9.io/

// GET /edit
exports.edit = function(req, res)
{
    var page = null;
    var code = "";
    if (req.query["page"])
    {
        page = req.query["page"];
    }

    if (page)
    {
        code = moduleStore.getModuleSource(page);
    }

    var files = moduleStore.listModules();

    res.render('edit', { title: 'Mobile Application As A Service (MAAAS)', code: code, page: page, files: files });
};

// GET /module
exports.loadModule = function(req, res)
{
    console.log("Load module");
    var result = { };

    if (req.query["module"])
    {
        result.status = "OK";
        result.message = "Module source found";
        result.source = moduleStore.getModuleSource(req.query["module"]);
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not found";
    }
    res.send(result);
};

// POST /module
exports.saveModule = function(req, res)
{
    console.log("Save module");
    var result = { };

    if (req.body["module"] && req.body["source"])
    {
        var moduleName = req.body["module"];
        var source = req.body["source"];

        var putResult = moduleStore.putModuleSource(moduleName, source);

        result.status = "OK";
        result.message = "Module source saved";

        // !!! Now that the API processor can be run as a forked child process, we need to signal it via a
        //     message (the maaasModules reference here will not be the same instance as the maaasModules
        //     used by forked child process, will not have loaded any modules, and will not be able to reload).
        //     This is a micro version of the macro problem, which is that we need some kind of notification
        //     method to let all API processors (possible spread across multple machine/vm instances) know that
        //     a module needs hot reloading.
        //
        maaasModules.reloadModule(moduleName, source);
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not saved";
    }

    res.send(result);
};