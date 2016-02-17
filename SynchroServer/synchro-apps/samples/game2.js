// Game of 15
//
var boardDim = 4; // Configurable board size - go nuts!

exports.View =
{
    title: "Game of 15",
    elements:
    [
        { control: "stackpanel", orientation: "Vertical", margin: 0, width: "*", contents: [
            { control: "text", value: "Put the Squares in Order", fontsize: 12, horizontalAlignment: "Center" },
            { control: "stackpanel", orientation: "Horizontal", margin: 0, horizontalAlignment: "Center", binding: { foreach: "board" }, contents: [
                { control: "border", background: "{background}", height: 75, width: 75, margin: 5, binding: { foreach: "$data", onTap: { command: "squareTapped", row: "{$parent.$index}", col: "{$index}" } }, contents: [
                    { control: "text", value: "{number}", horizontalAlignment: "Center", verticalAlignment: "Center", margin: 0 },
                ]}
            ] },
            { control: "text", value: "Turns: {turnCount}", fontsize: "12", horizontalAlignment: "Center" }
        ] },
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        turnCount: 0
    }

    var curr = 1;
    viewModel.board = new Array(boardDim);
    for (var row = 0; row < boardDim; row++) 
    {
        viewModel.board[row] = new Array(boardDim);
        for (var col = 0; col < boardDim; col++) 
        {
            if (curr <= ((boardDim * boardDim) - 1))
            {                
                viewModel.board[row][col] = { number: curr++, background: "Orange" };
            }
            else
            {
                viewModel.board[row][col] = { };
            }
        }
    }

    randomize(viewModel.board);

    return viewModel;
}

function randomize(board)
{
    var row = boardDim-1;
    var col = boardDim-1;
 
    for (var i = 0; i < 250; )
    {
        var possNewBlankRow = row;
        var possNewBlankCol = col;
        if (Math.random() > 0.5)
        {
            // Mod row
            possNewBlankRow = (Math.random() > 0.5) ? row + 1 : row - 1;
        }
        else
        {
            // Mod col
            possNewBlankCol = (Math.random() > 0.5) ? col + 1 : col - 1;
        }

        if ((possNewBlankRow >= 0) && (possNewBlankRow < boardDim) && (possNewBlankCol >= 0) && (possNewBlankCol < boardDim))
        {
            toggle(board, possNewBlankRow, possNewBlankCol);
            row = possNewBlankRow;
            col = possNewBlankCol;
            i++; // Only count valid moves
        }
    }
}

function isSolved(board)
{
    for (var row = 0; row < boardDim; row++) 
    {
        for (var col = 0; col < boardDim; col++) 
        {
            if ((row == boardDim-1) && (col == boardDim-1) && !board[row][col].number)
            {
                return true; // Got to the end and found empty square
            }
            else if (((row * boardDim) + col + 1) != board[row][col].number)
            {
                break; // Found a square out of position
            }
        }
    }
    return false;
}

function toggle(board, row, col)
{
    if ((row < boardDim-1) && !board[row+1][col].number)
    {
        board[row+1][col] = board[row][col];
    }
    else if ((row > 0) && !board[row-1][col].number)
    {
        board[row-1][col] = board[row][col];
    }
    else if ((col < boardDim-1) && !board[row][col+1].number)
    {
        board[row][col+1] = board[row][col];
    }
    else if ((col > 0) && !board[row][col-1].number)
    {
        board[row][col-1] = board[row][col];
    }
    else
    {
        return false;
    }

    board[row][col] = {};   
    return true;
}

exports.Commands = 
{
    squareTapped: function(context, session, viewModel, params)
    {
        if (toggle(viewModel.board, params.row, params.col))
        {
            viewModel.turnCount++;
            if (isSolved(viewModel.board))
            {
                return Synchro.showMessage(context, { message: "Congrats!  You solved it!" });
            }            
        }
    }
}