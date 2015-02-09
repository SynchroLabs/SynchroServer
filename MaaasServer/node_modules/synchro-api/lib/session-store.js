// World's worst session store.  Not peristent or scalable.  Use only for local testing.
//
// Note: This is the session store for Synchro clients calling the Synchro API, and is not related to any web session store
//       for the admin/development web site.
//
var uuid = require('node-uuid');

var logger = require('log4js').getLogger("memory-session-store");

module.exports = function(params)
{
    // Process params into locals
    
    var sessions = {};

    var sessionStore = 
    {
        createSession: function()
        {
            var newSessionId = uuid.v4();
            sessions[newSessionId] = { id: newSessionId };
            return sessions[newSessionId];
        },

        getSession: function(sessionId)
        {
            if (sessionId && sessions[sessionId])
            {
                return JSON.parse(JSON.stringify(sessions[sessionId]));
            }
            return null;
        },

        putSession: function(session)
        {
            // If the session put might be expensive, we could use objectmon to diff the current session with the potentially
            // updated version (if doing a read of the stored session, plus the compare, and the occasional write is actually
            // faster than just always doing a write).
            //
            sessions[session.id] = JSON.parse(JSON.stringify(session));
        },

        deleteSession: function(sessionId)
        {
            delete sessions[sessionId];
        }
    }

    return sessionStore;
}
