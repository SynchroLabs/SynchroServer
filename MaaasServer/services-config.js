var path = require('path');
var nconf = require('nconf');

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
		            packageRequirePath: path.resolve('./synchro-api'), 
		            serviceName: 'MemorySessionStore',
		            serviceConfiguration: {}

		            /*
		            packageRequirePath: path.resolve('./synchro-api'), 
		            serviceName: 'FileSessionStore',
		            serviceConfiguration: 
		            {
		                sessionStateFile: path.resolve(__dirname, "sessions.json")
		            }
		            */
		        },

		        moduleStoreSpec:
		        {
		            packageRequirePath: path.resolve('./synchro-api'), 
		            serviceName: 'FileModuleStore',
		            serviceConfiguration: 
		            {
		                moduleDirectory: path.join(nconf.get('FILE_STORE_PATH'), directory)
		            }        
		        },

		        resourceResolverSpec:
			    { 
			        packageRequirePath: path.resolve('./synchro-api'), 
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
		            packageRequirePath: path.resolve('./synchro-api'),
		            serviceName: 'RedisSessionStore',
		            serviceConfiguration: 
		            {
		                host: nconf.get('REDIS_HOST'),
		                port: nconf.get('REDIS_PORT'),
		                password: nconf.get('REDIS_PASSWORD'), // Redis Primary Key synchroapi
		                pingInterval: 60
		            }

		            /*
		            packageRequirePath: path.resolve('./synchro-azure'),
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
		            packageRequirePath: path.resolve('./synchro-azure'), 
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
			        packageRequirePath: path.resolve('./synchro-api'), 
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
