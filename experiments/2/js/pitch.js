class PitchDetector {
    constructor(input, oscillator, options) {
        options = this.constructOptions(options);
        this.input = input;
        this.oscillator = oscillator;
        this.length = options.numSamples;
        this.maxFrequency = options.maxFrequency;
        this.minFrequency = options.minFrequency;
        this.lowPassFilter = new Tone.Filter(this.maxFrequency, 'lowpass', -48);
        this.analyser = new Tone.Analyser('waveform', this.length);
        this.input.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.analyser);
        this.sampleRate = Tone.context.sampleRate;
        this.maxSamples = Math.floor(this.length / 2);
        this.correlations = new Array(this.maxSamples);
        this.maxVolume = options.maxVolume;
        this.accuracyThresh = 0.95;
        this.rmsThresh = 0.015;
        this.pitchRampInterval = options.updateInterval;
        this.pitchDivider = 2;
        this.pitch = 0;
        this.pitchIsOn = true;
        this.zeroCounter = 0;
        this.zeroThresh = 2;
        this.autoTune = options.autoTune;
        this.autoTuneFrequencies = [];
        this.autoTunePitchRampInterval = options.autoTuneUpdateInterval;
        this.autoTuneNoteIndexHistory = [];
        this.autoTuneNoteIndexHistorySize = options.autoTuneNoteIndexHistorySize;
        this.autoTuneStableThresh = options.autoTuneStableThresh;
        this.generateAutoTuneLookupTable();
    }
    getPitch() {
        var buf = this.analyser.getValue();
        var best_offset = -1;
        var best_correlation = 0;
        var rms = 0;
        var foundGoodCorrelation = false;
        buf.map(function(b) {
            rms += Math.pow(b, 2);
        });
        rms = Math.sqrt(rms/this.length);
        if (rms < this.rmsThresh) return 0;
        var lastCorrelation = 1;
        var correlation = 0;
        for (var offset = 0, len=this.maxSamples; offset < len; offset++) {
            correlation = 0;
            for (var i=0; i<this.maxSamples; i++) {
                correlation += Math.abs((buf[i])-(buf[i+offset]));
            }
            correlation = 1 - (correlation/this.maxSamples);
            this.correlations[offset] = correlation; // store it, for the tweaking we need to do below.
            if ((correlation>this.accuracyThresh) && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true;
                if (correlation > best_correlation) {
                    best_correlation = correlation;
                    best_offset = offset;
                }
            }
            else if (foundGoodCorrelation) {
                var shift = (this.correlations[best_offset+1] - this.correlations[best_offset-1])/this.correlations[best_offset];
                var retVal = this.sampleRate/(best_offset+(8*shift));
                if (retVal > this.maxFrequency) return 0;
                return retVal;
            }
            lastCorrelation = correlation;
        }
        if (best_correlation > 0.01) {
            var retVal = Math.min(this.sampleRate/best_offset, this.maxFrequency);
            if (retVal > this.maxFrequency) return 0;
            return retVal;
        }
        return 0;
    }
    updatePitch(newPitch) {
        if (newPitch === undefined) {
            newPitch = this.getPitch();
        }
        if (this.autoTune) {
            this.pitch = this.applyAutoTune(newPitch);
        }
        else {
            this.pitch = newPitch;
        }
        if (this.pitch > this.minFrequency && this.pitch < this.maxFrequency) {
            this.pitchIsOn = true;
            this.oscillator.volume.linearRampTo(
                this.maxVolume, this.pitchRampInterval);
            if (this.autoTune) {
                this.oscillator.frequency.linearRampTo(
                this.pitch / this.pitchDivider,
                this.autoTunePitchRampInterval);
            }
            else {
                this.oscillator.frequency.linearRampTo(
                this.pitch / this.pitchDivider,
                this.pitchRampInterval);
            }
        }
        else {
            this.zeroCounter += 1;
        }
        if (this.zeroCounter > this.zeroThresh && this.pitchIsOn) {
            this.pitchIsOn = false;
            this.oscillator.volume.linearRampTo(-100, this.pitchRampInterval);
            this.zeroCounter = 0;
        }
        return this.pitch;
    }
    generateAutoTuneLookupTable() {
        const intervals = [0, 3, 5, 7, 10];
        this.autoTuneFrequencies = [];
        var frequency, note;
        for (var oct=0;oct<8;oct++) {
            for (var int=0;int<intervals.length;int++) {
                note = (oct * 12) + intervals[int];
                frequency = Tone.Frequency.mtof(note);
                this.autoTuneFrequencies.push(frequency);
            }
        }
    }
    applyAutoTune(newPitch) {
        var foundNote = 0;
        for (var i=1,len=this.autoTuneFrequencies.length-1;i<len;i++) {
            if (newPitch > this.autoTuneFrequencies[i-1]) {
                if (newPitch < this.autoTuneFrequencies[i+1]) {
                    foundNote = i;
                    break;
                }
            }
        }
        this.autoTuneNoteIndexHistory.push(foundNote);
        const diff = this.autoTuneNoteIndexHistory.length - this.autoTuneNoteIndexHistorySize;
        if (diff > 0) {
            this.autoTuneNoteIndexHistory = this.autoTuneNoteIndexHistory.slice(diff);
        }
        var isUnstable = this.autoTuneNoteIndexHistory.reduce((total, value) => {
            if (value > 0) {
                return total + (value - foundNote);
            }
            else {
                return total;  // try and ignore the sudden drops to 0hz
            }
        }, 0);
        if (Math.abs(isUnstable) > this.autoTuneStableThresh) {
            return this.pitch;  // don't change the pitch
        }
        else {
            return this.autoTuneFrequencies[foundNote];
        }
    }
    constructOptions(options) {
        var defaultOptions = {
            maxFrequency: 350,
            minFrequency: 40,
            numSamples: 1024,
            updateInterval: 0.005,
            maxVolume: -5,
            autoTune: false,
            autoTuneUpdateInterval: 0.001,
            autoTuneNoteIndexHistorySize: 7,
            autoTuneStableThresh: 2
        }
        if (options === undefined) {
            options = defaultOptions;
        }
        if (options.maxFrequency === undefined) {
            options.maxFrequency = defaultOptions.maxFrequency;
        }
        if (options.minFrequency === undefined) {
            options.minFrequency = defaultOptions.minFrequency;
        }
        if (options.numSamples === undefined) {
            options.numSamples = defaultOptions.numSamples;
        }
        if (options.updateInterval === undefined) {
            options.updateInterval = defaultOptions.updateInterval;
        }
        if (options.maxVolume === undefined) {
            options.maxVolume = defaultOptions.maxVolume;
        }
        if (options.autoTune === undefined) {
            options.autoTune = defaultOptions.autoTune;
        }
        if (options.autoTuneUpdateInterval === undefined) {
            options.autoTuneUpdateInterval = defaultOptions.autoTuneUpdateInterval;
        }
        if (options.autoTuneNoteIndexHistorySize === undefined) {
            options.autoTuneNoteIndexHistorySize = defaultOptions.autoTuneNoteIndexHistorySize;
        }
        if (options.autoTuneStableThresh === undefined) {
            options.autoTuneStableThresh = defaultOptions.autoTuneStableThresh;
        }
        return options;
    }
}
