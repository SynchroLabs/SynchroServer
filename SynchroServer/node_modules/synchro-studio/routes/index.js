
/*
 * GET home page.
 */

exports.index = function(synchroStudio, req, res, applications){
  synchroStudio.render('index', { applications: applications }, res);
};