// Redis session store
//
// Note: This is the session store for Maaas clients calling the Maaas API, and is not related to any web session store
//       for the admin/development web site.
//

// https://github.com/mranney/node_redis
var redis = require("redis");
// redis.debug_mode = true;

var uuid = require('node-uuid');
var wait = require('wait.for');

var logger = require('log4js').getLogger("maaas-redis-session");

logger.info("Redis session store");

module.exports = function(params)
{
    // Process params into locals
    var port = params.port;
    var host = params.host;
    var password = params.password;
    var pingInterval = params.pingInterval;

    // Setup Redis
    //
	var client = redis.createClient(port, host);

	client.on("error", function (err) {
	    logger.info("error event - " + client.host + ":" + client.port + " - " + err);
	});

    client.on("end", function (err) {
        logger.info("the connection has ended - " + client.host + ":" + client.port + " - " + err);
    });

	if (password)
	{
		client.auth(password, function(err, result)
		{
			logger.info("Redis client auth - err: " + err + ", result: " + result);
		});		
	}

    // When using Azure Redis, when the connection times out, the client is not notified and does not recover
    // cleanly.  For more details, see - https://github.com/mranney/node_redis/issues/628
    //
    // We do a one minute redis PING heartbeat, which appears to keep the Azure Redis connections up and running
    // indefinitely. 
    //
    function heartbeat()
    {
        logger.info("Redis ping starting...");
        client.ping(function(err, result)
        {
            if (err)
            {
                logger.error("Redis ping returned err: " + err);
            }
            else
            {
                logger.info("Redis ping returned: " + result);
            }
        });
    }

    if (pingInterval)
    {
        setInterval(heartbeat, pingInterval * 1000);
    }

    // Profiling functions...
    //
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

	function createSessionRedis(callback)
	{
    	var session = { id: uuid.v4() };

        var startTime = timerStart();

		client.set(session.id, JSON.stringify(session), function (error, result)
		{
            if (!error)
            {
                logger.info("Redis session create succeeded (" + timerDiff(startTime) + " ms)");
                callback(null, session);
            }
            else
            {
                logger.info("Redis session create failed:: " + error);            
                callback(error);
            }
		});
	}

	function getSessionRedis(sessionId, callback)
	{
        var startTime = timerStart();

        logger.info("Redis client connected: " + client.connected);

		client.get(sessionId, function (error, result)
		{
            if (!error)
            {
                logger.info("Redis session get succeeded (" + timerDiff(startTime) + " ms)");
                callback(null, JSON.parse(result));
            }
            else
            {
                logger.info("Redis session get failed:: " + error);            
                callback(error);
            }
		});
	}

	function putSessionRedis(session, callback)
	{
        var startTime = timerStart();

		client.set(session.id, JSON.stringify(session), function (error, result)
		{
            if (!error)
            {
                logger.info("Redis session put succeeded (" + timerDiff(startTime) + " ms)");
                callback(null);
            }
            else
            {
                logger.info("Redis session put failed:: " + error);            
                callback(error);
            }
		});
	}

    
    var sessionStore = 
    {
        createSession: function()
        {
        	return wait.for(createSessionRedis);
        },

        getSession: function(sessionId)
        {
        	return wait.for(getSessionRedis, sessionId);
        },

        putSession: function(session)
        {
        	wait.for(putSessionRedis, session);
        },

        deleteSession: function(sessionId)
        {
        	wait.for(client.del, sessionId);
        }
    }

    return sessionStore;
}
