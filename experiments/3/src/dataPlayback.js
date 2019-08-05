import 'babel-polyfill'

import P5 from 'p5'

import { setupCanvas, clearCanvas, drawLineRelative } from './drawing.js'

const createButtonEvents = (s, parentNode, datasetArray) => {
  const startButton = parentNode.querySelector('#startPlaybackButton')
  const stopButton = parentNode.querySelector('#stopPlaybackButton')
  let timeoutRef // referenced by both start and stop functions
  const stopButtonEvent = () => {
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  }
  const startButtonEvent = () => {
    stopButtonEvent()
    // recursive function, generates a timeout from the time from data
    // then draws a line from the previous point to the current point
    const genTimeout = (dataArray, index) => {
      const [prev, curr] = [dataArray[index - 1], dataArray[index]]
      timeoutRef = setTimeout(() => {
        drawLineRelative(s, prev.x, prev.y, curr.x, curr.y)
        index += 1
        if (index < dataArray.length) genTimeout(dataArray, index)
        else stopButtonEvent()
      }, curr.t - prev.t)
    }
    // picks a random datasets, converts to array, then triggers the
    // recursive timout function above
    const startRandomPlayback = () => {
      clearCanvas(s)
      const i = Math.floor(Math.random() * datasetArray.length)
      const dataArray = datasetArray[i]
      genTimeout(dataArray, 1)
    }
    // trigger
    startRandomPlayback()
  }
  startButton.addEventListener('click', startButtonEvent)
  stopButton.addEventListener('click', stopButtonEvent)
  startButton.disabled = false
  stopButton.disabled = false
}

export const setupDataPlayback = (datasetArray) => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      const playbackDiv = document.getElementById('playback')
      playbackDiv.hidden = false
      const playbackCanvasParent = playbackDiv.querySelector('#canvasParent')
      setupCanvas(
        sketch, playbackCanvasParent, 500, 500)
      // use the buttons to save data, and clear the drawing board
      createButtonEvents(sketch, playbackDiv, datasetArray)
    }
  })
}
