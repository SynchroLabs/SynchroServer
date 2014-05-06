// This is the cloud-based module store.  It works with modules in the "maaas-modules" container of the Azure
// storage "maaas".
//
var azure = require('azure');
var wait = require('wait.for');

module.exports = function(params)
{
    var storageAccount = params.storageAccount;
    var storageAccessKey = params.storageAccessKey;
    var containerName = params.containerName;

    var blobService = azure.createBlobService(storageAccount, storageAccessKey);

    function listBlobs(callback)
    {
        blobService.listBlobs(containerName, function(err, blobs)
        {
            callback(err, blobs);
        });
    }

    function getBlobText(blobName, callback)
    {
        blobService.getBlobToText(containerName, blobName, function(err, text)
        {
            callback(err, text);
        });
    }

    function setBlobText(blobName, text, callback)
    {
        blobService.createBlockBlobFromText(containerName, blobName, text, function(err, result)
        {
            callback(err, result);
        });
    }

    function removeBlob(blobName, callback)
    {
        blobService.deleteBlob(containerName, blobName, function(err, result)
        {
            callback(err, result);
        });
    }

    function stripBom(content)
    {
        // !!! OK - this needs to be looked at.  What I know is that when I upload local JS modules created with
        //     Visual Studio, those files have a UTF-16 BOM marker at the beginning (which makes sense, as they
        //     should be UTF-16, or more specifically, UCS-2, which is the UTF-16 subset supported by Javascript
        //     and the V8 engine - Note also: I have see "ucs2" as an alias for "utf16le" in node code/docs).
        //
        //     At any rate, the UTF-16 BOM marker does not survive the round trip from the blob store to the ACE
        //     editor in the client, and back.  So we're going to remove it for now.  But really we need a clear
        //     understanding of all of the encoding issues (not the least of which is how the JS string we get from 
        //     the ACE editor is encoded, and how the encoding specified in the Azure blob relates to the blob 
        //     text getting serialized to/from the JS string).
        //
        if (content.charCodeAt(0) === 0xFEFF) 
        {
            content = content.slice(1);
        }
        return content;
    }

    var moduleStore = 
    {
        listModules: function()
        {
            var modules = [];

            var blobs = wait.for(listBlobs);
            for (var i = 0; i < blobs.length; i++) 
            {
                modules.push(blobs[i].name);
            }

            return modules;
        },

        getModuleSource: function(moduleFilename)
        {
            var content = wait.for(getBlobText, moduleFilename);
            return stripBom(content);
        },

        putModuleSource: function(moduleFilename, content)
        {
            return wait.for(setBlobText, moduleFilename, content);
        },

        removeModuleSource: function(moduleFilename)
        {
            return wait.for(removeBlob, moduleFilename, content);
        }
    }

    return moduleStore;
}
