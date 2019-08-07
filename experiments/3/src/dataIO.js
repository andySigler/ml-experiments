import { data as tfData } from '@tensorflow/tfjs'
import * as JSZip from 'jszip' // eslint-disable-line no-unused-vars
import { saveAs } from 'file-saver' // eslint-disable-line no-unused-vars

// const zip = new JSZip()
// zip.file('Hello.txt', 'Hello World\n')
// zip.generateAsync({ type: 'blob' }).then((content) => {
//   saveAs(content, 'example.zip')
// })

import { getFilePaths } from './dataPaths.js'

const getCartesian = (x1, y1, x2, y2) => {
  const xDiff = x2 - x1
  const yDiff = y2 - y1
  const hyp = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))
  let rad
  if (xDiff === 0) {
    if (yDiff > 0) {
      rad = Math.PI * 0.5
    } else {
      rad = Math.PI * 1.5
    }
  } else {
    rad = Math.atan(yDiff / xDiff)
  }
  return [rad, hyp]
}

const getAbsRadianDiff = (rad1, rad2) => {
  let absDiff = Math.abs(rad2 - rad1)
  if (absDiff > Math.PI) {
    absDiff = (2 * Math.PI) - absDiff
  }
  return absDiff
}

const didMoveTooMuch = (prevRad, newRad, hypotenuse) => {
  const absDiffRad = getAbsRadianDiff(prevRad, newRad)
  if (absDiffRad > (Math.PI / 8)) {
    return true
  }
  if ((absDiffRad * hypotenuse) > (Math.PI / 360.0)) {
    return true
  }
  return false
}

const trimAbsData = (data) => {
  const trimmedData = [data[0]]
  let prevRad = getCartesian(
    trimmedData[trimmedData.length - 1].x, trimmedData[trimmedData.length - 1].y, data[1].x, data[1].y
  )[0]
  for (let i = 1; i < data.length; i++) {
    const [newRad, hypotenuse] = getCartesian(
      trimmedData[trimmedData.length - 1].x, trimmedData[trimmedData.length - 1].y, data[i].x, data[i].y
    )
    if (didMoveTooMuch(prevRad, newRad, hypotenuse)) {
      trimmedData.push(data[i - 1])
      prevRad = getCartesian(
        trimmedData[trimmedData.length - 1].x, trimmedData[trimmedData.length - 1].y, data[i].x, data[i].y
      )[0]
    }
  }
  trimmedData.push(data[-1])
  return trimmedData
}

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
  const msg = `Loading ${dataPaths.length} training drawings, please wait...`
  console.log(msg)
  msgDOMNode.innerHTML = msg
  for (const path of dataPaths) {
    accumulatedDatasets.push(tfData.csv(path, {
      hasHeader: false,
      columnNames: ['t', 'x', 'y']
    }))
  }
  const onEachDecode = index => {
    const msg = `Loading <span style="font-size:150%;color:#10bf9b"><strong>${index} / ${accumulatedDatasets.length}</strong></span> drawings, please wait...`
    if (index % 5 === 0) {
      msgDOMNode.innerHTML = msg
      console.log(msg)
    }
  }
  decodeCSVDatasets(accumulatedDatasets, onEachDecode, dataArrays => {
    const msg = `<strong>Done</strong> loading ${dataArrays.length} drawings`
    msgDOMNode.innerHTML = msg
    console.log(msg)
    console.log('Trimming data...')
    const trimmedDataArrays = dataArrays.map(d => trimAbsData(d))
    console.log('Done trimming data')
    onFinished(dataArrays, trimmedDataArrays)
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
