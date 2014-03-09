// Binding page
//
var maaas = require('../maaas');

exports.View =
{
    title: "Binding",
    onBack: "exit",
    elements:
    [
        // This demonstrates binding to something that doesn't exist in the model at startup, and that the
        // value can come and go and still be reflected correctly when present.
        //
        { control: "text", value: "Not defined at startup: {notDefined}", fontsize: 12 },
        { control: "stackpanel", orientation: "Horizontal", margin: { top: 10 }, contents: [
            { control: "button", caption: "Define", width: 100, binding: "define" },
            { control: "button", caption: "Undefine", width: 100, binding: "undefine" },
        ] },

        // This demonostrates "one-time" binding (specified using ^)
        //
        { control: "slider", minimum: 10, maximum: 50, binding: "slider", width: 400 },
        { control: "text", value: "Starting slider position: {^slider}, current: {slider}", fontsize: 12 },

        // This demonstrates all binding context specifiers ($root, $parent, $data, $index, as well as the "foreach" and "with" binding specification attributes)
        //
        { control: "text", value: "{$root.caption}: {$data}, value: {$parent.value}, index: [{$index}]", fontsize: 12, binding: { foreach: "colors", with: "name" } },

        // This demonstrates using an array index specifier to select an item in an array
        //
        { control: "text", value: "The second color is: {colors[1].name}", fontsize: 12 },

        { control: "edit", fontsize: 12, binding: { foreach: "colors", value: "name" } },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        slider: 25,
        caption: "The Color",
        colors:
        [
            { name: "Red", color: "red", value: "0xff0000" }, 
            { name: "Green", color: "green", value: "0x00ff00" }, 
            { name: "Blue", color: "blue", value: "0x0000ff" },
        ],
    }
    return viewModel;
}

exports.Commands =
{
    define: function(context, session, viewModel)
    {
        viewModel.notDefined = "Defined";
    },
    undefine: function(context, session, viewModel)
    {
        delete viewModel.notDefined;
    },
    exit: function(context)
    {
        return maaas.navigateToView(context, "menu");
    },
}
