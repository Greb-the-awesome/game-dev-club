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
const platform = Bodies.rectangle(150, height - 100, 300, 20, { isStatic: true, render: { fillStyle: '#8B4513' } });
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
    stiffness: 0.02,
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

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const x = width - 200 + col * boxWidth;
            const y = height - 200 - row * boxHeight;
            boxes.push(
                Bodies.rectangle(x, y, boxWidth, boxHeight, {
                    restitution: 0.5,
                    chamfer: { radius: 10 }, // Adding rounded corners
                    render: { fillStyle: '#A52A2A' }
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

// Launch the bird when the mouse is released
Events.on(engine, 'afterUpdate', () => {
    if (!sling.bodyB && (bird.position.x > 200 || bird.position.y < height - 150)) {
        resetBird();
    }
});

// Mouse control to drag the bird
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.02,
        render: {
            visible: false
        }
    }
});

World.add(world, mouseConstraint);

// Release the bird from the sling and set the flag
Events.on(mouseConstraint, 'mouseup', (event) => {
    if (mouseConstraint.body === bird && !isBirdLaunched) {
        sling.bodyB = null;
        isBirdLaunched = true; // Bird has been launched, disable further control
    }
});

// Prevent bird dragging after launch
Events.on(mouseConstraint, 'mousemove', (event) => {
    if (isBirdLaunched) {
        mouseConstraint.constraint.bodyB = null; // Disable dragging if bird has been launched
    }
});

// Keep the canvas responsive
window.addEventListener('resize', () => {
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: width, y: height }
    });
});
