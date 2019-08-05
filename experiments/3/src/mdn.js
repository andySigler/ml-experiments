import * as tf from '@tensorflow/tfjs'

import MultivariateNormal from 'multivariate-normal'
import P5 from 'p5'

import { getMDNPath } from './dataPaths.js'
import { setupCanvas, clearCanvas, drawLineRelative } from './drawing.js'

const mdnSeqLen = 8
const mdnSampleLen = 16
const mdnNumMixes = 16

const splitMixtureParams = (params, outputDim, numMixes) => {
  /*
  Splits up an array of mixture parameters into mus, sigmas, and pis
  depending on the number of mixtures and output dimension.

  Arguments:
  params -- the parameters of the mixture model
  outputDim -- the dimension of the normal models in the mixture model
  numMixes -- the number of mixtures represented
  */
  const totalGaussians = numMixes * outputDim
  const mus = params.slice(0, totalGaussians)
  const sigs = params.slice(totalGaussians, totalGaussians * 2)
  const piLogits = params.slice(totalGaussians * 2)
  return [mus, sigs, piLogits]
}

const softmax = (w, t = 1.0) => {
  /*
  Softmax function for a list or numpy array of logits. Also adjusts temperature.

  Arguments:
  w -- a list or numpy array of logits

  Keyword arguments:
  t -- the temperature for to adjust the distribution (default 1.0)
  */

  // adjust temperature
  let e = w.map(el => el / t)
  // subtract max to protect from exploding exp values
  const arrayMax = Math.max(...e)
  e = e.map(el => el - arrayMax)
  e = e.map(el => Math.exp(el))
  const summed = e.reduce((total, val) => total + val, 0)
  const dist = e.map(el => el / summed)
  return dist
}

const sampleFromCategorical = (dist) => {
  /*
  Samples from a categorical model PDF.

  Arguments:
  dist -- the parameters of the categorical model

  Returns:
  One sample from the categorical model
  */
  const r = Math.random()
  let accumulate = 0
  for (let i = 0; i < dist.length; i++) {
    accumulate += dist[i]
    if (accumulate >= r) {
      return i
    }
  }
  throw new Error('Error sampling categorical model')
}

const createIdentityMatrix = (n, valArray) => {
  /*
  Creates an identity matrix with rows/columns of size "n"
  Optionally, an array of values (of length "n") can be passed
  to set the value at each non-zero point in the identity matrix

  Arguments:
  n -- the dimension of the 2d identity matrix (n * n)
  valArray -- (optional) array of length "n",
              holding the values of the identity matrix

  Returns:
  2d array, representing an identity matrix
  */
  const retVal = []
  for (let x = 0; x < n; x++) {
    retVal.push([])
    for (let y = 0; y < n; y++) {
      if (y === x) {
        if (valArray) {
          retVal[retVal.length - 1].push(valArray[x])
        } else {
          retVal[retVal.length - 1].push(1)
        }
      } else {
        retVal[retVal.length - 1].push(0)
      }
    }
  }
  return retVal
}

const sampleMDNOutput = (params, outputDim, numMixes, temp = 1.0, sigmaTemp = 1.0) => {
  /*
  Sample from an MDN output with temperature adjustment.
  This calculation is done outside of the Keras model

  Arguments:
  params -- the parameters of the mixture model
  outputDim -- the dimension of the normal models in the mixture model
  numMixes -- the number of mixtures represented

  Keyword arguments:
  temp -- the temperature for sampling between mixture components (default 1.0)
  sigmaTemp -- the temperature for sampling from the normal distribution (default 1.0)

  Returns:
  One sample from the the mixture model
  */
  const test = new MDNSigmasActivation() // eslint-disable-line no-unused-vars
  const [mus, sigs, piLogits] = splitMixtureParams(params, outputDim, numMixes)
  const pis = softmax(piLogits, temp)
  const m = sampleFromCategorical(pis)
  const musVector = mus.slice(m * outputDim, (m + 1) * outputDim)
  const sigVector = sigs.slice(
    m * outputDim,
    (m + 1) * outputDim
  ).map(el => el * sigmaTemp)
  const covMatrix = createIdentityMatrix(outputDim, sigVector)
  const sample = MultivariateNormal(musVector, covMatrix).sample()
  return sample
}

export class MDNSigmasActivation extends tf.serialization.Serializable {
  /*
  A custom activation, used in the python Keras implementation of
  this MDN model, and required for loading as a Layers Model in tfjs
  */
  static get className () {
    return 'eluPlusOnePlusEpsilon' // its name in the python implementation
  }

  constructor (config) {
    super(config)
    this.epsilonPlusOne = tf.scalar(1.0000001, 'float32')
  }

  getConfig () {
    return {}
  }

  apply (x) {
    // ELU activation, with a small addition to help prevent NaN in loss
    return tf.elu(x).add(this.epsilonPlusOne)
  }

  call (x) {
    return this.apply(x)
  }
}
tf.serialization.registerClass(MDNSigmasActivation)

const loadMDNModel = async () => {
  const model = await tf.loadLayersModel(getMDNPath())
  return model
}

const getRandomSeed = (drawingsArray) => {
  // find a drawing that is long enough
  let randomDrawingIndex = Math.floor((Math.random() * drawingsArray.length))
  const neededSamples = (mdnSampleLen * mdnSeqLen) + 1
  while (drawingsArray[randomDrawingIndex].length <= neededSamples) {
    randomDrawingIndex = Math.floor((Math.random() * drawingsArray.length))
  }
  const drawing = drawingsArray[randomDrawingIndex]
  // pick a random start point within that drawing
  const randomSequenceIndex = Math.floor(
    (Math.random() * (drawing.length - neededSamples))
  )
  const points = drawing.slice(
    randomSequenceIndex, randomSequenceIndex + neededSamples)
  return points
}

const pointsToMDNInput = (points) => {
  // convert the point objects to a flattened array with rel and abs values
  const pointsArray = points.map((p, i) => {
    if (i === 0) return undefined
    const relX = p.x - points[i - 1].x
    const relY = p.y - points[i - 1].y
    return [relX, relY, p.x, p.y]
  }).slice(1)
  const flattenedPointsArray = pointsArray.flat(Infinity)
  // divide the flattened array into an array of sub-sequences, for the RNN
  const rnnPoints = []
  const valuesPerSequence = mdnSampleLen * 4
  for (let i = 0; i < mdnSeqLen; i++) {
    const start = i * valuesPerSequence
    const end = start + valuesPerSequence
    rnnPoints.push(flattenedPointsArray.slice(start, end))
  }
  return rnnPoints
}

const addAbsPointsToOutput = (relOutput, absInput) => {
  // get the final absolute position from the input RNN sequences
  const lastRnnSeq = absInput[absInput.length - 1]
  const absOutput = lastRnnSeq.slice(lastRnnSeq.length - 4)
  // continue on, adding absolute points to the rest of the relative points
  for (let i = 0; i < relOutput.length; i += 2) {
    const absX = absOutput[absOutput.length - 2] + relOutput[i]
    const absY = absOutput[absOutput.length - 1] + relOutput[i + 1]
    absOutput.push(relOutput[i])
    absOutput.push(relOutput[i + 1])
    absOutput.push(absX)
    absOutput.push(absY)
  }
  return absOutput
}

const mdnOutputToPoints = outputArray => {
  const points = []
  let fakeMillisCounter = 0
  const fakeMillisStep = 5
  for (let i = 2; i < outputArray.length; i += 4) {
    points.push({
      t: fakeMillisCounter,
      x: outputArray[i],
      y: outputArray[i + 1]
    })
    fakeMillisCounter += fakeMillisStep
  }
  return points
}

const predictMDN = (model, seed, temp, sigmaTemp) => {
  return tf.tidy(() => {
    const seedTensor = tf.tensor3d(
      [seed], [1, mdnSeqLen, mdnSampleLen * 4], 'float32')
    const guess = model.predict(seedTensor)
    const guessArray = tf.squeeze(guess).arraySync()
    const mdnOutput = sampleMDNOutput(
      guessArray, mdnSampleLen * 2, mdnNumMixes, temp, sigmaTemp)
    return addAbsPointsToOutput(mdnOutput, seed)
  })
}

const drawLineAtIndex = (s, i, pointArray, color = 'black') => {
  const prev = pointArray[i - 1]
  const curr = pointArray[i]
  drawLineRelative(s, prev.x, prev.y, curr.x, curr.y, color)
  if (curr.x < 0 || curr.x > 1 || curr.y < 0 || curr.y > 1) {
    return false
  } else {
    return true
  }
}

const drawPointsArrayAsync = (s, pointArray, color = 'black', keepDrawing) => {
  return new Promise((resolve, reject) => {
    const recurseThroughPoints = (i) => {
      if (!keepDrawing) reject(new Error('Told to stop'))
      else if (drawLineAtIndex(s, i, pointArray, color)) {
        i += 1
        if (i < pointArray.length) {
          setTimeout(() => recurseThroughPoints(i), pointArray[i].t)
        } else {
          resolve(true)
        }
      } else {
        resolve(false)
      }
    }
    recurseThroughPoints(1)
  })
}

const createButtonEvents = (s, parentNode, datasetArray, model) => {
  const startButton = parentNode.querySelector('#startMDNButton')
  const stopButton = parentNode.querySelector('#stopMDNButton')
  const tempInput = parentNode.querySelector('#tempInput')
  const sigmaTempInput = parentNode.querySelector('#sigmaTempInput')
  let timeoutRef
  let currentlyDrawing = false
  const stopButtonEvent = () => {
    if (currentlyDrawing) {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
      tempInput.disabled = false
      sigmaTempInput.disabled = false
      currentlyDrawing = false
    }
  }
  const startButtonEvent = () => {
    const temp = tempInput.value
    const sigmaTemp = sigmaTempInput.value
    tempInput.disabled = true
    sigmaTempInput.disabled = true

    const predictNextSequence = async (seed) => {
      const mdnOutput = predictMDN(model, seed, temp, sigmaTemp)
      const newSeed = seed.slice(1)
      // remove the artifically added first point, then append to seed
      newSeed.push(mdnOutput.slice(4))
      const pointsToDraw = mdnOutputToPoints(mdnOutput)
      const stillOnScreen = await drawPointsArrayAsync(
        s, pointsToDraw, 'black', currentlyDrawing)
      if (!stillOnScreen) {
        stopButtonEvent()
      } else {
        timeoutRef = setTimeout(() => { predictNextSequence(newSeed) }, 50)
      }
    }

    const startModelPrediction = () => {
      currentlyDrawing = true
      clearCanvas(s)
      const randomPoints = getRandomSeed(datasetArray)
      const mdnInput = pointsToMDNInput(randomPoints)
      predictNextSequence(mdnInput)
    }
    // trigger
    stopButtonEvent()
    startModelPrediction()
  }
  startButton.addEventListener('click', startButtonEvent)
  stopButton.addEventListener('click', stopButtonEvent)
  startButton.disabled = false
  stopButton.disabled = false
}

export const setupMDNPlayback = (datasetArray) => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      const mdnDiv = document.getElementById('mdn')
      mdnDiv.hidden = false
      const mdnCanvasParent = mdnDiv.querySelector('#canvasParent')
      setupCanvas(sketch, mdnCanvasParent, 500, 500)
      loadMDNModel().then(model => {
        model.summary()
        createButtonEvents(sketch, mdnDiv, datasetArray, model)
      })
    }
  })
}
