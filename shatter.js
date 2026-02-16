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

// module aliases
var Engine = Matter.Engine,
Render = Matter.Render,
Runner = Matter.Runner,
Bodies = Matter.Bodies,
Composite = Matter.Composite,
Body = Matter.Body,
Vector = Matter.Vector,
Constraint = Matter.Constraint,
Events = Matter.Events;
var engine = Engine.create();
var runner = Runner.create();

var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.font = "30px Cutive";
var gameInterval;
var w = canvas.clientWidth; var h = canvas.clientHeight;
var gamestarted = false;
var playerX = 200, playerY = 300; // SCREEN POSITION
var playerWidth = 100, playerHeight = 100;
var playerBody;
var ballRadius = 10;
var defaultBallForce = 1;
var obstacles = [];
var cameraPosition = 0, moveSpeed = 5;
var ballsUsed = 0;

var images = { // image --> url
    "player": "./shatter-assets/player.svg",
};

for (var prop in images) {
	var im = new Image();
	im.src = images[prop];
	images[prop] = im;
}

class Glass {
    constructor(rows, cols, strength, mover, color) {
        // rows and cols = how many particles
        // strength = how much it takes to break the glass
        // mover = a Body that is attached to the glass to move the glass
        this.rows = rows;
        this.cols = cols;
        this.strength = strength;
        this.mover = mover;
        this.particles = [];
        this.constraints = [];
        var particleSize = 30;
        this.color = color;
        for (var r=0; r<rows; r++) {
            this.particles.push([]);
            this.constraints.push([]);
            for (var c=0; c<cols; c++) {
                this.constraints[r].push([]);
                var label = this;
                if (c == 0) {
                    // this one is directly attached to the mover, thus its constraint with the mover cannot be broken
                    // so the player may be forced to crash into this one
                    // thus we also mark it as a "mover"
                    label = "mover";
                }
                var toPush = Bodies.rectangle(mover.position.x + r * particleSize + particleSize, mover.position.y + c * particleSize + particleSize, particleSize, particleSize, {label: label, density: 0.0001});
                this.particles[r].push(toPush);
                Composite.add(engine.world, toPush);
            }
        }
        for (var r=0; r<rows; r++) {
            for (var c=0; c<cols; c++) {
                if (c == 0) {
                    var co = Constraint.create({
                        bodyA: mover,
                        bodyB: this.particles[r][c],
                        length: particleSize + Math.abs(r*2 - rows) * particleSize,
                        stiffness: 0.95,
                        damping: 0.01
                    });
                    Composite.add(engine.world, co);
                }
                for (var dx=-1; dx<=1; dx++) {
                    for (var dy=-1; dy<=1; dy++) {
                        if (((dx && !dy) || (!dx && dy)) && this.particles[r+dx] && this.particles[r+dx][c+dy]) {
                            var co = Constraint.create({
                                bodyA: this.particles[r + dx][c + dy],
                                bodyB: this.particles[r][c],
                                pointA: Vector.create(0,0), pointB: Vector.create(0,0),
                                length: particleSize * 0.99,
                                stiffness: 1,
                                damping: 0.01
                            });
                            this.constraints[r][c].push({obj: co, from: [r, c], to: [r+dx, c+dy], broken: false});
                            this.constraints[r+dx][c+dy].push({obj: co, from: [r+dx, c+dy], to: [r, c], broken: false});
                            Composite.add(engine.world, co);
                        }
                    }
                }
            }
        }
    }
    hitUtil(force, r, c, vis) {
        // recursive function to destroy a chunk of the glass using DFS
        force *= 0.8;
        for (var co of this.constraints[r][c]) {
            if (vis.has(co.to) || co.broken) {
                continue;
            }
            vis.add(co.to);
            if (force > this.strength) {
                Composite.remove(engine.world, co.obj);
                co.broken = true;
                for (var other of this.constraints[co.to[0]][co.to[1]]) {
                    if (other.to == [r, c]) {
                        other.broken = true;
                    }
                }
                this.hitUtil(force, co.to[0], co.to[1], vis);
            }
        }
    }
    hit(force, body) {
        // to break the glass
        // @param body basically body is the body that was originally detected to be colliding, we start DFS from this one
        for (var r=0; r<this.rows; r++) {
            for (var c=0; c<this.cols; c++) {
                if (this.particles[r][c] == body) {
                    this.hitUtil(force, r, c, new Set([r, c]));
                }
            }
        }
    }
}

class MovingPane {
    constructor(x, range, rows, cols, speed, color) {
        obstacles.push(this);
        this.x = x; this.range = range; this.rows = rows; this.cols = cols; this.speed = speed;
        this.mover = Bodies.rectangle(x, 300 - range, 10, 10, {isStatic: true, label: "mover"});
        this.glass = new Glass(rows, cols, 0.6, this.mover, color);
        this.t = 0;
    }
    update() {
        this.t += 16.667;
        Body.setPosition(this.mover, Vector.create(this.x, Math.cos(this.t * this.speed * 0.005) * this.range + 300));
    }
}

function startGame() { // read the button values and scroll
    if (gamestarted) {return;}
    gamestarted = true;
    window.scroll(0, 1000);
    document.getElementById("guiDiv").style.display = "none";
    gameInterval = setInterval(gameLoop, 16.667);

    playerBody = Bodies.rectangle(playerX, playerY, 10, 10, {isStatic: true, label: "player"});
    Composite.add(engine.world, playerBody);

    // run the engine
    Runner.run(runner, engine);

    canvas.addEventListener("mousedown", function() {
        // throw a ball
        var ball = Bodies.circle(playerX + cameraPosition, playerY, ballRadius, {label: "ball"});
        Body.setVelocity(ball, Vector.mult(Vector.normalise(Vector.sub(Vector.create(mousePos[0], mousePos[1]), Vector.create(playerX, playerY))), 15));
        Composite.add(engine.world, ball);
        ballsUsed++;
    });

    Events.on(engine, "collisionStart", function(e) {
        var pairs = e.pairs;
        pairs.forEach(pair => {
            var a = pair.bodyA, b = pair.bodyB;
            if (b.label == "ball") {
                [a, b] = [b, a];
            }
            if (a.label == "ball" && b.label.constructor.name == "Glass" && a.speed > 0.2) {
                b.label.hit(defaultBallForce, b);
            }

            if (b.label == "player") {
                [a, b] = [b, a];
            }
            if (a.label == "player" && b.label != "ball" && b.label != "mover") {
                console.log("crash");
                clearInterval(gameInterval);
                document.getElementById("endDiv").style.display = "block";
                // distance traveled measured in screens, each screen = 1000px
                document.getElementById("scoreDisplay").innerHTML = "Your score (distance traveled - 0.09 * balls shot) was <strong>" + (cameraPosition/1000 - 0.09 * ballsUsed) + "</strong>";
            }
        })
    });
}

function gameLoop() {
    ctx.clearRect(cameraPosition,0,w,h);

    cameraPosition += moveSpeed;
    ctx.translate(-moveSpeed, 0);
    Body.setPosition(playerBody, Vector.create(playerX + cameraPosition, 300));

    // spawn in obstacles
    if (Math.random() < 0.02) {
        new MovingPane(2000 + cameraPosition, Math.random() * 300, 1, Math.floor(Math.random() * 4 + 6), Math.random() * 0.2 + 0.5, "#114499");
    }

    // update the obstacles
    obstacles = obstacles.filter(function(ob) {
        if (ob.mover.position.x - cameraPosition < 0) {return false;}
        return true;
    })
    for (var ob of obstacles) {ob.update();}

    // render all the stuff
    var bodies = Composite.allBodies(engine.world);

    for (var b of bodies) {
        if (b.position.x - cameraPosition < 0 || b.position.y > 600) {
            Composite.remove(engine.world, b);
        }
    }

    for (var b of bodies) {
        var verts = b.vertices;
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (var v of verts) {
            ctx.lineTo(v.x, v.y);
        }
        ctx.lineTo(verts[0].x, verts[0].y);
        ctx.fillStyle = "gray";
        if (b.label?.color) {
            ctx.fillStyle = b.label.color;
        }
        ctx.fill();
    }

    // render the player
    ctx.save();
    ctx.setTransform([1,0,0,0,1,0,0,0,1])
    ctx.translate(playerX, playerY);
    ctx.rotate(Math.atan2(mousePos[1] - playerY, mousePos[0] - playerX));
    ctx.drawImage(images.player, -playerWidth/2, -playerHeight/2, playerWidth, playerHeight);
    ctx.restore();
}
