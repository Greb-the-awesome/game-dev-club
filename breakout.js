// Initialize board variables
let board;
let boardWidth = 900;
let boardHeight = 600;
let context;
let score = 0;
let showVariables = false;
let keyVPressed = false;

// Initialize global player variables
let playerWidth = 125;
let playerHeight = 15;
let playerVelocity = 12;
let left; // Tracks if player is going left
let keysPressed = {}; // Track keys for smoother movement

// Set initial conditions for the player
let player = {
    // Place player in center of the screen
    x: boardWidth / 2 - playerWidth / 2,
    y: boardHeight - playerHeight - 10,

    // Set dimensions of paddle
    width: 125,
    height: 15,

    // Give player some lives and velocity
    velocity: playerVelocity,
}

// Initialize ball variables (random speed)
let ballRadius = 10;
let ballVelocityX = randomSpeed();
let ballVelocityY = ballVelocityX + Math.random() * 0.9; // Zombiewars version Beta 0.9
let velocityIncrease = 0.5;

// Move ball left half the time
if (Math.random() <= 0.5) {
    ballVelocityX = -ballVelocityX;
}

// Define ball parameters (ball is in center of the screen)
let ball = {
    x: boardWidth / 2,
    y: boardHeight / 2,
    radius: ballRadius,
    velocityX: ballVelocityX,
    velocityY: ballVelocityY,
}

// Create a random speed
function randomSpeed() {
    return Math.random()*2+3;
}

// Initialize block variables
let blockWidth = 115;
let blockHeight = 30;
let blockX = 25;
let blockY = 75;
let rows = 4;
let columns = 7;
let spacing = 8;
let blockArray = [];
let totalBlocks = 0;

// Reference the canvas using board variable
window.onload = function () {
    board = document.getElementById("board");

    // Initialize board width and height, define context to draw on board
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Listen for key press and release events
    document.addEventListener("keydown", (key) => {
        keysPressed[key.code] = true;

        // Show variables on initial press of V
        if (key.code == "KeyV" && !keyVPressed) {
            showVariables = !showVariables;
            vKeyPressed = true;
        }
    });

    document.addEventListener("keyup", (key) => {
        keysPressed[key.code] = false;
        
        // Hide variables when V is released
        if (key.code == "KeyV") {
            vKeyPressed = false;
        }
    });

    // Draw the paddle
    context.fillStyle = "skyblue";
    context.fillRect(player.x, player.y, player.width, player.height);

    // Create the blocks
    createBlocks();
    requestAnimationFrame(update);
}

function update() {
    // Clear board to avoid overlapping frames
    context.clearRect(0, 0, board.width, board.height);

    // Move the player paddle
    movePlayer();

    // Draw the player paddle
    context.fillStyle = "skyblue";
    context.fillRect(player.x, player.y, player.width, player.height);

    // Draw the ball
    context.fillStyle = "white";
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    context.fill();

    // Move the ball using its x- and y-velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Draw the blocks
    context.fillStyle = "orange";
    for (let i = 0; i < blockArray.length; i++) {
        let block = blockArray[i];
        if (block.visible) {
            context.fillRect(block.x, block.y, block.width, block.height);
        }
    }

    // Bounce ball off walls (if statements determine which wall)
    if (ball.y <= ball.radius+50) {
        ball.velocityY *= -1;
    } else if (ball.x <= ball.radius) {
        ball.velocityX *= -1;
    } else if (ball.x + ball.radius >= boardWidth) {
        ball.velocityX *= -1;
    } else if (ball.y + ball.radius >= boardHeight-10) {
        // Game Over, print instructions on how to reset the game
        context.fillStyle = "white";
        context.font = "50px Tahoma";
        context.fillText("Game Over!", boardWidth/2-130, boardHeight/2);
        context.fillText("Press the spacebar to reset the game.", 30, boardHeight/2 + 80)

        // Stop the ball and player
        ball.velocityX = 0;
        ball.velocityY = 0;
        player.velocity = 0;
        if (keysPressed["Space"]) {
            resetGame();
        }
    }
    
    // Bounce ball off paddle
    if (detectCollision(ball, player)) {
        // Increase the speed in the direction the paddle hits the ball
        // Ensure speed does not go above 8 or below 3
        if (left && ball.velocityX >= -8 && Math.abs(ball.velocityX) >= 3+velocityIncrease) {
            ball.velocityX -= velocityIncrease;
        } else if (!left && ball.velocityX <= 8 && Math.abs(ball.velocityX) >= 3-velocityIncrease) {
            ball.velocityX += velocityIncrease;
        }

        // Increase the y-velocity of the ball regardless of the direction the paddle hits
        if (ball.velocityY <= 8) {
            ball.velocityY += velocityIncrease;
        }
        // Bounce the ball off
        ball.velocityY *= -1;
    }

    // Bounce ball off blocks
    for (let i = 0; i < blockArray.length; i++) {
        if (blockArray[i].visible) {
            if (topCollision(ball, blockArray[i]) || bottomCollision(ball, blockArray[i])) {
                // If the ball collides on the top or bottom, change the y-velocity
                // Change the direction of the ball, make the block invisible
                // Subtract 1 block from the total and add 100 to the score
                ball.velocityY *= -1;
                blockArray[i].visible = false;
                totalBlocks--;
                score += 100;
            } else if (leftCollision(ball, blockArray[i]) || bottomCollision(ball, blockArray[i])) {
                // if the ball collides on the side, change the x-velocity
                ball.velocityX *= -1;
                blockArray[i].visible = false;
                totalBlocks--;
                score += 100;
            }
        }
    }

    // Show Score
    context.fillStyle = "#A8DADC";
    context.fillRect(0, 0, boardWidth, 50);
    context.fillStyle = "white";
    context.font = "30px Tahoma";
    context.fillText("Score: " + score, 15, 35);

    // Show variables with text
    if (showVariables) {
        context.font = "20px Tahoma";
        context.fillText("Player Direction: " + (left ? "Left" : "Right"), boardWidth-230, boardHeight-105);
        context.fillText("Ball X Velocity: " + Math.round(ball.velocityX*1000)/1000, boardWidth-230, boardHeight-80);
        context.fillText("Ball Y Velocity: " + Math.round(ball.velocityY*1000)/1000, boardWidth-230, boardHeight-55);
        context.fillText("Number of blocks: " + totalBlocks, boardWidth-230, boardHeight-30);
    }

    // If all the blocks are gone, the player wins!
    if (totalBlocks == 0) {
        context.clearRect(0, 0, boardWidth, boardHeight);
        context.fillStyle = "skyblue";
        context.font = "40px Tahoma";
        context.fillText("Congratulations! You win! :)", boardWidth/2-225, boardHeight/2-50);
        context.fillText("Thank you for playing Breakout!", boardWidth/2-275, boardHeight/2+30);
        context.fillText("Made by Raymond Mi for Game Dev Club", boardWidth/2-360, boardHeight/2+100);
        return;
    }

    // Keep the animation/game going
    requestAnimationFrame(update);
}

 // Check for key presses and update player position
function movePlayer() {
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
        // Check bounds to ensure player is not going to exit the left side of the screen
        let nextX = player.x - player.velocity;
        if (nextX >= 0) {
            player.x = nextX;
        }
        left = true;
    }
    if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
        // Check bounds to ensure player is not going to exit the right side of the screen
        let nextX = player.x + player.velocity;
        if (nextX <= boardWidth - player.width) {
            player.x = nextX;
        }
        left = false;
    }
}

function detectCollision(ball, block) {
    return ball.x < block.x + block.width && // ball top left corner left of block top right corner
           ball.x + ball.radius > block.x && // ball top right corner right block top left corner
           ball.y < block.y + block.height && // ball top left corner above of block bottom left corner
           ball.y + ball.radius > block.y; // ball top bottom left corner below block top left corner
}

function topCollision(ball, block) { // ball above block
    return detectCollision(ball, block) && (ball.y + ball.radius) >= block.y;
}

function bottomCollision(ball, block) { // ball below block
    return detectCollision(ball, block) && ball.y <= (block.y + block.height);
}

function leftCollision(ball, block) { // ball left of block
    return detectCollision(ball, block) && (ball.x + ball.radius) >= block.x;
}

function rightCollision(ball, block) { // ball right of block
    return detectCollision(ball, block) && ball.x <= (block.x + block.width);
}

// Create the blocks row by row, and specify the coordinates and visibility of each block
function createBlocks() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let block =  {
                x: blockX + c*(blockWidth + spacing),
                y: blockY + r*(blockHeight + spacing),
                width: blockWidth,
                height: blockHeight,
                visible: true
            }
            // Add blocks to the array for storage
            blockArray.push(block);
        }
    }
    // Total blocks is the number of blocks in the array
    totalBlocks = blockArray.length;
}

function resetGame() {
    // Reset score, level, and clear the board
    score = 0;

    // Reset player variables
    player = {
        x: boardWidth / 2 - playerWidth / 2,
        y: boardHeight - playerHeight - 10,
        width: 125,
        height: 15,
        velocity: playerVelocity
    }

    // Reset ball variables
    ballVelocityX = randomSpeed();
    ballVelocityY = ballVelocityX + Math.random() * 0.9; // Zombiewars version Beta 0.9

    ball = {
        x: boardWidth / 2,
        y: boardHeight / 2,
        radius: ballRadius,
        velocityX: ballVelocityX,
        velocityY: ballVelocityY,
    }

    // Create blocks again
    blockArray = [];
    createBlocks();
}