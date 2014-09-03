var assert = require("assert");
require("./assert-helper");

var util = require("../lib/util");

describe("Util", function () 
{
	describe("getObjectProperty", function () 
	{
		it("should be undefined when property not found", function()
		{
			var result = util.getObjectProperty({foo: "bar"}, "baz");
			assert.equal(result, undefined);
		});

		it("should return simple top level property", function()
		{
			var result = util.getObjectProperty({foo: "bar"}, "foo");
			assert.equal(result, "bar");
		});

		it("should return null when property value is null", function()
		{
			var result = util.getObjectProperty({foo: null}, "foo");
			assert.equal(result, null);
		});

		it("should return second level property when referenced using dot notation", function()
		{
			var obj = 
			{
				ages: 
				{
					bob: 48,
					blake: 46 
				}
			};
			var result = util.getObjectProperty(obj, "ages.blake");
			assert.equal(result, 46);
		});

		it("should return array element when referenced using numeric property name inside square bracket notation", function()
		{
			var obj = 
			{
				employees: ["Bob", "Blake"] 
			};
			assert.equal(util.getObjectProperty(obj, "employees[0]"), "Bob");
			assert.equal(util.getObjectProperty(obj, "employees[1]"), "Blake");
		});

		it("should return array element when referenced using numeric property name with dot notation", function()
		{
			var obj = 
			{
				employees: ["Bob", "Blake"] 
			};
			assert.equal(util.getObjectProperty(obj, "employees.0"), "Bob");
			assert.equal(util.getObjectProperty(obj, "employees.1"), "Blake");
		});

		it("should return object when value is object", function()
		{
			var obj = 
			{
				ages: 
				{
					bob: 48,
					blake: 46 
				}
			};
			assert.objectsEqual(util.getObjectProperty(obj, "ages"), { bob: 48, blake: 46 } );
		});
	});

	describe("setObjectProperty", function () 
	{
		it("should set new top level property", function()
		{
			var obj = {};
			var result = util.setObjectProperty(obj, "foo", "bar");
			assert.objectsEqual(obj, { foo: "bar" });
		});

		it("should updated exising top level property", function()
		{
			var obj = {foo: "baz"};
			var result = util.setObjectProperty(obj, "foo", "bar");
			assert.objectsEqual(obj, { foo: "bar" });
		});

		it("should fail to create intermediate object", function()
		{
			var obj = {};
			var result = util.setObjectProperty(obj, "foo.bar", "baz");
			assert.objectsEqual(obj, {});
		});

		it("should set second level property when first level exists", function()
		{
			var obj = { ages: {} };
			var result = util.setObjectProperty(obj, "ages.bob", 48);
			assert.objectsEqual(obj, { ages: { bob: 48 } });
		});

		it("should set array element referenced using numeric property name", function()
		{
			var obj = { employees: ["Bob"] };
			var result = util.setObjectProperty(obj, "employees.1", "Blake");
			assert.objectsEqual(obj, { employees: ["Bob", "Blake"] });
		});

		it("should set property to object when object passed", function()
		{
			var obj = { foo: "baz" };
			var result = util.setObjectProperty(obj, "foo", { bar: "baz" });
			assert.objectsEqual(obj, { foo: { bar: "baz" } });
		});

		it("should null property on object when null value passed", function()
		{
			// !!! Should this actually clear the property?
			var obj = { foo: "bar", baz: "fraz" };
			var result = util.setObjectProperty(obj, "foo", null);
			assert.objectsEqual(obj, { foo: null, baz: "fraz" });
		});
	});

	describe("Array.prototype.remove", function () 
	{
		it("should remove value when single value passed", function() 
		{
			var arr = [1, 2, 3, 4, 5];
			arr.remove(3);
			assert.objectsEqual(arr, [1, 2, 4, 5]);
		});

		it("should remove value in more than one position when single value passed", function() 
		{
			var arr = [3, 1, 3, 2, 3, 4, 3, 5, 3];
			arr.remove(3);
			assert.objectsEqual(arr, [1, 2, 4, 5]);
		});

		it("should remove multiple values when multiple values passed", function() 
		{
			var arr = [1, 2, 3, 4, 5];
			arr.remove(2, 4);
			assert.objectsEqual(arr, [1, 3, 5]);
		});

		it("should remove multiple values when array of values passed", function() 
		{
			var arr = [1, 2, 3, 4, 5];
			arr.remove([2, 4]);
			assert.objectsEqual(arr, [1, 3, 5]);
		});

		it("should remove values when callback indicates true for value", function() 
		{
			var arr = [1, 2, 3, 4, 5];
			// Remove even numbers
			arr.remove(function(val){ return !(val % 2); });
			assert.objectsEqual(arr, [1, 3, 5]);
		});
	});

	describe("Array.prototype.clean", function () 
	{
		it("should remove null at start of array", function() 
		{
			var arr = [null, 2, 3, 4, 5];
			arr.clean();
			assert.objectsEqual(arr, [2, 3, 4, 5]);
		});

		it("should remove null in middle of array", function() 
		{
			var arr = [1, 2, null, 4, 5];
			arr.clean();
			assert.objectsEqual(arr, [1, 2, 4, 5]);
		});

		it("should remove null at end of array", function() 
		{
			var arr = [1, 2, 3, 4, null];
			arr.clean();
			assert.objectsEqual(arr, [1, 2, 3, 4]);
		});

		it("should remove mutiple nulls from array", function() 
		{
			var arr = [null, 2, null, 4, null];
			arr.clean();
			assert.objectsEqual(arr, [2, 4]);
		});

		it("should not touch array with no nulls", function() 
		{
			var arr = [1, 2, 3, 4, 5];
			arr.clean();
			assert.objectsEqual(arr, [1, 2, 3, 4, 5]);
		});
	});
});