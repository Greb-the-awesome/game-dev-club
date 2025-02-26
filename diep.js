// basically, I realized that setInterval() is unreliable and even if you want your function to be called every 8.333ms,
// the browser may call it every 16.667ms on 60hz screens.
// thus, this is the fix that I have implemented
var _intervals = [], _id = 0;
function _run() {
    for (var it of _intervals) {
        if (performance.now() - it.lastCalled >= it.delay) {
            it.lastCalled = performance.now();
            (async function() {it.func();})();
        }
    }
}
setInterval(_run, 0);
setInterval = function(callback, time) {
    _id++;
    _intervals.push({func: callback, delay: time, lastCalled: 0, id: _id});
    return _id;
}
function clearInterval(handle) {
    _intervals = _intervals.filter((it)=>(!(it.id == handle)));
}

// -------------------------------

ctx.imageSmoothingEnabled = false; ctx.font = "30px Cutive";
var gameInterval;
var bullets = [];
var shapes = [];
var w = canvas.clientWidth; var h = canvas.clientHeight, mapW = 3000, mapH = 2000;
var gamestarted = false;
var player = {
    x: mapW/2, y: mapH/2, health: 120, angle: 0, delayRemaining: 0,
    xp: 0, upgradeAvailable: 0,
    upgrades: {
        "Health Regen": 0,
        "Max Health": 0,
        "Bullet Speed": 0,
        "Bullet Damage": 0,
        "Reload": 0,
        "Movement Speed": 0,
        "XP Multiplier": 0
    },
    healthRegenRate: 5,
    maxHealthMultiplier: 1,
    bulletSpeedMultiplier: 1,
    reloadMultiplier: 1,
    bulletDamageMultiplier: 1,
    movementSpeedMultiplier: 1,
    xpMultiplier: 1
};
var redZoneDamage = 0.2;

var otherPlayers = [];

var playerSpeed = 1.7;
var images = { // image --> url
    "player": "./diep-assets/player.svg",
    "ai": "./diep-assets/ai.svg",
};
var imgScaleFactor = 0.5; // cause i exported the svg's way too big

for (var prop in images) {
	var im = new Image();
	im.src = images[prop];
	images[prop] = im;
}

// create the upgrades menu from the list of upgrades
for (let prop in player.upgrades) {
    var p = document.createElement("p");
    p.innerHTML = prop + " ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ";
    p.id = prop;
    p.className = "upgradeDesc";
    var btn = document.createElement("button");
    btn.innerHTML = "+";
    btn.onclick = function() {addUpgrade(prop);}
    btn.className = "addButton";
    var elem = document.getElementById("upgradesDiv");
    elem.appendChild(btn);
    elem.appendChild(p);
    elem.appendChild(document.createElement("br"));
}

var specs = {
    "Tank": {
        bulletDamage: 10,
        bulletSpeed: 6,
        bulletSize: 20,
        firingDelay: 500,
        bodyDamage: 10,
        health: 120,
        barrelLength: 100,
    }
};
var shapeSpecs = {
    "Square": {
        health: 10,
        rotationSpeed: 0.02,
        value: 10,
        draw: function() {
            if (this.iFrameRemaining > 0) {
                ctx.fillStyle = "#ffdcab";
            } else {
                ctx.fillStyle = "#ffbc21";
            }
            ctx.fillRect(-10, -10, 20, 20);
        }
    },
    "Triangle": {
        health: 30,
        rotationSpeed: 0.03,
        value: 15,
        draw: function() {
            if (this.iFrameRemaining > 0) {
                ctx.fillStyle = "#ffb47a";
            } else {
                ctx.fillStyle = "#f54d27";
            }
            ctx.beginPath();
            ctx.moveTo(-8, -20);
            ctx.lineTo(24, 0);
            ctx.lineTo(-8, 20);
            ctx.fill();
        }
    }
};

var currentBuild = "Tank";

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
    document.getElementById("guiDiv").style.display = "none";
}

function addUpgrade(name) {
    if (player.upgrades[name] == 10 || (player.upgradeAvailable / 25) < 1) {
        return;
    }
    player.upgradeAvailable -= 25;
    player.upgrades[name]++;

    // update the GUI
    var elem = document.getElementById(name);
    elem.innerHTML = name + " ";
    for (var i=0; i<player.upgrades[name]; i++) {
        elem.innerHTML += "█ ";
    }
    for (var i=0; i<10-player.upgrades[name]; i++) {
        elem.innerHTML += "▒ ";
    }
    
    // actually perform the action
    // TODO: put these prpertios on the player also actually use these values
    if (name == "Health Regen") {
        player.healthRegenRate += 1;
    } else
    if (name == "Max Health") {
        player.maxHealthMultiplier += 0.1;
    } else
    if (name == "Bullet Speed") {
        player.bulletSpeedMultiplier += 0.1;
    } else
    if (name == "Bullet Damage") {
        player.bulletDamageMultiplier += 0.1;
    } else
    if (name == "Reload") {
        player.reloadMultiplier -= 0.05;
    } else
    if (name == "Movement Speed") {
        player.movementSpeedMultiplier += 0.1;
    } else {
        player.xpMultiplier += 0.1;
    }

    document.getElementById("upgradeAmount").innerHTML = "x" + Math.floor((player.upgradeAvailable) / 25); // it takes 25 xp for an upgrade
}

function spawnOtherPlayer() {
    otherPlayers.push({
        x: mapW * Math.random(), y: mapH * Math.random(),
        build: "Tank",
        maxHealthMultiplier: Math.random() + 1,
        movementSpeedMultiplier: Math.random() + 1,
        bulletSpeedMultiplier: Math.random() + 1,
        reloadMultiplier: 1 - Math.random() * 0.5,
        bulletDamageMultiplier: Math.random() + 1,
        skill: Math.random(), // randomly choose its skill
        state: (Math.random() < 0.1) ? "afk" : "farming", // randomly choose between farming or afk
        runThreshold: Math.random(), // threshold for switching to "running away" state (as a fraction of total health)
        angle: 0,
        actualAngle: 0, // what is displayed (which will be smoothly transitioned, while the angle property can abruptly transition)
        delayRemaining: 0,
        inputQueue: [],
        targetObject: null,
        targetPosition: null,
        aggroTimer: Infinity, // the time before this other player will aggro onto the player.
        shooting: false,
        health: specs["Tank"].health
    });
}

function shootBullet(shooter, build) {
    if (shooter.delayRemaining > 0) {return;}
    bullets.push({
        x: shooter.x + specs[build].barrelLength * Math.cos(shooter.angle),
        y: shooter.y + specs[build].barrelLength * Math.sin(shooter.angle),
        dx: specs[build].bulletSpeed * Math.cos(shooter.angle) * shooter.bulletSpeedMultiplier,
        dy: specs[build].bulletSpeed * Math.sin(shooter.angle) * shooter.bulletSpeedMultiplier,
        damage: specs[build].bulletDamage * shooter.bulletDamageMultiplier,
        timeRemaining: 1000,
        source: shooter,
    });
    shooter.delayRemaining = specs[build].firingDelay * shooter.reloadMultiplier;
}

function gameLoop() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#6ebb73";
    ctx.fillRect(0, 0, w, h);

    // handle keys
    if (downKeys["KeyW"]) {
        player.y -= playerSpeed * player.movementSpeedMultiplier;
    }
    if (downKeys["KeyS"]) {
        player.y += playerSpeed * player.movementSpeedMultiplier;
    }
    if (downKeys["KeyA"]) {
        player.x -= playerSpeed * player.movementSpeedMultiplier;
    }
    if (downKeys["KeyD"]) {
        player.x += playerSpeed * player.movementSpeedMultiplier;
    }

    // translation of the canvas so the player is always centered
    ctx.save();
    ctx.translate(-player.x + w/2, -player.y + h/2);

    // let's not talk about this (very broken code)
    if (mouseDown) {
        shootBullet(player, currentBuild);
    }
    player.delayRemaining -= 8.333;

    // player rotation
    player.angle = Math.atan2(mousePos[1] - h/2, mousePos[0] - w/2);

    // draw a grid
    {
        var gridSpacing = 100;
        ctx.strokeStyle = "#4ea44f";
        ctx.lineWidth = 3;
        var startX = player.x - w/2, startY = player.y - h/2; // start and stop at the edges at the screen instead of drawing the entire grid for large maps

        // vertical lines
        for (var i=startX - startX % gridSpacing; i<=startX + w; i+=gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(i, startY);
            ctx.lineTo(i, startY + h);
            ctx.stroke();
        }

        // horizontal lines
        for (var i=startY - startY % gridSpacing; i<=startY + h; i+=gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(startX, i);
            ctx.lineTo(startX + w, i);
            ctx.stroke();
        }

        // also draw the border
        ctx.strokeStyle = "#00000022";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(mapW, 0);
        ctx.lineTo(mapW, mapH);
        ctx.lineTo(0, mapH);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }

    // draw the player
    ctx.fillStyle = "red";
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(images["player"], -30, -30, 135, 60);
    ctx.fillStyle = specs[currentBuild].barrelColor;
    // var img = images[currentBuild + "_world"];
    // ctx.drawImage(img, 15, -img.height/2*imgScaleFactor, img.width*imgScaleFactor, img.height*imgScaleFactor);
    ctx.restore();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.strokeRect(player.x - 50, player.y + 50, 100, 10);
    ctx.stroke();
    ctx.fillRect(player.x - 50, player.y + 50, 100 * player.health / specs[currentBuild].health / player.maxHealthMultiplier, 10);

    // update player health
    player.health += player.healthRegenRate / 120; // divide by 120 because 120 frames per second
    player.health = Math.min(player.health, specs[currentBuild].health * player.maxHealthMultiplier);

    // spawn bot enemies
    if (Math.random() < 0.0005 && otherPlayers.length < 10) {
        spawnOtherPlayer();
    }

    // update enemies
    otherPlayers = otherPlayers.filter((o)=>!o.removed);
    for (var oth of otherPlayers) {

        // red zone damage
        if (!checkCollision(oth.x-30, oth.y-30, 60, 60, 0, 0, mapW, mapH)) {
            oth.health -= redZoneDamage;
        }

        // process information to switch between different states
        if (oth.state == "afk") {continue;}
        if (oth.state == "farming" && oth.aggroTimer == Infinity && checkCollision(oth.x - w/2, oth.y - h/2, w, h, player.x, player.y, 0, 0)) {
            // other player just saw this player, start aggro timer
            oth.aggroTimer = 60; // 60 frames or 0.5s until they react and aggro
        }
        var oldState = oth.state;
        oth.aggroTimer--;
        if (oth.aggroTimer < 0 && oldState != "aggro") {
            // other player is aggro on player
            oth.state = "aggro";
            oth.targetPosition = false;
            if (oth.health < specs[oth.build].maxHealth * oth.maxHealthMultiplier * oth.runThreshold) {
                oth.state = "running";
                oth.aggroTimer = Infinity;
            }
        }
        if (oth.state == "running" && Math.sqrt(Math.pow(oth.x - player.x, 2) + Math.pow(oth.y - player.y, 2)) > 750) {
            // other player got far enough that they're not scared anymore
            oth.state = "farming";
        }
        if (oth.health < 0) {
            oth.removed = true;
        }

        oth.shooting = false;
        if (oth.state == "farming") {
            oth.targetObject = false;
            for (var shape of shapes) {
                if (Math.sqrt(Math.pow(shape.x - oth.x, 2) + Math.pow(shape.y - oth.y, 2)) < 600) {
                    oth.shooting = true;
                    oth.targetObject = shape;
                    break;
                }
            }
            if (Math.random() < (oth.shooting?0.002:0.005)) {
                oth.targetPosition = [Math.random() * mapW, Math.random() * mapH];
            }
        }
        else if (oth.state == "aggro") {
            oth.shooting = true;
            if (!oth.targetObject || Math.random() < 0.01) {
                oth.targetObject = null;
                for (var cand of otherPlayers) {
                    if (cand.state == "aggro" && Math.random() < 0.2) {
                        oth.targetObject = cand;
                        break;
                    }
                }
                if (!oth.targetObject) {
                    oth.targetObject = player;
                }
            }
            if (!oth.targetPosition ||
                (Math.abs(oth.targetPosition[0] - oth.x) < 100 && Math.abs(oth.targetPosition[1] - oth.y) < 100 && Math.random() < Math.pow(oth.skill, 2) * 0.4)) {
                var theta = Math.random() * 2 * Math.PI;
                var distFromPlayer = Math.random() * 450 + 200;
                oth.targetPosition = [Math.cos(theta) * distFromPlayer + player.x, Math.sin(theta) * distFromPlayer + player.y];
            }
        } else if (oth.state == "running") {
            oth.targetObject = false;
            if (!oth.targetPosition || Math.random() < 0.1 * oth.skill) {
                var distanceX = oth.x - player.x, distanceY = oth.y - player.y;
                var magnitude = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                distanceX /= magnitude; distanceY /= magnitude;

                oth.targetPosition = [distanceX * Math.random() * 1000, distanceY * Math.random() * 1000];
            }
        }

        var speed = playerSpeed * oth.movementSpeedMultiplier;
        if (oth.targetPosition) {
            if (oth.x < oth.targetPosition[0] - 100) {
                oth.x += speed;
            } else if (oth.x > oth.targetPosition[0] + 100) {
                oth.x -= speed;
            }
            if (oth.y < oth.targetPosition[1] - 100) {
                oth.y += speed;
            } else if (oth.y > oth.targetPosition[1] + 100) {
                oth.y -= speed;
            }
        }

        if (oth.targetObject) {
            oth.angle = Math.atan2(oth.targetObject.y - oth.y, oth.targetObject.x - oth.x);
        } else if (Math.random() < 0.01) {
            oth.angle = Math.random() * Math.PI;
        }
        oth.actualAngle += (oth.angle - oth.actualAngle) * 0.1 * oth.skill;

        ctx.save();
        ctx.translate(oth.x, oth.y);
        ctx.rotate(oth.actualAngle);
        ctx.drawImage(images["ai"], -30, -30, 135, 60);
        ctx.restore();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.strokeRect(oth.x - 50, oth.y + 50, 100, 10);
        ctx.stroke();
        ctx.fillRect(oth.x - 50, oth.y + 50, 100 * oth.health / specs[oth.build].health / oth.maxHealthMultiplier, 10);

        if (oth.shooting) {
            shootBullet(oth, oth.build);
        }
        oth.delayRemaining -= 8.3333;
    }

    // spawn shapes
    if (Math.random() < 0.02 && shapes.length < 60) {
        var type = Object.keys(shapeSpecs)[Math.floor(Math.random() * Object.keys(shapeSpecs).length)];
        shapes.push({x: Math.random() * mapW, y: Math.random() * mapH,
            health: shapeSpecs[type].health,
            draw: shapeSpecs[type].draw,
            angle: 0,
            angularSpeed: shapeSpecs[type].rotationSpeed * (Math.random() * 2 - 1),
            value: shapeSpecs[type].value,
            iFrameRemaining: 0
        });
    }

    // bullets processing
    ctx.fillStyle = "lightblue";
    bullets = bullets.filter((b)=>!b.removed);
    for (var bul of bullets) {
        if (bul.timeRemaining < 0) {
            bul.removed = true;
        }
        bul.timeRemaining--;
        bul.x += bul.dx; bul.y += bul.dy;

        // check colision with other players
        for (var oth of otherPlayers) {
            if (checkCollision(oth.x-30, oth.y-30, 60, 60, bul.x, bul.y, 10, 10)) {
                oth.health -= bul.damage;
                bul.removed = true;
            }
        }
        
        // check collision with player themselves
        if (checkCollision(player.x-30, player.y-30, 60, 60, bul.x, bul.y, 10, 10)) {
            player.health -= bul.damage;
            bul.removed = true;
        }
        
        // draw
        ctx.fillRect(bul.x - 5, bul.y - 5, 10, 10);
    }

    // shapes processing
    for (var shape of shapes) {
        shape.iFrameRemaining--;
        for (var bul of bullets) {
            if (checkCollision(bul.x-10, bul.y-10, 20, 20, shape.x, shape.y, 20, 20)) {
                shape.health -= bul.damage;
                bul.removed = true;
                shape.iFrameRemaining = 10;
                if (shape.health <= 0) {
                    shape.removed = true;
                    if (bul.source == player) {
                        player.xp += shape.value * player.xpMultiplier;
                        player.upgradeAvailable += shape.value * player.xpMultiplier;
                        document.getElementById("upgradeAmount").innerHTML = "x" + Math.floor((player.upgradeAvailable) / 25); // it takes 25 xp for an upgrade
                    }
                }
            }
        }
        shape.angle += shape.angularSpeed;
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.angle);
        shape.draw();
        ctx.restore();
    }
    shapes = shapes.filter((s)=>!s.removed);
    
    // player red zone damage
    if (!checkCollision(player.x - 30, player.y - 30, 60, 60, 0, 0, mapW, mapH)) {
        player.health -= redZoneDamage;
    }

    if (player.health < 0) {
        clearInterval(gameInterval);
        document.getElementById("deadDiv").style.display = "block";
    }

    ctx.restore();
}