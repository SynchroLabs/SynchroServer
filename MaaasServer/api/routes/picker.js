// Picker page
//

exports.View =
{
    title: "Picker",
    onBack: "exit",
    elements:
    [
        { type: "picker", width: 100, margin: { bottom: 10 }, binding: { 
            items: "colors", item: "name", selection: "selectedColor", selectionItem: "value", 
            onItemClick: { command: "clicked", control: "Picker", colorName: "{name}" } 
            } 
        },

        { type: "border", border: "White", borderthickness: "5", contents: [
            { type: "rectangle", width: "100", height: "100", fill: "{selectedColor}" },
        ] },

        { type: "listbox", select: "Single", height: 150, width: 200, binding: { 
            items: "colors", item: "name",  selection: "selectedColor", selectionItem: "value", 
            onItemClick: { command: "clicked", control: "ListBox", colorName: "{name}" }
            } 
        },

        { type: "listview", select: "Single", height: 300, width: 200, 
            binding: { 
                items: "colors", selection: "selectedColor", selectionItem: "value", 
                onItemClick: { command: "clicked", control: "ListView", colorName: "{name}" } 
            }, 
            itemTemplate: { type: "stackpanel", orientation: "Horizontal", padding: 5, contents: [
                { type: "text", width: 65, value: "{name}" },
                { type: "rectangle", height: 25, width: 100, fill: "{value}" },
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
        return showMessage(context, { message: params.control + " selection changed, new color: " + params.colorName });
    },
    exit: function(context)
    {
        return navigateToView(context, "menu");
    },
}
