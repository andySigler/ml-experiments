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
            this.volumes[i].volume.value = -100;
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
  setBands(newSpectrum, time) {
    if (time === undefined) {
        time = 0;
    }
    for (var i=0, len=this.length; i<len; i++) {
        this.volumes[i].volume.linearRampTo(newSpectrum[i], time);
    }
  }
  getBands(minDecibels) {
    if (minDecibels === undefined) {
        minDecibels = -100;
    }
    var retVal = [];
    for (var i=0, len=this.length; i<len; i++) {
        retVal[i] = Math.min(Math.max(this.meters[i].getLevel(), minDecibels), 0);
    }
    return retVal;
  }
}


class Vocoder {
    constructor(carrier, modulator, pitchDetector, output, options) {
        this.vocoderSetDefaultOptions(options);
        this.frequencies = this.generateFrequencies();
        this.length = this.frequencies.length;
        this.carrier = new FilterBand(
            carrier, output, this.frequencies, this.options);
        this.modulator = new FilterBand(
            modulator, undefined, this.frequencies, this.options);
        this.isRecording = false;
        this.recordBuffer = [];
        this.setCarrierQ();
        this.setModulatorQ();
        this.setGain();
        this.pitchDetector = pitchDetector;
        this.dataArray = undefined;
        this.decoder = undefined;
        this.currentDecoderStep = 0;
        this.currentDecoderStepThresh = 2;
        this.currentDecoderSample = 0;
        this.currentDecoderSampleStep = 1;
        this.decoderStepAmount = tf.tensor1d([0, 0], 'float32');
        this.decoderInput = this.decoderStepAmount;
        this.decoderOutput = undefined;
        this.decoderInputStep = tf.tensor1d([0, 0], 'float32');
        this.decoderTarget = this.decoderInput;
    }
    setCarrierFromModulator() {
        // use the modulator spectrum to set the carrier filters
        const spectrum = this.modulator.getBands(this.options.minDecibels);
        this.carrier.setBands(spectrum, this.options.updateInterval * 0.75);
        return spectrum;
    }
    setCarrierFromData(dataLine) {
        this.carrier.setBands(dataLine, this.options.updateInterval * 0.75);
    }
    convertTensorToSample(guess) {
        if (guess.shape.length == 1) guess = tf.expandDims(guess, 0);
        else if (guess.shape.length == 3) guess = tf.squeeze(guess, 0);
        var pitchGuess = guess.slice([0, 0], [1, 1]);
        pitchGuess = tf.mul(pitchGuess, 1000.0);
        var spectrumGuess = guess.slice([0, 1], [1, guess.shape[1] - 1]);
        spectrumGuess = tf.sub(tf.mul(spectrumGuess, 100.0), 100.0);
        return {
            pitch: pitchGuess.arraySync()[0][0],
            spectrum: spectrumGuess.arraySync()[0]
        }
    }
    startMP3(isRecording) {
        this.isRecording = isRecording;
        var self = this;
        var createUpdateScheduleEvent = function() {
            if (self.isRecording) {
                self.recordBuffer = [];
                return function() {
                    const spectrum = self.setCarrierFromModulator();
                    // for now, I'm always make the 0th element a pitch
                    // default value is 0 (if not doing any pitch detection)
                    var pitch = 0;
                    if (self.pitchDetector) {
                        pitch = self.pitchDetector.updatePitch();
                    }
                    spectrum.unshift(pitch);  // record 32 items
                    self.recordBuffer.push(spectrum);
                };
            }
            else {
                return function() {
                    const spectrum = self.setCarrierFromModulator();
                    // update the pitch detector
                    if (self.pitchDetector) self.pitchDetector.updatePitch();
                };
            }
        }
        this.runEventOnTransport(createUpdateScheduleEvent());
    }
    stopMP3() {
        this.stopTransport();
        if (this.isRecording) {
            this.isRecording = false;
            var retVal = this.recordBuffer.slice();
            this.recordBuffer = [];
            return retVal;
        }
    }
    startDataPlayback() {
        this.currentDataLine = 0;
        var self = this;
        var createUpdateScheduleEvent = function() {
            return function() {
                const dataLine = self.dataArray[self.currentDataLine];
                self.setCarrierFromData(dataLine.spectrum);
                // update the pitch detector
                if (self.pitchDetector) {
                    self.pitchDetector.updatePitch(dataLine.pitch);
                }
                self.currentDataLine += 1;
                self.currentDataLine %= self.dataArray.length;
            };
        }
        this.runEventOnTransport(createUpdateScheduleEvent());
    }
    stopDataPlayback() {
        this.stopTransport();
    }
    setTargetLatentState(newTarget) {
        this.decoderInputStep = tf.div(
            tf.sub(newTarget, this.decoderInput),
            this.currentDecoderStepThresh);
        this.currentDecoderStep = 0;
    }
    getTargetLatentState() {
        return this.decoderTarget.clone();
    }
    updateSlidingLatentState() {
        if (this.currentDecoderStep < this.currentDecoderStepThresh) {
            this.decoderInput = tf.add(
                this.decoderInput, this.decoderInputStep);
            this.decoderOutput = this.decoder.predict(this.decoderInput.expandDims(0));
            const data = this.convertTensorToSample(this.decoderOutput);
            this.setCarrierFromData(data.spectrum);
            if (this.pitchDetector) {
                this.pitchDetector.updatePitch(data.pitch);
            }
            this.currentDecoderStep += 1;
        }
    }
    startDecoderPlayback() {
        const self = this;
        this.runEventOnTransport(() => {
            self.updateSlidingLatentState();
        });
    }
    stopDecoderPlayback() {
        this.stopTransport();
    }
    runEventOnTransport(event) {
        this.stopTransport();
        this.eventID = Tone.Transport.scheduleRepeat(
            event,
            this.options.updateInterval
        );
        Tone.Transport.start();
    }
    stopTransport() {
        if (this.eventID >= 0) {
            Tone.Transport.stop();
            Tone.Transport.clear(this.eventID);
            this.eventID = undefined;
        }
    }
    printRecordedTime() {
        var printString = '';
        const sampleLength = this.recordBuffer.length;
        var numMinutes = (sampleLength * this.options.updateInterval) / 60;
        printString =  String(numMinutes);
        printString += ' min (';
        printString += String(sampleLength);
        printString += ' samples)';
        console.log(printString);
    }
    getRecordedSeconds() {
        return this.recordBuffer.length * this.options.updateInterval;
    }
    getRecordedSamples() {
        return this.recordBuffer.length;
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
            updateInterval: 1 / 100, // seconds (0.015625)
            filterRolloff: -48,     // -12db, -24db, or -48db
            carrierQ: 8,            // must be >= 1
            modulatorQ: 8,          // must be >= 1
            maxBands: 31,           // 0th element is pitch, making 32 total
            maxFreq: 15000,
            minDecibels: -100
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
