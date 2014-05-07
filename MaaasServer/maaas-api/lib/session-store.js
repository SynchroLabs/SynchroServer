// !!! World's worst session store.  Fix this.  As a first step, these APIs should all be async (since they'll presumably
//     be async when they're talking to a real store).
//
// Note: This is the session store for Maaas clients calling the Maaas API, and is not related to any web session store
//       for the admin/development web site.
//
var uuid = require('node-uuid');

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
            if (sessionId)
            {
                return sessions[sessionId];
            }
            return null;
        },

        putSession: function(session)
        {
            // If the session put might be expensive, we could use objectmon to diff the current session with the potentially
            // updated version (if doing a read of the stored session, plus the compare, and the occasional write is actually
            // faster than just always doing a write).
            //
            sessions[session.id] = session;
        },

        deleteSession: function(sessionId)
        {
            delete sessions[sessionId];
        }
    }

    return sessionStore;
}
