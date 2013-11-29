//
// objectDiff
//
// GitHub - https://github.com/NV/objectDiff.js
//
// NPM - objectdiff - https://npmjs.org/package/objectdiff 
//
// Visual diff app using objectDiff - http://nv.github.io/objectDiff.js/
//

console.log("Running objectMonitor");

var objectDiff = require("objectdiff");

function recordChanges(path, diffs, recordChange)
{
    if (diffs.changed == "object change")
    {
        for (var property in diffs.value)
        {
            var propertyPath = property;
            if (path != null)
            {
                if (isNaN(property))
                {
                    propertyPath = path + "." + property;
                }
                else
                {
                    propertyPath = path + "[" + property + "]";
                }
            }

            switch (diffs.value[property].changed)
            {
                case "primitive change":
                    // Old value is in diffs.value[property].removed
                    recordChange("update", propertyPath, diffs.value[property].added);
                    break;
                case "added":
                    // A property or array element was added (value can be primitive or object)...
                    recordChange("add", propertyPath, diffs.value[property].value);
                    break;
                case "removed":
                    // A property or array element was removed (value can be primitive or object)...
                    // Old value is in diffs.value[property].value
                    recordChange("remove", propertyPath);
                    break;
                case "object change":
                    // The contents of an array or object changed...
                    recordChange("object", propertyPath);
                    recordChanges(propertyPath, diffs.value[property], recordChange);
                    break;
            }
        }
    }
}

function logChange(changeType, path, value)
{
    var msg = "Found change of type: " + changeType + " for property at path: " + path;
    if (value !== undefined)
    {
        msg += " vith value: " + value;
    }
    console.log(msg);
}

exports.getChangeList = function(basePath, originalObject, newObject)
{
    var diffs = objectDiff.diff(originalObject, newObject);
    console.log("Diffs: ", JSON.stringify(diffs, null, 4));

    var changes = [];
    recordChanges(basePath, diffs, function (changeType, path, value)
    {
        logChange(changeType, path, value);
        changes.push({ path: path, change: changeType, value: value });
    });

    return changes;
}

// !!! Needed a convenient (non-Typescript) place to put this - move later
Array.prototype.remove = function ()
{
    var what, a = arguments, L = a.length, ax;
    while (L && this.length)
    {
        what = a[--L];
        while ((ax = this.indexOf(what)) != -1)
        {
            this.splice(ax, 1);
        }
    }
    return this;
}

//=========================================================================================
// Test
//=========================================================================================
/*
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

theChanges = getChangeList("state", originalState, state);
console.log("Changes: ", JSON.stringify(theChanges, null, 4));
*/

// For primitive changes...
//
// { path: "state.foo.bar", change: "add",    value: "foo" }
// { path: "state.foo.bar", change: "update", value: "foo" }
// { path: "state.foo.bar", change: "remove" }
//
// For object/array contents changed...
//
// { path: "state.foo" change: "object" }
//


