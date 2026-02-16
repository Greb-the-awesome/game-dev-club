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
var gamestarted = false;
var globalfriction = 0.7;
var lives = 100;
var framesSurvived = 0, score = 0;

// specs for all the guns
var gunSpecs = {
	"QCW-05": {
		delay: 10, // DELAY IS IN FRAMES
		damage: 51,
		capacity: 75,
		currentCapacity: 75,
		reloadTime: 3900, // RELOAD IN SECONDS
		texture: "green",
		gunLength: 150,
		gunWidth: 20,
		bulletTexture: "yellow",
		bulletSpeed: 4,
		bulletSize: 10,
		spread: 10,
		piercing: false,
	},
	"SV-98": {
		delay: 120,
		damage: 900,
		capacity: 10,
		currentCapacity: 10,
		reloadTime: 2500,
		texture: "olive",
		gunLength: 200,
		gunWidth: 15,
		bulletTexture: "aqua",
		bulletSpeed: 15,
		bulletSize: 25,
		spread: 1,
		piercing: true,
	},
	"ARX-160": {
		delay: 20,
		damage: 200,
		capacity: 30,
		currentCapacity: 30,
		reloadTime: 1500,
		texture: "gray",
		gunLength: 100,
		gunWidth: 20,
		bulletTexture: "blue",
		bulletSpeed: 6,
		bulletSize: 10,
		spread: 20,
		piercing: false,
	}
};

var currentGun = "QCW-05";
var invSelect = 0;
// gunSettings is the data about the gun you're holding like the current firing delay left
var gunSettings = {angle: 0, x: 500, y: 300, delay: 0, reloading: false};
var inv = ["QCW-05", "SV-98", "ARX-160"];

// arrays to store the bullets and bloons
var bullets = [];
var bloons = [];

// GUI system
var guiText = [
	["capacity", "Lives left:", "30px Calibri", "30px Calibri"],
	["[reloading?]", "Wave x", "30px Calibri", "30px Calibri"],
	["Current weapon:", "inventory:", "30px Calibri", "30px Calibri"],
]

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
	// x and y are the center
	return (Math.abs(x1 - x2) < (w1 + w2)/2) && (Math.abs(y1 - y2) < (h1 + h2)/2);
}

function startGame() { // start the game and remove the home screen
	if (gamestarted) {return;}
	gamestarted = true;
	gameInterval = setInterval(gameLoop, 8.333);
	document.getElementById("guiDiv").style.display = "none";
	canvas.style.display = "block";
	w = canvas.clientWidth; h = canvas.clientHeight;
}

function gameLoop() {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "lightgreen";
	ctx.fillRect(0, 0, w, h);
	framesSurvived++;
	score += 0.3;

	// spawn a pack of bloons
	if (Math.random() < 0.002) {
		for (var i=0; i<Math.random() * 15; i++) {
			bloons.push({texture: "black", health: 100, x: 0, y: 300, velx: 0, vely: 0, size: 30});
		}
	}

	// draw the bloons + process them
	var newBloons = [];
	for (var b of bloons) {
		// basic kinematics
		b.vely += Math.pow(Math.random(), 10) * (Math.random() > 0.5?1:-1) * 32;
		if (b.y <= 10 || b.y >= 590) {b.vely = b.vely * -0.2;}
		b.velx *= globalfriction; b.vely *= globalfriction;
		b.x += b.velx + 2;
		b.y += b.vely;

		// validation for next frame
		if (b.x > 1000) { // youre bad at the game :(
			lives--;
		} else if (b.health > 0) { // good if the health > 0
			newBloons.push(b);
		}
		if (b.health <= 0) {
			score += 10; // score increase for killing bloon
		}

		ctx.fillStyle = b.texture; // draw
		ctx.fillRect(b.x - b.size/2, b.y - b.size/2, b.size, b.size);
	}
	bloons = newBloons;

	// draw bullets
	var newBullets = [];
	ctx.font = "100px Impact";
	for (var b of bullets) {
		b.x += b.dx; b.y += b.dy; // kinematics

		if (!checkCollision(b.x, b.y, b.width, b.height, 500, 300, 1000, 600)) {
			// bullet not in screen so we can't preseve it
			continue;
		}

		var bulletConsumed = false;
		for (var g of bloons) {
			if (checkCollision(b.x, b.y, b.width, b.height, g.x, g.y, g.size, g.size)) {
				var oldDamage = b.damage;
				b.damage -= g.health;
				g.health -= oldDamage;
				bulletConsumed = true;
				ctx.fillStyle = "red";
				ctx.fillText("hit", b.x, b.y);
				break;
			}
		}

		if (!bulletConsumed || b.piercing) {
			ctx.fillStyle = b.texture;
			ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
			newBullets.push(b);
		}
	}

	bullets = newBullets;

	// boom boom in the bloon
	// do some angle calculations
	var gun = gunSpecs[currentGun];
	ctx.fillStyle = gun.texture;
	var dx = mouseX - 500; var dy = mouseY - 300;
	gunSettings.angle = Math.atan2(dy, dx);

	// spread calculations
	var spreadRadians = gun.spread * Math.PI / 180;
	var shootingAngle = gunSettings.angle + (spreadRadians) * Math.random() - spreadRadians/2;

	// use the ctx.rotate from last lecture to rotate our gun
	ctx.save();
	ctx.translate(500, 300);
	ctx.rotate(gunSettings.angle);
	ctx.fillRect(-100, -10, 200, 20);
	ctx.restore();

	guiText[2][0] = "Current gun: " + currentGun;
	guiText[0][0] = gun.currentCapacity + " / " + gun.capacity;
	if (gunSettings.reloading) {
		guiText[1][0] = "Reloading...";
	} else {guiText[1][0] = "";}
	guiText[0][1] = "Lives Left: " + lives;
	guiText[2][1] = "";
	for (var i=0; i<inv.length; i++) {
		guiText[2][1] += "[" + (i+1) + "]: " + inv[i] + " ";
	}
	guiText[1][1] = "SCORE: " + Math.round(score);

	gunSettings.delay--;
	if (gunSettings.delay <= 0 && mouseDown && gun.currentCapacity > 0) {
		bullets.push({
			x: 500 + Math.cos(gunSettings.angle) * gun.gunLength / 2,
			y: 300 + Math.sin(gunSettings.angle) * gun.gunLength / 2,
			width: gun.bulletSize, height: gun.bulletSize,
			texture: gun.bulletTexture, dx: Math.cos(shootingAngle)*gun.bulletSpeed, dy: Math.sin(shootingAngle)*gun.bulletSpeed,
			damage: gun.damage, piercing: gun.piercing,
		});
		gunSettings.delay = gun.delay;
		gun.currentCapacity--;
	}

	if (gun.currentCapacity <= 0 && !gunSettings.reloading) {
		gunSettings.reloading = true;
		setTimeout(function() {gun.currentCapacity = gun.capacity; gunSettings.reloading = false;}, gun.reloadTime);
	}

	if (gun.currentCapacity > gun.capacity) {gun.currentCapacity = gun.capacity;}

	// GUI
	for (var i=0; i<guiText.length; i++) {
		ctx.font = guiText[i][2];
		ctx.fillText(guiText[i][0], 20, 40 + i * 50);
	}
	ctx.textAlign = "right";
	for (var i=0; i<guiText.length; i++) {
		ctx.font = guiText[i][3];
		ctx.fillText(guiText[i][1], 980, 40 + i * 50);
	}
	ctx.textAlign = "left";

	ctx.strokeRect(mouseX-10, mouseY-10, 20, 20);
	ctx.stroke();

	// process key presses
	for (var i=0; i<inv.length; i++) {
		if (downKeys["Digit" + (i+1)]) {
			invSelect = i;
			currentGun = inv[invSelect];
		}
	}

	if (lives <= 0) {
		clearInterval(gameInterval);
		ctx.font = "100px Impact";
		ctx.fillStyle = "black";
		ctx.fillText("you lose cause your bad", 100, 100);
		ctx.fillText("yer score was " + Math.round(score) + " and you survived " + framesSurvived + " frames.", 300, 300);
	}
}