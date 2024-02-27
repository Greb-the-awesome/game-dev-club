var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = canvas.clientWidth;
var squareWidth = w / 15;

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

var currentPiece = "T", currentRotation = 0;
var pieceX = 0, pieceY = 0;

// fill the grid
var grid = [];
for (var i=0; i<15; i++) {
    grid.push([]);
    for (var j=0; j<15; j++) {
        grid[grid.length-1].push(false);
    }
}

addEventListener("keydown", function(e) {
    var oldRot = currentRotation, oldX = pieceX, oldY = pieceY;
    if (e.code == "KeyW") {
        currentRotation++;
        currentRotation %= 4;
    }
    if (e.code == "KeyA") {
        pieceX--;
    }
    if (e.code == "KeyD") {
        pieceX++;
    }
    for (var coord of pieces[currentPiece][currentRotation]) {
        if (coord[0]+pieceX < 0 || coord[0]+pieceX >= 15 || grid[coord[0]+pieceX][coord[1]+pieceY]) {
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
                if (coord[1] + pieceY + 1 >= 15 || grid[coord[0]+pieceX][coord[1]+pieceY+1]) {
                    // in the next iteration, the piece will collide with the blocks
                    freeze = true; break;
                }
            }
            if (!freeze) {
                pieceY++;
            }
        }
    }
})

function gameLoop() {
    ctx.clearRect(0, 0, w, w);
    
    ctx.strokeStyle = "lightgrey";
    for (var i=0; i<=w; i+=squareWidth) {
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, w);
    }
    ctx.fillStyle = "black";
    ctx.stroke();
    for (var i=0; i<15; i++) {
        for (var j=0; j<15; j++) {
            if (grid[i][j]) {
                ctx.fillRect(i * squareWidth, j * squareWidth, squareWidth, squareWidth);
            }
        }
    }
    var freeze = false;
    ctx.fillStyle = "green";
    for (var coord of pieces[currentPiece][currentRotation]) {
        ctx.fillRect((coord[0] + pieceX) * squareWidth, (coord[1] + pieceY) * squareWidth, squareWidth, squareWidth);
        if (coord[1] + pieceY + 1 >= 15 || grid[coord[0]+pieceX][coord[1]+pieceY+1]) {
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
        currentPiece = ["I", "J", "L", "O", "S", "T", "Z"][Math.floor(Math.random() * 7)];
        // check if this new piece is obstructed
        for (var coord of pieces[currentPiece][currentRotation]) {
            if (grid[coord[0]+pieceX][coord[1]+pieceY]) {
                clearInterval(gameInterval);
                ctx.font = "100px Calibri";
                ctx.fillStyle = "red";
                ctx.fillText("YOU LOSE bum", 0, 100);
            }
        }
    }

    // clear line
    for (var i=0; i<15; i++) {
        var lineCleared = true;
        for (var j=0; j<15; j++) {
            if (!grid[j][i]) {lineCleared = false;}
        }
        if (lineCleared) {
            for (var j=0; j<15; j++) {
                grid[j].splice(i, 1);
                grid[j].unshift(false);
            }
        }
    }
}

var gameInterval = setInterval(gameLoop, 16.666);

setInterval(function() {pieceY++;}, 1000);