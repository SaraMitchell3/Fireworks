/* It is recommended that the programme be used with headphones so that sound coming from the speakers
doesn't interfere with the rest of the functions. */

var canon;
var fireworks = [];
var gravity;
var particles = [];
var vol;
var thresholdTop = 0.05;
var thresholdBottom = 0.04;
var playing = false;
var sliderVol;
var sliderPan;
var sliderRate;
var playButton;

function preload() {
 canon = loadSound("canon.mp3"); // Background track, controlled by sliders.
}

function setup() {

  createCanvas(3700, 2100);

  colorMode(HSB);

  img = loadImage("bg.jpg")
  img.resize(800, 600);
  // canon = loadSound("canon.mp3"); // Background track, controlled by sliders.

  // Transparency of background to leave a trail
  image(img, 0, 0);
  tint(255, 120);
  image(img, 50, 0);

  gravity = createVector(0, 0.1); // Downwards force (positive)

  mic = new p5.AudioIn();
  mic.start();

  // Sliders
  sliderVolume = createSlider(0, 1, 0.5, 0.01);
  sliderVolume.position(25, 150);

  sliderPan = createSlider(-1, 1, 0, 0.01);
  sliderPan.position(25, 250);

  sliderRate = createSlider(0, 2, 1, 0.01);
  sliderRate.position(25, 350);

  // Play/Pause button
  playButton = createButton("Play");
  playButton.position(25, 50);
  playButton.mousePressed(startStop);

  function startStop() {

    if (!canon.isPlaying()) {
      canon.play();
      playButton.html("Pause");
    } else {
      canon.pause();
      playButton.html("Play");
    }
  }

}

function draw() {

  background(img);

  // Slider labels
  push();
  colorMode(RGB);
  strokeWeight(0);
  fill(255, 145, 0); // Orange
  textSize(12);
  text('Volume', 25, 140);
  text('Pan', 25, 240);
  text('Rate', 25, 340);
  pop();

  // Track loop
  if (canon.currentTime() > 19.95) {
    canon.jump(0);
  }

  // Display sliders
  canon.setVolume(sliderVolume.value());
  canon.pan(sliderPan.value());
  canon.rate(sliderRate.value());

  var vol = mic.getLevel();
  println(vol);

  // Determines when a new firework is created depending on mic input
  if (vol > thresholdTop && !playing) {
    fireworks.push(new Firework());
    playing = true;
  }

  if (vol < thresholdBottom) {
    playing = false;
  }

  for (var i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].run();
    fireworks[i].display();
    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}

// Functions //

function Particle(x, y, colour, burst) {

  var vol = mic.getLevel();

  this.pos = createVector(x, y);
  this.colour = colour;
  this.burst = burst;
  this.duration = 255;

  //Type of explosion
  if (this.burst) {
    this.vel = createVector(0, random(-6, -11)); // Upwards force
  } else if (vol < 0.04) {
    this.vel = p5.Vector.random2D(); // Unit vectors
    this.vel.mult(map(vol, 0, 1, 0.5, 5)); // Ellipse width, depends on volume
  } else if (vol >= 0.04) {
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 5)); // Firework instead of ellipse
  }
  this.acc = createVector(0, 0);

  this.applyForce = function(force) { // Adds force to acceleration for more realistic movement
    this.acc.add(force);
  }

  this.run = function() { // Add velocity to position, and acceleration to velocity
    if (!this.burst) {
      this.vel.mult(0.97);
      this.duration -= 2;
    }
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0); // Clear acceleration for each new particle
  }

  this.display = function() {
    if (!this.burst) {
      strokeWeight(random(1, 3));
      stroke(colour, 255, 255, this.duration);
    } else {
      strokeWeight(random(3, 5));
      stroke(colour, 255, 255);
    }
      point(this.pos.x, this.pos.y); // Initial particle
  }
  
  this.done = function() {
    if (this.duration < 0) {
      return true;
    } else {
      return false;
    }
  }
}

function Firework() { // Keeps track of an array of particles

  var gravity = createVector(0, 0.1); // Downwards force

  this.colour = random(255);
  this.firework = new Particle(random(width), height, this.colour, true);
  this.exploded = false;
  this.particles = []; // Array of particles after explosion for this.explode function

  this.run = function() {

    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.run();
      if (this.firework.vel.y >= 0) { // Explode when particle reaces peak position
        this.exploded = true;
        this.explode();
      }
    }
    // Applies forces to the new particles
    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].run();
      if (this.particles[i].done()) { // Prevents frameRate from slowing down
        this.particles.splice(i, 1);
      }
    }

    this.explode = function() { // Creates 100 new particles once the original one has exploded
      for (var i = 0; i < 100; i++) {
        var p = new Particle(this.firework.pos.x, this.firework.pos.y, this.colour, false);
        this.particles.push(p);
      }
    }
  }

  this.display = function() {
    if (!this.exploded) {
      this.firework.display();
    }
    // Displays new particles
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].display();
    }
  }
  
  this.done = function() {
    if (this.exploded && this.particles.length === 0) {
      return true;
    } else {
      return false;
    }
  }
}
