// This is the static prefix resource resolver. 
//
module.exports = function(params)
{
    var prefix = params.prefix;

    var resourceResolver = 
    {
        getResourceUrl: function(resource)
        {
            return prefix + resource;
        }
    }

    return resourceResolver;
}
