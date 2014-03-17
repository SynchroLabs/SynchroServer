// This is the cloud-based module store.  It works with modules in the "maaas-modules" container of the Azure
// storage "maaas".
//
var azure = require('azure');
var wait = require('wait.for');

var storageName = "maaas";
var containerName = "maaas-modules";

// Note: In an Azure Cloud Service we don't need these params (they are set in web.config)
//
var blobService = azure.createBlobService(
    storageName,
    "xGXFkejKx3FeaGaX6Akx4C2owNO2eXXqLmVUk5T1CZ1qPYJ4E+3wMpOl+OVPpmnm4awHBHnZ5U6Cc0gHHwzmQQ=="
    );

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

exports.listModules = function()
{
    var modules = [];

    var blobs = wait.for(listBlobs);
    for (var i = 0; i < blobs.length; i++) 
    {
        modules.push(blobs[i].name);
    }

    return modules;
};

exports.getModuleSource = function(moduleFilename)
{
    return wait.for(getBlobText, moduleFilename);
};

exports.putModuleSource = function(moduleFilename, content)
{
    return wait.for(setBlobText, moduleFilename, content);
};

exports.removeModuleSource = function(moduleFilename)
{
    return wait.for(removeBlob, moduleFilename, content);
};