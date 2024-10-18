// main.js
// Initialize the Matter.js modules needed
const { Engine, Render, Runner, World, Bodies, Body, Events, Mouse, MouseConstraint, Constraint, Vector } = Matter;

// Setup the engine and the world
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1; // Gravity force similar to Earth

// Setup rendering
const width = 800;
const height = 600;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#87CEEB' // Sky blue background
    }
});

Render.run(render);

// Setup the runner
const runner = Runner.create();
Runner.run(runner, engine);

// Ground and platforms
const ground = Bodies.rectangle(width / 2, height - 10, width, 20, { isStatic: true, render: { fillStyle: '#8B4513' } });
const platform = Bodies.rectangle(150, height - 50, 300, 20, { isStatic: true, render: { fillStyle: '#8B4513' } });
World.add(world, [ground, platform]);

// Create a sling and projectile (the bird)
let bird = Bodies.circle(150, height - 150, 20, {
    density: 0.004,
    restitution: 0.8,
    render: { fillStyle: 'red' }
});

let sling = Constraint.create({
    pointA: { x: 150, y: height - 150 },
    bodyB: bird,
    stiffness: 0.014,
    length: 40
});

World.add(world, [bird, sling]);

// Track if the bird has been launched
let isBirdLaunched = false;

// Stack of boxes (the targets)
const createBoxStack = () => {
    const boxes = [];
    const boxWidth = 40;
    const boxHeight = 40;

    for (let row = 0; row < 6; row++) {
        var numCols;
        if (row < 3) {
            numCols = 4;
        } else {
            numCols = 2;
        }
        for (let col = 0; col < numCols; col++) {
            const x = width - 200 + col * boxWidth;
            const y = height - 1 - row * boxHeight;
            boxes.push(
                Bodies.rectangle(x, y, boxWidth, boxHeight, {
                    restitution: 0.1,
                    chamfer: { radius: 3 }, // Adding rounded corners
                    render: { fillStyle: '#A52A2A' },
                    density: 0.0015,
                    friction: 0.9
                })
            );
        }
    }
    return boxes;
};

const boxes = createBoxStack();
World.add(world, boxes);

// Function to reset the bird
const resetBird = () => {
    World.remove(world, bird);
    bird = Bodies.circle(150, height - 150, 20, {
        density: 0.004,
        restitution: 0.8,
        render: { fillStyle: 'red' }
    });
    sling.bodyB = bird;
    World.add(world, bird);
    isBirdLaunched = false; // Reset launch flag
};

// Keep the canvas responsive
window.addEventListener('resize', () => {
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: width, y: height }
    });
});

// move the bird using WASD, fire using space
var downKeys = {};
addEventListener("keydown", function(e) {
    downKeys[e.code] = true;
});

addEventListener("keyup", function(e) {
    downKeys[e.code] = false;
});

var birdPos = Vector.create(150, height - 150);
const sensitivity = 1;
const maxDist = 150;
var lastSlingLength = 100000;

setInterval(function() {
    if (downKeys["Space"]) {
        isBirdLaunched = true;
    }
    if (isBirdLaunched) {
        // remove the sling at the correct time
        // calculate the current sling length
        // we would use Constraint.currentLength which is mentioned in the documentation and it's supposed to return the distance between the two bodies of a constraint, exactly what we need
        // but apparently the joke documentation is literally false as the function is nowhere to be found lmfao
        // matter.js joke trash documentation moment
        var currSlingLength = Vector.magnitude(Vector.sub(bird.position, Vector.create(150, height - 150)));

        if (lastSlingLength < currSlingLength) {
            World.remove(world, sling);
        }
        lastSlingLength = currSlingLength;
        return;
    }
    if (downKeys["KeyW"]) {
        birdPos.y -= sensitivity;
    }
    if (downKeys["KeyS"]) {
        birdPos.y += sensitivity;
    }
    if (downKeys["KeyA"]) {
        birdPos.x -= sensitivity;
    }
    if (downKeys["KeyD"]) {
        birdPos.x += sensitivity;
    }
    if (Vector.magnitude(Vector.sub(birdPos, Vector.create(150, height - 150))) > maxDist) {
        birdPos = Vector.add(Vector.mult(Vector.normalise(Vector.sub(birdPos, Vector.create(150, height - 150))), maxDist-2), Vector.create(150, height - 150));
    }
    Body.setPosition(bird, birdPos);
    Body.setVelocity(bird, Vector.create(0, 0));
})
