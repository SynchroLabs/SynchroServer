/*
 * GET edit page.
 */
var logger = require('log4js').getLogger("web-edit");

// GET /edit
exports.edit = function(maaasStudio, appName, req, res)
{
    var apiProcessor = maaasStudio.getApiProcessor(appName);
    var moduleStore = maaasStudio.getModuleStore(appName);

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

    var debugPort = apiProcessor.debugPort;

    maaasStudio.render('sandbox', { title: 'Mobile Application As A Service (MAAAS)', code: code, page: page, files: files, debugPort: debugPort }, res);
};

// GET /module
exports.loadModule = function(maaasStudio, appName, req, res)
{
    var moduleStore = maaasStudio.getModuleStore(appName);

    logger.info("Load module");
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
exports.saveModule = function(maaasStudio, appName, req, res)
{
    var apiProcessor = maaasStudio.getApiProcessor(appName);
    var moduleStore = maaasStudio.getModuleStore(appName);

    logger.info("Save module");
    var result = { };

    if (req.body["module"] && req.body["source"])
    {
        var moduleName = req.body["module"];
        var source = req.body["source"];

        var putResult = moduleStore.putModuleSource(moduleName, source);

        result.status = "OK";
        result.message = "Module source saved";

        apiProcessor.reloadModule(moduleName); // !!! Would be nice to get some notification that this worked
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not saved";
    }

    res.send(result);
};