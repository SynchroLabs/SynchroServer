// Main page
//
var boardDim = 5;
var squareOn = "Orange";
var squareOff = "DarkGray";

exports.View =
{
    title: "Game",
    elements:
    [
        { control: "text", value: "Turn Out the Lights", fontsize: 12 },

        { control: "stackpanel", orientation: "Horizontal", binding: { foreach: "board" }, contents: [
            { control: "rectangle", height: "75", width: "75", fill: "{background}", 
              binding: { foreach: "$data", onTap: { command: "squareTapped", row: "{$parent.$index}", col: "{$index}" } } },
        ] },
        { control: "text", value: "Turns: {turnCount}, lights: {lights}", fontsize: "12" }
    ]
}

function countLights(viewModel)
{
    viewModel.lights = 0;
    for (var row = 0; row < boardDim; row++) 
    {
        for (var col = 0; col < boardDim; col++) 
        {
            if (viewModel.board[row][col].background == squareOn)
            {
                viewModel.lights++;
            }
        }
    }
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        turnCount: 0,
        lights: 0
    }

    viewModel.board = new Array(boardDim);
    for (var row = 0; row < boardDim; row++) 
    {
        viewModel.board[row] = new Array(boardDim);
        for (var col = 0; col < boardDim; col++) 
        {
            viewModel.board[row][col] = { background: Math.random() > 0.5 ? squareOn : squareOff }
        }
    }

    countLights(viewModel);

    return viewModel;
}

function toggle(board, row, col)
{
    if ((row >= 0) && (row < board.length) && (col >= 0) && (col < board[row].length))
    {
        board[row][col].background = board[row][col].background == squareOn ? squareOff : squareOn;
    }
}

exports.Commands = 
{
    squareTapped: function(context, session, viewModel, params)
    {
        toggle(viewModel.board, params.row, params.col);
        toggle(viewModel.board, params.row-1, params.col);
        toggle(viewModel.board, params.row+1, params.col);
        toggle(viewModel.board, params.row, params.col-1);
        toggle(viewModel.board, params.row, params.col+1);
        viewModel.turnCount++;
        countLights(viewModel);
        if (viewModel.lights == 0)
        {
            return Synchro.showMessage(context, { message: "Congrats!  You turned out the lights!" });
        }
    }
}
