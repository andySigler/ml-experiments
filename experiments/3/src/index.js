import { setupCreateData } from './createData.js'
import { setupDataPlayback } from './dataPlayback.js'
import { loadDatasets } from './dataIO.js'

window.addEventListener('load', () => {
  const datasets = loadDatasets()
  setupCreateData()
  setupDataPlayback(datasets)
})
