// Main page
//
exports.View =
{
    title: "Game",
    elements:
    [
        { control: "text", value: "Tap Squares for Fun", fontsize: 12 },

        { control: "stackpanel", orientation: "Horizontal", binding: { foreach: "board" }, contents: [
            { control: "rectangle", height: "50", width: "50", fill: "{background}", 
              binding: { foreach: "$data", onTap: { command: "squareTapped", row: "{$parent.$index}", col: "{$index}" } } },
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
    }

    viewModel.board = new Array(8);
    for (var row = 0; row < 8; row++) 
    {
        viewModel.board[row] = new Array(8);
        for (var col = 0; col < 8; col++) 
        {
            viewModel.board[row][col] = { background: ((row + col) % 2) ? "Green" : "Blue" }
        }
    }

    return viewModel;
}

exports.Commands = 
{
    squareTapped: function(context, session, viewModel, params)
    {
        console.log("OnTapped - row: %s, col: %s", params.row, params.col);
        viewModel.board[params.row][params.col].background = "White";
    }
}
