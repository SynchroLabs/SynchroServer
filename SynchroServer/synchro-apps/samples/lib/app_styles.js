// Default styles
//
exports.defaultStyleMapping = 
{
    "button": "btnStyle",
    "text": "txtStyle"
}

// Global styles
//
exports.styles = 
{
    btnStyle:
    {
        foreground: "CornflowerBlue",
        background: "DarkSlateGray",
    },
    txtStyle:
    {
        fontsize: 12
    },
    stackStyle:
    {
        orientation: "Horizontal"
    },
    editStyle:
    {
        fontsize: { os_value: { iOS: 9, android: 10, win: 11, default: 12 } },
        os_merge: 
        { 
            iOS: 
            { 
                foreground: "Blue" 
            },
            win:
            { 
                foreground: "Blue",
                background: "Black" 
            },
            default:
            {
                background: "Green"
            }
        }
    }
}
