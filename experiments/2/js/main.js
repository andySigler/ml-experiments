

function addAudioOnOffEvents(button, _onEvent, _offEvent) {
    var onString = "Audio is On";
    var offString = "Audio is Off";
    var isPoweredOn = false;
    var context = undefined;
    var onEvent = function () {
        _onEvent();
        console.log(onString);
        button.innerHTML = onString;
    }
    var offEvent = function () {
        _offEvent();
        console.log(offString);
        button.innerHTML = offString;
    }
    button.addEventListener('click', function() {
        if (!isPoweredOn) {
            isPoweredOn = true;
            if (context === undefined) {
                context = new AudioContext();
                context.resume().then(onEvent);
            }
            else {
                onEvent();
            }
        }
        else {
            isPoweredOn = false;
            offEvent();
        }
    });
}

function setupAudio() {
    var modulator = new Tone.Player();
    modulator.load("http://localhost:8000/experiments/2/sample.mp3");
    var noise = new Tone.Noise('white');
    // source, modulator, output, numFilters, minFreq, maxFreq
    var vocoder = new Vocoder(
        noise, modulator, Tone.Master, 50, 50, 8000);
    var allOn = function() {
        noise.start();
        modulator.start();
    }
    var allOff = function() {
        noise.stop();
        modulator.stop();
    }
    var button = document.getElementById('button');
    addAudioOnOffEvents(button, allOn, allOff);
    return vocoder;
}

var vocoder;

function setup() {
    vocoder = setupAudio();
    vocoder.setGain(10);
    console.log('here');
}

function draw() {
    vocoder.update();
}
