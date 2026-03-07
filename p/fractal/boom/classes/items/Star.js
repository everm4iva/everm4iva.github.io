export default class Star {
  constructor(x, y, directionX, directionY) {
    this.x = x;
    this.y = y;
    this.width = 130;
    this.height = 130;
    this.speed = 16;
    this.directionX = directionX;
    this.directionY = directionY;
    this.rotation = 0;
    this.rotationSpeed = 0.2;
    this.alpha = 1.0; // For fading effect

    // Lifetime management
    this.maxLifetime = 480;
    this.lifetime = 0;
    this.initialSize = 130;

    // Visual effects
    this.trail = [];
    this.glowPulse = 0;
  }

  update(canvasWidth, canvasHeight) {
    // Move
    this.x += this.directionX * this.speed;
    this.y += this.directionY * this.speed;

    // Rotate
    this.rotation += this.rotationSpeed;

    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.directionX *= -1;
      this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    }
    if (this.y <= 0 || this.y + this.height >= canvasHeight) {
      this.directionY *= -1;
      this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }

    // Update lifetime and shrink
    this.lifetime++;
    const lifeProgress = this.lifetime / this.maxLifetime;
    this.width = Math.max(2, this.initialSize * (1 - lifeProgress)); // Shrink to nearly 0
    this.height = Math.max(2, this.initialSize * (1 - lifeProgress));

    // Glow pulse
    this.glowPulse += 0.1;

    // Add trail
    this.trail.push({
      x: this.getCenterX(),
      y: this.getCenterY(),
      alpha: 1,
    });

    // Update trail
    this.trail = this.trail.filter((t) => {
      t.alpha -= 0.05;
      return t.alpha > 0;
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Draw trail
    this.trail.forEach((t) => {
      ctx.fillStyle = `rgba(255, 255, 0, ${t.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const centerX = this.getCenterX();
    const centerY = this.getCenterY();
    const pulse = Math.sin(this.glowPulse) * 0.3 + 0.7;

    // Glow effect
    ctx.shadowBlur = 30 * pulse;
    ctx.shadowColor = "#ffff00";

    // Rotate star
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);

    // Draw star shape
    const spikes = 5;
    const outerRadius = this.width / 2;
    const innerRadius = outerRadius * 0.5;

    ctx.fillStyle = "#ffff00";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner glow
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  checkCollision(entity) {
    return (
      this.x < entity.x + entity.width &&
      this.x + this.width > entity.x &&
      this.y < entity.y + entity.height &&
      this.y + this.height > entity.y
    );
  }

  isDead() {
    return this.lifetime >= this.maxLifetime;
  }

  die() {
    this.lifetime = this.maxLifetime;
  }
}
