class FilterBand {
    constructor(input, output, frequencies, options) {
        this.frequencies = frequencies.slice();
        this.length = this.frequencies.length;
        this.filters = [];
        this.volumes = [];
        this.outputVolume = undefined;
        this.meters = [];
        this.input = input;
        this.output = output;
        this.generateNodes(options);
        this.connectNodes(options);
    }
  generateNodes(options) {
    if (this.output) {
        this.outputVolume = new Tone.Volume(0);
    }
    for (var i=0;i<this.length;i++) {
        this.filters[i] = new Tone.Filter(
            this.frequencies[i],
            'bandpass',
            options.filterRolloff
        );
        if (this.output) {
            this.volumes[i] = new Tone.Volume(0);
            this.volumes[i].volume.value = 0;
        }
        else {
            this.meters[i] = new Tone.Meter();
        }
    }
  }
  connectNodes(options) {
    if(this.output) {
        this.outputVolume.connect(this.output);
    }
    for (var i=0;i<this.length;i++) {
        this.input.connect(this.filters[i]);
        if (this.output) {
            this.filters[i].connect(this.volumes[i]);
            this.volumes[i].connect(this.outputVolume);
        }
        else {
            this.filters[i].connect(this.meters[i]);
        }
    }
  }
  setBands(newSpectrum) {
    for (var i=0, len=this.length; i<len; i++) {
        this.volumes[i].volume.value = newSpectrum[i];
    }
  }
  getBands(minDecibels) {
    if (minDecibels === undefined) {
        minDecibels = -100;
    }
    var retVal = [];
    for (var i=0, len=this.length; i<len; i++) {
        retVal[i] = Math.max(this.meters[i].getLevel(), minDecibels);
    }
    return retVal;
  }
}


class Vocoder {
    constructor(source, modulator, output, options) {
        this.vocoderSetDefaultOptions(options);
        this.frequencies = this.generateFrequencies();
        this.length = this.frequencies.length;
        this.carrier = new FilterBand(
            source, output, this.frequencies, this.options);
        this.modulator = new FilterBand(
            modulator, undefined, this.frequencies, this.options);
        this.isRecording = false;
        this.recordBuffer = [];
        this.setCarrierQ();
        this.setModulatorQ();
        this.setGain();
    }
    update() {
        const spectrum = this.modulator.getBands(this.options.minDecibels);
        this.carrier.setBands(spectrum);
        return spectrum;
    }
    stop() {
        if (this.eventID >= 0) {
            Tone.Transport.stop();
            Tone.Transport.clear(this.eventID);
            this.eventID = undefined;
            var retVal = this.recordBuffer.slice();
            this.recordBuffer = [];
            return retVal;
        }
    }
    start(isRecording) {
        var v = this;
        var createUpdateScheduleEvent = function() {
            if (isRecording) {
                v.recordBuffer = [];
                return function(time) {
                    v.recordBuffer.push(v.update());
                };
            }
            else {
                return function(time) {
                    v.update();
                };
            }
        }
        this.eventID = Tone.Transport.scheduleRepeat(
            createUpdateScheduleEvent(),
            this.options.updateInterval
        );
        Tone.Transport.start();
    }
    setGain(decibels) {
        if (decibels === undefined) decibels = this.options.gain;
        else this.options.gain = decibels;
        this.carrier.outputVolume.volume.value = this.options.gain;
    }
    setCarrierQ(Q) {
        if (Q === undefined) Q = this.options.carrierQ;
        else this.options.carrierQ = Q;
        for (var i=0, len=this.carrier.length;i<len;i++) {
            this.carrier.filters[i].Q.value = this.options.carrierQ;
        }
    }
    setModulatorQ(Q) {
        if (Q === undefined) Q = this.options.modulatorQ;
        else this.options.modulatorQ = Q;
        for (var i=0, len=this.modulator.length;i<len;i++) {
            this.modulator.filters[i].Q.value = this.options.modulatorQ;
        }
    }
    getFrequencies() {
        return this.modulator.filters.map(function(filter) {
            return filter.frequency.value
        });
    }
    generateFrequencies() {
        var frequencies = [];
        var count = 0;
        while (frequencies.length == 0 || frequencies[frequencies.length - 1] < this.options.maxFreq) {
            frequencies[count] = Math.pow(2, count / 4) * 10;
            count += 1;
        }
        if (frequencies.length > this.options.maxBands) {
            frequencies = frequencies.slice(
                frequencies.length - this.options.maxBands);
        }
        return frequencies;
    }
    vocoderSetDefaultOptions(options) {
        const vocoderDefaultOptions = {
            gain: 0,
            updateInterval: 1 / 64,     // seconds (0.015625)
            filterRolloff: -48,         // -12db, -24db, or -48db
            carrierQ: 10,                 // must be >= 1
            modulatorQ: 10,                 // must be >= 1
            maxBands: 32,
            maxFreq: 15000,
            minDecibels: -100,
        };
        if (options === undefined) {
            options = vocoderDefaultOptions;
        }
        if (!options.gain) {
            options.gain = vocoderDefaultOptions.gain;
        }
        if (!options.maxFreq) {
            options.maxFreq = vocoderDefaultOptions.maxFreq;
        }
        if (!options.maxBands) {
            options.maxBands = vocoderDefaultOptions.maxBands;
        }
        if (!options.updateInterval) {
            options.updateInterval = vocoderDefaultOptions.updateInterval;
        }
        if (!options.filterRolloff) {
            options.filterRolloff = vocoderDefaultOptions.filterRolloff;
        }
        if (!options.carrierQ) {
            options.carrierQ = vocoderDefaultOptions.carrierQ;
        }
        if (!options.modulatorQ) {
            options.modulatorQ = vocoderDefaultOptions.modulatorQ;
        }
        if (!options.minDecibels) {
            options.minDecibels = vocoderDefaultOptions.minDecibels;
        }
        this.options = options;
    }
}
