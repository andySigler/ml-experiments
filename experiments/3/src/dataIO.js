import { data as tfData } from '@tensorflow/tfjs'
import * as JSZip from 'jszip' // eslint-disable-line no-unused-vars
import { saveAs } from 'file-saver' // eslint-disable-line no-unused-vars

// const zip = new JSZip()
// zip.file('Hello.txt', 'Hello World\n')
// zip.generateAsync({ type: 'blob' }).then((content) => {
//   saveAs(content, 'example.zip')
// })

import { getFilePaths } from './dataPaths.js'

export const loadDatasets = () => {
  const dataPaths = getFilePaths()
  const accumulatedDatasets = []
  console.log(`Reading in ${dataPaths.length} training datasets`)
  for (const path of dataPaths) {
    console.log(`\tReading in ${path}`)
    accumulatedDatasets.push(tfData.csv(path, {
      hasHeader: false,
      columnNames: ['t', 'x', 'y']
    }))
  }
  console.log(`Loaded ${accumulatedDatasets.length} training datasets`)
  return accumulatedDatasets
}

export const exportSavedData = (data, parentNode) => {
  for (const [count, drawing] of data.entries()) {
    if (drawing.length === 0) continue
    let newFileString = ''
    for (const sample of drawing) {
      newFileString += sample.t + ','
      newFileString += sample.x + ','
      newFileString += sample.y + '\n'
    }
    const blob = new Blob([newFileString], {
      type: 'text/csv;charset=utf-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.innerHTML = 'Click to Download CSV #' + (count + 1)
    link.href = url
    parentNode.appendChild(link)
    parentNode.appendChild(document.createElement('br'))
  }
}

export const saveNewPoint = (data, t, x, y) => {
  data[data.length - 1].push({ t, x, y })
}

export const createNewEntryIfNeeded = (data) => {
  if (data[data.length - 1].length > 0) {
    data.push([])
  }
}

export const emptyDataArray = (data = []) => {
  while (data.length > 0) {
    data.pop()
  }
  data.push([]) // add single empty element to start off with
  return data
}
