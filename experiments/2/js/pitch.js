class PitchDetector {
    constructor(input, oscillator, numSamples, maxFrequency) {
        this.input = input;
        this.oscillator = oscillator;
        this.length = numSamples;
        this.maxFrequency = maxFrequency;
        this.lowPassFilter = new Tone.Filter(this.maxFrequency, 'lowpass', -48);
        this.analyser = new Tone.Analyser('waveform', this.length);
        this.input.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.analyser);
        this.sampleRate = Tone.context.sampleRate;
        this.maxSamples = Math.floor(this.length/2);
        this.correlations = new Array(this.maxSamples);
    }
    setPitch(val) {
        this.oscillator.volume.linearRampTo(val, )
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
        if (rms < 0.01) return 0;
        var lastCorrelation = 1;
        var correlation = 0;
        var GOOD_ENOUGH_CORRELATION = 0.95; // this is the "bar" for how close a correlation needs to be
        for (var offset = 0, len=this.maxSamples; offset < len; offset++) {
            correlation = 0;
            for (var i=0; i<this.maxSamples; i++) {
                correlation += Math.abs((buf[i])-(buf[i+offset]));
            }
            correlation = 1 - (correlation/this.maxSamples);
            this.correlations[offset] = correlation; // store it, for the tweaking we need to do below.
            if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
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
}
