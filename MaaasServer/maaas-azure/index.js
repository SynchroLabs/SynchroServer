// Maaas Azure module
//
var logger = require('log4js').getLogger("maaas-azure");

exports.createService = function(serviceName, serviceConfiguration)
{
    var service;

    switch (serviceName)
    {
        case "AzureSessionStore":
        {
            service = require('./lib/azure-session-store')(serviceConfiguration);
        }
        break;

        case "AzureModuleStore":
        {
            service = require('./lib/azure-module-store')(serviceConfiguration);
        }
        break;
    }

    return service;
}
