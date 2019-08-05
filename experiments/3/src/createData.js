import P5 from 'p5'

import {
  setupCanvas, clearCanvas, createDrawingEvents
} from './drawing.js'
import {
  emptyDataArray, createNewEntryIfNeeded,
  saveNewPoint, exportSavedData
} from './dataIO.js'

const createButtonEvents = (s, parentNode, data) => {
  const saveButton = parentNode.querySelector('#saveButton')
  const clearButton = parentNode.querySelector('#clearButton')
  const fileLinks = parentNode.querySelector('#fileLinks')
  saveButton.addEventListener('click', () => {
    fileLinks.innerHTML = ''
    exportSavedData(data, fileLinks)
    // erase the shared data array
    emptyDataArray(data)
    clearCanvas(s)
  })
  clearButton.addEventListener('click', () => {
    // overwrite drawing with a white background
    // does NOT erase any data
    clearCanvas(s)
  })
}

export const setupCreateData = () => {
  new P5((sketch) => { // eslint-disable-line no-new
    sketch.setup = () => { // will be called automatically
      // create our shared data array, holds drawing mouse movements
      const drawnData = emptyDataArray()
      // setup the canvas
      const generateDiv = document.getElementById('generate')
      generateDiv.hidden = false
      const generateCanvasParent = generateDiv.querySelector('#canvasParent')
      const canvas = setupCanvas(
        sketch, generateCanvasParent, 500, 500)
      const onStoppedDrawing = () => createNewEntryIfNeeded(drawnData)
      const onNewPoint = (t, x, y) => saveNewPoint(drawnData, t, x, y)
      createDrawingEvents(
        sketch, canvas, onStoppedDrawing, onNewPoint)
      // use the buttons to save data, and clear the drawing board
      createButtonEvents(sketch, generateDiv, drawnData)
    }
  })
}
