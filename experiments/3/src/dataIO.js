import { data as tfData } from '@tensorflow/tfjs'
import * as JSZip from 'jszip' // eslint-disable-line no-unused-vars
import { saveAs } from 'file-saver' // eslint-disable-line no-unused-vars

// const zip = new JSZip()
// zip.file('Hello.txt', 'Hello World\n')
// zip.generateAsync({ type: 'blob' }).then((content) => {
//   saveAs(content, 'example.zip')
// })

import { getFilePaths } from './dataPaths.js'

const decodeCSVDatasets = (datasetArray, onEach, onFinished) => {
  const decodeDataset = (index, dArray, newArray) => {
    onEach(index)
    dArray[index].toArray().then(d => {
      newArray.push(d)
      if (index < dArray.length - 1) {
        decodeDataset(index + 1, dArray, newArray)
      } else {
        onFinished(newArray)
      }
    })
  }
  decodeDataset(0, datasetArray, [])
}

export const loadDatasets = (msgDOMNode, onFinished) => {
  const dataPaths = getFilePaths()
  const accumulatedDatasets = []
  console.log(`Reading in ${dataPaths.length} training datasets`)
  for (const path of dataPaths) {
    accumulatedDatasets.push(tfData.csv(path, {
      hasHeader: false,
      columnNames: ['t', 'x', 'y']
    }))
  }
  const onEachDecode = index => {
    const msg = `Decoding ${index}/${accumulatedDatasets.length} datasets...`
    if (index % 3 === 0) {
      msgDOMNode.innerHTML = msg
      console.log(msg)
    }
  }
  decodeCSVDatasets(accumulatedDatasets, onEachDecode, dataArrays => {
    const msg = `Done decoding ${dataArrays.length} training datasets`
    msgDOMNode.innerHTML = msg
    console.log(msg)
    onFinished(dataArrays)
  })
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
