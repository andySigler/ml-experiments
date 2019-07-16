const dataFolder = 'recordedData'

const fileNames = [
  '5Bz46KfG.csv',
  '6oBfrXii.csv',
  '7qI_r8wg.csv',
  '8U3RuQqo.csv',
  '8V2gm0LV.csv',
  'AQnQM6tC.csv',
  'BL41gtja.csv',
  'DXR2WHU+.csv',
  'FtwosUyz.csv',
  'HmCk2FJR.csv',
  'KLOB+4bA.csv',
  'NHnuR66Q.csv',
  'NZ47Xrqb.csv',
  'PLltqqqX.csv',
  'QOlCF0j6.csv',
  'ZNs+JcPu.csv',
  '_UZcyikZ.csv',
  'aplwg+bK.csv',
  'eAyaYT6d.csv',
  'eux6JJPM.csv',
  'guN1Xa3q.csv',
  'hvOgSRso.csv',
  'iw3fYdcr.csv',
  'jRSeQB0t.csv',
  'nMXbiRjc.csv',
  'rATcvjaS.csv',
  'rNkzgYck.csv',
  'wNhRLzt3.csv',
  'yA4jAz9n.csv'
]

export const getFilePaths = () => {
  return fileNames.map(f => `./${dataFolder}/${f}`)
}
