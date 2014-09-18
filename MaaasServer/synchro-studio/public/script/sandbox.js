// Edit page javascript
//
var currentModule = null; // Only if loaded via modules (not via debugger)
var currentScriptPath = null;
var editMode = false;

var editor;

// Toastr rules.  http://codeseven.github.io/toastr/
//
toastr.options = 
{
    closeButton: true,
    debug: false,
    positionClass: "toast-bottom-right",
    onclick: null,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut"
}

// Here is some a discussion and some code to deal with moving breakpoints on line insert/delete:
//
//     https://groups.google.com/forum/#!msg/ace-discuss/sfGv4tRWZdY/ca1LuolbLnAJ
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

    $("#module").text("Module: " + currentModule);
    if (currentModule)
    {
        $("button#save").show();
    }
    else
    {
        $("button#save").hide();
    }

    // Highlight the new active module...
    //
    $("div#modules a.active").removeClass("active");
    $("div#modules a[module='" + currentModule + "']").addClass("active");
}

function getModulePathPrefix()
{
    // !!! Not sure if this needs to be configurable.  The synchro-api processor has a virtual path (where it pretends all 
    //     modules are loaded from), so any debugger interaction with synchro modules (like breakpoints) need to use that
    //     path prefix to the module name.
    //
    return "synchro-api\\lib\\routes\\";
}

function initEditPage(page)
{
    currentScriptPath = getModulePathPrefix() + page;
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
            clearBreakpoint(currentScriptPath, row);
        }
        else 
        {
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

function onLoadModule(moduleName)
{
    var modulePath = getModulePathPrefix() + moduleName;
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
        loadBreakpoints(modulePath);
    })
    .fail(function() 
    {
        alert( "loadModule error" );
    });

    return false; // To prevent default click behavior
}

function onBreakpointSource(sourceData)
{
    var prefix = getModulePathPrefix();
    if (sourceData.scriptPath.lastIndexOf(prefix) == 0)
    {
        sourceData.moduleName = sourceData.scriptPath.substring(prefix.length);
        console.log("Loading breakpoint source from module loader for module: " + sourceData.moduleName);
        $.getJSON("module", { module: sourceData.moduleName }, function(data)
        {
            // Process JSON response
            console.log("loadModule " + sourceData.moduleName + ": " + JSON.stringify(data));
            sourceData.source = data.source;
            loadSource(sourceData);
        })
        .fail(function() 
        {
            alert( "loadModule error" );
        });
    }
    else
    {
        loadSource(sourceData);
    }
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
        toastr.success("Module saved and deployed")
    })
    .fail(function() 
    {
        alert( "error" );
    });
}
