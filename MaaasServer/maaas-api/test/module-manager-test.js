var assert = require("assert");
require("./assert-helper");

var fs = require('fs');
var path = require('path');

var logger = require('log4js').getLogger("module-manager-test");

function removeBOM(content)
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

describe("Module Manager", function()
{
    var moduleDirectory = path.resolve('test', 'testapp');

    logger.info("moduleDirectory: " + moduleDirectory);

    var moduleStore = 
    {
        getAppDefinition: function()
        {
            var appDefinitionPath = path.resolve(moduleDirectory, "synchro.json");
            var content = removeBOM(fs.readFileSync(appDefinitionPath, 'utf8'));
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
            var content = removeBOM(fs.readFileSync(moduleFilePath, 'utf8'));
            return content;
        },
            
        putModuleSource: function(moduleFilename, content)
        {
        },
            
        removeModuleSource: function (moduleFilename)
        {
        }
    };
    var resourceResolver = {};

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

    it("should add route path to the view of a loaded module", function()
    {
        var menu = moduleManager.getModule("menu");
        var view = 
        {
            title: "Menu",
            elements: 
            [
		        { control: "button", caption: "Counter", binding: "goToCounter" },
	        ],
            path: "menu"
        };
        assert.objectsEqual(menu.View, view);
    });

    it("should add route path to view of module with dynamic view only");

    it("should be able to access app services from loaded module");

    it("should update already loaded module instance with new module content on reloadModule, reflecting provided source", function()
    {
        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });

        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 1 });

        var moduleFilePath = path.resolve(moduleDirectory, "counter_update.js");
        var content = removeBOM(fs.readFileSync(moduleFilePath, 'utf8'));

        moduleManager.reloadModule("counter", content);

        counter = moduleManager.getModule("counter");
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 6 });
    });

    it.skip("should update already loaded module instance with module content from module store on reloadModule without source", function()
    {
        var counter = moduleManager.getModule("counter");
        var counterViewModel = counter.InitializeViewModel({}, {});
        assert.objectsEqual(counterViewModel, { count: 0 });
        
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 5 });
                
        moduleManager.reloadModule("counter");
        
        counter = moduleManager.getModule("counter");
        counter.Commands.inc({}, {}, counterViewModel);
        assert.objectsEqual(counterViewModel, { count: 6 });
    });
});