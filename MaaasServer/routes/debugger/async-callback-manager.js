// This is a general purpose async callback manager.  It queues callbacks, giving back an id that can
// be used to dequeue the callback later.  It also supports culling for callbacks that haven't been 
// dequeued within a specified timeout.
//
// Writing for Node and the browser: http://caolanmcmahon.com/posts/writing_for_node_and_the_browser/
//
function AsyncCallbackManager(timeoutMs, onTimeoutCallback)
{
    this.pendingCallbacks = [];
    this.sequenceNumber = 1;

    this.pushCallback = function(callback)
    {
        if (callback)
        {
            this.sequenceNumber += 1;
            var pendingCallback = { callback: callback, timestamp: new Date().getTime() }
            this.pendingCallbacks[this.sequenceNumber] = pendingCallback;
            return this.sequenceNumber;
        }
        return null;
    }

    this.popCallback = function(callbackId)
    {
        if (callbackId)
        {
            var pendingCallback = this.pendingCallbacks[callbackId];
            if (pendingCallback)
            {
                delete this.pendingCallbacks[callbackId];
                return pendingCallback.callback;
            }
        }
        return null;
    }

    // !!! Implement timeout support (some mechanism to call processExpiredCallbacks, possibly track oldest callback
    //     and use a timer, but then you have to update that whenever the current oldest callback is popped).
    //
    this.processExpiredCallbacks()
    {
        if (timeoutMs > 0)
        {
            var expiredIfBefore = new Data().getTime() - timeoutMs;
            for (var callbackId in this.pendingCallbacks)
            {
                if (this.pendingCallbacks[callbackId].timestamp < expiredIfBefore)
                {
                    var callback = this.popCallback(callbackId);
                    if (callback && onTimeoutCallback)
                    {
                        onTimeoutCallback(callback);
                    }
                }
            }
        }
    }
}
