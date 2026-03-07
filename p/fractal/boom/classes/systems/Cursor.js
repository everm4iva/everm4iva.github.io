export default class Cursor {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.state = "default"; // default, bomb, crystal, star
    this.rotation = 0;

    // Create cursor element
    this.element = document.createElement("div");
    this.element.id = "customCursor";
    this.element.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32">
                <circle class="cursor-circle" cx="16" cy="16" r="12" fill="none" stroke="#4714FF" stroke-width="2"/>
                <rect class="cursor-square" x="6" y="6" width="20" height="20" fill="none" stroke="#00ffff" stroke-width="2" opacity="0"/>
                <rect class="cursor-cube" x="8" y="8" width="16" height="16" fill="none" stroke="#ffff00" stroke-width="2" opacity="0"/>
                <g class="cursor-crosshair" opacity="0">
                    <line x1="16" y1="4" x2="16" y2="12" stroke="#ff4400" stroke-width="2"/>
                    <line x1="16" y1="20" x2="16" y2="28" stroke="#ff4400" stroke-width="2"/>
                    <line x1="4" y1="16" x2="12" y2="16" stroke="#ff4400" stroke-width="2"/>
                    <line x1="20" y1="16" x2="28" y2="16" stroke="#ff4400" stroke-width="2"/>
                </g>
            </svg>
        `;

    // Style the cursor container
    this.element.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            width: 32px;
            height: 32px;
            transform: translate(-50%, -50%);
        `;

    document.body.appendChild(this.element);

    // Get SVG elements
    this.svg = this.element.querySelector("svg");
    this.circle = this.element.querySelector(".cursor-circle");
    this.square = this.element.querySelector(".cursor-square");
    this.cube = this.element.querySelector(".cursor-cube");
    this.crosshair = this.element.querySelector(".cursor-crosshair");

    // Add CSS transitions to SVG elements for smooth morphing
    const transitionStyle = "opacity 0.15s ease";
    this.circle.style.transition = transitionStyle;
    this.square.style.transition = transitionStyle;
    this.cube.style.transition = transitionStyle;
    this.crosshair.style.transition = transitionStyle;

    // Hide default cursor
    document.body.style.cursor = "none";

    // Track mouse movement
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseLeave = this.onMouseLeave.bind(this);
    this.boundMouseEnter = this.onMouseEnter.bind(this);

    document.addEventListener("mousemove", this.boundMouseMove);
    document.addEventListener("mouseleave", this.boundMouseLeave);
    document.addEventListener("mouseenter", this.boundMouseEnter);

    // Animation loop for spinning
    this.lastTime = performance.now();
    this.animate();
  }

  onMouseMove(e) {
    this.x = e.clientX;
    this.y = e.clientY;
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  onMouseLeave() {
    this.element.style.opacity = "0";
  }

  onMouseEnter() {
    this.element.style.opacity = "1";
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.updateVisuals();
  }

  updateVisuals() {
    // Reset all elements
    this.circle.style.opacity = "0";
    this.square.style.opacity = "0";
    this.cube.style.opacity = "0";
    this.crosshair.style.opacity = "0";

    switch (this.state) {
      case "default":
        this.circle.style.opacity = "1";
        break;
      case "bomb":
        this.crosshair.style.opacity = "1";
        break;
      case "crystal":
        this.square.style.opacity = "1";
        break;
      case "star":
        this.cube.style.opacity = "1";
        break;
    }
  }

  triggerShoot() {
    // No visual change on shoot
  }

  animate() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Spin for crystal
    if (this.state === "crystal") {
      this.rotation += delta * 0.3;
    } else {
      // Smoothly return to 0
      this.rotation *= 0.9;
      if (Math.abs(this.rotation % 360) < 1) this.rotation = 0;
    }

    // Apply rotation
    const rotationDeg = this.rotation % 360;
    this.svg.style.transform = `rotate(${rotationDeg}deg)`;

    requestAnimationFrame(() => this.animate());
  }

  destroy() {
    document.removeEventListener("mousemove", this.boundMouseMove);
    document.removeEventListener("mouseleave", this.boundMouseLeave);
    document.removeEventListener("mouseenter", this.boundMouseEnter);
    this.element.remove();
    document.body.style.cursor = "auto";
  }
}
