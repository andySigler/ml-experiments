function buttonOnOffEvents(button, onCallback, offCallback) {
    console.log('Create On/Off Button');
    var onString = "Audio is On";
    var offString = "Audio is Off";
    var isPoweredOn = false;
    var context = undefined;
    var buttonOnEvent = function () {
        onCallback();
        console.log(onString);
        button.innerHTML = onString;
    }
    var buttonOffEvent = function () {
        offCallback();
        console.log(offString);
        button.innerHTML = offString;
    }
    button.addEventListener('click', function() {
        if (!isPoweredOn) {
            isPoweredOn = true;
            if (context === undefined) {
                context = new AudioContext();
                context.resume().then(buttonOnEvent);
            }
            else {
                buttonOnEvent();
            }
        }
        else {
            isPoweredOn = false;
            buttonOffEvent();
        }
    });
    buttonOffEvent();
}

function setupAudio() {
    var modulator = new Tone.Player();
    var carrier = new Tone.Noise('white');
    var vocoder = new Vocoder(carrier, modulator, Tone.Master, {
        gain: 0,
        updateInterval: 1 / 64,     // seconds (0.015625)
        filterRolloff: -48,         // -12db, -24db, or -48db
        carrierQ: 10,               // must be >= 1
        modulatorQ: 10,             // must be >= 1
        maxBands: 32,
        maxFreq: 15000,
        minDecibels: -100,
    });
    var button = document.getElementById('button');
    var allOn = function() {
        carrier.start();
        modulator.start();
        vocoder.start(true);
    }
    var allOff = function() {
        carrier.stop();
        modulator.stop();
        console.log(vocoder.stop());
    }
    console.log('loading audio file...');
    modulator.load(
        "http://localhost:8000/experiments/2/sample.mp3",
        () => {buttonOnOffEvents(button, allOn, allOff);}
    );
    return vocoder;
}

var vocoder;

window.addEventListener('load', (event) => {
    vocoder = setupAudio();
    vocoder.setGain(20);
});

function q(newQ) {
    vocoder.setCarrierQ(newQ);
    vocoder.setModulatorQ(newQ);
}
