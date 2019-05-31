// function setupAudioPlayback(audio, voiceName, callback) {
//     // create all audio events for the button
//     var mp3Button = document.getElementById('mp3Button');
//     var checkbox = document.getElementById('mp3Record');
//     var timeoutEventAutoOff = undefined;
//     var buttonAudioOn = () => {
//         // ON state
//         audio.events.on();
//         // modulator.seek(Math.random() * modulator.fileDuration);
//         var shouldRecord = checkbox.checked;
//         audio.vocoder.startMP3(shouldRecord);
//         if (modulator.fileDuration > 0) {
//             // automatically turn audio OFF when file's duration has passed
//             if (timeoutEventAutoOff) clearTimeout(timeoutEventAutoOff);
//             timeoutEventAutoOff = setTimeout(
//                 mp3Button.offEvent,  // run full button event, to set it's state
//                 modulator.fileDuration * 1000
//             );
//         }
//     }
//     var buttonAudioOff = () => {
//         // OFF state
//         if (timeoutEventAutoOff) clearTimeout(timeoutEventAutoOff);
//         audio.events.off();
//         var saveData = audio.vocoder.stopMP3();
//         if (saveData) {
//             generateCSV(saveData);
//         }
//     }
//     // attach the events to the button
//     buttonOnOffEvents(mp3Button, buttonAudioOn, buttonAudioOff);
//     // finally, load in the mp3 file to the Tone.Player
//     setButtonText(mp3Button, 'Loading');
//     document.getElementById('voiceName').innerHTML = voiceName;
//     loadVoice(audio.modulator, voiceName, () => {
//         mp3Button.offEvent();
//         if (callback) callback();
//     });
// }

function setupDataPlaybackAndTrain(audio, dataName, callback) {
    var dataButton = document.getElementById('dataButton');
    var buttonDataOn = () => {
        audio.events.on();
        audio.vocoder.startDataPlayback();
    }
    var buttonDataOff = () => {
        audio.events.off();
        audio.vocoder.stopDataPlayback();
    }
    buttonOnOffEvents(dataButton, buttonDataOn, buttonDataOff);
    setButtonText(dataButton, 'Loading');
    document.getElementById('dataName').innerHTML = dataName;
    var dataset = loadCSVDataset(dataName);
    // just take a 1 minute sample, for testing data audio with playback
    dataset.take(64 * 60).toArray().then((data) => {
        data = parseRecordedData(data);
        // save the dataset for playback
        audio.vocoder.dataArray = data;
        dataButton.offEvent();
        if (callback) callback();
    });
    var trainButton = document.getElementById('trainButton');
    const batchesPerEpoch = 32;
    const trainBatchSize = 32;
    const trainSeqLength = 32;
    const inputDataLength = audio.vocoder.length + 1; // includes pitch at 0th
    const trainDataToShuffle = batchesPerEpoch * trainBatchSize;
    var parseDataPoint = (element) => {
        var parsedData = parseRecordedData(element);
        var arr = parsedData[0].spectrum;
        arr = arr.map((val) => {
            return (val + 100.0) / 100.0;
        });
        arr.unshift(parsedData[0].pitch / 1000.0);
        return arr;
    };
    var createXData = (batch) => {
        return batch.slice([0,0], [trainSeqLength, inputDataLength]);
    };
    var createYData = (batch) => {
        return batch.slice([1,0], [trainSeqLength, inputDataLength]);
    };
    var xyDataset = dataset.map(parseDataPoint).batch(
        trainSeqLength + 1, false);
    xyDataset = tf.data.zip({
        xs: xyDataset.map(createXData),
        ys: xyDataset.map(createYData)
    });
    var model = createModel(trainSeqLength, inputDataLength);
    var buttonTrainOn = () => {
        // train it (monitor)
        var trainDataset = xyDataset.shuffle(
            trainDataToShuffle).batch(trainBatchSize, false);
        trainModel(model, trainDataset, batchesPerEpoch, () => {
            // reset the button's state when training is done
            trainButton.offEvent();
            // test results using vocoder
            audio.vocoder.model = model;
        });
    }
    var buttonTrainOff = () => {
    }
    buttonOnOffEvents(trainButton, buttonTrainOn, buttonTrainOff);
}

function setupModelPlayback(audio, modelName, callback) {
    var modelButton = document.getElementById('modelButton');
    var buttonModelOn = () => {
        audio.events.on();
        audio.vocoder.startModelPlayback();
    }
    var buttonModelOff = () => {
        audio.events.off();
        audio.vocoder.stopModelPlayback();
    }
    buttonOnOffEvents(modelButton, buttonModelOn, buttonModelOff);
    setButtonText(modelButton, 'Loading');
    document.getElementById('modelName').innerHTML = modelName;
    // (TODO) load the pre-trained model here
    audio.vocoder.model = undefined;
    modelButton.offEvent();
    if (callback) callback();
}

var audio;

window.addEventListener('load', (event) => {
    const modelName = '';
    const dataName = 'david_long_19_5_29_15_40_00';
    const mp3Name = 'david_cropped';
    audio = generateAudioNodes();
    setupModelPlayback(audio, modelName, () => {
        console.log('Model Playback Ready');
        setupDataPlaybackAndTrain(audio, dataName, () => {
            console.log('Dataset Playback Ready');
            enableAllButtons();
            // setupAudioPlayback(audio, mp3Name, () => {
            //     console.log('Audio Playback Ready');
            // });
        });
    });
});
