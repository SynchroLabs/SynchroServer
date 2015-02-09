var path = require('path');
var nconf = require('nconf');

var logger = require('log4js').getLogger("services-config");

exports.getServicesConfig = function(config, directory)
{
	var servicesConfig;

	switch (config)
	{
		case 'local':
		{
			servicesConfig = 
			{
		        sessionStoreSpec:
		        {
		            packageRequirePath: 'synchro-api', 
		            serviceName: 'MemorySessionStore',
		            serviceConfiguration: {}

		            /*
		            packageRequirePath: './synchro-api', 
		            serviceName: 'FileSessionStore',
		            serviceConfiguration: 
		            {
		                sessionStateFile: path.resolve(__dirname, "sessions.json")
		            }
		            */
		        },

		        moduleStoreSpec:
		        {
		            packageRequirePath: 'synchro-api', 
		            serviceName: 'FileModuleStore',
		            serviceConfiguration: 
		            {
		                moduleDirectory: path.join(nconf.get('FILE_STORE_PATH'), directory)
		            }        
		        },

		        resourceResolverSpec:
			    { 
			        packageRequirePath: 'synchro-api', 
			        serviceName: 'ResourceResolver',
			        serviceConfiguration: 
			        {
			            prefix: nconf.get('LOCAL_RESOURCE_PREFIX')
			        }
			    }
		    };
		}
		break;

		case 'azure':
		{
			// The following config items must be set (via environment or config file) to use this set of services:
			//
			// Redis - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
			// Azure - AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY, AZURE_RESOURCE_PREFIX
			//
			servicesConfig = 
			{
		        sessionStoreSpec:
		        {
		            packageRequirePath: 'synchro-api',
		            serviceName: 'RedisSessionStore',
		            serviceConfiguration: 
		            {
		                host: nconf.get('REDIS_HOST'),
		                port: nconf.get('REDIS_PORT'),
		                password: nconf.get('REDIS_PASSWORD'), // Redis Primary Key synchroapi
		                pingInterval: 60
		            }

		            /*
		            packageRequirePath: 'synchro-azure',
		            serviceName: 'AzureSessionStore',
		            serviceConfiguration: 
		            {
		                storageAccount: nconf.get('AZURE_STORAGE_ACCOUNT'),
		                storageAccessKey: nconf.get('AZURE_STORAGE_ACCESS_KEY'),
		                tableName: "synchroSessions"
		            }
		            */
		        },

		        moduleStoreSpec:
		        {
		            packageRequirePath: 'synchro-azure', 
		            serviceName: 'AzureModuleStore',
		            serviceConfiguration:
		            {
		                storageAccount: nconf.get('AZURE_STORAGE_ACCOUNT'),
		                storageAccessKey: nconf.get('AZURE_STORAGE_ACCESS_KEY'),
		                containerName: directory
		            }
		        },

		        resourceResolverSpec:
			    { 
			        packageRequirePath: 'synchro-api', 
			        serviceName: 'ResourceResolver',
			        serviceConfiguration: 
			        {
			            prefix: nconf.get('AZURE_RESOURCE_PREFIX')
			        }
			    }
			};
		}
		break;
    }

    return servicesConfig;
}
