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
var money = 100;

// images
var images = {
	"bg": "./btdGUI-assets/bg.svg",
	"platform": "./btd-assets/platform_world.svg",
	"bloon": "./btd-assets/bloon.png",
	"PKP Pecheneg_world": "./btd-assets/pkp_world.svg",
	"Pecheneg Unlocked_world": "./btd-assets/pkp_world.svg",
	"M39 EMR_world": "./btd-assets/emr_world.svg",
	"Vector_world": "./btd-assets/vector_world.svg",
	"inv": "./btdGUI-assets/inv.png",
	"pkp_loot": "./btdGUI-assets/pkp.webp",
	"emr_loot": "./btdGUI-assets/m39.webp",
	"vector_loot": "./btdGUI-assets/vector.webp",
	"invselect": "./btdGUI-assets/invselect.png",
	"healthbar": "./btdGUI-assets/livesLeft.png"
}

for (var prop in images) {
	var im = new Image();
	im.src = images[prop];
	images[prop] = im;
}

// specs for all the guns
var gunSpecs = {
	"PKP Pecheneg": {
		delay: 15, // DELAY IS IN FRAMES
		damage: 25,
		capacity: 200,
		currentCapacity: 200,
		reloadTime: 5000, // RELOAD IN MS
		texture: "green",
		gunLength: 200,
		gunWidth: 20,
		bulletTexture: "yellow",
		bulletSpeed: 4,
		bulletSize: 10,
		spread: 10,
		piercing: false,
		sounds: {
			reload: "https://namerio.biz/audio/guns/pkp_reload_01.mp3",
			fire: "https://github.com/HasangerGames/suroi/raw/master/client/public/audio/sfx/weapons/lewis_gun_fire.mp3",
			// fire: "https://namerio.biz/audio/guns/pkp_01.mp3"
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
		gunLength: 150,
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
		gunLength: 100,
		gunWidth: 20,
		bulletTexture: "purple",
		bulletSpeed: 10,
		bulletSize: 10,
		spread: 20,
		piercing: false,
		sounds: {
			reload: "https://namerio.biz/audio/guns/vector_reload_01.mp3",
			fire: "https://namerio.biz/audio/guns/scorpion_01.mp3",
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
	["", "", "30px Calibri", "30px Calibri"],
	["", "", "30px Calibri", "30px Calibri"],
	["", ""],
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
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	w = canvas.width;
	h = canvas.height;
	setTimeout(function() {
		setInterval(function() {
			spawnWave(Math.pow(Math.log(currentWave + 0.5), 2.5) + 5, -Math.pow(0.9, currentWave - 18) + 7.5);
			currentWave++;
			money += 25;
		}, 7500);
	}, 5000);
}

function howToPlay() {
	document.getElementById("howToPlay").innerHTML
		= "HOW TO PLAY<br>Bloons will appear on the left.<br>Prevent them from getting to the right by placing down towers (click).<br>Use number keys 1, 2, 3 to try different towers.";
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
			bloons.push({texture: col, health: 50 * adjDiff, x: 0, y: 300, size: 15 * (Math.sqrt(adjDiff+1)) + 40, age: 0});
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
		alert("not enough money: cost for all towers is 100");
	}
}

function drawSizedImage(img, xcenter, ycenter, xwidth) {
	var width = xwidth;
	var height = img.height / img.width * width;
	ctx.drawImage(img, xcenter - width/2, ycenter - height/2, width, height);
}

function gameLoop() {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "lightblue";
	ctx.drawImage(images.bg, 0, 0, w, h);
	framesSurvived++;
	score += 0.3;

	// draw the path
	{
		ctx.lineWidth = 5;
		let age = 0;
		ctx.beginPath();
		while (getPath(age)[0] < w) {
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
		if (b.x > w) { // youre bad at the game :(
			lives--;
			money -= 4;
		} else if (b.health > 0) { // good if the health > 0
			newBloons.push(b);
		}
		if (b.health <= 0) {
			score += 10; // score increase for killing bloon
		}

		ctx.fillStyle = b.texture; // draw
		ctx.drawImage(images.bloon, b.x - b.size/2, b.y - b.size/2, b.size, b.size);
	}
	bloons = newBloons;

	// draw bullets
	var newBullets = [];
	ctx.font = "100px Impact";
	for (var b of bullets) {
		b.x += b.dx; b.y += b.dy; // kinematics

		if (!checkCollision(b.x, b.y, b.width, b.height, w/2, h/2, w, h)) {
			// bullet not in screen so we can't preserve it
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
		ctx.drawImage(images.platform, t.x-40, t.y-40, 80, 80);
		ctx.save();
		ctx.translate(t.x, t.y);
		ctx.rotate(t.gunSettings.angle);
		ctx.fillStyle = gunSpecs[t.type].texture;
		var img = images[t.type + "_world"];
		ctx.drawImage(img, -20, -20, img.width/img.height*40, 40);
		ctx.restore();

		if (t.gunSettings.reloading) {
			ctx.fillStyle = "lime";
			ctx.fillText("Reloading...", t.x, t.y);
		}
	}

	// GUI
	guiText[1][1] = "SCORE: " + Math.round(score);
	guiText[0][1] = "MONEY: " + money;

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

	// width and height of inventory are fixed at 576, 204.8
	ctx.drawImage(images.inv, w/2-288, h*0.95-204.8, 576, 204.8);
	// then draw images of the guns with offset so they go into the squares
	ctx.drawImage(images.pkp_loot, w/2-257.6, h*0.95-122.8, 106, 106);
	ctx.drawImage(images.emr_loot, w/2-118.4, h*0.95-122.8, 106, 106);
	ctx.drawImage(images.vector_loot, w/2+18, h*0.95-122.8, 106, 106);

	if (invSelect == 0) {
		ctx.drawImage(images.invselect, w/2-257.6, h*0.95-122.8, 106, 106);
	} else if (invSelect == 1) {
		ctx.drawImage(images.invselect, w/2-118.4, h*0.95-122.8, 106, 106);
	} else if (invSelect == 2) {
		ctx.drawImage(images.invselect, w/2+18, h*0.95-122.8, 106, 106);
	}
	
	if (lives > 66) {
		ctx.fillStyle = "green";
	} else if (lives > 15) {
		ctx.fillStyle = "yellow";
	} else {
		ctx.fillStyle = "red";
	}
	ctx.fillRect(w * 0.05 + 53, h * 0.05 + 55.45, 393.1 * lives/100, 32.2);
	ctx.drawImage(images.healthbar, w * 0.05, h * 0.05, 462, 100);

	// then draw the current weapon
	ctx.textAlign = "center";
	ctx.fillStyle = "black";
	ctx.font = "41.6px Teko";
	ctx.fillText(currentGun, w/2, h*0.95-163.2);

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