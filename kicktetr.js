var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = 343, h = 600;
var boardWidth = 12, boardHeight = 21;
var squareWidth = w / boardWidth;
var grid = [];
var onDelay = false;
var hold = "O";
var alreadyHeld = false;
var lastClear = 0;

// 7-bag piece generator
var bag = [], nextBag = [];
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

// extremely complicated rotation using SRS kick system

var pieceShapes = {
    'O': [[0, 0], [1, 0], [0, 1], [1, 1]],
    'I': [[-1, 0], [0, 0], [1, 0], [2, 0]],
    'L': [[-1, -1], [-1, 0], [0, 0], [1, 0]],
    'J': [[1, -1], [-1, 0], [0, 0], [1, 0]],
    'T': [[0, -1], [-1, 0], [0, 0], [1, 0]],
    'S': [[0, -1], [1, -1], [-1, 0], [0, 0]],
    'Z': [[-1, -1], [0, -1], [0, 0], [1, 0]]
};

var kickData = {
    '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // 0° -> 90°
    '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],    // 90° -> 0°
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],     // 90° -> 180°
    '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 180° -> 90°
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],    // 180° -> 270°
    '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],  // 270° -> 180°
    '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 270° -> 0°
    '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]      // 0° -> 270°
};

var iKickData = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

var currentPiece = getPiece(), currentRotation = 0;
var pieceX = 6, pieceY = 0;

function getBlockPositions() {
    const blocks = this.pieceShapes[this.type];
    const rotated = rotateBlocks(blocks, this.rotation);
    return rotated.map(block => [block[0] + pieceX, block[1] + pieceY]);
}

function getBlockPositions() {
    const blocks = pieceShapes[currentPiece];
    const rotated = rotateBlocks(blocks, currentRotation);
    return rotated.map(block => [block[0] + pieceX, block[1] + pieceY]);
}

function rotateBlocks(blocks, rotation) {
    if (currentPiece === 'O') return blocks; // O piece doesn't rotate

    return blocks.map(blocks => {
        let [x, y] = blocks;
        // Apply rotation transform
        for (let i = 0; i < rotation; i++) {
            [x, y] = [-y, x]; // 90° rotation
        }
        return [x, y];
    });
}

function isValidPosition(x, y, rotation) {
    const testBlocks = rotateBlocks(pieceShapes[currentPiece], rotation);

    for (const [ox, oy] of testBlocks) {
        const bx = x + ox;
        const by = y + oy;

        // Check boundaries
        if (bx < 0 || bx >= grid.length || by < 0 || by >= grid[bx].length) {
            return false;
        }

        // Check collision with existing blocks
        if (grid[bx][by]) {
            return false;
        }
    }

    return true;
}

function attemptRotation(oldRotation, newRotation) {
    const kickKey = `${oldRotation}>${newRotation}`;
    const kickTests = currentPiece === 'I' ? iKickData[kickKey] : kickData[kickKey];

    for (const [kx, ky] of kickTests) {
        const newX = pieceX + kx;
        const newY = pieceY + ky;

        if (isValidPosition(newX, newY, newRotation)) {
            pieceX = newX;
            pieceY = newY;
            currentRotation = newRotation;
            return true;
        }
    }

    currentRotation = oldRotation;
    return false; // Rotation failed
}

function freezePiece() {
    const blocks = getBlockPositions();
    for (const [x, y] of blocks) {
        grid[x][y] = true;
    }
}

// fill the grid
for (var i = 0; i < boardWidth; i++) {
    grid.push([]);
    for (var j = 0; j < boardHeight-1; j++) {
        grid[grid.length - 1].push((i == 0 || i == boardWidth - 1));
    }
    grid[grid.length - 1].push(true);
}

addEventListener("keydown", function (e) {
    var oldRot = currentRotation, oldX = pieceX, oldY = pieceY;
    if (e.code == "ArrowUp") {
        currentRotation++;
        currentRotation %= 4;
        attemptRotation(oldRot, currentRotation);
    }
    if (e.code == "ArrowLeft") {
        pieceX--;
        if (!isValidPosition(pieceX, pieceY, currentRotation)) {
            pieceX++;
        }
    }
    if (e.code == "ArrowRight") {
        pieceX++;
        if (!isValidPosition(pieceX, pieceY, currentRotation)) {
            pieceX--;
        }
    }

    /*var tspin = false;
    if (e.code == "ArrowUp" && currentPiece == "T" && onDelay) {
        for (var coord of pieceC[currentPiece][currentRotation]) {
            if (grid[coord[0] + pieceX][coord[1] + pieceY - 1]) {
                tspin = true;
            }
        }
    }*/
    if (false) {
        displayMessage("T-SPIN", 300, 600);
    }
    if (e.code == "Space") {
        // hard drop
        var freeze = false;
        while (!freeze) {
            for (var coord of getBlockPositions()) {
                if (coord[1] + 1 >= boardHeight || grid[coord[0]][coord[1] + 1]) {
                    // in the next iteration, the piece will collide with the blocks
                    freeze = true; break;
                }
            }
            if (!freeze) {
                pieceY++;
            }
        }
        freezePiece();
        pieceY = 0; pieceX = 6;
        currentPiece = getPiece();
        // check if this new piece is obstructed
        // check if this new piece is obstructed
        for (var coord of getBlockPositions()) {
            if (grid[coord[0]][coord[1]]) {
                clearInterval(gameInterval);
                ctx.font = "100px Calibri";
                ctx.fillStyle = "red";
                ctx.fillText("YOU LOSE bum", 0, 100);
            }
        }
        alreadyHeld = false;
        onDelay = false;
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
});

function displayMessage(msg, x, y) {
    var elem = document.getElementById("statusholder");
    var n = document.createElement("h1");
    setTimeout(function () { n.remove(); }, 2400);
    n.appendChild(document.createTextNode(msg));
    elem.appendChild(n);
    n.style.position = "absolute";
    n.style.left = x + "px"; n.style.top = y + "px";
    n.style.animation = "fadeout 2.5s";
}
ctx.strokeStyle = "lightgrey";
for (var i = 0; i <= w; i += squareWidth) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
}
for (var i = 0; i <= h; i += squareWidth) {
    ctx.moveTo(0, i);
    ctx.lineTo(w, i);
}
function gameLoop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 600, 600); // clear with black

    ctx.font = "30px Comic Sans";
    if (alreadyHeld) {
        ctx.fillStyle = "grey";
    } else {
        ctx.fillStyle = "#00FFFF";
    }

    // render held piece
    ctx.fillText("HOLD", (boardWidth + 1) * squareWidth, squareWidth);
    for (var coord of pieceShapes[hold]) {
        ctx.fillRect((coord[0] + boardWidth + 1) * squareWidth, (coord[1] + 1) * squareWidth + 10, squareWidth, squareWidth);
    }

    // show next 5 pieces
    ctx.fillStyle = "white";
    ctx.fillText("NEXT", (boardWidth + 1) * squareWidth, 5 * squareWidth);
    for (var i = 0; i < 5; i++) {
        for (var coord of pieceShapes[queue[i]]) {
            ctx.fillRect((coord[0] + boardWidth + 1) * squareWidth, (coord[1] + 7 + i * 4) * squareWidth, squareWidth, squareWidth);
        }
    }

    // render grid and board
    ctx.fillStyle = "grey";
    ctx.stroke();
    for (var i = 0; i < boardWidth; i++) {
        for (var j = 0; j < boardHeight; j++) {
            if (grid[i][j]) {
                ctx.fillRect(i * squareWidth, j * squareWidth, squareWidth, squareWidth);
            }
        }
    }

    // render current falling piece
    var freeze = false;
    ctx.fillStyle = "#00FF00";
    for (var coord of getBlockPositions()) {
        ctx.fillRect((coord[0]) * squareWidth, (coord[1]) * squareWidth, squareWidth, squareWidth);
        if (coord[1] + 1 >= boardHeight || grid[coord[0]][coord[1] + 1]) {
            // in the next iteration, the piece will collide with the blocks
            freeze = true;
        }
    }
    if (freeze && !onDelay) {
        onDelay = true;
        setTimeout(function () {
            if (!onDelay) return;
            onDelay = false;
            // freeze the piece and put a new one
            freezePiece();
            pieceY = 0; pieceX = 6;
            currentPiece = getPiece();
            // check if this new piece is obstructed
            for (var coord of getBlockPositions()) {
                if (grid[coord[0]][coord[1]]) {
                    clearInterval(gameInterval);
                    ctx.font = "100px Calibri";
                    ctx.fillStyle = "red";
                    ctx.fillText("YOU LOSE bum", 0, 100);
                }
            }
            alreadyHeld = false;
        }, 500);
    }

    // clear line
    var linesCleared = 0;
    for (var i = 0; i < boardHeight-1; i++) {
        var lineCleared = true;
        for (var j = 0; j < boardWidth; j++) {
            if (!grid[j][i]) { lineCleared = false; }
        }
        if (lineCleared) {
            for (var j = 0; j < boardWidth; j++) {
                grid[j].splice(i, 1);
                grid[j].unshift(false);
            }
            linesCleared++;
        }
    }
    if (linesCleared) {
        displayMessage(["SINGLE", "DOUBLE", "TRIPLE", "QUAD"][linesCleared - 1], 300, 100);
        if (linesCleared == lastClear && linesCleared > 1) {
            displayMessage("B2B" + ["SINGLE", "DOUBLE", "TRIPLE", "QUAD"][linesCleared - 1], 300, 200);
        }
        lastClear = linesCleared;
    }
}

var gameInterval = setInterval(gameLoop, 16.666);

setInterval(function () { if (onDelay || downKeys["ArrowDown"]) return; pieceY++; }, 1000);
setInterval(function () { if (onDelay || !downKeys["ArrowDown"]) return; pieceY++; }, 75);