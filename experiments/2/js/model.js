function createModel(seqLength, dataLength) {
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 128,
        inputShape: [seqLength, dataLength],
        activation: 'relu',
        useBias: true
    }))
    model.add(tf.layers.dense({
        units: 512,
        activation: 'relu',
        useBias: true
    }))
    model.add(tf.layers.gru({
        units: 512,
        returnSequences: false
    }));
    model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        useBias: true
    }))
    model.add(tf.layers.dense({
        units: dataLength,
        activation: 'relu',
        useBias: true
    }))
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });
    return model;
}

function trainModel(model, dataset, batchesPerEpoch, callback) {
    console.log('Starting to train...');
    const batchPrintInterval = 1;
    model.fitDataset(dataset, {
        epochs: 1,
        batchesPerEpoch: batchesPerEpoch,
        callbacks: {
            onBatchEnd: (batch, logs) => {
                if (batch % batchPrintInterval === 0) {
                    console.log(logs);
                }
            }
        }
    }).then((e) => {
        console.log('Done Training');
        console.log('Accuracy', e.history.acc[0]);
        console.log('Loss', e.history.loss[0]);
        if (callback) callback();
        // dataset.take(1).forEachAsync((d) => {
        //     console.log('testing time');
        //     var predictSeed = d.xs.slice([0, 0, 0], [1, 32, 32]);
        //     console.log(predictSeed);
        //     var guess;
        //     for (var i=0;i<5;i++) {
        //         const startTime = Date.now();
        //         guess = model.predict(predictSeed);
        //         const endTime = Date.now();
        //         console.log('Time:', endTime - startTime);
        //         predictSeed = predictSeed.slice([0, 1, 0], [1, 31, 32]).concat(guess.expandDims(0), 1);
        //     }
        //     console.log(guess);
        // });
    });
}
