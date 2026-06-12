let snow = [];      // still falling
let stuckSnow = []; // have landed and stayed

// fix trees attributes to find intersection later
let trees = [
  { x: 60,  size: 85 },
  { x: 150, size: 62 },
  { x: 245, size: 100 },
  { x: 340, size: 72 }
];

// leaves layers
let layers = [
  { base: 0.00, half: 0.45, apex: 0.70 },
  { base: 0.45, half: 0.38, apex: 1.10 },
  { base: 0.85, half: 0.30, apex: 1.45 }
];

// sound variables
let wind;             // noise
let windFilter;       // low-pass
let windOn = false;   

//create the canvas
function setup() {
  createCanvas(400, 400);

  // LOOP: create 110 falling snowflakes
  for (let i = 0; i < 110; i++) {
    snow.push({
      x: random(width),
      y: random(-height, 0),       
      size: random(2, 5),
      speed: random(0.5, 2),       // falling speed
      sway: random(0.01, 0.04),    // drifts sideways
      offset: random(TWO_PI)       // variable for sin func
    });
  }
  
    // wind sound cycle: brown noise -> low-freq pass -> amp
  wind = new p5.Noise('brown');   // deep 
  windFilter = new p5.LowPass();  
  wind.disconnect();              
  wind.connect(windFilter);       // plug it into the filter
  wind.amp(0);                    // start silent
  wind.start();
}


// draw items onto the background
function draw() {
  background(150, 178, 205); // color

  // snow on the ground
  noStroke();
  fill(244, 248, 252);
  rect(0, 320, width, 80);

  // LOOP: draw every pine tree using the unique function
  for (let i = 0; i < trees.length; i++) {
    drawPineTree(trees[i].x, 320, trees[i].size);
  }

  // LOOP: draw flake that has already stuck
  noStroke();
  fill(255);
  for (let i = 0; i < stuckSnow.length; i++) {
    circle(stuckSnow[i].x, stuckSnow[i].y, stuckSnow[i].size);
  }

  // LOOP: snowflake that is still falling
  for (let i = 0; i < snow.length; i++) {
    let flake = snow[i];

    // down, sideways and random
    flake.y += flake.speed;
    flake.x += sin(frameCount * flake.sway + flake.offset) * 0.5;

    // CONDITIONAL: while a flake is on a the edge it has a 10% chance to stick. If not, slipping into the triangles.
    if (touchingTree(flake.x, flake.y) && random(1) < 0.1) {
      stuckSnow.push({ x: flake.x, y: flake.y, size: flake.size });
      flake.y = random(-50, 0);
      flake.x = random(width);
    }
    
    // CONDITIONAL: flakes that reach the ground settle slightly into the snow layer 
    else if (flake.y > 318) {
      stuckSnow.push({ x: flake.x, y: random(318, 326), size: flake.size });
      flake.y = random(-50, 0);
      flake.x = random(width);
    }

    // draw the falling flake
    fill(255);
    noStroke();
    circle(flake.x, flake.y, flake.size);
    
    }
    // CONDITIONAL: 
  if (windOn) {
    let gust = noise(frameCount * 0.005);        // slow wandering 0..1
    wind.amp(0.05 + gust * 0.25, 0.1);           // gust volume 
    windFilter.freq(200 + gust * 600);           // freq
  }
  
   // hint in the corner so people know the canvas is clickable
  fill(255);
  noStroke();
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  fill(90, 90, 20);
  if (windOn) {
    text("click to mute wind", width - 8, height - 6);
  } else {
    text("click for wind sound", width - 8, height - 6);
  }
}
 
// user interactive
function mousePressed() {
  userStartAudio(); 
 
  // CONDITIONAL: flip between wind on and wind off
  if (windOn) {
    wind.amp(0, 0.8); // fade out over 0.8 seconds
    windOn = false;
  } else {
    wind.amp(0.2, 0.8); // fade in over 0.8 seconds
    windOn = true;
  }
}

// UNIQUE FUNCTION #1: returns true if the point (x, y) is inside any of the triangles.
function touchingTree(x, y) {
  for (i = 0; i < trees.length; i++) {
    let t = trees[i];
    let topOfTrunk = 320 - t.size * 0.25; // same number drawPineTree uses

    // LOOP: check each of the three triangles of this tree
    for (j = 0; j < layers.length; j++) {
      let L = layers[j];
      let baseY = topOfTrunk - t.size * L.base; 
      let apexY = topOfTrunk - t.size * L.apex; 
      
      // CONDITIONAL: is the point between this layer's apex and base?
      if (y > apexY && y < baseY) {
        // 0 = at the apex, 1 = at the base of THIS layer
        let howFarDown = (y - apexY) / (baseY - apexY);

        // this layer's half-width at that height
        let halfWidth = howFarDown * t.size * L.half;

        if (abs(x - t.x) < halfWidth) {
          return true;
        }
      }
    }
  }
  return false; 
}

// UNIQUE FUNCTION #2: draws pine tree 
function drawPineTree(x, baseY, size) {
  let trunkW = size * 0.15;
  let trunkH = size * 0.25;
  let topOfTrunk = baseY - trunkH;

  // trunk
  noStroke();
  fill(110, 70, 40);
  rect(x - trunkW / 2, topOfTrunk, trunkW, trunkH);

  // LOOP: draw the three green layers from the shared layers data
  fill(40, 110, 60);
  for (j = 0; j < layers.length; j++) {
    let L = layers[j];
    let bY = topOfTrunk - size * L.base; // bottom edge 
    let aY = topOfTrunk - size * L.apex; // apex
    triangle(x - size * L.half, bY, x + size * L.half, bY, x, aY);
  }
}
