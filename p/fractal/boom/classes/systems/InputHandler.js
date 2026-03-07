export default class InputHandler {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false };
    this.mouseDown = false; // Track if left mouse button is held
    this.pausePressed = false;
    this.resetPressed = false;
    this.firstInputDetected = false;
    this.firstInputTime = 0;

    // DOUBLE-TAP DASH SYSTEM
    this.doubleTapWindow = 250; // ms window for double-tap
    this.lastKeyTime = {}; // Track last press time for each key
    this.lastKeyState = {}; // Track if key was released
    this.dashRequest = null; // { direction: {x, y} } when double-tap detected

    window.addEventListener("keydown", (e) => {
      if (!this.firstInputDetected) {
        this.firstInputDetected = true;
        this.firstInputTime = Date.now();
      }

      const key = e.key.toLowerCase();

      // Check for double-tap on movement keys
      if (["w", "a", "s", "d"].includes(key)) {
        const now = Date.now();

        // Only trigger if key was released and pressed again quickly
        if (
          this.lastKeyState[key] === "released" &&
          this.lastKeyTime[key] &&
          now - this.lastKeyTime[key] < this.doubleTapWindow
        ) {
          // Double-tap detected!
          this.dashRequest = this.getDashDirection(key);
          this.lastKeyTime[key] = 0; // Reset to prevent triple-tap
        } else if (!this.keys.has(key) && !this.keys.has(key.toUpperCase())) {
          // First press - record time
          this.lastKeyTime[key] = now;
        }
        this.lastKeyState[key] = "pressed";
      }

      this.keys.add(e.key);

      // Handle pause
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        this.pausePressed = true;
      }

      // Handle reset
      if (e.key === "r" || e.key === "R") {
        this.resetPressed = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);

      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        this.lastKeyState[key] = "released";
        // Update time on release for accurate double-tap detection
        this.lastKeyTime[key] = Date.now();
      }
    });
  }

  getDashDirection(key) {
    switch (key) {
      case "w":
        return { x: 0, y: -1 };
      case "s":
        return { x: 0, y: 1 };
      case "a":
        return { x: -1, y: 0 };
      case "d":
        return { x: 1, y: 0 };
      default:
        return null;
    }
  }

  consumeDashRequest() {
    const dash = this.dashRequest;
    this.dashRequest = null;
    return dash;
  }

  setupMouseListeners(canvas, onShoot, onRightClick) {
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouseDown = true;
        if (!this.firstInputDetected) {
          this.firstInputDetected = true;
          this.firstInputTime = Date.now();
        }
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouseDown = false;
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.mouseDown = false;
    });

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!this.firstInputDetected) {
        this.firstInputDetected = true;
        this.firstInputTime = Date.now();
      }

      if (onRightClick) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        onRightClick(mouseX, mouseY);
      }
    });
  }

  consumePausePress() {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  consumeResetPress() {
    const pressed = this.resetPressed;
    this.resetPressed = false;
    return pressed;
  }

  shouldShowInstructions() {
    if (!this.firstInputDetected) return true;
    return Date.now() - this.firstInputTime < 10000; // Hide after 10 seconds
  }
}
