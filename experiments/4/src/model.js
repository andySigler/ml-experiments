import * as tf from '@tensorflow/tfjs'

import { getDecoderPath, getEncoderPath } from './dataPaths.js'
import { frameRate, getImagePixels, pixelsToArray } from './canvas.js'

export const imageSize = 160
const numLatentUnits = 128
const totalImages = 2633

const calculateLatentSteps = (startLatent, endLatent, seconds) => {
  // calculate each latent vector that steps between them
  const numFrames = frameRate * seconds
  const latentStep = endLatent.map((val, i) => {
    return (val - startLatent[i]) / numFrames
  })
  const latentStepValues = [startLatent]
  for (let i = 0; i < numFrames - 1; i++) {
    const newValue = latentStepValues[i].map((val, i) => val + latentStep[i])
    latentStepValues.push(newValue)
  }
  latentStepValues.push(endLatent)
  return latentStepValues
}

const predictPixelsFromLatents = (models, latentsArray) => {
  return tf.tidy(() => {
    // predict all latents as a batch
    const guess = models.decoder.predict(tf.tensor2d(latentsArray))
    // add the Alpha channel
    const alphaShape = guess.shape.slice(0)
    alphaShape[alphaShape.length - 1] = 1
    const alpha = tf.ones(alphaShape, 'float32')
    const withAlpha = tf.concat([guess, alpha], guess.shape.length - 1)
    // convert to 8bit
    const as8Bit = tf.mul(withAlpha, 256).asType('int32')
    // flatten each image into Canvas pixels array
    const newShape = [
      as8Bit.shape[0],
      as8Bit.shape[1] * as8Bit.shape[2] * as8Bit.shape[3]
    ]
    return as8Bit.reshape(newShape).arraySync()
  })
}

const predictLatentFromImage = (models, pixels) => {
  return tf.tidy(() => {
    const flatImage8Bit = tf.tensor1d(pixels, 'float32')
    const flatImageFloat = tf.div(flatImage8Bit, 256)
    const imageFloat = tf.reshape(flatImageFloat, [1, imageSize, imageSize, 4])
    const imageNoAlpha = tf.slice(
      imageFloat, [0, 0, 0, 0], [1, imageSize, imageSize, 3])
    const guess = models.encoder.predict(imageNoAlpha)
    return tf.reshape(guess, [numLatentUnits]).arraySync()
  })
}

export const predictNewFrames = (sketch, models, startIndex, seconds, onFinish) => {
  // get the start latent vector
  const startPixels = pixelsToArray(sketch)
  const startLatent = predictLatentFromImage(models, startPixels)
  // get the end latent vector
  const endIndex = Math.floor(Math.random() * totalImages)
  getImagePixels(sketch, endIndex, pixels => {
    const endPixels = pixelsToArray(pixels)
    const endLatent = predictLatentFromImage(models, endPixels)
    // calculate each latent step
    const latentStepValues = calculateLatentSteps(
      startLatent, endLatent, seconds)
    // run the latent step through the model to generate output pixels
    const pixelsArray = predictPixelsFromLatents(models, latentStepValues)
    onFinish(pixelsArray, endIndex, endPixels)
  })
}

const loadModel = (path, onFinish) => {
  tf.loadLayersModel(path).then(model => {
    model.summary()
    const predShape = model.inputs[0].shape.slice(0)
    predShape[0] = 1
    model.predict(tf.zeros(predShape, 'float32'))
    onFinish(model)
  })
}

export const setupModels = onFinish => {
  const models = {}
  loadModel(getDecoderPath(), decoder => {
    models.decoder = decoder
    loadModel(getEncoderPath(), encoder => {
      models.encoder = encoder
      onFinish(models)
    })
  })
}
