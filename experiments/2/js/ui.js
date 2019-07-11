function setButtonText(button, text) {
    button.innerHTML = button.innerHTML.split(' ')[0] + ' ' + text;
}

function enableAllInputs() {
    var buttons = document.getElementsByTagName('button');
    for (var i=0;i<buttons.length;i++) {
        buttons[i].disabled = false;
    }
    var inputs = document.getElementsByTagName('input');
    for (var i=0;i<inputs.length;i++) {
        inputs[i].disabled = false;
    }
}

function disableAllOtherInputs(el) {
    var buttons = document.getElementsByTagName('button');
    for (var i=0;i<buttons.length;i++) {
        if (el !== buttons[i]) buttons[i].disabled = true;
    }
    var inputs = document.getElementsByTagName('input');
    for (var i=0;i<inputs.length;i++) {
        if (el !== inputs[i]) inputs[i].disabled = true;
    }
}

function buttonOnOffEvents(button, onCallback, offCallback) {
    var isPoweredOn = false;
    button.onEvent = function () {
        isPoweredOn = true;
        setButtonText(button, 'Stop');
        onCallback();
    }
    button.offEvent = function () {
        isPoweredOn = false;
        setButtonText(button, 'Start');
        offCallback();
    }
    // the audio context must be turned on by a UI event
    var context = undefined;
    button.addEventListener('click', function() {
        if (!isPoweredOn) {
            if (context === undefined) {
                context = new AudioContext();
                context.resume().then(button.onEvent);
            }
            else {
                button.onEvent();
            }
        }
        else {
            button.offEvent();
        }
    });
}
