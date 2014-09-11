var assert = require("assert");
require("./assert-helper");

var fs = require('fs');
var path = require('path');
var util = require("../lib/util");

var logger = require('log4js').getLogger("module-manager-test");

describe("Module Manager", function()
{
    var moduleDirectory = path.resolve('test', 'testapp');

    logger.info("moduleDirectory: " + moduleDirectory);

    var moduleStore = 
    {
        getAppDefinition: function()
        {
            var appDefinitionPath = path.resolve(moduleDirectory, "synchro.json");
            var content = util.removeBOM(fs.readFileSync(appDefinitionPath, 'utf8'));
            logger.info("got app def: " + content);
            return JSON.parse(content);
        },
            
        listModules: function()
        {
            return ["menu.js", "counter.js"];
        },
            
        getModuleSource: function(moduleFilename)
        {
            var moduleFilePath = path.resolve(moduleDirectory, moduleFilename);
            var content = util.removeBOM(fs.readFileSync(moduleFilePath, 'utf8'));
            return content;
        },
            
        putModuleSource: function(moduleFilename, content)
        {
        },
            
        removeModuleSource: function (moduleFilename)
        {
        }
    };

    var resourceResolver =
    {
        getResourceUrl: function(resource)
        {
            return "test:" + resource;
        }
    };

    var moduleManager = require('../lib/module-manager')(moduleStore, resourceResolver);

    it("should get no error and proper app definition on callback from loadModules", function(done) 
    {
        moduleManager.loadModules({}, function(err, appDefinition)
        {
            assert.equal(err, null);

            var expectedAppDefinition = 
            {
                "name": "synchro-test",
                "version": "0.0.0",
                "description": "Synchro API Test",
                "mainPage": "launch",
                "author": "Bob Dickinson <bob@synchro.io> (http://synchro.io/)"
            }
            assert.objectsEqual(appDefinition, expectedAppDefinition);
            done();
        });
    });

    it("should get loaded modules via getModule", function()
    {
        var menu = moduleManager.getModule("menu");
        var menuViewModel = menu.InitializeViewModel({}, {});
        assert.objectsEqual(menuViewModel, { test: "testValue" });

        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });
    });

    it("should get correct view from loaded module", function()
    {
        var menu = moduleManager.getModule("menu");
        var view = 
        {
            title: "Menu",
            elements: 
            [
		        { control: "button", caption: "Counter", binding: "goToCounter" },
	        ]
        };
        assert.objectsEqual(menu.View, view);
    });

    it("should be able to load a module with dynamic view only, and get correct view from same", function()
    {
        // This used to fail (fail to load the module at all, because it lacked the View member)
        //
        var counter = moduleManager.getModule("counter");
        var view = 
        {
            title: "Counter Page",
            onBack: "exit",
            elements: 
            [
                { control: "text", value: "Count: {count}", font: 24 },
            ]
        };
        assert.objectsEqual(counter.View, undefined);
        assert.objectsEqual(counter.InitializeView(), view);
    });

    it("should be able to access app services from loaded module", function() 
    {
        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });

        // This will do a Synchro.getResourceUrl() in the module
        counter.Commands.test({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 0, url: "test:user.png" });
    });

    it("should update already loaded module instance with new module content on reloadModule, reflecting provided source", function()
    {
        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });

        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 1 });

        var moduleFilePath = path.resolve(moduleDirectory, "counter_update.js");
        var content = util.removeBOM(fs.readFileSync(moduleFilePath, 'utf8'));

        moduleManager.reloadModule("counter.js", content);

        counter = moduleManager.getModule("counter");
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 6 });
    });

    it("should update already loaded module instance with module content from module store on reloadModule", function()
    {
        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });
        
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 5 });
                
        moduleManager.reloadModule("counter.js");
        
        counter = moduleManager.getModule("counter");
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 6 });
    });
});