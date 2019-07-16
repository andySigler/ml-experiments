import 'babel-polyfill'

import P5 from 'p5'
// import * as tf from '@tensorflow/tfjs'

import * as drawing from './drawing.js'
import * as dataIO from './dataIO.js'

const createButtonEvents = (s, parentNode, data) => {
  const saveButton = parentNode.querySelector('#saveButton')
  const clearButton = parentNode.querySelector('#clearButton')
  const fileLinks = parentNode.querySelector('#fileLinks')
  saveButton.addEventListener('click', () => {
    fileLinks.innerHTML = ''
    dataIO.exportSavedData(data, fileLinks)
    // erase the shared data array
    dataIO.emptyDataArray(data)
    drawing.clearCanvas(s)
  })
  clearButton.addEventListener('click', () => {
    // overwrite drawing with a white background
    // does NOT erase any data
    drawing.clearCanvas(s)
  })
}

export const setup = () => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      // create our shared data array, holds drawing mouse movements
      const drawnData = dataIO.emptyDataArray()
      // setup the canvas
      const generateDiv = document.getElementById('generate')
      const generateCanvasParent = generateDiv.querySelector('#canvasParent')
      const canvas = drawing.setupCanvas(
        sketch, generateCanvasParent, 500, 500)
      const onStoppedDrawing = () => dataIO.createNewEntryIfNeeded(drawnData)
      const onNewPoint = (t, x, y) => dataIO.saveNewPoint(drawnData, t, x, y)
      drawing.createDrawingEvents(
        sketch, canvas, onStoppedDrawing, onNewPoint)
      // use the buttons to save data, and clear the drawing board
      createButtonEvents(sketch, generateDiv, drawnData)
    }
  })
}
