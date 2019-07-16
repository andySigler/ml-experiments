import 'babel-polyfill'

// import * as tf from '@tensorflow/tfjs'

import * as dataGenerator from './dataGenerator.js'
import * as playback from './playback.js'
import * as dataIO from './dataIO.js'

window.addEventListener('load', () => {
  const datasets = dataIO.loadDatasets()
  dataGenerator.setup()
  playback.setup(datasets)
})
