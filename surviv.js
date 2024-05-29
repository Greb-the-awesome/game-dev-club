var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.font = "30px Cutive";
var gameInterval;
var w = canvas.clientWidth; var h = canvas.clientHeight;
var gamestarted = false;
var player1 = {x: 10, y: 10, health: 100, firingDelay: 10, loadout: [0, 0], selected: 0, angle: 0, roundsRemaining: [0, 0],
    delays: [10, 10], reloadRemaining: [20, 20]
};
var playerSpeed = 3;
var player2 = {x: 900, y: 500, health: 100, firingDelay: 10, loadout: [2, 1], selected: 0, angle: 0, roundsRemaining: [0, 0],
    delays: [10, 10], reloadRemaining: [20, 20],
    currentStrafeDir: false,
    newStrafeDir: function() {
        this.strafeDirection1 = [Math.floor(Math.random() * 3) - 1, Math.floor(Math.random() * 3) - 1];
        if (this.strafeDirection1[0] == 0 && this.strafeDirection1[1] == 0) {
            this.strafeDirection1[0] = 1; // prevent the AI not moving
        }
        this.strafeDirection2 = [-this.strafeDirection1[0], -this.strafeDirection1[1]];
    }
};
player2.newStrafeDir();
var names = ["DP-28", "SCAR-H", "Mosin-Nagant"], bullets = [];

var images = { // image --> url
    "player": "./surviv-assets/player_world.svg",
    "ai": "./surviv-assets/ai_world.svg",
    "DP-28_world": "./surviv-assets/dp_world.svg",
    "SCAR-H_world": "./surviv-assets/scar_world.svg",
    "Mosin-Nagant_world": "./surviv-assets/mosin_world.svg",
};
var imgScaleFactor = 0.5; // cause i exported the svg's way too big

for (var prop in images) {
	var im = new Image();
	im.src = images[prop];
	images[prop] = im;
}

var specs = {
    "DP-28": {
        delay: 80,
        capacity: 47,
        reloadTime: 3300,
        damage: 10,
        bulletSpeed: 7,
        barrelColor: "black",
        barrelLength: 100
    },
    "SCAR-H": {
        delay: 90,
        capacity: 20,
        reloadTime: 2700,
        damage: 20,
        bulletSpeed: 15,
        barrelColor: "brown",
        barrelLength: 70
    },
    "Mosin-Nagant": {
        delay: 1250,
        capacity: 5,
        reloadTime: 3000,
        damage: 72,
        bulletSpeed: 20,
        barrelColor: "olive",
        barrelLength: 150
    }
}

// weapons
for (var j=0; j<2; j++) {
    let i = j;
    document.getElementById("p1s" + i).onclick = function() { // click button to toggle gun
        player1.loadout[i]++;
        player1.loadout[i] %= 3;
        this.innerHTML = names[player1.loadout[i]];
    }
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    // x and y are the center
    ax1 = x1 + w1/2;
    ay1 = y1 + h1/2;
    ax2 = x2 + w2/2;
    ay2 = y2 + h2/2;

    return (Math.abs(ax1 - ax2) < (w1 + w2)/2) && (Math.abs(ay1 - ay2) < (h1 + h2)/2);
}

function startGame() { // read the button values and scroll
    if (gamestarted) {return;}
    gamestarted = true;
    window.scroll(0, 1000);
    gameInterval = setInterval(gameLoop, 8.333);
    player1.x = 100; player1.y = 100;
    document.getElementById("guiDiv").style.display = "none";
}

var t = 0;

function gameLoop() {
    ctx.clearRect(0, 0, w, h);

    // gui
    ctx.fillStyle = "#000000";
    
    // ----------- PLAYER 1 -----------

    // handle keys
    var playerWeapon = names[player1.loadout[player1.selected]];
    if (downKeys["KeyW"]) {
        player1.y -= playerSpeed;
    }
    if (downKeys["KeyS"]) {
        player1.y += playerSpeed;
    }
    if (downKeys["KeyA"]) {
        player1.x -= playerSpeed;
    }
    if (downKeys["KeyD"]) {
        player1.x += playerSpeed;
    }
    if (downKeys["Digit1"]) {
        player1.selected = 0;
    }
    if (downKeys["Digit2"]) {
        player1.selected = 1;
    }
    // let's not talk about this (very broken code)
    if (mouseDown && player1.delays[player1.selected] <= 0 && player1.roundsRemaining[player1.selected] > 0) {
        new Audio("./surviv-assets/" + playerWeapon + "_fire.wav").play();
        bullets.push({
            x: player1.x + specs[playerWeapon].barrelLength * Math.cos(player1.angle),
            y: player1.y + specs[playerWeapon].barrelLength * Math.sin(player1.angle),
            dx: specs[playerWeapon].bulletSpeed * Math.cos(player1.angle),
            dy: specs[playerWeapon].bulletSpeed * Math.sin(player1.angle),
            damage: specs[playerWeapon].damage
        });
        player1.delays[player1.selected] = specs[playerWeapon].delay * 10 / 10;
        player1.roundsRemaining[player1.selected]--;
        if (player1.roundsRemaining[player1.selected] <= 0) {
            player1.reloadRemaining[player1.selected] = specs[playerWeapon].reloadTime;
        }
    }
    player1.delays[0] -= 8.333;
    player1.delays[1] -= 8.333;
    if (player1.reloadRemaining[player1.selected] < 8.333 && player1.reloadRemaining[player1.selected] > 0) {
        player1.roundsRemaining[player1.selected] = specs[playerWeapon].capacity;
    }
    player1.reloadRemaining[player1.selected] -= 8.333;

    // player rotation
    player1.angle = Math.atan2(mousePos[1] - player1.y, mousePos[0] - player1.x);

    // draw the player
    ctx.fillStyle = "red";
    ctx.save();
    ctx.translate(player1.x, player1.y);
    ctx.rotate(player1.angle);
    ctx.drawImage(images["player"], -30, -30, 135, 60);
    ctx.fillStyle = specs[playerWeapon].barrelColor;
    var img = images[playerWeapon + "_world"];
    ctx.drawImage(img, 15, -img.height/2*imgScaleFactor, img.width*imgScaleFactor, img.height*imgScaleFactor);
    ctx.restore();

    // ---------AI----------

    var distFromPlayer = Math.sqrt(Math.pow(player2.x - player1.x, 2) + Math.pow(player2.y - player1.y, 2));
    if (distFromPlayer < 100) {
        // too close for comfort
        player2.selected = 1;
        if (player2.x > player1.x) {
            player2.strafeDirection1[0] = 1;
        } else {
            player2.strafeDirection1[0] = -1;
        }
        if (player2.y > player1.y) {
            player2.strafeDirection1[1] = 1;
        } else {
            player2.strafeDirection1[1] = -1;
        }
    } else if (distFromPlayer < 500) {
        player2.selected = 1;
    } else {player2.selected = 0;}
    if (player2.x < 100) {player2.strafeDirection2[0] = 1; player2.strafeDirection1[0] = 1;}
    if (player2.x > 900) {player2.strafeDirection2[0] = -1; player2.strafeDirection1[0] = -1;}
    if (player2.y < 100) {player2.strafeDirection2[1] = 1; player2.strafeDirection1[1] = 1;}
    if (player2.y > 500) {player2.strafeDirection2[1] = -1; player2.strafeDirection1[1] = -1;}
    // strafe
    if (Math.random() < 0.015) {
        player2.currentStrafeDir = !player2.currentStrafeDir;
    }
    if (player2.currentStrafeDir) {
        player2.x += player2.strafeDirection2[0] * playerSpeed;
        player2.y += player2.strafeDirection2[1] * playerSpeed;
    } else {
        player2.x += player2.strafeDirection1[0] * playerSpeed;
        player2.y += player2.strafeDirection1[1] * playerSpeed;
    }

    if (Math.random() < 0.002) {
        player2.newStrafeDir();
    }

    playerWeapon = names[player2.loadout[player2.selected]];

    // let's not talk about this (very broken code)
    if (player2.delays[player2.selected] <= 0 && player2.roundsRemaining[player2.selected] > 0) {
        new Audio("./surviv-assets/" + playerWeapon + "_fire.wav").play();
        bullets.push({
            x: player2.x + specs[playerWeapon].barrelLength * Math.cos(player2.angle),
            y: player2.y + specs[playerWeapon].barrelLength * Math.sin(player2.angle),
            dx: specs[playerWeapon].bulletSpeed * Math.cos(player2.angle),
            dy: specs[playerWeapon].bulletSpeed * Math.sin(player2.angle),
            damage: specs[playerWeapon].damage
        });
        player2.delays[player2.selected] = specs[playerWeapon].delay * 10 / 10;
        player2.roundsRemaining[player2.selected]--;
        if (player2.roundsRemaining[player2.selected] <= 0) {
            player2.reloadRemaining[player2.selected] = specs[playerWeapon].reloadTime;
        }
    }
    player2.delays[0] -= 8.333;
    player2.delays[1] -= 8.333;
    if (player2.reloadRemaining[player2.selected] < 8.333 && player2.reloadRemaining[player2.selected] > 0) {
        player2.roundsRemaining[player2.selected] = specs[playerWeapon].capacity;
    }
    player2.reloadRemaining[player2.selected] -= 8.333;

    // player rotation
    player2.angle = Math.atan2(player1.y - player2.y, player1.x - player2.x) + Math.sin(t*0.04) * 0.07;
    t += Math.random();

    // draw the player
    ctx.fillStyle = "red";
    ctx.save();
    ctx.translate(player2.x, player2.y);
    ctx.rotate(player2.angle);
    ctx.drawImage(images["ai"], -30, -30, 135, 60);
    ctx.fillStyle = specs[playerWeapon].barrelColor;
    var img = images[playerWeapon + "_world"];
    ctx.drawImage(img, 15, -img.height/2*imgScaleFactor, img.width*imgScaleFactor, img.height*imgScaleFactor);
    ctx.restore();

    // bullets processing
    ctx.fillStyle = "lightblue";
    bullets = bullets.filter((b)=>!b.removed);
    for (var bul of bullets) {
        if (Math.abs(bul.x) > 1000 || Math.abs(bul.y) > 1000) {
            bul.removed = true;
        }
        bul.x += bul.dx; bul.y += bul.dy;

        if (checkCollision(player1.x, player1.y, 60, 60, bul.x, bul.y, 10, 10)) {
            player1.health -= bul.damage * 0.385; // full level 3 armor
            bul.removed = true;
        }
        if (checkCollision(player2.x, player2.y, 60, 60, bul.x, bul.y, 10, 10)) {
            player2.health -= bul.damage * 0.385; // full level 3 armor
            bul.removed = true;
        }
        
        // draw
        ctx.fillRect(bul.x - 5, bul.y - 5, 10, 10);
    }

    // GUI
    ctx.fillStyle = "black";
    ctx.fillText(names[player1.loadout[0]] + (player1.selected==0?" - " + (player1.roundsRemaining[0] + "/" + specs[names[player1.loadout[0]]].capacity):" "), 50, 500);
    ctx.fillText(names[player1.loadout[1]] + (player1.selected==1?" - " + player1.roundsRemaining[1] + "/" + specs[names[player1.loadout[1]]].capacity:""), 50, 550);
    ctx.fillText("player healths: " + Math.round(player1.health) + ", " + Math.round(player2.health), 100, 100);

    // no cheesing allowed
    player1.x = Math.max(player1.x, 0); player1.x = Math.min(player1.x, 1000);
    player1.y = Math.max(player1.y, 0); player1.y = Math.min(player1.y, 600);
    player2.x = Math.max(player2.x, 0); player2.x = Math.min(player2.x, 1000);
    if (player1.health < 0 || player2.health < 0) {
        clearInterval(gameInterval);
        ctx.fillText("we have a winner!", 100, 300);
    }
}
