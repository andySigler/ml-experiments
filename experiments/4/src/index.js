import { setupCanvas, drawPredictedFrames, drawLinearSlide } from './canvas.js'
import { setupModels, predictNewFrames, imageSize } from './model.js'

const runImageBlend = (sketch, models, msgDiv, onFinish) => {
  predictNewFrames(sketch, models, sketch.simpsonsIndex, 1.0, (genPixels, newIndex, newPixels) => {
    sketch.simpsonsIndex = newIndex
    if (msgDiv) msgDiv.innerHTML = 'Drawing predicted frames...'
    drawLinearSlide(sketch, genPixels[0], 0.25, () => {
      drawPredictedFrames(sketch, genPixels.slice(1), () => {
        drawLinearSlide(sketch, newPixels, 0.25, () => {
          onFinish()
        })
      })
    })
  })
}

const setupButtonEvents = (sketch, models) => {
  const button = document.getElementById('loopButton')
  const message = document.getElementById('message')
  let enabled = false
  let running = false
  let timeoutInterval
  const createBlendLoop = () => {
    timeoutInterval = setTimeout(() => {
      running = true
      message.innerHTML = 'Predicting... please wait'
      runImageBlend(sketch, models, message, () => {
        running = false
        if (enabled) {
          createBlendLoop()
        }
      })
    }, 50)
  }
  button.addEventListener('click', () => {
    if (timeoutInterval !== undefined) {
      clearTimeout(timeoutInterval)
    }
    if (enabled) {
      button.innerHTML = 'Start'
      message.innerHTML = 'Click to start'
      enabled = false
    } else if (!running) {
      button.innerHTML = 'Stop'
      enabled = true
      createBlendLoop()
    }
  })
  button.disabled = false
  button.innerHTML = 'Start'
  message.innerHTML = 'Click to start'
}

window.addEventListener('load', () => {
  setupModels(models => {
    const startingFaceIndex = 0 // homer simpson
    setupCanvas('facesDiv', imageSize, imageSize, startingFaceIndex, sketch => {
      sketch.simpsonsIndex = startingFaceIndex // save the index to the sketch
      setupButtonEvents(sketch, models)
    })
  })
})
