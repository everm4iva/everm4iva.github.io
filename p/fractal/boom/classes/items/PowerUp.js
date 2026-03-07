export default class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // 'health' or 'multishot'
    this.color = type === "health" ? "#ffff00" : "#ff00ff";
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.05;
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.pulsePhase = 0;

    // For multishot, determine random bullet count (x3 to x7)
    if (type === "multishot") {
      this.bulletCount = Math.floor(Math.random() * 5) + 3; // 3 to 7
    }
  }

  update() {
    // Bobbing animation
    this.bobOffset += this.bobSpeed;
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.1;
  }

  draw(ctx) {
    ctx.save();

    const bobY = Math.sin(this.bobOffset) * 5;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;

    // Draw glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = this.color;

    // Rotate around center
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bobY);
    ctx.rotate(this.rotation);

    // Draw square
    ctx.fillStyle = this.color;
    ctx.fillRect(
      (-this.width / 2) * pulse,
      (-this.height / 2) * pulse,
      this.width * pulse,
      this.height * pulse
    );

    // Draw inner bright square
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      (-this.width / 4) * pulse,
      (-this.height / 4) * pulse,
      (this.width / 2) * pulse,
      (this.height / 2) * pulse
    );

    // Draw symbol
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (this.type === "health") {
      ctx.fillText("+", 0, 0);
    } else {
      ctx.fillText(`×${this.bulletCount}`, 0, 0);
    }

    ctx.restore();
  }

  checkCollision(entity) {
    return (
      this.x < entity.x + entity.width &&
      this.x + this.width > entity.x &&
      this.y < entity.y + entity.height &&
      this.y + this.height > entity.y
    );
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}
