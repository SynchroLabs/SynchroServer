// Picker page
//
exports.View =
{
    title: "Picker",
    elements:
    [
        { control: "picker", width: 150, margin: { bottom: 10 }, binding: { 
            items: "colors", itemContent: "Color: {name}", selection: "selectedColor", selectionItem: "value", 
            onSelectionChange: { command: "clicked", control: "Picker", colorName: "{name}" } 
            } 
        },

        { control: "border", border: "White", borderThickness: "5", contents: [
            { control: "rectangle", width: "100", height: "100", fill: "{selectedColor}" },
        ] },

        { control: "listbox", select: "Single", height: 250, width: 250, binding: { 
            items: "colors", itemContent: "{name}",  selection: "selectedColor", selectionItem: "value", 
            onSelectionChange: { command: "clicked", control: "ListBox", colorName: "{name}" }
            } 
        },

        { control: "listview", select: "Single", height: 300, width: 250, 
            binding: { 
                items: "colors", selection: "selectedColor", selectionItem: "value", 
                onSelectionChange: { command: "clicked", control: "ListView", colorName: "{name}" } 
            }, 
            itemTemplate: { control: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                { control: "text", width: 65, value: "{name}" },
                { control: "rectangle", height: 25, width: 100, fill: "{value}" },
            ] },
        },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        colors:
        [
            { name: "Red", color: "red", value: "#ff0000" }, { name: "Green", color: "green", value: "#00ff00" }, { name: "Blue", color: "blue", value: "#0000ff" },
        ],
        selectedColor: "#00ff00",
    }
    return viewModel;
}

exports.Commands =
{
    clicked: function(context, session, viewModel, params)
    {
        return Synchro.showMessage(context, { message: params.control + " selection changed, new color: " + params.colorName });
    },
}
