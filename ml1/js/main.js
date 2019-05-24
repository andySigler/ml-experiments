console.log('main.js');

var resolution = 28;
var imageScale = 10;
var nnModel = undefined;

var modelURL = 'http://localhost:8000/ml1/data/model.json';

var currentState = [];
var targetState = [];
var stateStepSizes = [];
var stepDivider = 10;
var stepCount = 0;

function loadNNModel() {
    tf.loadLayersModel(modelURL).then(function(m) {
        nnModel = m;
        nnModel.summary();
        background(255);
    });
}

function getPrediction(input) {
    return nnModel.predict(input);
}

function getRandomInput() {
    return tf.randomUniform([1,100], -1.0, 1.0);
}

function newRandomTarget() {
    targetState = getRandomInput();
    stateStepSizes = tf.div(tf.sub(targetState, currentState), stepDivider);
}

function updateState() {
    currentState = tf.add(currentState, stateStepSizes);
    stepCount += 1;
    if (stepCount >= stepDivider) {
        stepCount = 0;
        newRandomTarget();
    }
}

function drawPrediction(prediction) {
    for (var i=0;i<prediction.length;i++) {
        var y = Math.floor(i / resolution);
        var x = i % resolution;
        var fillValue = map(prediction[i], -1, 1, 0, 255);
        fill(255 - fillValue);
        ellipse(x * imageScale, y * imageScale, imageScale, imageScale);
    }
}

function setup() {
    createCanvas(resolution * imageScale, resolution * imageScale);
    background(0);
    noStroke();
    currentState = getRandomInput();
    newRandomTarget();
    loadNNModel();
}

function draw() {
    if (nnModel) {
        updateState();
        drawPrediction(getPrediction(currentState).dataSync());
    }
}
