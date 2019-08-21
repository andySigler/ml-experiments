const dataFolder = 'data'
const modelFolder = 'models'
const imagesFolder = 'img/face'

export const getPNGPath = index => {
  return `./${imagesFolder}/resized_${index + 1}.png`
}

export const getEncoderPath = () => {
  return `./${dataFolder}/${modelFolder}/encoder/model.json`
}

export const getDecoderPath = () => {
  return `./${dataFolder}/${modelFolder}/decoder/model.json`
}
