/*
* old tetris code.
* we will revise this code and add:
 * dark theme
 * soft drop
 * lock delay
 * nice GUI
* in the next meeting
*/

var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = 300, h = 600;
var boardWidth = 10, boardHeight = 20;
var squareWidth = w / boardWidth;
var grid = [];
var hold = "O";
var alreadyHeld = false;

// 7-bag piece generator
var bag = [];
var queue = [];
function _getPiece() {
    if (bag.length == 0) {
        let unshuffled = ["O", "L", "J", "T", "S", "Z", "I"];

        let shuffled = unshuffled
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        bag = JSON.parse(JSON.stringify(shuffled));
    }
    return bag.pop();
}
_getPiece();

queue = [_getPiece(), _getPiece(), _getPiece(), _getPiece(), _getPiece(), _getPiece(), _getPiece()];

function getPiece() {
    var ret = queue[0];
    queue.shift();
    queue.push(_getPiece());
    return ret;
}

// very complicated piece rotation code
var pieces = {
    "I": [ [[1, 0], [1, 1], [1, 2], [1, 3]] ],
    "J": [ [[0, 0], [1, 0], [1, 1], [1, 2]] ],
    "L": [ [[0, 2], [1, 0], [1, 1], [1, 2]] ],
    "O": [ [[0, 1], [0, 2], [1, 1], [1, 2]] ],
    "S": [ [[0, 1], [0, 2], [1, 0], [1, 1]] ],
    "T": [ [[0, 1], [1, 0], [1, 1], [1, 2]] ],
    "Z": [ [[0, 0], [0, 1], [1, 1], [1, 2]] ]
};
for (var rot=0; rot<3; rot++) {
    for (var piece in pieces) {
        pieces[piece].push([]);
        for (var coord of pieces[piece][pieces[piece].length-2]) {
            var x = coord[0], y = coord[1]; x--; y--;
            var xNew = -y, yNew = x; xNew++;; yNew++;
            pieces[piece][pieces[piece].length-1].push([xNew, yNew]);
        }
    }
}

var currentPiece = getPiece(), currentRotation = 0;
var pieceX = 0, pieceY = 0;

// fill the grid
for (var i=0; i<boardWidth; i++) {
    grid.push([]);
    for (var j=0; j<boardHeight; j++) {
        grid[grid.length-1].push(false);
    }
}

addEventListener("keydown", function(e) {
    var oldRot = currentRotation, oldX = pieceX, oldY = pieceY;
    if (e.code == "ArrowUp") {
        currentRotation++;
        currentRotation %= 4;
    }
    if (e.code == "ArrowLeft") {
        pieceX--;
    }
    if (e.code == "ArrowRight") {
        pieceX++;
    }

    // if rotating it makes it obstructed, revert the change
    for (var coord of pieces[currentPiece][currentRotation]) {
        if (coord[0]+pieceX < 0 || coord[0]+pieceX >= boardWidth || grid[coord[0]+pieceX][coord[1]+pieceY] || coord[1]+pieceY > boardHeight) {
            currentRotation = oldRot;
            pieceX = oldX;
            pieceY = oldY;
            return;
        }
    }
    
    if (e.code == "Space") {
        // hard drop
        var freeze = false;
        while (!freeze) {
            for (var coord of pieces[currentPiece][currentRotation]) {
                if (coord[1] + pieceY + 1 >= boardHeight || grid[coord[0]+pieceX][coord[1]+pieceY+1]) {
                    // in the next iteration, the piece will collide with the blocks
                    freeze = true; break;
                }
            }
            if (!freeze) {
                pieceY++;
            }
        }
        for (var coord of pieces[currentPiece][currentRotation]) {
            grid[coord[0] + pieceX][coord[1] + pieceY] = true;
        }
        pieceY = 0; pieceX = 3;
        currentPiece = getPiece();
        // check if this new piece is obstructed
        for (var coord of pieces[currentPiece][currentRotation]) {
            if (grid[coord[0]+pieceX][coord[1]+pieceY]) {
                clearInterval(gameInterval);
                ctx.font = "100px Calibri";
                ctx.fillStyle = "red";
                ctx.fillText("YOU LOSE bum", 0, 100);
            }
        }
        alreadyHeld = false;
    }

    // hold
    if (e.code == "KeyC" && !alreadyHeld) {
        [hold, currentPiece] = [currentPiece, hold];
        for (var coord of pieces[currentPiece][currentRotation]) {
            if (grid[coord[0] + pieceX][grid[1] + pieceY]) {
                [hold, currentPiece] = [currentPiece, hold];
                return;
            }
        }
        alreadyHeld = true;
    }
})

ctx.strokeStyle = "lightgrey";
    for (var i=0; i<=w; i+=squareWidth) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
    }
    for (var i=0; i<=h; i+=squareWidth) {
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
    }

function gameLoop() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 600, 600); // clear with black
    
    ctx.font = "30px Comic Sans";
    if (alreadyHeld) {
        ctx.fillStyle = "grey";
    } else {
        ctx.fillStyle = "green";
    }
    ctx.fillText("hold: " + hold + ", next: " + queue, 0, squareWidth);
    ctx.fillStyle = "black";
    ctx.stroke();
    for (var i=0; i<boardWidth; i++) {
        for (var j=0; j<boardHeight; j++) {
            if (grid[i][j]) {
                ctx.fillRect(i * squareWidth, j * squareWidth, squareWidth, squareWidth);
            }
        }
    }
    var freeze = false;
    ctx.fillStyle = "green";
    for (var coord of pieces[currentPiece][currentRotation]) {
        ctx.fillRect((coord[0] + pieceX) * squareWidth, (coord[1] + pieceY) * squareWidth, squareWidth, squareWidth);
        if (coord[1] + pieceY + 1 >= boardHeight || grid[coord[0]+pieceX][coord[1]+pieceY+1]) {
            // in the next iteration, the piece will collide with the blocks
            freeze = true;
        }
    }
    if (freeze) {
        // freeze the piece and put a new one
        for (var coord of pieces[currentPiece][currentRotation]) {
            grid[coord[0] + pieceX][coord[1] + pieceY] = true;
        }
        pieceY = 0; pieceX = 3;
        currentPiece = getPiece();
        // check if this new piece is obstructed
        for (var coord of pieces[currentPiece][currentRotation]) {
            if (grid[coord[0]+pieceX][coord[1]+pieceY]) {
                clearInterval(gameInterval);
                ctx.font = "100px Calibri";
                ctx.fillStyle = "red";
                ctx.fillText("YOU LOSE bum", 0, 100);
            }
        }
        alreadyHeld = false;
    }

    // clear line
    for (var i=0; i<boardHeight; i++) {
        var lineCleared = true;
        for (var j=0; j<boardWidth; j++) {
            if (!grid[j][i]) {lineCleared = false;}
        }
        if (lineCleared) {
            for (var j=0; j<boardWidth; j++) {
                grid[j].splice(i, 1);
                grid[j].unshift(false);
            }
        }
    }
}

var gameInterval = setInterval(gameLoop, 16.666);

setInterval(function() {pieceY++;}, 1000);
