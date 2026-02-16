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

// images
var images = {
	"tex": "./rage-assets/tex.png"
};

for (var prop in images) {
	var im = new Image();
	im.src = images[prop];
	images[prop] = im;
}

// walls
var walls = [];

// set up matter.js
// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;
var engine = Engine.create();


function generateLevel() {
	walls = [];
	walls.push({coords: [0, 500, 1000, 100], friction: 0.1, angle: 0.1});

	for (var w of walls) {
		w.body = Bodies.rectangle(engine.world, w.coords[0], w.coords[1], w.coords[2], w.coords[3], {isStatic: true, friction: w.friction, angle: w.angle});
		Composite.add(w.body);
	}
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
	ctx.fillStyle = "black";	
	ctx.drawImage(images.tex, 0, 0, w, h);

	for (var w of walls) {
		var v = w.vertices;
		// basically draw a rectangle
		ctx.fillRect(Math.min(v[0].x, v[1].x, v[2].x, v[3].x),
			Math.min(v[0].y, v[1].y, v[2].y, v[3].y), 
			Math.max(v[0].x, v[1].x, v[2].x, v[3].x) - Math.min(v[0].x, v[1].x, v[2].x, v[3].x),
			Math.max(v[0].y, v[1].y, v[2].y, v[3].y) - Math.min(v[0].y, v[1].y, v[2].y, v[3].y));
	}
}