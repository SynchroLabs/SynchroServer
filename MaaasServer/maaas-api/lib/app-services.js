// This module contains the helper API that is exposed to our app modules
//
var wait = require('wait.for');

module.exports = function(apiProcessor, resourceResolver)
{
	var services = 
	{
		getResourceUrl: function(resource)
		{
		    return resourceResolver.getResourceUrl(resource);
		},

		navigateToView: function(context, route, params)
		{
		    apiProcessor.navigateToView(context, route, params);
		},

		showMessage: function(context, messageBox)
		{
		    apiProcessor.showMessage(context, messageBox);
		},

		waitFor: function()
		{
		    return wait.for.apply(this, arguments);
		}
	}

	return services;
}