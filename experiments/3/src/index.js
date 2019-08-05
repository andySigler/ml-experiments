// import { setupCreateData } from './createData.js'
import { setupDataPlayback } from './dataPlayback.js'
import { loadDatasets } from './dataIO.js'
// import { setupSimpleRNNPlayback } from './simpleRNN.js'
import { setupMDNPlayback } from './mdn.js'

window.addEventListener('load', () => {
  const loadingMsgNode = document.getElementById('decodingMessage')
  loadDatasets(loadingMsgNode, drawingsArray => {
    // setupCreateData()
    setupDataPlayback(drawingsArray)
    // setupSimpleRNNPlayback(drawingsArray)
    setupMDNPlayback(drawingsArray)
  })
})
