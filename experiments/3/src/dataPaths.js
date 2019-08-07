const modelFolder = 'model'

const dataFolder = 'recordedData'

const fileNames = [
  '00bd035f-39e0-4669-8984-dba2143791b3.csv',
  '095c8223-db49-44aa-b552-11560fff00c6.csv',
  '0a8d6dde-117c-4cf9-91d4-3916de4701a2.csv',
  '0af3358f-867a-458d-9540-de0e42dfc5cb.csv',
  '0b726c1f-3dae-4aaf-acd5-40c4eb940979.csv',
  '0eabd6a2-8c7b-4ed0-aefd-1ce735208242.csv',
  '0f2aad99-f893-421a-80c7-f443dd091cef.csv',
  '12849617-6045-47ec-94c1-b96e83e222cc.csv',
  '1bcaba3d-075c-42f5-bc16-1d2168724fc6.csv',
  '1f9c28cb-14fc-4828-9a97-01f54979ce43.csv',
  '205cc998-2426-4745-86ef-a8c8a641677b.csv',
  '21edfedd-57c2-48d8-bd46-ff7ddce41b51.csv',
  '2369fa49-d2ac-4b63-9f9a-f132a2c1d4be.csv',
  '263ed971-00ce-4300-b7fb-6fa4d8a91cfd.csv',
  '28860ead-ecb4-4bd9-97f4-064b234c8da8.csv',
  // '2e743862-6c22-4ffb-a983-f6ddb2b5476a.csv', // not long enough
  '309d7b78-63e8-455d-a967-9775a60dabc1.csv',
  '30e13af0-f6bb-4440-ac3b-b39809f03490.csv',
  '35a60fe9-4649-43dd-a02c-f6fe83ffe6f3.csv',
  '387b2305-e751-4052-8632-62e59e6cf2b1.csv',
  // '410169a1-a41e-4940-bf17-f9bc68394e78.csv', // not long enough
  '45e86bc7-3b74-4108-82e2-e86f7282dd87.csv',
  '499f01e3-255b-4156-9400-a203da453b95.csv',
  '4c8212f9-f059-4296-a866-53abd849a53a.csv',
  '4d948741-0205-4b90-9acc-cdc7f84a1bd4.csv',
  '5205b318-71a4-4e9d-898a-c39dbac200f4.csv',
  '520c0587-3c3f-48f3-98f0-08cbfc4b579c.csv',
  '55330dae-7d78-416c-812a-1e4dfbea1148.csv',
  '55b08df5-4d5b-4302-acf5-c96d3960f541.csv',
  '56af8e99-bed2-4090-ab31-e20b565aa5f7.csv',
  '56b68b14-a4ee-4360-b6e5-a99cba4014d8.csv',
  '5700bdb9-630c-4913-bab1-c4c82d3d2d66.csv',
  '58bcd978-f5c4-42af-a9dc-007abb4a6b03.csv',
  // '5958fac2-4ea3-4089-852d-24168a18d292.csv', // not long enough
  '627da6e8-9780-4095-bdaf-1e1d853df87b.csv',
  '62ed1255-8c3c-457c-8dbd-8287af6e1e0a.csv',
  '64e2f571-cdee-4dae-b5f7-d26c3bce8be5.csv',
  '6dcc4019-3d37-4049-af42-74558a9669c7.csv',
  // '76988314-daea-45fc-a39e-d89fce7ff714.csv', // not long enough
  '77e9dd3d-e34a-4b72-b055-ed7bd96bc14b.csv',
  '799eb490-4c40-4446-96f0-4c59c1cf08b2.csv',
  '7a1c1b6c-f126-4e0d-bf2e-51b3e440b335.csv',
  '7d62892e-7126-41a7-92a3-d8fe52144914.csv',
  '7f08d164-10f9-4e06-94fd-0a4f45ba9d93.csv',
  '8256bf4b-9414-4207-9592-bf21d80b4228.csv',
  '86e3d449-b5c0-4f72-819f-8f7769704d29.csv',
  '895d811b-ae1f-492e-8cb6-19a21f687fe6.csv',
  '89a492b6-a35e-4a55-a5ad-10342e5fcc38.csv',
  '91e257f0-f3f6-4121-bb11-d33c9b359ba5.csv',
  '9414d9a2-ae4a-4c7f-a71c-384ff399dbe8.csv',
  '97b4f088-a789-4cfc-a806-fbcdb2aef505.csv',
  '97d56f2f-d287-4c2f-b3fc-0c208fac20ef.csv',
  '9e776fe0-f016-41dc-b9f6-874b3b51237d.csv',
  // 'a4e8afac-9781-4f88-a1ce-524cd5eb765c.csv', // not long enough
  'a896000c-0cf7-44d3-b8a6-977b6eb30981.csv',
  'b5d49dc1-381d-42d0-99bc-0b6368e87ea0.csv',
  // 'b6648ed6-b908-46fa-aee0-8172ce1fcb24.csv', // not long enough
  'bb5b5dc7-9420-4986-ade2-6b5ff79153e3.csv',
  // 'bb7ec7dd-5204-4efd-b629-8f253c7904b7.csv', // not long enough
  'bba63c4f-e004-4486-83ad-235f2ada4ddb.csv',
  'c01f7455-882a-4733-b931-1c2c1315978e.csv',
  'cb0ff990-c61e-4fed-8d99-ecd4df49d0cd.csv',
  'd987896d-9f83-45c4-bbdb-590b478b9742.csv',
  'ed602c6a-629d-43d7-8d8a-b31f67f82283.csv',
  'ee39f7fb-64e9-4e59-9119-de50444940df.csv',
  'f2ca7b6a-186c-4f36-be31-bdd0e7a605e4.csv',
  'f503fce0-20aa-4b0b-b44e-8af51ac7da3c.csv',
  'f6b223a6-0597-4fde-9fdb-9862f44ec8c0.csv',
  'f7ae0899-a990-4516-8013-cb68de777a45.csv',
  'fb2ed425-decc-47f2-8b0e-f5af97e5be82.csv'
]

export const getFilePaths = () => {
  return fileNames.map(f => `./${dataFolder}/${f}`)
}

export const getSimpleRNNPath = () => {
  return `./${modelFolder}/simpleRNN/model.json`
}

export const getMDNPath = () => {
  return `./${modelFolder}/mdn/model.json`
}
