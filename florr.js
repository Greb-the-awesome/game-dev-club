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
var ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.font = "50px Cutive";
var gameInterval;
var w = canvas.clientWidth; var h = canvas.clientHeight;
var bullets = []; var zombies = [];
var ailoadout = [0, 0, 0, 0, 1];
var gamestarted = false;
var images = [new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image()];
var gifs = [new Image(), new Image()];
images[0].src = "./florrio-assets/light.png";
images[1].src = "./florrio-assets/wing.png";
images[2].src = "./florrio-assets/faster.png";
images[3].src = "./florrio-assets/rose.png";
images[4].src = "./florrio-assets/hardcore.png";
images[5].src = "./florrio-assets/sadhardcore.png";
images[6].src = "./florrio-assets/player.png";
images[7].src = "./florrio-assets/bg2.png";
gifs[0].src = "./florrio-assets/bg2.png";
gifs[1].src = "./florrio-assets/heartgone.png";
var colors = ["grey", "blue", "yellow", "pink"];
var names = ["light", "wing", "faster", "rose"];
var roseheal = 0.05;
var damages = [1, 1.5, 0.3, 0.069420];
var player1 = {x: 10, y: 10, health: 100, firingDelay: 10, loadout: [0, 0, 0, 0, 0], rotSpeed: 4, angle: 0, lastHearts: 5};
var player2 = {x: 900, y: 500, health: 100, firingDelay: 10, loadout: [0, 0, 0, 0, 0], ai: false, rotSpeed: 4, angle: 0, lastHearts: 5};

// AI stuff
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

function isAIattacking() {
    return Math.abs(Math.sqrt((player2.x - player1.x) ** 2 + (player2.y - player1.y) ** 2) - 100) < 15;
}

// weapons
for (var j=0; j<5; j++) {
    let i = j;
    document.getElementById("p1s" + i).onclick = function() { // click button to toggle petal
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

function startGame() { // read the button values and scroll
    if (gamestarted) {return;}
    gamestarted = true;
    window.scroll(0, 1000);
    gameInterval = setInterval(gameLoop, 8.333);
    for (var i=0; i<5; i++) {
        player1.rotSpeed += player1.loadout[i] == 2?3:0;
        player2.rotSpeed += player2.loadout[i] == 2?3:0;
    }
    document.getElementById("guiDiv").style.display = "none";
    playGif(0, 200, 100, 10, true);
}

function toggleAI() { // AI toggle button
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

var imagesToRender = []; // [imageIndex, x, y, frameNum, timer, scale, loop]

function playGif(img, x, y, scale, loop) {
    // play a gif from a sprite sheet, with a fixed amount of 5 frames.
    imagesToRender.push([img, x, y, 0, 0, scale, loop]);
}

function updateGifs() {
    for (var i of imagesToRender) {
        i[4]++;
        if (i[4] > 60) {
            i[4] = 0;
            i[3]++;
        }
        if (i[3] > 4) {
            if (i[6]) {
                i[3] %= 5;
            } else {
                continue;
            }
        }
        var w = gifs[i[0]].width / 5;
        var h = gifs[i[0]].height;
        ctx.drawImage(gifs[i[0]], w * i[3], 0, w, h, i[1], i[2], w * i[5], h * i[5]);
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, w, h);

    // gui
    ctx.fillStyle = "#000000";
    // health bar
    var player1Hearts = 0, player2Hearts = 0;
    for (var i=0; i<6; i++) {
        if (player1.health * 6 / 100 > i) {
            ctx.drawImage(images[4], 40 + i * 70, 30, 66, 66);
            player1Hearts = i;
        } else {
            ctx.drawImage(images[5], 40 + i * 70, 30, 66, 66);
        }
        if (player2.health * 6 / 100 > i) {
            ctx.drawImage(images[4], 530 + i * 70, 30, 66, 66);
            player2Hearts = i;
        } else {
            ctx.drawImage(images[5], 530 + i * 70, 30, 66, 66);
        }
    }
    if (player1Hearts != player1.lastHearts) {
        playGif(1, 40+player1.lastHearts*70, 30, 6, false);
        player1.lastHearts = player1Hearts;
    }
    if (player2Hearts != player2.lastHearts) {
        playGif(1, 530+player2.lastHearts*70, 30, 6, false);
        player2.lastHearts = player2Hearts;
    }

    updateGifs();
    
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
    ctx.drawImage(images[6], player1.x-15, player1.y-15, 30, 30);
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
        var x = player1.x + Math.cos(angle) * r, y = player1.y + Math.sin(angle) * r;
        
        // sprite rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(images[player1.loadout[i]], -10, -10, 20, 20);
        ctx.restore();

        if (checkCollision(x-10, y-10, 20, 20, player2.x, player2.y, 20, 20)) {
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
    ctx.drawImage(images[6], player2.x-15, player2.y-15, 30, 30);
    for (var i=0; i<5; i++) {
        var angle = player2.angle + Math.PI * 2 * i / 5;
        var r = 30;
        if ((!player2.ai && downKeys["Semicolon"]) || (player2.ai && isAIattacking())) {
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
        var x = player2.x + Math.cos(angle) * r, y = player2.y + Math.sin(angle) * r;

        // sprite rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(images[player2.loadout[i]], -10, -10, 20, 20);
        ctx.restore();

        if (checkCollision(x-10, y-10, 20, 20, player1.x, player1.y, 20, 20)) {
            player1.health -= damages[player2.loadout[i]];
        }
    }

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
