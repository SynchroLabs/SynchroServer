// Edit page javascript
//
var currentModule = null; // Only if loaded via modules (not via debugger)
var currentScriptPath = null;
var editMode = false;

var editor;

// Here is some code to deal with moving breakpoints on line insert/delete:
//
//     https://github.com/MikeRatcliffe/Acebug/blob/master/chrome/content/ace%2B%2B/startup.js
//

function loadSource(sourceData)
{
    // sourceData.moduleName
    // sourceData.scriptPath
    // sourceData.source
    // sourceData.breakpoints
    // sourceData.executionPointer

    currentModule = sourceData.moduleName;
    currentScriptPath = sourceData.scriptPath;

    editor.session.clearBreakpoints();
    editor.session.setValue(sourceData.source);
    if (sourceData.breakpoints)
    {
        for (var i = 0; i < sourceData.breakpoints.length; i++)
        {
            var breakpoint = sourceData.breakpoints[i];
            editor.session.setBreakpoint(breakpoint.line);
        }
    }
    var executionPointer = sourceData.executionPointer || -1;
    setActiveBreakpoint(executionPointer);
    if (executionPointer >= 0)
    {
        editor.renderer.scrollToLine(executionPointer, true, true);
    }

    $("#module").text("Module: " + currentScriptPath);
    if (currentModule)
    {
        $("button#save").show();
    }
    else
    {
        $("button#save").hide();
    }
}


function initEditPage(page)
{
    currentScriptPath = "api\\routes\\" + page;
    editMode = true;

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.commands.addCommand(
    {
        name: 'saveCommand',
        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
        exec: function(editor) 
        {
            doSave();
        },
        readOnly: false // false if this command should not apply in readOnly mode
    });

    editor.on("guttermousedown", function(e)
    { 
        var target = e.domEvent.target; 
        if (target.className.indexOf("ace_gutter-cell") == -1) 
            return; 
        if (!editor.isFocused()) 
            return; 
        if (e.clientX > 25 + target.getBoundingClientRect().left) 
            return; 

        var row = e.getDocumentPosition().row 
        if (e.editor.session.getBreakpoints()[row]) 
        {
            e.editor.session.clearBreakpoint(row);
            clearBreakpoint(currentScriptPath, row);
        }
        else 
        {
        	e.editor.session.setBreakpoint(row);
            setBreakpoint(currentScriptPath, row);
        }
        e.stop();
    });

    editor.session.on("changeBreakpoint", function(e)
    { 
        // alert("change breakpoint");
    });
}

var activeBreakpointMarker;
function setActiveBreakpoint(row) // Use -1 to clear
{
    if (activeBreakpointMarker)
    {
        editor.getSession().removeMarker(activeBreakpointMarker);
        activeBreakpointMarker = null;
    }

    if (row >= 0)
    {
        Range = require("ace/range").Range;
        var range = new Range(row, 0, row, 100);
        activeBreakpointMarker = editor.getSession().addMarker(range,"active-breakpoint","line", true);
    }
}

function loadModule(moduleName)
{
    var modulePath = 'api\\routes\\' + moduleName;
    $.getJSON("module", { module: moduleName }, function(data)
    {
        // Process JSON response
        console.log("loadModule " + moduleName + ": " + JSON.stringify(data));
        loadSource(
        {
            moduleName: moduleName,
            scriptPath: modulePath,
            source: data.source
        });
    })
    .fail(function() 
    {
        alert( "loadModule error" );
    });

    return false; // To prevent default click behavior
}

function doSave() 
{
    if (!currentModule)
    {
        alert("No module loaded");
        return;
    }

    $.post("module", { module: currentModule, source: editor.getValue() }, function(result)
    {
        alert("Module saved");
    })
    .fail(function() 
    {
        alert( "error" );
    });
}
