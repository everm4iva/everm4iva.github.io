// TimeWarp.js - Slows down time for everything except the player

import { CONFIG } from "../config/GameConfig.js";

export default class TimeWarp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.POWERUPS.TIME_WARP.WIDTH;
    this.height = CONFIG.POWERUPS.TIME_WARP.HEIGHT;
    this.color = CONFIG.POWERUPS.TIME_WARP.COLOR;

    // Animation
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.08;
    this.rotation = 0;
    this.rotationSpeed = 0.03;
    this.pulsePhase = 0;
    this.ringRotation = 0;

    // Lifetime
    this.lifetime = CONFIG.POWERUPS.TIME_WARP.LIFETIME;
    this.age = 0;
  }

  update() {
    this.bobOffset += this.bobSpeed;
    this.rotation += this.rotationSpeed;
    this.ringRotation -= this.rotationSpeed * 2; // Outer ring spins opposite
    this.pulsePhase += 0.15;
    this.age++;
  }

  draw(ctx) {
    ctx.save();

    const bobY = Math.sin(this.bobOffset) * 6;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
    const fadeOut =
      this.age > this.lifetime - 120 ? (this.lifetime - this.age) / 120 : 1;

    ctx.globalAlpha = fadeOut;

    // Draw outer glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = this.color;

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bobY);

    // Outer rotating ring
    ctx.save();
    ctx.rotate(this.ringRotation);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.width * 0.8 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Ring segments (clock-like)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const innerR = this.width * 0.6 * pulse;
      const outerR = this.width * 0.75 * pulse;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
    ctx.restore();

    // Inner rotating core
    ctx.rotate(this.rotation);

    // Draw hourglass/clock shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    // Top triangle
    ctx.moveTo(0, (-this.height / 3) * pulse);
    ctx.lineTo((-this.width / 4) * pulse, 0);
    ctx.lineTo((this.width / 4) * pulse, 0);
    ctx.closePath();
    ctx.fill();

    // Bottom triangle
    ctx.beginPath();
    ctx.moveTo(0, (this.height / 3) * pulse);
    ctx.lineTo((-this.width / 4) * pulse, 0);
    ctx.lineTo((this.width / 4) * pulse, 0);
    ctx.closePath();
    ctx.fill();

    // Center bright point
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, 3 * pulse, 0, Math.PI * 2);
    ctx.fill();

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

  isDead() {
    return this.age >= this.lifetime;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}
