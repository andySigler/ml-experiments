function generateAudioNodes() {
    // create the carrier signal's oscillator sources (noise and pulse)
    // white noise
    console.log('creating audio nodes');
    var cuttoutFrequency = 1000;
    var noiseSource = new Tone.Noise('white');
    noiseSource.volume.value = 0;
    // only allow HIGH frequencies from white noise
    var noiseHighpass = new Tone.Filter(
        cuttoutFrequency,
        'highpass',
        -12             // -12db, -24db, or -48db
    );
    noiseSource.connect(noiseHighpass);
    // and also, a pulse with flat frequency responds
    var pulseSource = new Tone.PulseOscillator(0, 0.05);
    // below is a weird thing that seems to avoid a crazy noise on load
    pulseSource.volume.value = -100;
    pulseSource.start();
    setTimeout(() => {
        pulseSource.volume.value = 0;
        pulseSource.stop();
    }, 1);
    // only allow LOW frequencies from pulse oscillator
    var pulseLowpass = new Tone.Filter(
        cuttoutFrequency,
        'lowpass',
        -12             // -12db, -24db, or -48db
    );
    pulseSource.connect(pulseLowpass);
    // the vocoder's carrier signal is the combination of noise and pulse
    var carrier = new Tone.Volume(0);
    noiseHighpass.connect(carrier);
    pulseLowpass.connect(carrier);
    // the vocoder's modulator signal is mp3 file
    modulator = new Tone.Player();
    // the vocoder can (optionally) change the oscillator's pitch
    var pitchDetector = new PitchDetector(modulator, pulseSource);
    // create the vocoder
    var vocoder = new Vocoder(
        carrier,         // carrying audio source
        modulator,       // modulating audio source
        pitchDetector,   // (optional) pitch detect/control
        Tone.Master      // output audio node
    );
    // I found the vocoder's output needs some gain
    vocoder.setGain(20);
    // functions for turning on/off these audio nodes
    // don't include vocoder on/off, since that requires more context
    var eventAudioOn = () => {
        noiseSource.start();
        pulseSource.start();
        carrier.volume.value = 0;
        if (modulator.buffer._buffer) modulator.start();
    };
    var eventAudioOff = () => {
        noiseSource.stop();
        pulseSource.stop();
        carrier.volume.value = -100;
        if (modulator.buffer._buffer) modulator.start();
    };
    return {
        events: {
            on: eventAudioOn,
            off: eventAudioOff
        },
        vocoder: vocoder,
        carrier: carrier,
        modulator: modulator,
        pitchDetector: pitchDetector,
        pulseSource: pulseSource,
        noiseSource: noiseSource
    }
}
