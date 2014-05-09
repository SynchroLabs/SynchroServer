/*
 * GET edit page.
 */
var logger = require('log4js').getLogger("web-edit");

// GET /edit
exports.edit = function(maaasStudio, req, res)
{
    var page = null;
    var code = "";
    if (req.query["page"])
    {
        page = req.query["page"];
    }

    if (page)
    {
        code = maaasStudio.moduleStore.getModuleSource(page);
    }

    var files = maaasStudio.moduleStore.listModules();

    var debugPort = maaasStudio.apiProcessor.debugPort;

    maaasStudio.render('sandbox', { title: 'Mobile Application As A Service (MAAAS)', code: code, page: page, files: files, debugPort: debugPort }, res);
};

// GET /module
exports.loadModule = function(maaasStudio, req, res)
{
    logger.info("Load module");
    var result = { };

    if (req.query["module"])
    {
        result.status = "OK";
        result.message = "Module source found";
        result.source = maaasStudio.moduleStore.getModuleSource(req.query["module"]);
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not found";
    }
    res.send(result);
};

// POST /module
exports.saveModule = function(maaasStudio, req, res)
{
    logger.info("Save module");
    var result = { };

    if (req.body["module"] && req.body["source"])
    {
        var moduleName = req.body["module"];
        var source = req.body["source"];

        var putResult = maaasStudio.moduleStore.putModuleSource(moduleName, source);

        result.status = "OK";
        result.message = "Module source saved";

        maaasStudio.apiProcessor.reloadModule(moduleName); // !!! Would be nice to get some notification that this worked
    }
    else
    {
        result.status = "Fail";
        result.message = "Module source not saved";
    }

    res.send(result);
};