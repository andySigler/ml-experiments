function buttonOnOffEvents(button, onCallback, offCallback) {
    console.log('Create On/Off Button');
    button.disabled = true;
    var onString = "Audio is On";
    var offString = "Audio is Off";
    var isPoweredOn = false;
    var context = undefined;
    button.onEvent = function () {
        isPoweredOn = true;
        console.log(onString);
        button.innerHTML = onString;
        if (button.recordStopDelayTime > 0) {
            if (button.offDelay) clearTimeout(button.offDelay);
            button.offDelay = setTimeout(function() {
                button.offEvent();
            }, button.recordStopDelayTime * 1000);
        }
        onCallback();
    }
    button.offEvent = function () {
        isPoweredOn = false;
        if (button.offDelay) clearTimeout(button.offDelay);
        console.log(offString);
        button.innerHTML = offString;
        offCallback();
    }
    button.addEventListener('click', function() {
        if (!isPoweredOn) {
            if (context === undefined) {
                context = new AudioContext();
                context.resume().then(button.onEvent);
            }
            else {
                button.onEvent();
            }
        }
        else {
            button.offEvent();
        }
    });
    button.isSetup = true;
}

function loadVoice(playerInstance, voiceName, button) {
    button.offEvent();
    console.log('loading audio file...');
    var baseURL = window.location.href;
    if (baseURL[baseURL.length - 1] !== '/') {
        baseURL += '/';
    }
    var dataFolderURL = baseURL + 'data/';
    var mp3URL = dataFolderURL + voiceName + '.mp3';
    button.disabled = true;
    button.innerHTML = 'Loading...';
    var buffer = new Tone.Buffer(mp3URL, function() {
        console.log('Done Loading', mp3URL);
        playerInstance.buffer = buffer.get();
        button.recordStopDelayTime = buffer.duration;
        button.disabled = false;
        button.innerHTML = 'Audio Loaded';
        document.getElementById('voiceName').innerHTML = voiceName;
    }, function(e) {
        console.log('error loading', mp3URL);
        console.log(e);
    });
}

function setupAudio() {

    var cuttoutFrequency = 1000;

    var noiseSource = new Tone.Noise('white');
    noiseSource.volume.value = 0;
    var noiseHighpass = new Tone.Filter(
        cuttoutFrequency,
        'highpass',
        -12             // -12db, -24db, or -48db
    );
    noiseSource.connect(noiseHighpass);

    var pulseSource = new Tone.PulseOscillator(0, 0.4);
    document.getElementById('frequencyRange').addEventListener('input', function(e) {
        document.getElementById('frequencyDisplay').innerHTML = this.value + 'Hz';
        pulseSource.frequency.value = this.value;
    });
    pulseSource.volume.value = -100;
    pulseSource.start();
    // this seems to avoid that crazy noise on load
    setTimeout(function(){
        pulseSource.volume.value = 0;
        pulseSource.stop();
    }, 1);
    var pulseLowpass = new Tone.Filter(
        cuttoutFrequency,
        'lowpass',
        -12             // -12db, -24db, or -48db
    );
    pulseSource.connect(pulseLowpass);

    var carrier = new Tone.Volume(0);
    noiseHighpass.connect(carrier);
    pulseLowpass.connect(carrier);
    var modulator = new Tone.Player();

    var pitchDetector = new PitchDetector(modulator, pulseSource, 1024, 350);

    var vocoder = new Vocoder(carrier, modulator, pitchDetector, Tone.Master, {
        gain: 0,
        updateInterval: 1 / 64,     // seconds (0.015625)
        filterRolloff: -48,         // -12db, -24db, or -48db
        carrierQ: 8,               // must be >= 1
        modulatorQ: 8,             // must be >= 1
        maxBands: 31,
        maxFreq: 15000,
        minDecibels: -100
    });
    var button = document.getElementById('button');
    if (!button.isSetup) {
        buttonOnOffEvents(button, function() {
            // ON state
            noiseSource.start();
            pulseSource.start();
            carrier.volume.value = 0;
            modulator.start();
            var pitchChangeCounter = 0;
            var pitchChangeInterval = 2;
            var pitchRampInterval = 1 / 64;
            vocoder.start(true);
        }, function() {
            // OFF state (called automatically during init)
            noiseSource.stop();
            pulseSource.stop();
            carrier.volume.value = -100;
            modulator.stop();
            console.log(vocoder.stop());
        });
    }
    loadVoice(modulator, 'david_long', button);
    return vocoder;
}

var vocoder, analyser;

window.addEventListener('load', (event) => {
    vocoder = setupAudio();
    vocoder.setGain(20);
});

function q(newQ) {
    vocoder.setCarrierQ(newQ);
    vocoder.setModulatorQ(newQ);
}
