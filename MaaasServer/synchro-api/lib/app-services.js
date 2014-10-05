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
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.navigateToView()");
			}
		    apiProcessor.navigateToView(context, route, params);
		},

		showMessage: function(context, messageBox)
		{
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.showMessage()");
			}
		    apiProcessor.showMessage(context, messageBox);
		},

		waitFor: function(context)
		{
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.waitFor()");
			}
			var args = Array.prototype.slice.call(arguments, 1);
			return apiProcessor.waitFor(this, context, args);
		},

		interimUpdate: function(context)
		{
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.interimUpdate()");
			}
			apiProcessor.interimUpdate(context);
		},

		isActiveInstance: function(context)
		{
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.isActiveInstance()");
			}
			return apiProcessor.isActiveInstance(context);
		},

		getMetrics: function(context)
		{
			if (!apiProcessor.isValidContext(context))
			{
				throw new Error("A valid context must be the first parameter to Synchro.getMetrics()");
			}
			return { DeviceMetrics: context.session.DeviceMetrics, ViewMetrics: context.session.ViewMetrics };
		}
	}

	return services;
}