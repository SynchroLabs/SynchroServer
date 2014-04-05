﻿// !!! World's worst session store.  Fix this.  As a first step, these APIs should all be async (since they'll presumably
//     be async when they're talking to a real store).
//
// Note: This is the session store for Maaas clients calling the Maaas API, and is not related to any web session store
//       for the admin/development web site.
//
var uuid = require('node-uuid');

exports.getSessionStore = function()
{
    var sessions = {};

    this.createSession = function()
    {
        var newSessionId = uuid.v4();
        sessions[newSessionId] = { id: newSessionId };
        return sessions[newSessionId];
    };

    this.getSession = function(sessionId)
    {
        if (sessionId)
        {
            return sessions[sessionId];
        }
        return null;
    };

    this.putSession = function(session)
    {
        sessions[session.id] = session;
    };

    this.deleteSession = function(sessionId)
    {
        delete sessions[sessionId];
    };

    return this;
}
