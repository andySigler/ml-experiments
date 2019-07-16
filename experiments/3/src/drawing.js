export const setupCanvas = (s, parentName, width, height) => {
  s.noLoop()
  const canvas = s.createCanvas(width, height)
  canvas.parent(parentName)
  clearCanvas(s)
  return canvas.elt
}

export const drawLine = (s, x1, y1, x2, y2) => {
  s.stroke(0)
  s.strokeWeight(1)
  s.line(x1, y1, x2, y2)
}

export const drawLineRelative = (s, x1, y1, x2, y2) => {
  drawLine(s, x1 * s.width, y1 * s.height, x2 * s.width, y2 * s.height)
}

export const clearCanvas = (s) => {
  s.background(255)
}

export const createDrawingEvents = (s, canvas, onStoppedDrawing, onNewPoint) => {
  let previouslyDrawing = false
  let pX, pY, startMillis
  const saveDrawingState = (newTime) => {
    previouslyDrawing = true
    pX = s.mouseX
    pY = s.mouseY
  }
  const stoppedDrawing = () => {
    previouslyDrawing = false
    onStoppedDrawing()
  }
  s.mouseReleased = stoppedDrawing
  s.mouseDragged = (e) => {
    if (e.target !== canvas) {
      stoppedDrawing()
      return
    }
    // ignore event if didn't move at all
    if (pX === s.mouseX && pY === s.mouseY) return
    const now = s.millis()
    // if just started moving, then this is the start time
    if (!previouslyDrawing) startMillis = now
    // save the absolute normalized XY movement, and relative time in millis
    onNewPoint(
      now - startMillis,
      s.mouseX / s.width,
      s.mouseY / s.height)
    // only draw a line if there was a previously saved point
    if (previouslyDrawing) {
      drawLine(s, pX, pY, s.mouseX, s.mouseY)
    }
    // save the current point to the previous point
    saveDrawingState()
  }
}
