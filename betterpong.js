var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = canvas.clientWidth;
var h = canvas.clientHeight;
var ballX = w / 2;
var ballY = h / 2;
var velX = -w / 400; // Decreased ball acceleration
var velY = 0;
var paddlePos = h / 2;
var aipos = h / 2;
var lastAIdir = "up";
var lives = 3; // Counter for lives
var hitEffect = false; // Flag for hit effect

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        Math.abs(x1 - x2) < (w1 + w2) / 2 &&
        Math.abs(y1 - y2) < (h1 + h2) / 2
    );
}

function handleUserInput() {
    if (downKeys["KeyW"] && paddlePos > 0) {
        paddlePos -= 10;
    }
    if (downKeys["KeyS"] && paddlePos < h) {
        paddlePos += 10;
    }
}

function handleBallMovement() {
    ballX += velX;
    ballY += velY;
}

function handlePaddleCollision() {
    if (
        checkCollision(
            ballX - 5,
            ballY - 5,
            10,
            10,
            5,
            paddlePos - 60,
            10,
            120
        )
    ) {
        velX = -velX;
        if (downKeys["KeyW"]) {
            velY -= 5;
        }
        if (downKeys["KeyS"]) {
            velY += 5;
        }
        hitEffect = true; // Activate hit effect
    }
}

function handleAICollision() {
    if (
        checkCollision(
            ballX - 5,
            ballY - 5,
            10,
            10,
            w - 5,
            aipos - 40,
            10,
            80
        )
    ) {
        velX = -velX;
        if (lastAIdir == "up") {
            velY -= 2;
        } else {
            velY += 2;
        }
        hitEffect = true; // Activate hit effect
    }
}

function handleAIPathfinding() {
    if (ballY < aipos) {
        aipos -= 10;
        lastAIdir = "up";
    }
    if (ballY > aipos) {
        aipos += 10;
        lastAIdir = "down";
    }
}

function handleBallBounce() {
    if (ballY < 0 || ballY > h) {
        velY = -velY;
    }
}

function drawElements() {
    ctx.clearRect(0, 0, w, h);
    // Draw background color
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, w, h);
    
    // Draw paddles
    ctx.fillStyle = "black";
    ctx.fillRect(0, paddlePos - 60, 10, 120);
    ctx.fillRect(w - 10, aipos - 40, 10, 80);
    
    // Draw ball trajectory with trail effect
    ctx.save();
    ctx.globalAlpha = 0.2; // Set trail opacity
    for (let i = 0; i < 33; i++) {
        const gradient = ctx.createRadialGradient(
            ballX - velX * i, ballY - velY * i, 0,
            ballX - velX * i, ballY - velY * i, 10
        );
        gradient.addColorStop(0, `rgba(255, 255, 0, ${i / 13})`); // Start with yellow color
        gradient.addColorStop(1, 'transparent'); // End with transparent color

        ctx.beginPath();
        ctx.arc(ballX - velX * i, ballY - velY * i, 10, 0, 2 * Math.PI); // Use arc method to draw a circle
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    ctx.restore();
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI); // Use arc method to draw a circle
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
    
    // Draw lives counter
    ctx.font = "20px Calibri";
    ctx.fillStyle = "black";
    ctx.fillText("Lives: " + lives, 10, 20);
    
    // Draw ball trajectory with arrow tip
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 3; // Increase line width
    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(0, ballY - (ballX * velY) / velX); // Extend the line to the left wall
    ctx.stroke();

    // Draw arrow tip
    ctx.save();
    ctx.translate(0, ballY - (ballX * velY) / velX);
    ctx.rotate(Math.atan2(velY, -velX)); // Use negative velX to point the arrow towards the left wall
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10, 5);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(w, ballY + ((w - ballX) * velY) / velX); // Extend the line to the right wall
    ctx.stroke();

    ctx.save();
    ctx.translate(w, ballY + ((w - ballX) * velY) / velX);
    ctx.rotate(Math.atan2(velY, w - ballX)); // Use w - ballX to point the arrow towards the right wall
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10, 5);
    ctx.stroke();
    ctx.restore();
}

function handleGameEnd() {
    if (ballX < 0) {
        lives--; // Decrease lives counter
        if (lives <= 0) {
            ctx.font = "100px Calibri";
            ctx.fillStyle = "black";
            ctx.fillText("Game Over!", 200, 250);
            clearInterval(gameInterval);
        } else {
            resetGame();
        }
    }
    if (ballX > w) {
        ctx.font = "100px Calibri";
        ctx.fillStyle = "black";
        ctx.fillText("You Win!", 250, 250);
        clearInterval(gameInterval);
    }
}

function resetGame() {
    ballX = w / 2;
    ballY = h / 2;
    velX = -w / 400; // Reset ball acceleration
    velY = 0;
    paddlePos = h / 2;
    aipos = h / 2;
}

function gameLoop() {
    handleUserInput();
    handleBallMovement();
    handlePaddleCollision();
    handleAICollision();
    handleAIPathfinding();
    handleBallBounce();
    drawElements();
    handleGameEnd();
}

var gameInterval = setInterval(gameLoop, 10);
