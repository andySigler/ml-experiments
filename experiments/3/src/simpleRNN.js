import * as tf from '@tensorflow/tfjs'

import P5 from 'p5'

import { getSimpleRNNPath } from './dataPaths.js'
import { setupCanvas, clearCanvas, drawLineRelative } from './drawing.js'

export const modelSeqLen = 64
const modelInputSampleLen = 5
const modelOutputSampleLen = 3
const modelInputShape = [1, modelSeqLen, modelInputSampleLen]

const seedToModelInput = (seed) => {
  // sample = [ deltaSeconds, deltaX, deltaY, absX, absY ]
  const newSeed = []
  for (let i = 1; i < seed.length; i++) {
    const currentSample = seed[i]
    const prevSample = seed[i - 1]
    const dMillis = (currentSample.t - prevSample.t) / 1000.0
    const dX = currentSample.x - prevSample.x
    const dY = currentSample.y - prevSample.y
    newSeed.push([dMillis, dX, dY, currentSample.x, currentSample.y])
  }
  return tf.tensor3d([newSeed], modelInputShape, 'float32')
}

const modelOutputToDrawData = (outputArray, seedData) => {
  const finalSeedData = seedData[seedData.length - 1]
  return {
    t: outputArray[0] * 1000, // convert back to millis
    x: outputArray[1] + finalSeedData['x'], // convert to abs pose
    y: outputArray[2] + finalSeedData['y'] // convert to abs pose
  }
}

const modelPredict = (model, input) => {
  return tf.tidy(() => {
    const guess = model.predict(input)
    const finalGuessState = tf.slice(
      guess,
      [0, modelSeqLen - 1, 0],
      [1, 1, modelOutputSampleLen]
    )
    return finalGuessState
  })
}

// const getFinalAbsPoseOfInput = (inputTensor) => {
//   return tf.slice(
//     inputTensor,
//     [0, modelSeqLen - 1, modelInputSampleLen - 2],
//     [1, 1, 2]
//   )
// }

// const addAbsPoseToOutput = (input, output) => {
//   return tf.tidy(() => {
//     const lastInputAbsPose = getFinalAbsPoseOfInput(input)
//     const outputRelPose = tf.slice(output, [0, 0, 1], [1, 1, 2])
//     const outputAbsPose = tf.add(outputRelPose, lastInputAbsPose)
//     return tf.concat([output, outputAbsPose], 2)
//   })
// }

const predictLineFromSeed = async (model, seed) => {
  return tf.tidy(() => {
    const seedTensor = seedToModelInput(seed)
    const guessedState = modelPredict(model, seedTensor)
    // const guessedStateAbs = addAbsPoseToOutput(seedTensor, guessedState)
    const outputArray = guessedState.squeeze().arraySync()
    return modelOutputToDrawData(outputArray, seed)
  })
}

const loadSimpleRNNModel = async () => {
  const model = await tf.loadLayersModel(getSimpleRNNPath())
  return model
}

const createButtonEvents = (s, parentNode, datasetArray, model) => {
  const startButton = parentNode.querySelector('#startModelButton')
  const stopButton = parentNode.querySelector('#stopModelButton')
  let timeoutRef
  const stopButtonEvent = () => {
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  }
  const startButtonEvent = () => {
    // recursive function, generates a timeout from the time from data
    // then draws a line from the previous point to the current point
    const predictNewLine = (seed) => {
      predictLineFromSeed(model, seed).then(newPoint => {
        if (newPoint.x > 1 || newPoint.x < 0 || newPoint.y > 1 || newPoint.y < 0) {
          stopButtonEvent()
          startModelPrediction()
        } else {
          seed.push(newPoint)
          const [prev, curr] = [seed[seed.length - 2], seed[seed.length - 1]]
          drawLineRelative(s, prev.x, prev.y, curr.x, curr.y)
          timeoutRef = setTimeout(() => predictNewLine(seed.slice(1)), 10)
        }
      })
    }
    // picks a random datasets, converts to array, then triggers the
    // recursive timout function above
    const startModelPrediction = () => {
      clearCanvas(s)
      const i = Math.floor(Math.random() * datasetArray.length)
      const modelSeed = datasetArray[i].slice(0, modelSeqLen + 1)
      predictNewLine(modelSeed)
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

export const setupSimpleRNNPlayback = (datasetArray) => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      const modelDiv = document.getElementById('simpleRNN')
      const modelCanvasParent = modelDiv.querySelector('#canvasParent')
      setupCanvas(sketch, modelCanvasParent, 500, 500)
      loadSimpleRNNModel().then(model => {
        model.summary()
        createButtonEvents(sketch, modelDiv, datasetArray, model)
      })
    }
  })
}
