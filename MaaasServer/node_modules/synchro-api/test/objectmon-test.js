require('./test');

var assert = require("assert");
require("./assert-helper");

var objectmon = require("../lib/objectmon");

describe("Object monitor", function () 
{
	it("should return empty array when comparing empty objects", function() 
	{
		var origObj = {};
		var newObj = {};
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);
		assert.objectsEqual(changes, []);
	});

	it("should return empty array when no changes", function() 
	{
		var origObj = { foo: "bar" };
		var newObj = { foo: "bar" };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);
		assert.objectsEqual(changes, []);
	});

	it("should return single add change in array when one property added", function() 
	{
		var origObj = { };
		var newObj = { foo: "bar" };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		var expected = [{ path: "TestPath.foo", change: "add", value: "bar" }];
		assert.objectsEqual(changes, expected);
	});

	it("should return single update change in array when one property updated", function() 
	{
		var origObj = { foo: "bar" };
		var newObj = { foo: "baz" };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		var expected = [{ path: "TestPath.foo", change: "update", value: "baz" }];
		assert.objectsEqual(changes, expected);
	});

	it("should return single remove change in array when one property removed", function() 
	{
		var origObj = { foo: "bar" };
		var newObj = { };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		// !!! Should "value" even be present?  Does anyone rely on explicit undefined?
		//
		var expected = [{ path: "TestPath.foo", change: "remove", value: undefined }];
		assert.objectsEqual(changes, expected);
	});

	it("should return multiple update changes in array when multiple properties changed", function() 
	{
		var origObj = { foo: "bar", baz: "fraz" };
		var newObj = { foo: "barf", baz: 13 };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		var expected = [{ path: "TestPath.foo", change: "update", value: "barf" }, { path: "TestPath.baz", change: "update", value: 13 }];
		assert.objectsEqual(changes, expected);
	});

	it("should return update change with object value when simple property changed to object", function() 
	{
		var origObj = { foo: "bar" };
		var newObj = { foo: { bar: "baz" } };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		var expected = [{ path: "TestPath.foo", change: "update", value: { bar: "baz" } }];
		assert.objectsEqual(changes, expected);
	});

	it("should return update change with simple value when property value of object changed to simple value", function() 
	{
		var origObj = { foo: { bar: "baz" } };
		var newObj = { foo: "bar" };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		var expected = [{ path: "TestPath.foo", change: "update", value: "bar" }];
		assert.objectsEqual(changes, expected);
	});

	it("should return object change for object, and property update change for second level path, when child property updated", function() 
	{
		var origObj = { age: { bob: 48, blake: 46 } };
		var newObj = { age: { bob: 49, blake: 46 } };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		// !! Should we just remove the undefined in the object change?
		//
		var expected = [{ path: "TestPath.age", change: "object", value: undefined }, { path: "TestPath.age.bob", change: "update", value: 49 }];
		assert.objectsEqual(changes, expected);
	});

	it("should return object change for array, and property remove change for removed item, when array item removed", function() 
	{
		var origObj = { employees: ["Bob", "Blake"] };
		var newObj = { employees: ["Bob"] };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		// !! Should we just remove the undefined in the object change and the remove?
		//
		var expected = [{ path: "TestPath.employees", change: "object", value: undefined }, { path: "TestPath.employees[1]", change: "remove", value: undefined }];
		assert.objectsEqual(changes, expected);
	});

	it("should return changes for existing array elements plus add for new last element when array element inserted", function() 
	{
		var origObj = { employees: ["Bob", "Blake"] };
		var newObj = { employees: ["Bonzo", "Bob", "Blake"] };
		var changes = objectmon.getChangeList("TestPath", origObj, newObj);

		// !! Should we just remove the undefined in the object change and the remove?
		//
		var expected = 
		[
		    { path: "TestPath.employees", change: "object", value: undefined }, 
		    { path: "TestPath.employees[0]", change: "update", value: "Bonzo" },
		    { path: "TestPath.employees[1]", change: "update", value: "Bob" },
		    { path: "TestPath.employees[2]", change: "add", value: "Blake" },
		];
		assert.objectsEqual(changes, expected);
	});

	it("should return correct set of changes for large scale, complex changes", function() 
	{
		var state =
		{
		    property1: "value1",
		    property2: "value2",
		    days: ["Monday", "Tuesday", "Wednesday"],
		    colorNames: [{ color: "red" }, { color: "green" }, { color: "blue" }],
		    user:
		    {
		        username: "testuser",
		        password: ""
		    }
		}

		var originalState = JSON.parse(JSON.stringify(state));

		state.property1 = "newValue1";
		state.property3 = "newValue3";
		state.days[1] = "Saturday";
		state.days.pop();
		state.colorNames.unshift({ color: "greenish" });
		state.user.password = "testpass";

		changes = objectmon.getChangeList("state", originalState, state);

		var expected = 
		[
		    { path: "state.property1", change: "update", value: "newValue1" }, 
		    { path: "state.days", change: "object", value: undefined },
		    { path: "state.days[1]", change: "update", value: "Saturday" },
		    { path: "state.days[2]", change: "remove", value: undefined },
		    { path: "state.colorNames", change: "object", value: undefined },
		    { path: "state.colorNames[0]", change: "object", value: undefined },
		    { path: "state.colorNames[0].color", change: "update", value: "greenish" },
		    { path: "state.colorNames[1]", change: "object", value: undefined },
		    { path: "state.colorNames[1].color", change: "update", value: "red" },
		    { path: "state.colorNames[2]", change: "object", value: undefined },
		    { path: "state.colorNames[2].color", change: "update", value: "green" },
		    { path: "state.colorNames[3]", change: "add", value: { color: "blue" } },
		    { path: "state.user", change: "object", value: undefined },
		    { path: "state.user.password", change: "update", value: "testpass" },
		    { path: "state.property3", change: "add", value: "newValue3" }, 
		];
		assert.objectsEqual(changes, expected, "suck it");
	});
});