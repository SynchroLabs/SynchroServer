// Azure session store
//
// Note: This is the session store for Maaas clients calling the Maaas API, and is not related to any web session store
//       for the admin/development web site.
//
var logger = require('log4js').getLogger("maaas-azure-session");

var uuid = require('node-uuid');
var azure = require('azure-storage');
var wait = require('wait.for');

module.exports = function(params)
{
    // Process params into locals
    var storageAccount = params.storageAccount;
    var storageAccessKey = params.storageAccessKey;
    var tableName = params.tableName;
    var partitionKey = "session";
    
    var tableService = azure.createTableService(storageAccount, storageAccessKey);

    // !!! Probably want to make sure this completes before we party too hard on the table with subsequent operations.
    //
    tableService.createTableIfNotExists(tableName, function(error, result, response)
    {
        if (!error)
        {
            // Table exists or created
            logger.info("Azure session table '" + tableName + "' exists or created");
        }
        else
        {
            logger.info("Azure session table  '" + tableName + "' did not exist and could not be created: " + error);            
        }
    });

    function entityFromSession(session)
    {
        var eg = azure.TableUtilities.entityGenerator;

        var entity = 
        {
            PartitionKey: eg.String(partitionKey),
            RowKey: eg.String(session.id),
            Session: eg.String(JSON.stringify(session))
        }

        return entity;
    }

    function sessionFromEntity(entity)
    {
        logger.info("entity session: " + entity.Session._);
        return JSON.parse(entity.Session._);
    }

    function createSessionAzure(callback)
    {
        var session = { id: uuid.v4() };
        var entity = entityFromSession(session);

        tableService.insertEntity(tableName, entity, function (error, entity, response) 
        {
            if (!error)
            {
                logger.info("Azure session table entity inserted");
                callback(null, session);
            }
            else
            {
                logger.info("Azure session table entity insertion failed: " + error);            
                callback(error);
            }
        });
    }

    function timerStart()
    {
        return process.hrtime();
    }

    function timerDiff(timeStart)
    {
        var diff = process.hrtime(timeStart);
        var millis = (diff[0] * 1000) + (diff[1] / 1000000);

        return millis;
    }

    function getSessionAzure(sessionId, callback)
    {
        logger.info("Azure session get starting");
        var startTime = timerStart();

        tableService.retrieveEntity(tableName, partitionKey, sessionId, function (error, entity, response) 
        {
            if (!error)
            {
                logger.info("Azure session get - table entity retrieved (" + timerDiff(startTime) + " ms)");
                callback(null, sessionFromEntity(entity));
            }
            else if (error.code === "ResourceNotFound")
            {
                // Not necessarily a problem to handle at this level, just return null.  The higher level logic has 
                // handing for the case where the client provides a session ID that the server doesn't know about.
                //
                logger.info("Azure session get - table entity not found");
                callback(null, null);
            }
            else
            {
                logger.info("Azure session get - table entity retrieval failed: " + error);
                callback(error);
            }
        });
    }

    function putSessionAzure(session, callback)
    {
        var entity = entityFromSession(session);

        logger.info("Azure session put starting");
        var startTime = timerStart();

        tableService.updateEntity(tableName, entity, function (error, entity, response) 
        {
            if (!error)
            {
                logger.info("Azure session put - table entity updated (" + timerDiff(startTime) + " ms)");
                callback(null);
            }
            else
            {
                logger.info("Azure session put - table entity update failed: " + error);            
                callback(error);
            }
        });
    }

    function deleteSessionAzure(sessionId, callback)
    {
        var entity = entityFromSession(session);

        tableService.deleteEntity(tableName, entity, function (error, successful, response) 
        {
            if (!error)
            {
                logger.info("Azure session table entity deleted");
                callback(null);
            }
            else
            {
                logger.info("Azure session table entity delete failed: " + error);            
                callback(error);
            }
        });
    }

    var sessionStore = 
    {
        createSession: function()
        {
            return wait.for(createSessionAzure);
        },

        getSession: function(sessionId)
        {
            return wait.for(getSessionAzure, sessionId);
        },

        putSession: function(session)
        {
            return wait.for(putSessionAzure, session);
        },

        deleteSession: function(sessionId)
        {
            return wait.for(deleteSessionAzure, sessionId);
        }
    }

    return sessionStore;
}
