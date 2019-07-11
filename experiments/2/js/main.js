function setupAudioPlayback(audio, voiceName, callback) {
    // create all audio events for the button
    const mp3Button = document.getElementById('mp3Button');
    const checkbox = document.getElementById('mp3Record');
    let timeoutEventAutoOff = undefined;
    const buttonAudioOn = () => {
        disableAllOtherInputs(mp3Button);
        // ON state
        audio.events.on();
        // modulator.seek(Math.random() * modulator.fileDuration);
        const shouldRecord = checkbox.checked;
        audio.vocoder.startMP3(shouldRecord);
        if (modulator.fileDuration > 0) {
            // automatically turn audio OFF when file's duration has passed
            if (timeoutEventAutoOff) clearTimeout(timeoutEventAutoOff);
            timeoutEventAutoOff = setTimeout(
                mp3Button.offEvent,  // run full button event, to set it's state
                modulator.fileDuration * 1000
            );
        }
    }
    const buttonAudioOff = () => {
        enableAllInputs();
        // OFF state
        if (timeoutEventAutoOff) clearTimeout(timeoutEventAutoOff);
        audio.events.off();
        const saveData = audio.vocoder.stopMP3();
        if (saveData) {
            generateCSV(saveData);
        }
    }
    // attach the events to the button
    buttonOnOffEvents(mp3Button, buttonAudioOn, buttonAudioOff);
    // finally, load in the mp3 file to the Tone.Player
    setButtonText(mp3Button, 'Loading');
    loadVoice(audio.modulator, voiceName, () => {
        mp3Button.offEvent();
        if (callback) callback();
    });
}

function setupDecoderPlayback(audio, modelName, callback) {
    const decoderButton = document.getElementById('decoderButton');
    const buttonDecoderOn = () => {
        disableAllOtherInputs(decoderButton);
        audio.vocoder.startDecoderPlayback();
        audio.events.on();
    }
    const buttonDecoderOff = () => {
        enableAllInputs();
        audio.events.off();
        audio.vocoder.stopDecoderPlayback();
    }
    buttonOnOffEvents(decoderButton, buttonDecoderOn, buttonDecoderOff);
    setButtonText(decoderButton, 'Loading');
    loadModelJSON(modelName, (model) => {
        // split the model, so the input is the 2-valued latent space
        //
        audio.vocoder.decoder = model;
        decoderButton.offEvent();
        if (callback) callback();
    });
}

// global for debugging
let audio;

function setup() {
    noLoop();  // don't use p5.js loop() function
    const modelName = 'decoder';
    const mp3Name = 'david_cropped';
    canvasSetup(450, 450, (x, y) => {
        // set the new XY values to be the target latent space
        // of the vocoder's decoder model
        const newTarget = tf.tensor1d([x, y], 'float32');
        // newTarget.print();
        audio.vocoder.setTargetLatentState(newTarget);
    });
    console.log('Canvas Ready');
    audio = generateAudioNodes();
    setupAudioPlayback(audio, mp3Name, () => {
        console.log('Audio Playback Ready');
        enableAllInputs();
        setupDecoderPlayback(audio, modelName, () => {
            console.log('Decoder Playback Ready');
            enableAllInputs();
        });
    });
}

// no use, leave empty
function loop() {}
