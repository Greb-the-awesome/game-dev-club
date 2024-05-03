var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.font = "50px Cutive";
var gameInterval;
var w = canvas.clientWidth; var h = canvas.clientHeight;
var gamestarted = false;
var globalfriction = 0.7;
var lives = 100;
var framesSurvived = 0, score = 0;
var money = 100;

// specs for all the guns
var gunSpecs = {
	"PKP Pecheneg": {
		delay: 15, // DELAY IS IN FRAMES
		damage: 25,
		capacity: 200,
		currentCapacity: 200,
		reloadTime: 5000, // RELOAD IN MS
		texture: "green",
		gunLength: 150,
		gunWidth: 20,
		bulletTexture: "yellow",
		bulletSpeed: 4,
		bulletSize: 10,
		spread: 10,
		piercing: false,
		sounds: {
			reload: "https://namerio.biz/audio/guns/pkp_reload_01.mp3",
			fire: "https://github.com/HasangerGames/suroi/raw/master/client/public/audio/sfx/weapons/lewis_gun_fire.mp3",
		}
	},
	"Pecheneg Unlocked": {
		delay: 3, // DELAY IS IN FRAMES
		damage: 900,
		capacity: 200,
		currentCapacity: 200,
		reloadTime: 2500, // RELOAD IN MS
		texture: "black",
		gunLength: 100,
		gunWidth: 20,
		bulletTexture: "aqua",
		bulletSpeed: 15,
		bulletSize: 25,
		spread: 3,
		piercing: true,
		sounds: {
			reload: "https://namerio.biz/audio/guns/pkp_reload_01.mp3",
			fire: "https://namerio.biz/audio/guns/pkp_01.mp3",
		}
	}
	,
	"M39 EMR": {
		delay: 80,
		damage: 300,
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
		sounds: {
			reload: "https://namerio.biz/audio/guns/m39_reload_01.mp3",
			fire: "https://namerio.biz/audio/guns/m39_01.mp3",
		}
	},
	"Vector": {
		delay: 5,
		damage: 30,
		capacity: 25,
		currentCapacity: 25,
		reloadTime: 1600,
		texture: "gray",
		gunLength: 50,
		gunWidth: 20,
		bulletTexture: "purple",
		bulletSpeed: 10,
		bulletSize: 10,
		spread: 20,
		piercing: false,
		sounds: {
			reload: "https://namerio.biz/audio/guns/vector_reload_01.mp3",
			fire: "https://namerio.biz/audio/guns/vector_01.mp3",
		}
	}
};

var currentGun = "PKP Pecheneg";
var invSelect = 0;
// gunSettings is the data about the gun you're holding like the current firing delay left
var gunSettings = {angle: 0, x: 500, y: 300, delay: 0, reloading: false};
var inv = ["PKP Pecheneg", "M39 EMR", "Vector"];

// arrays to store the bullets and bloons
var bullets = [];
var bloons = [];
var towers = [];

// GUI system
var guiText = [
	["gleb", "gleb", "30px Calibri", "30px Calibri"],
	["gleb", "gleb", "30px Calibri", "30px Calibri"],
	["gleb", "[1] PKP tower | [2] EMR tower | [3] Vector tower", "30px Calibri", "30px Calibri"],
	["", "", "30px Calibri", "30px Calibri"],
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
	setTimeout(function() {
		setInterval(function() {
			guiText[0][0] = "Wave number " + currentWave;
			spawnWave(Math.pow(Math.log(currentWave + 0.5), 2.5) + 5, -Math.pow(0.9, currentWave - 21) + 10);
			currentWave++;
			money += 25;
		}, 7500);
	}, 5000);
}

function spawnWave(num, difficulty) {
	// difficulty: 0 = instant destroy | 1 = regular bloon | 10 = max level, completely ram
	let delay = 2500/num;
	let numBloons = num;
	let diff = difficulty;
	let f = function(n) {
		if (n > 0) {
			var adjDiff = difficulty * (1+Math.random()*0.3);
			var col = "rgb(" + (adjDiff/10*255) + ", " + (255-adjDiff/10*255) + ", 0)";
			bloons.push({texture: col, health: 50 * adjDiff, x: 0, y: 300, size: 15 * (Math.sqrt(adjDiff+1)), age: 0});
			setTimeout(()=>{f(n-1);}, delay);
		}
	};
	f(num);
}

function getPath(t) {
	// a parametric defining the path
	return [t, Math.sin(0.005*t) * 200 + 350];
}

// wave maker
var currentWave = 1;

// place down towers
canvas.onclick = function(e) {
	if (money >= 100) {
		towers.push({x: mouseX, y: mouseY, type: currentGun, gunSettings: {angle: 0, delay: 0, currentCapacity: 0}});
		money -= 100;
		if (towers.length > 10) {
			guiText[3][0] = "Audio turned off to save performance."
			Audio = function(e) {return {play: function() {}};};
		}
	} else {
		alert("not enough money: cost for all towers is 50");
	}
}

function gameLoop() {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "lightblue";
	ctx.fillRect(0, 0, w, h);
	framesSurvived++;
	score += 0.3;

	// draw the path
	{
		let age = 0;
		ctx.beginPath();
		while (getPath(age)[0] < 1000) {
			ctx.moveTo(...getPath(age));
			ctx.lineTo(...getPath(age+3));
			age += 3;
		}
		ctx.stroke();
	}

	// draw the bloons + process them
	var newBloons = [];
	for (var b of bloons) {
		// basic kinematics
		[b.x, b.y] = getPath(b.age);
		b.age++;

		// validation for next frame
		if (b.x > 1000) { // youre bad at the game :(
			lives--;
			money -= 4;
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

		if ((!bulletConsumed || b.piercing) && b.damage > 0) {
			ctx.fillStyle = b.texture;
			ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
			newBullets.push(b);
		}
	}

	bullets = newBullets;

	// boom boom in the bloon
	ctx.font = "30px Calibri";
	for (var t of towers) {
		var gun = gunSpecs[t.type];
		ctx.fillStyle = gun.texture;

		// we will target a random bloon
		if (!t.target || !bloons[t.target]) {
			t.target = Math.floor(Math.random() * bloons.length);
		}
		if (bloons.length) {
			var dx = bloons[t.target].x - t.x, dy = bloons[t.target].y - t.y;
			t.gunSettings.angle = Math.atan2(dy, dx);
		}
		
		// spread calculations
		var spreadRadians = gun.spread * Math.PI / 180;
		var shootingAngle = t.gunSettings.angle + (spreadRadians) * Math.random() - spreadRadians/2;

		t.gunSettings.delay--;
		if (t.gunSettings.delay <= 0 && bloons.length && t.gunSettings.currentCapacity > 0) {
			bullets.push({
				x: t.x + Math.cos(t.gunSettings.angle) * gun.gunLength / 2,
				y: t.y + Math.sin(t.gunSettings.angle) * gun.gunLength / 2,
				width: gun.bulletSize, height: gun.bulletSize,
				texture: gun.bulletTexture, dx: Math.cos(shootingAngle)*gun.bulletSpeed, dy: Math.sin(shootingAngle)*gun.bulletSpeed,
				damage: gun.damage, piercing: gun.piercing,
			});
			t.gunSettings.delay = gun.delay;
			t.gunSettings.currentCapacity--;
			new Audio(gun.sounds.fire).play();
		}

		if (t.gunSettings.currentCapacity <= 0 && !t.gunSettings.reloading) {
			t.gunSettings.reloading = true;
			let _t = t;
			new Audio(gun.sounds.reload).play();
			setTimeout(function() {_t.gunSettings.currentCapacity = gunSpecs[_t.type].capacity; _t.gunSettings.reloading = false;}, gun.reloadTime);
		}

		if (t.gunSettings.currentCapacity > gun.capacity) {t.gunSettings.currentCapacity = gun.capacity;}

		// draw tower
		ctx.save();
		ctx.translate(t.x, t.y);
		ctx.rotate(t.gunSettings.angle);
		ctx.fillStyle = gunSpecs[t.type].texture;
		ctx.fillRect(-gunSpecs[t.type].gunLength/2, -gunSpecs[t.type].gunWidth/2, gunSpecs[t.type].gunLength, gunSpecs[t.type].gunWidth);
		ctx.restore();

		if (t.gunSettings.reloading) {
			ctx.fillStyle = "lime";
			ctx.fillText("Reloading...", t.x, t.y);
		}
	}

	// GUI
	guiText[1][1] = "SCORE: " + Math.round(score);
	guiText[0][1] = "MONEY: " + money;
	guiText[1][0] = "Current tower: " + currentGun;
	guiText[2][0] = "Lives: " + lives;

	ctx.fillStyle = "black";
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

	ctx.beginPath();
	ctx.strokeRect(mouseX-10, mouseY-10, 20, 20);
	ctx.stroke();

	// process key presses
	for (var i=0; i<inv.length; i++) {
		if (downKeys["Digit" + (i+1)] && !gunSettings.reloading) {
			invSelect = i;
			currentGun = inv[invSelect];
		}
	}

	if (lives <= 0) {
		clearInterval(gameInterval);
		ctx.font = "40px Impact";
		ctx.fillStyle = "black";
		ctx.fillText("you lose cause your bad", 100, 100);
		ctx.fillText("yer score was " + Math.round(score) + " and you survived " + framesSurvived + " frames.", 300, 300);
	}
}