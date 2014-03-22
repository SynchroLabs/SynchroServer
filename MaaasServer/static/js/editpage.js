// Edit page javascript
//
var currentScriptPath = null;
var editMode = false;

var editor;

// Here is some code to deal with moving breakpoints on line insert/delete:
//
//     https://github.com/MikeRatcliffe/Acebug/blob/master/chrome/content/ace%2B%2B/startup.js
//

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

function doSave() 
{
    $.post("edit", { page: page, content: editor.getValue() }, function(result)
    {
        alert("Module saved");
    })
    .fail(function() 
    {
        alert( "error" );
    });
}
