
/*
 * GET edit page.
 */

var fs = require("fs");

// Using the ACE editor - http://ace.c9.io/

exports.edit = function(req, res)
{
    var page = "sandbox.js";
    if (req.query["page"])
    {
        page = req.query["page"];
    }

    var files = fs.readdirSync("api/routes");

    var code = fs.readFileSync("api/routes/" + page, 'utf8').toString();
    code = code.replace(/^\uFEFF/, ''); // !!! Needed? (to whack unicode marker)
    res.render('edit', { title: 'Mobile Application As A Service (MAAAS)', code: code, page: page, files: files });
};

exports.save = function(req, res)
{
    console.log("Save");

    var page = "sandbox.js";
    if (req.body["page"])
    {
        page = req.body["page"];
    }

    var content = req.body["content"];

    var result = fs.writeFileSync("api/routes/" + page, content, 'utf8');

    res.send({status: "OK", message: "File was saved"});
};