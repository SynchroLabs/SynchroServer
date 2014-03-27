/*
 * GET edit page.
 */

var maaasModules = require("../api/maaas-modules");
var moduleStore = maaasModules.getModuleStore();

var _apiProcessor;
exports.setApiProcessor = function(apiProcessor)
{
    _apiProcessor = apiProcessor;
}

// Signal the API processor that the module needs to be reloaded (the API itself may be running inproc or as a
// forked child process, but the API processors reloadModule() entrypoint abstracts us from that).
//
// !!! There is a larger order problem here, which is that there may be many API instances running (possibly more
//     than one in this Node instance, and certainly multiple machine/vm instances would each have one, or more).
//     We need some kind of notification method to let all API instances know that a module needs hot reloading (pub/sub).
//
function reloadModule(moduleName)
{
    if (_apiProcessor)
    {
        _apiProcessor.reloadModule(moduleName);
    }
}

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

    res.render('sandbox', { title: 'Mobile Application As A Service (MAAAS)', code: code, page: page, files: files });
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

        reloadModule(moduleName); // !!! Would be nice to get some notification that this worked
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not saved";
    }

    res.send(result);
};