const filterBandRolloff = -48;  // -12, -24, or -48
const filterBandQ = 10; // >=1

class FilterBand {
  constructor(input, output, numFilters, minFreq, maxFreq) {
    this.length = numFilters;
    this.filters = [];
    this.volumes = [];
    this.meters = [];
    this.input = input;
    this.output = output;
    this.generateNodes(minFreq, maxFreq);
    this.connectNodes();
  }
  generateNodes(minFreq, maxFreq) {
    const fStep = (maxFreq - minFreq) / (this.length / 1);
    console.log('Frequency Spread:', fStep);
    for (var i=0;i<this.length;i++) {
        this.filters[i] = new Tone.Filter(
          minFreq + (fStep * i),
          'bandpass',
          filterBandRolloff
        );
        this.filters[i].Q.value = filterBandQ;
        if (this.output) {
          this.volumes[i] = new Tone.Volume(0);
          this.volumes[i].volume.value = 0;
        }
        else {
          this.meters[i] = new Tone.Meter();
        }
    }
  }
  connectNodes() {
    for (var i=0;i<this.length;i++) {
      this.input.connect(this.filters[i]);
      if (this.output) {
        this.filters[i].connect(this.volumes[i]);
        this.volumes[i].connect(this.output);
      }
      else {
        this.filters[i].connect(this.meters[i]);
      }
    }
  }
  setBands(newSpectrum, gain) {
    for (var i=0;i<this.length;i++) {
      this.volumes[i].volume.value = newSpectrum[i] + gain;
    }
  }
  getBands(newSpectrum) {
    var retVal = [];
    for (var i=0;i<this.length;i++) {
      retVal[i] = this.meters[i].getLevel();
    }
    return retVal;
  }
}


class Vocoder {
  constructor(source, modulator, output, numFilters, minFreq, maxFreq) {
    this.sourceFilterBand = new FilterBand(
        source, output, numFilters, minFreq, maxFreq);
    this.modulatorFilterBand = new FilterBand(
        modulator, undefined, numFilters, minFreq, maxFreq);
    this.gain = 0.0;
  }
  update() {
    this.sourceFilterBand.setBands(
        this.modulatorFilterBand.getBands(),
        this.gain
    );
  }
  setGain(decibels) {
    this.gain = decibels;
  }
}
