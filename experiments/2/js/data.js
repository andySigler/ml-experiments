function dataFolder() {
    var baseURL = window.location.href;
    if (baseURL[baseURL.length - 1] !== '/') {
        baseURL += '/';
    }
    return baseURL + 'data/';
}


function loadVoice(playerInstance, voiceName, callback) {
    console.log('loading audio file...');
    var mp3URL = dataFolder() + voiceName + '.mp3';
    var buffer = new Tone.Buffer(mp3URL, function() {
        console.log('Done Loading', mp3URL);
        playerInstance.buffer = buffer.get();
        playerInstance.fileDuration = buffer.duration;
        if (callback) callback();
    }, function(e) {
        console.log('error loading', mp3URL);
        console.log(e);
    });
}

function createCSVString(dataArray, labels) {
    var newFile = '';
    var rowLength = labels.length;
    for (var n=0,len=rowLength;n<len;n++) {
        newFile += String(labels[n]);
        if (n == len - 1) break;
        newFile += String(',');
    }
    newFile += '\r\n';
    for (var i=0;i<dataArray.length;i++) {
        for (var n=0;n<rowLength;n++) {
            newFile += String(dataArray[i][n]);
            if (n == rowLength - 1) break;
            newFile += ',';
        }
        newFile += '\r\n';
    }
    return newFile;
}

function generateCSV(data) {
    var link = document.getElementById('fileLink');
    link.href = '';
    link.innerHTML = 'Generating CSV...';
    var labels = vocoder.frequencies.slice()
    labels.unshift('pitch');
    var fileString = createCSVString(data, labels);
    var blob = new Blob(
        [fileString],
        {
            type: "text/csv;charset=utf-8"
        }
    );
    var url = window.URL.createObjectURL(blob);
    link.innerHTML = 'Click to Download CSV';
    link.href = url;
}

function loadCSVDataset(filename) {
    console.log('Loading CSV', filename);
    var csvURL = dataFolder() + filename + '.csv';
    return tf.data.csv(csvURL);
}

function parseRecordedData(data) {
    // tf parses data as an array of objects
    // where each key in the object is a feature from that sample
    // filter band features are numbers, labelling the frequency of that filter
    // this method converts filter band features to an ordered array of numbers
    // where the array's order is sorted by the filter's frequency
    var orderedKeys = [];
    if (data.length === undefined) {
        data = [data];
    }
    for (var key in data[0]) {
        if (data[0].hasOwnProperty(key) && key !== 'pitch') {
            orderedKeys.push(key);
        }
    }
    orderedKeys.sort((a, b) => {
        return parseFloat(a) - parseFloat(b);
    });
    for (var i=0;i<data.length;i++) {
        const spectrum = [];
        for (var n=0;n<orderedKeys.length;n++) {
            spectrum[n] = data[i][orderedKeys[n]];
        }
        data[i] = {
            pitch: data[i].pitch,
            spectrum: spectrum
        }
    }
    // {
    //     pitch: Number,
    //     spectrum: [Number, Number, ...]
    // }
    return data;
}
