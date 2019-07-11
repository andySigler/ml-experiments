var resolution = 28;
var imageScale = 10;
var inputDim = resolution * resolution;

var blueColor = '#10bf9b';

var canvasWidth = resolution * imageScale;
var canvasHeight = resolution * imageScale;

// var modelURL = 'http://localhost:8000/experiments/1/data/model.json';
var modelURL = './data/model.json';
var nnModel = undefined;
var firstUpdate = false;

var outputState = [];
var inputState = [];
var prevInputState = [];
var prevOutputState = [];

var inputFeedback = 0.01;
var outputFeedback = 0.25

var predictTimeout = undefined;

function initInputOutputValues() {
    for (var i=0;i<inputDim;i++) {
        inputState[i] = -1;
        outputState[i] = -1;
        prevInputState[i] = -1;
        prevOutputState[i] = -1;
    }
}

function loadNNModel(callback) {
    tf.loadLayersModel(modelURL).then(function(m) {
        nnModel = m;
        // nnModel.summary();
        if (callback) {
            callback();
        }
    });
}

function arrayToTensor() {
    return tf.tensor(inputState, [1, inputDim]);
}

function updateOutput(callback) {
    if (predictTimeout === undefined) {
        predictTimeout = setTimeout(function() {
            nnModel.predict(arrayToTensor()).data().then(function(d) {
                outputState = d;
                predictTimeout = undefined;
                if (callback) {
                    callback();
                }
            });
        }, 1);
    }
}

function initModel() {
    var messageDiv = document.getElementById('message');
    messageDiv.innerHTML = 'Loading model...';
    loadNNModel(function() {
        messageDiv.innerHTML = 'Initializing...';
        updateOutput(function() {
            messageDiv.innerHTML = 'Ready, try moving your cursor on the drawing';
        })
    });
}

function drawOutput() {
    for (var i=0;i<outputState.length;i++) {
        var diff = outputState[i] - prevOutputState[i];
        var state;
        if (Math.abs(diff) < 0.1) {
            state = outputState[i];
        }
        else {
            state = prevOutputState[i] + (diff * outputFeedback);
        }
        prevOutputState[i] = state;
        var y = Math.floor(i / resolution);
        y = (y * imageScale) + (imageScale / 2);
        var x = i % resolution;
        x = (x * imageScale) + (imageScale / 2);
        var scaleValue = map(state, -1, 1, 0, 1);
        if (imageScale > 0.1) {
            noStroke();
            fill(0);
            ellipse(x, y, imageScale * scaleValue, imageScale * scaleValue);
        }
    }
}

function updateInputValues() {
    var returnVal = false;
    for (var i=0;i<inputState.length;i++) {
        var y = Math.floor(i / resolution);
        y = (y * imageScale) + (imageScale / 2);
        var x = i % resolution;
        x = (x * imageScale) + (imageScale / 2);
        var dx = mouseX - x;
        var dy = mouseY - y;
        var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        var thresh = Math.sqrt(Math.pow(imageScale / 2, 2) + Math.pow(imageScale / 2, 2));
        if (distance <= thresh) {
            inputState[i] = 1.0;
        }
        else if (inputState[i] > -0.95){
            inputState[i] -= (inputState[i] - (-1)) * inputFeedback;
        }
        else {
            inputState[i] = -1.0;
        }
        inputState[i] = parseFloat(inputState[i].toFixed(3));
        if (inputState[i] !== prevInputState[i]) {
            returnVal = true;
        }
        prevInputState[i] = inputState[i];
    }
    return returnVal;
}

function drawInput() {
    for (var i=0;i<inputState.length;i++) {
        var y = Math.floor(i / resolution);
        y = (y * imageScale) + (imageScale / 2);
        var x = i % resolution;
        x = (x * imageScale) + (imageScale / 2);
        var scaleValue = map(inputState[i], -1, 1, 0, 1);
        if (scaleValue > 0.1) {
            stroke(blueColor);
            // noStroke();
            // fill('rgba(0, 193, 123, 0.25)');
            noFill();
            ellipse(x, y, imageScale * scaleValue, imageScale * scaleValue);
        }
    }
}

function drawCanvasFrame() {
    noFill();
    stroke(0);
    rect(0, 0, canvasWidth - 1, canvasHeight - 1);
}

function moveCanvas() {
    var c = document.getElementById('defaultCanvas0');
    c.parentNode.removeChild(c);
    document.getElementById('canvas').appendChild(c);
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    moveCanvas();
    initInputOutputValues();
    initModel();
}

function draw() {
    background(255);
    if (updateInputValues() && nnModel) {
        updateOutput();
    }
    drawInput();
    drawOutput();
    drawCanvasFrame();
}
