
/*
 * GET edit page.
 */

var maaasModules = require("../api/maaas-modules");
var moduleStore = maaasModules.getModuleStore();

// Using the ACE editor - http://ace.c9.io/

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

exports.save = function(req, res)
{
    console.log("Save");

    var page = null;
    if (req.body["page"])
    {
        page = req.body["page"];
    }

    var content = req.body["content"];

    if (page)
    {
        var result = moduleStore.putModuleSource(page, content);

        // !!! Now that the API processor can be run as a forked child process, we need to signal it via a
        //     message (the maaasModules reference here will not be the same instance as the maaasModules
        //     used by forked child process, will not have loaded any modules, and will not be able to reload).
        //     This is a micro version of the macro problem, which is that we need some kind of notification
        //     method to let all API processors (possible spread across multple machine/vm instances) know that
        //     a module needs hot reloading.
        //
        maaasModules.reloadModule(page, content);
    }

    res.send({status: "OK", message: "File was saved"});
};