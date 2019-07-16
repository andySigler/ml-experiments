import 'babel-polyfill'

import P5 from 'p5'
// import * as tf from '@tensorflow/tfjs'

import * as drawing from './drawing.js'
// import * as dataIO from './dataIO.js'

const createButtonEvents = (s, parentNode, datasetArray) => {
  const startButton = parentNode.querySelector('#startPlaybackButton')
  const stopButton = parentNode.querySelector('#stopPlaybackButton')
  let timeoutRef // referenced by both start and stop functions
  startButton.addEventListener('click', () => {
    if (timeoutRef) return
    // recursive function, generates a timeout from the time from data
    // then draws a line from the previous point to the current point
    const genTimeout = (dataArray, index) => {
      const [prev, curr] = [dataArray[index - 1], dataArray[index]]
      timeoutRef = setTimeout(() => {
        drawing.drawLineRelative(s, prev.x, prev.y, curr.x, curr.y)
        index += 1
        if (index < dataArray.length) genTimeout(dataArray, index)
        else startRandomPlayback()
      }, curr.t - prev.t)
    }
    // picks a random datasets, converts to array, then triggers the
    // recursive timout function above
    const startRandomPlayback = () => {
      drawing.clearCanvas(s)
      const i = Math.floor(Math.random() * datasetArray.length)
      datasetArray[i].toArray().then(dataArray => genTimeout(dataArray, 1))
    }
    // trigger
    startRandomPlayback()
  })
  stopButton.addEventListener('click', () => {
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = undefined
    }
  })
}

export const setup = (datasetArray) => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      const playbackDiv = document.getElementById('playback')
      const playbackCanvasParent = playbackDiv.querySelector('#canvasParent')
      drawing.setupCanvas(
        sketch, playbackCanvasParent, 500, 500)
      // use the buttons to save data, and clear the drawing board
      createButtonEvents(sketch, playbackDiv, datasetArray)
    }
  })
}
