
/*
 * GET edit page.
 */

var fs = require("fs");

// Using the ACE editor - http://ace.c9.io/

exports.edit = function(req, res)
{
    var code = fs.readFileSync("api/routes/sandbox.js", 'utf8').toString();
    code = code.replace(/^\uFEFF/, ''); // !!! Needed? (to whack unicode marker)
    res.render('edit', { title: 'Mobile Application As A Service (MAAAS)', code: code });
};