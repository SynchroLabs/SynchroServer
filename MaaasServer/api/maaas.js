// This module contains the MAAAS API that is exposed to pages/screens
//
var wait = require('wait.for');

module.exports = function(apiProcessor, resourceResolver)
{
	var maaas = 
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

	return maaas;
}