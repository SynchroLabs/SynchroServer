// Modules: Reader-Writer 
//
// Usage:
//
// The ReaderWriter object produced by this module will match up pending reads and writes on a channel when 
// the reads and writes occur asynchronously to each other, regardless of whether the read or write is posted
// first.  When a cooresponsing read and write for the same channel have both been posted, the write operation 
// will have its callback called and can then write to the reader.  It is assumed that only a single read and 
// write may be posted for a given channel until the read/write has been satisfied.
//
// TODO: It may be desirable to timestamp the pending reads and writes such that abandoned reads and writes can
//       be cleared when a timeout has expired (to prevent them from backing up), assuming this situation can
//       arise (that remains to be seen).
//
// When the reader is ready to read, it calls:
//
//    readerWriter.readAsync(channelId, function(err, data)
//    {
//        // "data" received ("read") from writer
//    });
//
// When the writer is ready to write, it calls:
//
//    readerWriter.writeAsync(channelId, function(err, writeData)
//    {
//        // The writeData function will write data to a waiting reader
//        writeData("the data");
//    });
//
var ReaderWriter = function()
{
    this.pendingReads = {};
    this.pendingWrites = {};
}

ReaderWriter.prototype.drain = function()
{
	this.pendingReads = {};
	this.pendingWrites = {};		
}

ReaderWriter.prototype.isReadPending = function(channelId)
{
	return !!(channelId && this.pendingReads[channelId]);
}

ReaderWriter.prototype.isWritePending = function(channelId)
{
	return !!(channelId && this.pendingWrites[channelId]);
}

ReaderWriter.prototype.cancelRead = function(channelId)
{
	if (channelId && this.pendingReads[channelId])
	{
		delete this.pendingReads[channelId];
	}
}

ReaderWriter.prototype.cancelWrite = function(channelId)
{
	if (channelId && this.pendingWrites[channelId])
	{
		delete this.pendingWrites[channelId];
	}
}

// Queue a read operation.  No subsequent reads should be attempted on this channel until this read completes.
//
ReaderWriter.prototype.readAsync = function(channelId, onRead)
{
    if (this.pendingReads[channelId])
    {
    	onRead("Pending read already exists for channel ID: " + channelId);
   	}
    else if (this.pendingWrites[channelId])
    {
    	var pendingWrite = this.pendingWrites[channelId];
		delete this.pendingWrites[channelId];

    	pendingWrite(null, function(data)
    	{
    		onRead(null, data);
    	});
    }
    else
    {
    	this.pendingReads[channelId] = onRead;
    }
}

// Queue a write operation.  No subsequent writes should be attempted on this channel until this write completes.
//
ReaderWriter.prototype.writeAsync = function(channelId, onWrite)
{
    if (this.pendingWrites[channelId])
    {
    	onWrite("Pending write already exists for channel ID: " + channelId);
   	}
   	else if (this.pendingReads[channelId])
    {
		var pendingRead = this.pendingReads[channelId];
		delete this.pendingReads[channelId];

    	onWrite(null, function(data)
    	{
    		pendingRead(null, data);
    	});
    }
    else
    {
    	this.pendingWrites[channelId] = onWrite;
    }
}

module.exports = ReaderWriter;
