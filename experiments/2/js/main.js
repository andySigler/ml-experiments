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
    var buttonTrainOn = () => {
        // create the model
        var model = createModel();
        // train it (monitor)
        trainModel(model, dataset);
        // test results using vocoder
        audio.vocoder.model = model;
        // reset the button's state when training is done
        trainButton.offEvent();
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
    // load the pre-trained model here
    audio.vocoder.model = undefined;
    modelButton.offEvent();
    if (callback) callback();
}

window.addEventListener('load', (event) => {
    const dataName = 'david_long_19_5_29_15_40_00';
    const voiceName = 'david_cropped';
    const modelName = '';
    var audio = generateAudioNodes();
    setupModelPlayback(audio, modelName, () => {
        console.log('Model Playback Ready');
        setupDataPlaybackAndTrain(audio, dataName, () => {
            console.log('Dataset Playback Ready');
            enableAllButtons();
            // setupAudioPlayback(audio, voiceName, () => {
            //     console.log('Audio Playback Ready');
            //     enableAllButtons();
            // });
        });
    });
});
