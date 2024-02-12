var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = canvas.clientWidth; var h = canvas.clientHeight;
var ballX = w/2, ballY = h/2, velX = -w/100, velY = 0;
var paddlePos = h/2, aipos = h/2;
var lastAIdir = "up";
var score = 0;

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    // x and y are the middle

    return (Math.abs(x1 - x2) < (w1 + w2)/2) && (Math.abs(y1 - y2) < (h1 + h2)/2);
}

function gameLoop() {
    ctx.clearRect(0, 0, w, h);

    ctx.strokeRect(0, 0, w, h);
    
    // handle user input
    if (downKeys["KeyW"] && paddlePos > 0) {
        paddlePos -= 10;
    }
    if (downKeys["KeyS"] && paddlePos < h) {
        paddlePos += 10;
    }

    // colliding with player's paddle?
    if (checkCollision(ballX, ballY, 10, 10, 5, paddlePos, 10, 120)) {
        velX = -velX;
        ballX = 11;
        score++;
        // "english" the ball
        if (downKeys["KeyW"]) {
            velY -= Math.random() * 2 + 2;
        }
        if (downKeys["KeyS"]) {
            velY += Math.random() * 2 + 2;
        }
        // a bit of randomness
        velY *= Math.random()*2 + 0.5;
    }

    // colliding with AI's paddle?
    if (checkCollision(ballX, ballY, 10, 10, w-5, aipos, 10, 80)) {
        velX = -velX;
        ballX = w-11;

        // AI can also "english" the ball
        if (lastAIdir == "up") {
            velY -= Math.random() * 2 + 4;
        } else {
            velY += Math.random() * 2 + 4;
        }
        // a bit of randomness
    }

    // move the ball
    ballX += velX;
    ballY += velY;
    
    // AI pathfinding
    if (ballY < aipos) {
        aipos -= 10;
        lastAIdir = "up";
    }
    if (ballY > aipos) {
        aipos += 10;
        lastAIdir = "down";
    }

    // bounce along the top and bottom
    if (ballY < 0) {
        velY = -velY;
        ballY = 1;
    }
    if (ballY > h) {
        velY = -velY;
        ballY = h-1;
    }

    // draw
    ctx.fillRect(0, paddlePos-60, 10, 120);
    ctx.fillRect(ballX-5, ballY-5, 10, 10);
    ctx.fillRect(w-10, aipos-40, 10, 80);
    ctx.font = "50px Calibri";
    ctx.fillText("Score: " + score, 250, 100);

    // if ball is out of bounds on the sides: one person loses
    if (ballX < 0) {
        ctx.font = "100px Calibri";
        ctx.fillText("You Lose!", 250, 250);
        clearInterval(gameInterval);
    }
    if (ballX > w) {
        ctx.font = "100px Calibri";
        ctx.fillText("You Win!", 250, 250);
        clearInterval(gameInterval);
    }
}

var gameInterval = setInterval(gameLoop, 16.666);
