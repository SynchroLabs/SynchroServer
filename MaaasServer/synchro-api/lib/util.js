﻿
var crypto = require("crypto");
var lodash = require("lodash");

var logger = require('log4js').getLogger("util");


// This handy method allows you to completely repopulate an object with new contents (removing/replacing any
// previous contents).  This is particularly useful for doing a poor-mans pass-by-reference when using an
// object param.
//
exports.assignNewContents = function(obj, contents)
{
    lodash.each(obj, function(v, k) 
    {
        delete obj[k];
    });
    lodash.assign(obj, contents);
}

exports.jsonHash = function(obj)
{
   return crypto.createHash('sha1').update(JSON.stringify(obj)).digest("hex");
}

exports.removeBOM = function(content)
{
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM) because the buffer-to-string
    // conversion in `fs.readFileSync()` translates it to FEFF, the UTF-16 BOM.
    //
    if (content.charCodeAt(0) === 0xFEFF)
    {
        content = content.slice(1);
    }

    return content;
}

exports.getObjectProperty = function(obj, propertyPath)
{
    propertyPath = propertyPath.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    var parts = propertyPath.split('.'),
        last = parts.pop(),
        len = parts.length,
        i = 1,
        current = parts[0];

    if (len > 0)
    {
        while ((obj = obj[current]) && i < len)
        {
            current = parts[i];
            i++;
        }
    }

    if (obj)
    {
        return obj[last];
    }
}

exports.setObjectProperty = function(obj, propertyPath, value)
{
    propertyPath = propertyPath.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    var parts = propertyPath.split('.'),
        last = parts.pop(),
        len = parts.length,
        i = 1,
        current = parts[0];

    if (len > 0)
    {
        while ((obj = obj[current]) && i < len)
        {
            current = parts[i];
            i++;
        }
    }
    
    if (obj)
    {
        logger.info("Updating bound item for property: " + propertyPath);
        obj[last] = value;
        return obj[last];
    }
}

// 
// Remove one or more items from an array.  
//
// Usage:
//
//   Single argument    - arr.remove("foo");
//   Multiple arguments - arr.remove("foo", "bar");
//   Array argument     - arr.remove(["foo", "bar"]);
//
Array.prototype.remove = function ()
{
    if ((arguments.length == 1) && (typeof(arguments[0]) == "function"))
    {
        // Removing items that satisfy callback function
        //
        var isRemoveTarget = arguments[0];
        var i = this.length;
        while (i--) 
        {
            if (isRemoveTarget(this[i])) 
            {
                this.splice(i, 1);
            }
        }
    }
    else
    {
        // Removing a list of items or an array of items (the items can be objects - deep equality checking will be used)
        //
        var itemsToRemove = [];

        for (var argNum = 0; argNum < arguments.length; ++argNum) 
        {
            var item = arguments[argNum];
            if (item instanceof Array)
            {
                for (var i = 0; i < item.length; ++i) 
                {
                    itemsToRemove.push(item[i]);
                }
            }
            else
            {
                itemsToRemove.push(item);
            } 
        }

        var itemsLen = itemsToRemove.length;
        while (itemsLen && this.length)
        {
            var foundAt = -1;
            itemToRemove = itemsToRemove[--itemsLen];
            while ((foundAt = lodash.findIndex(this, function isMatch(item) {return lodash.isEqual(item, itemToRemove)})) != -1)
            {
                this.splice(foundAt, 1);
            }
        }
    }
    
    return this;
}

// Remove null items from array
//
Array.prototype.clean = function() 
{
    for (var i = 0; i < this.length; i++) 
    {
        if (this[i] == null) // null or undefined
        {         
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};