// Module-wide test pre-processing
//
global.defaultLogLevel = "INFO"; // "ERROR";

var assert = require("assert");
var assertHelper = require("./assert-helper");

var log4js = require('log4js');
log4js.setGlobalLogLevel(global.defaultLogLevel);

// This is also a good place to put global before/beforeEach/after/afterEach
//
// Note that the before/after functions run once before/after the set of all tests (tests denoted by "it"), but
// not before other module initialization or code in the body of any describe in those test modules.
//
/*
var logger = require('log4js').getLogger("test");
logger.setLevel("INFO");

before(function()
{
	logger.info("API tests starting");
});

after(function()
{
	logger.info("API tests complete");
});
*/

// This is a place you can stick one-off tests until you find a home for them....
/*
describe("Test", function()
{
	it("should do something", function()
	{
	});
});
*/