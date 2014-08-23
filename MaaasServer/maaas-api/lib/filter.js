// Module to apply View filtering logic
//
var lodash = require("lodash");
var util = require('./util');

var logger = require('log4js').getLogger("filter");

function equalsOrContains(haystack, needle)
{
    if (haystack instanceof Array)
    {
        for (var i = 0; i < haystack.length; i++) 
        {
            if (haystack[i] == needle)
            {
                return true;
            }
        }
        return false;
    }
    else
    {
        return haystack == needle;
    }
}

// Filter value domain types:
//
//   deviceMetric, viewMetric, viewModel
//
// Filter operators:
//
//   is, isnot, lt, lte, gt, gte
//
function processFilter(session, filter)
{
    var value = null;
    var isDynamic = false;

    if (filter["deviceMetric"])
    {
        value = util.getObjectProperty(session.DeviceMetrics, filter["deviceMetric"]);
    }
    else if (filter["viewMetric"])
    {
        value = util.getObjectProperty(session.ViewMetrics, filter["viewMetric"]);
        isDynamic = true;
    }
    else if (filter["viewModel"])
    {
        value = util.getObjectProperty(session.ViewModel, filter["viewModel"]);
        isDynamic = true;
    }
    else
    {
        // !!! Error - no filter value domain and value
    }

    var operands = ["is", "isnot", "lt", "lte", "gt", "gte"];
    var operand = null;
    var operandValue = null;

    for (var i = 0; i < operands.length; i++)
    {
        if (filter[operands[i]] !== undefined)
        {
            operand = operands[i];
            operandValue = filter[operand];
            break;
        }
    }

    // logger.info("operand: " + operand + ", operandValue: " + operandValue + ", value: " + value);

    var result = false;

    if (operand && (operandValue !== null))
    {
        switch (operand)
        {
            case "is":
                result = equalsOrContains(operandValue, value);
                break;

            case "isnot":
                result = !equalsOrContains(operandValue, value);
                break;

            case "lt":
                result = value < operandValue;
                break;

            case "lte":
                result = value <= operandValue;
                break;

            case "gt":
                result = value > operandValue;
                break;

            case "gte":
                result = value >= operandValue;
                break;
        }
    }
    else
    {
        // !!! Error - no operand and operand value
    }

    return result;
}

// Return false if any provided filter criteria is not met, otherwise true
//
function objectPassesFilter(session, obj)
{
    if (obj["filter"])
    {
        var result = true;

        if (obj["filter"] instanceof Array)
        {
            // Multiple filters - treated as an AND with shortcut evaluation...
            //
            for (var i = 0; i < obj["filter"].length; i++) 
            {
                result = processFilter(session, obj["filter"][i]);
                if (!result)
                {
                    break;
                }
            }
        }
        else
        {
            // Single filter...
            //
            result = processFilter(session, obj["filter"]);
        }

        // Remove the "filter" attribute (now that it's processed and no longer relevant)
        //
        delete obj["filter"];

        return result;
    }

    // If we get here, we didn't fail to meet any filter criteria, so we won!
    return true;
}

function processSelectFirst(session, obj, containingArray)
{
    // If the object is a select:First, process it now - promote first qualifying child, if any
    //
    if (obj["select"] == "First")
    {
        if (obj["contents"] && (obj["contents"] instanceof Array) && (obj["contents"].length > 0))
        {
            for (var i = 0; i < obj["contents"].length; i++) 
            {
                // Return the first qualifying child
                var childObj = obj["contents"][i];
                if (objectPassesFilter(session, childObj))
                {
                    return processSelectFirst(session, childObj);
                }
            }
        }

        return null;
    }

    return processObject(session, obj); // Not a select:First
}

function processSelectAll(obj, containingArray)
{
    // If the object is a select:All, process it now - promote all children by adding them to the containing array
    //
    if (obj["select"] == "All")
    {
        if (obj["contents"] && (obj["contents"] instanceof Array))
        {
            for (var i = 0; i < obj["contents"].length; i++) 
            {
                containingArray.push(obj["contents"][i]);
            }
        }
    }
    else
    {
        // Not a select:All, just add object itself to the containing array
        containingArray.push(obj);
    }
}

function processObject(session, obj)
{    
    if (!objectPassesFilter(session, obj))
    {
        return null;
    }

    if (obj)
    {
        // Iterate properties of object...
        for (var property in obj)
        {
            // Process properties that contain arrays...
            if (obj[property] && (obj[property] instanceof Array))
            {
                var newArray = [];

                // For each array element...
                for (var i = 0; i < obj[property].length; i++) 
                {
                    // If the array element is an Object, process that object...
                    if (obj[property][i] && (obj[property][i] instanceof Object))
                    {
                        var childObj = processSelectFirst(session, obj[property][i], newArray);
                        if (childObj)
                        {
                            processSelectAll(childObj, newArray);
                        }
                    }
                }
                
                obj[property] = newArray;
            }
        }
    }

    return obj;
}

exports.filterView = function(session, view)
{    
    // logger.info("Applying filter to view");
    return processObject(session, lodash.cloneDeep(view));
}
