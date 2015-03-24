// Synchro AWS module
//
var logger = require('log4js').getLogger("synchro-aws");

exports.createService = function(serviceName, serviceConfiguration)
{
    var service;

    switch (serviceName)
    {
        case "AwsModuleStore":
        {
            // service = require('./aws-module-store')(serviceConfiguration);
        }
        break;
    }

    return service;
}
