// import { setupCreateData } from './createData.js'
import { setupDataPlayback } from './dataPlayback.js'
import { loadDatasets } from './dataIO.js'
import { setupMDNPlayback } from './mdn.js'

window.addEventListener('load', () => {
  const loadingMsgNode = document.getElementById('decodingMessage')
  loadDatasets(loadingMsgNode, (data, trimmedData) => {
    // setupCreateData()
    setupMDNPlayback(trimmedData)
    setupDataPlayback(data)
  })
})
