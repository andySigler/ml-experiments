import P5 from 'p5'

import { getPNGPath } from './dataPaths.js'

export const frameRate = 10

const clearCanvas = (sketch, color = 255, opacity = 255) => {
  sketch.background(color, color, color, opacity)
}

export const getImagePixels = (sketch, imageIndex, onFinish) => {
  sketch.loadImage(getPNGPath(imageIndex), img => {
    img.loadPixels()
    onFinish(img.pixels)
  })
}

export const drawPixels = (sketch, pixels) => {
  sketch.loadPixels()
  pixels.forEach((val, i) => { sketch.pixels[i] = val })
  sketch.updatePixels()
}

export const pixelsToArray = pixels => {
  if (pixels.pixels !== undefined) {
    pixels.loadPixels()
    pixels = pixels.pixels
  }
  const pixelsArray = []
  for (let i = 0; i < pixels.length; i++) {
    pixelsArray.push(pixels[i])
  }
  return pixelsArray
}

export const drawLinearSlide = (sketch, pixels, seconds, onFinish) => {
  const numFrames = Math.ceil(frameRate * seconds)
  // some steps have been made to avoid how pixels[] will auto-round values
  const unroundedPixels = pixelsToArray(sketch)
  const pixStep = unroundedPixels.map((val, i) => (pixels[i] - val) / numFrames)
  let frameCount = 0
  const stepFrame = () => {
    sketch.loadPixels()
    pixStep.forEach((val, index) => {
      unroundedPixels[index] += val
      sketch.pixels[index] = unroundedPixels[index]
    })
    sketch.updatePixels()
    frameCount++
    if (frameCount >= numFrames) {
      clearInterval(interval)
      onFinish()
    }
  }
  const interval = setInterval(stepFrame, 1000 / frameRate)
}

export const drawPredictedFrames = (sketch, pixelsArray, onFinish) => {
  sketch.loadPixels()
  // some steps have been made to avoid how pixels[] will auto-round values
  let frameCount = 0
  const stepFrame = () => {
    drawPixels(sketch, pixelsArray[frameCount])
    frameCount++
    if (frameCount === pixelsArray.length) {
      clearInterval(interval)
      onFinish()
    }
  }
  const interval = setInterval(stepFrame, 1000 / frameRate)
}

export const setupCanvas = (parentName, width, height, faceIndex, onFinish) => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      sketch.noLoop()
      const canvas = sketch.createCanvas(width, height)
      canvas.parent(parentName)
      clearCanvas(sketch)
      getImagePixels(sketch, faceIndex, pixels => {
        drawPixels(sketch, pixels)
        onFinish(sketch)
      })
    }
  })
}
