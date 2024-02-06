var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = canvas.clientWidth; var h = canvas.clientHeight;
var bullets = []; var zombies = [];
var player = {x: 10, y: 10, health: 100, firingDelay: 10};

function dfs(b, z) {
    z.health -= b.damage;
    for (var zomb of zombies) {
        if (Math.sqrt((zomb.x - b.x)**2 + (zomb.y - b.y)**2) < 300 && Math.random() < 0.9) {
            ctx.beginPath();
            ctx.moveTo(z.x, z.y);
            ctx.lineTo(zomb.x, zomb.y);
            ctx.stroke();
            dfs(b, zomb);
        }
    }
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    // x and y are the top-left corner
    // but it's easier to check when x and y are the middle
    // so adjust them
    ax1 = x1 + w1/2;
    ay1 = y1 + h1/2;
    ax2 = x2 + w2/2;
    ay2 = y2 + h2/2;

    return (Math.abs(ax1 - ax2) < (w1 + w2)/2) && (Math.abs(ay1 - ay2) < (h1 + h2)/2);
}

function gameLoop() {
    ctx.clearRect(0, 0, w, h);
    
    // handle keys
    if (downKeys["KeyW"]) {
        player.y -= 1;
    }
    if (downKeys["KeyS"]) {
        player.y += 1;
    }
    if (downKeys["KeyA"]) {
        player.x -= 1;
    }
    if (downKeys["KeyD"]) {
        player.x += 1;
    }

    // draw the player
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player.x, player.y, 20, 20);

    // spawn the zombies
    // write your zombie spawning code here

    // draw the zombies + pathfind
    ctx.fillStyle = "#00AA00";
    for (var z of zombies) {
        // pathfind
        if (z.x < player.x) {z.x += 0.7;}
        else {z.x -= 0.7;}
        if (z.y < player.y) {z.y += 0.7;}
        else {z.y -= 0.7;}
    
        // damage the player
        if (checkCollision(z.x, z.y, 20, 20, player.x, player.y, 20, 20)) {
            player.health -= z.damage;
            if (player.health <= 0) {
                // write your death code here
            }
        }

        // draw
        ctx.fillRect(z.x, z.y, 20, 20);
    }
    zombies = zombies.filter(function(z) {return z.health > 0;});

    // fire de bulets
    player.firingDelay--;
    if (player.firingDelay <= 0) {
        if (downKeys["ArrowUp"]) {
            bullets.push({damage: 25, dx: 0, dy: -3, x: player.x, y: player.y});
            player.firingDelay = 100;
        }
        if (downKeys["ArrowDown"]) {
            bullets.push({damage: 25, dx: 0, dy: 3, x: player.x, y: player.y});
            player.firingDelay = 100;
        }
        if (downKeys["ArrowLeft"]) {
            bullets.push({damage: 25, dx: -3, dy: 0, x: player.x, y: player.y});
            player.firingDelay = 100;
        }
        if (downKeys["ArrowRight"]) {
            bullets.push({damage: 25, dx: 3, dy: 0, x: player.x, y: player.y});
            player.firingDelay = 100;
        }
    }

    // draw de bulets + update
    ctx.fillStyle = "#AAAA00";
    bullets = bullets.filter(function(b) {
        // if not colliding with the viewport, then we can't see it
        // so delete it
        return checkCollision(b.x, b.y, 5, 5, 0, 0, w, h);
    })
    for (var b of bullets) {
        b.x += b.dx; b.y += b.dy;
        // check collision
        for (var z of zombies) {
            if (checkCollision(b.x, b.y, 5, 5, z.x, z.y, 20, 20)) {
                z.health -= b.damage;
                ctx.strokeStyle = "#008888";
                dfs(b, z);
            }
        }
        // draw
        ctx.fillRect(b.x, b.y, 5, 5);
    }

    // gui
    ctx.fillStyle = "#000000";
    ctx.font = "50px Calibri";
    ctx.fillText("player health: " + player.health, 0, 100);

    // no cheesing allowed
    if (!checkCollision(player.x, player.y, 20, 20, 0, 0, w, h)) {
        clearInterval(gameInterval);
        ctx.fillText("hey! no going outside the map", 100, 300);
    }
}

var gameInterval = setInterval(gameLoop, 16.666);
