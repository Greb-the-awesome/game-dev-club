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

var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var gameInterval;
var w = canvas.clientWidth; var h = canvas.clientHeight;
var bullets = []; var zombies = [];
var ailoadout = [0, 0, 0, 0, 1];
var gamestarted = false;
var names = ["light", "wing", "faster", "rose"];
var colors = ["grey", "blue", "yellow", "pink"];
var roseheal = 0.05;
var damages = [1.5, 3, 0.5, 0.069420];
var player1 = {x: 10, y: 10, health: 100, firingDelay: 10, loadout: [0, 0, 0, 0, 0], rotSpeed: 4, angle: 0};
var player2 = {x: 900, y: 500, health: 100, firingDelay: 10, loadout: [0, 0, 0, 0, 0], ai: false, rotSpeed: 4, angle: 0};

var aiTarget = 100;
setInterval(() => {
    var cnt = 0;
    for (var i=0; i<5; i++) {
        if (player1.loadout[i] == 1) {
            cnt++;
        }
    }
    if (aiTarget == 100 && cnt <= 2) {aiTarget = 30;}
    else {aiTarget = 100;}
}, 1200);

// weapons
for (var j=0; j<5; j++) {
    let i = j;
    document.getElementById("p1s" + i).onclick = function() {
        player1.loadout[i]++;
        player1.loadout[i] %= 4;
        this.innerHTML = names[player1.loadout[i]];
    }
    document.getElementById("p2s" + i).onclick = function() {
        player2.loadout[i]++;
        player2.loadout[i] %= 4;
        this.innerHTML = names[player2.loadout[i]];
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

function startGame() {
    if (gamestarted) {return;}
    gamestarted = true;
    window.scroll(0, 1000);
    gameInterval = setInterval(gameLoop, 8.333);
    for (var i=0; i<5; i++) {
        player1.rotSpeed += player1.loadout[i] == 2?3:0;
        player2.rotSpeed += player2.loadout[i] == 2?3:0;
    }
}

function toggleAI() {
    player2.ai = !player2.ai;
    document.getElementById("aibutton").innerHTML = player2.ai?"<strong>AI</strong>/human":"AI/<strong>human</strong>";
    if (player2.ai) {
        for (var i=0; i<5; i++) {
            document.getElementById("p2s"+i).innerHTML = names[ailoadout[i]];
            document.getElementById("p2s"+i).disabled = true;
            player2.loadout[i] = ailoadout[i];
        }
    } else {
        for (var i=0; i<5; i++) {
            document.getElementById("p2s"+i).disabled = false;
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, w, h);
    
    // ----------- PLAYER 1 -----------

    // handle keys
    if (downKeys["KeyW"]) {
        player1.y -= 1;
    }
    if (downKeys["KeyS"]) {
        player1.y += 1;
    }
    if (downKeys["KeyA"]) {
        player1.x -= 1;
    }
    if (downKeys["KeyD"]) {
        player1.x += 1;
    }

    // rotate the petals
    player1.angle += player1.rotSpeed / 120;

    // draw the player
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player1.x-10, player1.y-10, 20, 20);
    for (var i=0; i<5; i++) {
        var angle = player1.angle + Math.PI * 2 * i / 5;
        var r = 30;
        if (downKeys["Space"]) {
            if (player1.loadout[i] != 3) {
                r = 100;
            }
            if (player1.loadout[i] == 1) {
                r = 150 * (Math.sin(angle * 1.3) ** 2) + 100;
            }
        } else {
            if (player1.loadout[i] == 3) {
                player1.health += roseheal;
                player1.health = Math.min(player1.health, 100);
            }
        }
        ctx.fillStyle = colors[player1.loadout[i]];
        var x = player1.x + Math.cos(angle) * r, y = player1.y + Math.sin(angle) * r;
        ctx.fillRect(x - 5, y - 5, 10, 10);
        if (checkCollision(x, y, 10, 10, player2.x, player2.y, 20, 20)) {
            player2.health -= damages[player1.loadout[i]];
        }
    }

    // ----------- PLAYER 2 -----------
    // handle keys
    if (!player2.ai) {
        if (downKeys["KeyI"]) {
            player2.y -= 1;
        }
        if (downKeys["KeyK"]) {
            player2.y += 1;
        }
        if (downKeys["KeyJ"]) {
            player2.x -= 1;
        }
        if (downKeys["KeyL"]) {
            player2.x += 1;
        }
    } else {
        // we want to go in the direction that would cause our petals to intersect the most with the other player
        var bestDist = 69420;
        var bestdx = 0, bestdy = 0;
        for (var i=-1; i<=1; i++) {
            for (var j=-1; j<=1; j++) {
                var r = Math.abs(Math.sqrt((player2.x + i - player1.x) ** 2 + (player2.y + j - player1.y) ** 2) - aiTarget);
                if (r < bestDist && checkCollision(player2.x+i, player2.y+j, 20, 20, 0, 0, w, h)) {
                    bestDist = r;
                    bestdx = i; bestdy = j;
                }
            }
        }
        player2.x += bestdx;
        player2.y += bestdy;
    }

    // rotate the petals
    player2.angle += player2.rotSpeed / 120;

    // draw the player
    ctx.fillStyle = "blue";
    ctx.fillRect(player2.x-10, player2.y-10, 20, 20);
    for (var i=0; i<5; i++) {
        var angle = player2.angle + Math.PI * 2 * i / 5;
        var r = 30;
        if ((!player2.ai && downKeys["Semicolon"]) || (player2.ai &&
            Math.abs(Math.sqrt((player2.x - player1.x) ** 2 + (player2.y - player1.y) ** 2) - 100) < 15
        )) {
            if (player2.loadout[i] != 3) {
                r = 100;
            }
            if (player2.loadout[i] == 1) {
                r = 150 * (Math.sin(angle * 1.3) ** 2) + 100;
            }
        } else {
            if (player2.loadout[i] == 3) {
                player2.health += roseheal;
                player2.health = Math.min(player2.health, 100);
            }
        }
        ctx.fillStyle = colors[player2.loadout[i]];
        var x = player2.x + Math.cos(angle) * r, y = player2.y + Math.sin(angle) * r;
        ctx.fillRect(x - 5, y - 5, 10, 10);
        if (checkCollision(x, y, 10, 10, player1.x, player1.y, 20, 20)) {
            player1.health -= damages[player2.loadout[i]];
        }
    }

    // gui
    ctx.fillStyle = "#000000";
    ctx.font = "50px Calibri";
    ctx.fillText("player healths: " + Math.round(player1.health) + ", " + Math.round(player2.health), 0, 100);

    // no cheesing allowed
    if (!checkCollision(player1.x, player1.y, 20, 20, 0, 0, w, h) || !checkCollision(player2.x, player2.y, 20, 20, 0, 0, w, h)) {
        clearInterval(gameInterval);
        ctx.fillText("hey! no going outside the map", 100, 300);
    }
    if (player1.health < 0 || player2.health < 0) {
        clearInterval(gameInterval);
        ctx.fillText("we have a winner!", 100, 300);
    }
}
