/*

_____/\\\\\\\\\_______/\\\\\\\\\______/\\\\\\\\\\\\\___        
 ___/\\\\\\\\\\\\\___/\\\///////\\\___\/\\\/////////\\\_       
  __/\\\/////////\\\_\/\\\_____\/\\\___\/\\\_______\/\\\_      
   _\/\\\_______\/\\\_\/\\\\\\\\\\\/____\/\\\\\\\\\\\\\/__     
    _\/\\\\\\\\\\\\\\\_\/\\\//////\\\____\/\\\/////////____    
     _\/\\\/////////\\\_\/\\\____\//\\\___\/\\\_____________   
      _\/\\\_______\/\\\_\/\\\_____\//\\\__\/\\\_____________  
       _\/\\\_______\/\\\_\/\\\______\//\\\_\/\\\_____________ 
        _\///________\///__\///________\///__\///______________


A Playable Tilt Axis Step Sequencer Arpeggiator
M Damager - 2024

Each row in the sequencer corresponds to one of the seven degrees in the western diatonic scale. 
Arp uses phone gyroscope data to shift the tonal center of the sequencer allowing users to create gesturally controlled melodic progressions.
*/

let startButton;
let stopButton;

let notes = [];
let index = 0;

const rowLength = 8;
const numRows = 8;
const grid = [];

let tempoSlider;
let noteLength;
let lengthmulti;

let playing = false

let wave = ["sine","square","triangle","sawtooth"]

let tempo

let scalePos
let tiltPos
let twistPos

let leadgain
let lead
let splash = true
let chord
let scaleDegree

function setup() {

let aspectRatio = 720/1280
let canvasWidth, canvasHeight

if (windowWidth / windowHeight > aspectRatio) {
  canvasWidth = windowHeight * aspectRatio;
  canvasHeight = windowHeight;
} else {
  canvasWidth = windowWidth;
  canvasHeight = windowWidth / aspectRatio;
}
  createCanvas(canvasWidth, canvasHeight);
  createEffects()
  createSynth()

  motionListeners()
  Tone.start();

}

function draw() {

  /*
  Audio context won't trigger unless the user interacts with the page, so a splash screen forces a tap. 
  */
  if (splash){
    background(50);
    fill(100)
    text("START",width/2,height/2)
  }else{
  
   
  background(50);
  tiltMap();//function that maps the phone's tilt to variables that can be plugged into other functions
  effectHandler();//function for changing effect parameters

  lengthmulti = int(map(lSlider.value(),0,100,0,3))//This multiplier is used to dictate the length of each note. The slider values are used to subdivide the note length into quarters of a quarter note.
  noteLength = 60/tempo*(1+lengthmulti)/4 //the maximum length each note can be is a quarter note at whatever tempo is set.

  tempo= int(tempoSlider.value())//sets tempo and passes that to Tone.js
  Tone.Transport.bpm.value = tempo

  scalePos = int(map(tiltPos, 0, height, 1, 6))//Maps the tilt position of the phone to the selected scale. 

//DECORATIONS
  textSize(width*0.1*2)
  stroke(180)
  textSize(width*0.05)
  stroke(80)
  textSize(width*0.025)
  text("BPM "+tempo,width*0.725,height*0.97)
  line(width*0.1,height*0.925,width*0.8,height*0.925)
  updatePattern()
  fill(100)
  noStroke()
  text("gain",width*0.12,height*0.525)
  text("vibe",width*0.12,height*0.575)
  text("octave",width*0.12,height*0.625)
  text("port",width*0.12,height*0.675)
  text("wave",width*0.12,height*0.725)
  text("leng",width*0.12,height*0.775)
  textSize(500)
  fill(200,20)
  text("arp",width*0.05,height*0.3)
  textSize(50)
  text(chord,width*0.875,height*0.075)

  //PLAYHEAD

  let playheadX = map(index, 0, rowLength, width * 0.073, width * 0.875);//used to denote which beat the sequencer is on
  strokeWeight(5);
  strokeCap(SQUARE)
  stroke(255, 50); 
  noFill();
  ellipse(playheadX, height * 0.02,height*0.01);
  strokeWeight(20)
  strokeWeight(2);
  stroke(40);

//SLIDERPANEL

//loop for creating panels with the illusion of depth. It draws 8 rectangles that decrease in size and move down slightly with each iteration.
for(let i = 0; i<8;i++){
rect(width*0.085,height*0.47+i*5,width*0.7,height*0.34-i*2,20)
}
}
}


//This function checks the scalePos value (dictated by the phone tilt) and sets the scale mode of the sequencer.
function updatePattern() {
  if (scalePos === 1) {
    notes = ["A3","B3","C4","D4","E4","F4","G4","A4"];
    scaleDegree = "vi"
    chord = "Amin"
  } else if (scalePos === 2){
    notes = ["C4", "D4", "E4","F4","G4","A4","B4","C5"];
    scaleDegree = "I"
    chord = "Cmaj"
  } else if (scalePos === 3){
    notes = ["D4", "E4","F4","G4","A4","B4","C5","D5"];
    scaleDegree = "ii"
    chord = "Dmin"
  } else if (scalePos === 4){
    notes = ["E4","F4","G4","A4","B4","C5","D5","E5"];
    scaleDegree = "iii"
    chord = "Emin"
  } else if (scalePos === 5){
    notes = ["F4","G4","A4","B4","C5","D5","E5","F5"];
    scalePos = "IV"
    chord = "F Maj"
  } else if (scalePos === 6){
    notes = ["G4","A4","B4","C5","D5","E5","F5","G5"];
    scalePos = "V"
    chord = "Gmaj"
  }else if (scalePos === 7){
    notes = ["A4","B4","C5","D5","E5","F5","G5","A5"];
    scalePos = "vi"
    chord = "A min"
  }else if (scalePos === 8){
    notes = ["C5", "D5", "E5","F5","G5","A5","B5","C6"];
    scaleDegree = "I"
    chord = "Cmaj"
  } else if (scalePos === 9){
    notes = ["D5", "E5","F5","G5","A5","B5","C6","D6"];
    scaleDegree = "ii"
    chord = "Dmin"
  } else if (scalePos === 10){
    notes = ["E6","F6","G6","A6","B6","C6","D6","E6"];
    scaleDegree = "iii"
    chord = "Emin"
}
}

//functions for controlling the playback of the sequencer in tone.js
function startTransport() {
  if(!playing){
  Tone.start();
  Tone.Transport.start();
  playing = true
  }
}
function stopTransport() {
  if(playing){
  Tone.Transport.stop();
  playing = false
  }
}


//assigns gyroscope data to variables
function deviceTurnedHandler(event){
  frontToBack = event.beta; 
  leftToRight = event.gamma; 
}


//motion listeners read phone gyroscope data
function motionListeners(){
    if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    askButton = createButton('Permission');
    askButton.mousePressed(handlePermissionButtonPressed);
  }else{
    
  
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
}

function tiltMap(){

//maps gyroscope data to screen size
 tiltPos = constrain(map(frontToBack, -60,120,0,height),0,height);
twistPos = constrain(map(leftToRight, -45,45,0,width),0,3);
 
 //draws the keys
  noFill()
   for(let i = 0; i<11; i++){
    push()
      stroke(200,50)
      rect(width*0.85,height*0.1*i,width*0.2,height*0.1)
      fill(45)
      rect(width*0.85+10,height*0.1*i,width*0.2,height*0.1)
    pop()
  }
  textSize(15);
  fill(255,50)

  //indicator for the tilt/twist positions
  circle(twistPos+width*0.92,tiltPos,50)
 
}


function createSynth() {

  //create monophonic AM synthesizer
  lead = new Tone.AMSynth({
    harmonicity: 3,
    modulationIndex: 10,
    detune: 0, 
    oscillator: {type: "sine"},
    envelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 1,
      release: 0.3
    },
    portamento: 0.01
  });

//create gain node
leadGain = new Tone.Gain(0.3)


//attach synth to gain node
lead.connect(leadGain)
//attach gain node to vibrato node
leadGain.connect(vib); 
//vibrato goes into hipass filter
vib.connect(hiPass) 
//hipass goes into the reverb
hiPass.connect(verb) 
//reverb connects to master output.
verb.connect(Tone.Master); 
 
}

//function for creating the effect nodes within tone.js
function createEffects(){

  hiPass = new Tone.Filter(); //filter that only passes frequencies within a certain value range to the speakers
  trem = new Tone.Tremolo();//tremelo fluctuates signal volume
  vib = new Tone.Vibrato();//vibrato fluctuates signal pitch
  chorus = new Tone.Chorus();//chorus doubles the signal and detunes it slightly against the original. 
  verb = new Tone.JCReverb();//reverb is sound reverberating off of surfaces. 
}

function mousePressed(){
if(splash){

  //create buttons for transport and sliders to control effects parameters. 
  startButton = createButton("START");
  startButton.position(width*0.2,height*0.85)
  startButton.size(width*0.2,height*0.05)
  stopButton = createButton("STOP");
  stopButton.position(width*0.5,height*0.85)
  stopButton.size(width*0.2,height*0.05)
  startButton.mousePressed(startTransport);
  stopButton.mousePressed(stopTransport);
  

  tempoSlider = createSlider(20,500,120);//INIT at 120BPM
  tempoSlider.position(width*0.1,height*0.97)
  tempoSlider.size(width*0.6)

  sGain = createSlider(0,50,25);//sGain is used to control the synth volume. 
  sGain.position(width*0.2,height*0.525)
  sGain.size(width*0.5)

  vDepth = createSlider(0,100,0);//vDepth controls the depth of the vibrato
  vDepth.position(width*0.2,height*0.575)
  vDepth.size(width*0.5)

  dTun = createSlider(-3,3,0);//dTun is used to change the octave of the selected notes. it has a seven octave range
  dTun.position(width*0.2,height*0.625)
  dTun.size(width*0.5)

 pKnob = createSlider(0,100,0);//used to control portamento speed
 pKnob.position(width*0.2,height*0.675)
 pKnob.size(width*0.5)

  wSlider = createSlider(0,3,0);//used to control the waveform of the oscillator, which are held in a table. 
  wSlider.position(width*0.2,height*0.725)
  wSlider.size(width*0.5)

  lSlider = createSlider(0,100,0);//used to control the note length
  lSlider.position(width*0.2,height*0.775)
  lSlider.size(width*0.5)
  
  splash = false



  synthMaker()//generates synths
}
}


function effectHandler(){

  //normalises effect slider values to useable numbers

  let gainKnob = map(sGain.value(),0,100,0,1)//puts the gain knob to a range between 0 and 1. I shrank the input range of the slider value to half because the gain node was too loud at 100%.
  let vibDepth = map(vDepth.value(),0,100,0,0.5)//vibrato depth is limited to maximum 50% blend of wet and dry signal. 
  let portaKnob = map(pKnob.value(),0,100,0,0.3)//portamento is limited to 0.3seconds
  let detuner = dTun.value()//octave selecter
  let wavenum = wSlider.value()//updates selected waveform variable
  lead.oscillator.type = wave[wavenum]//selects waveform
  leadGain.gain.value = gainKnob//volume

  vib.depth.value = vibDepth//vibrato

  lead.detune.value = 1200*detuner//offsets frequency values by multiples of 1200 cents (one octave)
  lead.portamento = portaKnob//portamento
}

function synthMaker(){

  //creates a time based tone JS loop. it checks to see if any of a grid of checkboxes is armed and passes a corresponding note length, value and time offset to the synth.
  const loop = new Tone.Loop((time) => {
    for (let i = 0; i < numRows; i++) {
      let currentRow = grid[i];
      let currentBox = currentRow[index];
      let note = notes[i];
      if (currentBox.checked()) {
        lead.triggerAttackRelease(note, noteLength, time);
      }
    }
    index++;
    if (index > rowLength - 1) {
      index = 0;
    }
  }, "8n").start(0);

  //loop that creates the grid of checkboxes
  for (let j = 0; j < numRows; j++) {
    const row = [];
    for (let i = 0; i < rowLength; i++) {
      const cb = createCheckbox();
      cb.position(i * width*0.1+50, j * height*0.05+height*0.05);
      row.push(cb);
    }
    grid.push(row);
  }

}



