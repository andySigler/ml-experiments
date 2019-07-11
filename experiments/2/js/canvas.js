function canvasMouseBars(x, y) {
    if (x === undefined || y == undefined) {
        x = mouseX;
        y = mouseY;
    }
    stroke('#10bf9b');
    noFill();
    strokeWeight(3);
    line(0, y, width, y);
    line(x, 0, x, height);
}

function canvasSetup(canvasWidth, canvasHeight, onUpdate) {
    createCanvas(canvasWidth, canvasHeight);
    var c = document.getElementById('defaultCanvas0');
    c.parentNode.removeChild(c);
    document.getElementById('canvas').appendChild(c);
    let prevX = mouseX;
    let prevY = mouseY;
    c.addEventListener("mousemove", () => {
        canvasUpdate();
        if (onUpdate && (prevX !== mouseX || prevY !== mouseY)) {
            prevX = mouseX;
            prevY = mouseY;
            var relX = mouseX / width;
            var relY = mouseY / height;
            onUpdate(relX, relY);
        }
        else {
            prevX = mouseX;
            prevY = mouseY;
        }
    });
    background(245);
    canvasMouseBars(canvasWidth / 2, canvasHeight / 2);
}

function canvasUpdate() {
    background(245);
    canvasMouseBars();
}
