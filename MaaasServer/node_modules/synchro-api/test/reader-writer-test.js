require('./test');

var assert = require("assert")
require("./assert-helper");

var ReaderWriter = require("../lib/reader-writer");
var readerWriter = new ReaderWriter();

var logger = require('log4js').getLogger("reader-writer-test");

describe("Reader-Writer", function()
{
	var channelId = "69";

	beforeEach(function()
	{
		readerWriter.drain();
	});

	it("should report no read pending when no read pending", function()
	{
		assert.equal(readerWriter.isReadPending(channelId), false);
	});

	it("should report no write pending when no write pending", function()
	{
		assert.equal(readerWriter.isWritePending(channelId), false);
	});

	it("should report read pending when read pending", function()
	{
		readerWriter.readAsync(channelId, function(err, data){});
		assert.equal(readerWriter.isReadPending(channelId), true);
	});

	it("should report write pending when write pending", function()
	{
		readerWriter.readAsync(channelId, function(err, data){});
		assert.equal(readerWriter.isReadPending(channelId), true);
	});

	it("should report proper write pending status before and after satisfied write", function(done)
	{
		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.equal(readerWriter.isReadPending(channelId), false);
			assert.equal(readerWriter.isWritePending(channelId), false);
			writeData("the data");
		});

		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), true);

		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.equal(readerWriter.isReadPending(channelId), false);
			assert.equal(readerWriter.isWritePending(channelId), false);
			done();
		});
	});

	it("should report proper read pending status before and after satisfied read", function(done)
	{
		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.equal(readerWriter.isReadPending(channelId), false);
			assert.equal(readerWriter.isWritePending(channelId), false);
			done();
		});

		assert.equal(readerWriter.isReadPending(channelId), true);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.equal(readerWriter.isReadPending(channelId), false);
			assert.equal(readerWriter.isWritePending(channelId), false);
			writeData("the data");
		});
	});

	it("should cancel pending read", function()
	{
		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.readAsync(channelId, function(err, data){});

		assert.equal(readerWriter.isReadPending(channelId), true);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.cancelRead(channelId);

		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);
	});

	it("should cancel pending write", function()
	{
		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);

		readerWriter.writeAsync(channelId, function(err, writeData){});

		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), true);

		readerWriter.cancelWrite(channelId);

		assert.equal(readerWriter.isReadPending(channelId), false);
		assert.equal(readerWriter.isWritePending(channelId), false);
	});

	it("should complete correctly when write posted before read", function(done)
	{
		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.equal(err, null);
			writeData("the data");
		});

		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.equal(err, null);
			assert.equal("the data", data);
			done();
		});
	});

	it("should complete correctly when read postred before write", function(done)
	{
		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.equal(err, null);
			assert.equal(data, "the data");
			done();
		});

		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.equal(err, null);
			writeData("the data");
		});
	});

	it("should get read data from cooresponding write", function(done)
	{
		readerWriter.writeAsync("different channel", function(err, writeData)
		{
			assert(false, "Write for this channel should not get called");
		});

		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.equal(err, null);
			writeData("the data");
		});

		readerWriter.writeAsync("yet a different channel", function(err, writeData)
		{
			assert(false, "Write for this channel should not get called");
		});

		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.equal(err, null);
			assert.equal(data, "the data");
			done();
		});
	});

	it("should fail to post read with pending read on same channel", function(done)
	{
		readerWriter.readAsync(channelId, function(err, data)
		{
			assert(false, "Should not get here");
		});

		readerWriter.readAsync(channelId, function(err, data)
		{
			assert.notEqual(err, null);
			assert.equal(data, null);
			done();
		});
	});

	it("should fail to post write with pending write on same channel", function(done)
	{
		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert(false, "Should not get here");
		});

		readerWriter.writeAsync(channelId, function(err, writeData)
		{
			assert.notEqual(err, null);
			assert.equal(writeData, null);
			done();
		});
	});
});