var assert = require("assert");

assert.objectsEqual = function(actual, expected, message)
{
	// The actual equality we care about is deepEqual().  However, when that fails, it is sometimes difficult to
	// find the differences in complex values.  So if deepEqual fails, we will JSONify the objects and do a string
	// compate.  Note that this may not produce a nice, easy to read set of diffs in all cases (properties may be
    // reported in different order, etc).  But in most cases, this makes it much easier to see the diffs in test
    // output.  If we end up with a good object differ later, we can always stick that here.
	try
	{
		assert.deepEqual(actual, expected);
	}
	catch (e)
	{
	    assert.equal(JSON.stringify(actual, null, 4), JSON.stringify(expected, null, 4), message);
	}
}