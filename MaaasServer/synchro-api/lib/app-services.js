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

		waitFor: function(context)
		{
			var args = Array.prototype.slice.call(arguments, 1);
			return apiProcessor.waitFor(this, context, args);
		},

		interimUpdate: function(context)
		{
			apiProcessor.interimUpdate(context);
		},

		isActiveInstance: function(context)
		{
			return apiProcessor.isActiveInstance(context);
		},

		getMetrics: function(context)
		{
			return { DeviceMetrics: context.session.DeviceMetrics, ViewMetrics: context.session.ViewMetrics };
		}
	}

	return services;
}