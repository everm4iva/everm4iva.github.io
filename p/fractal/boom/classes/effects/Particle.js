export default class Particle {
  constructor(x, y, color = "#ff6600") {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.01;
    this.gravity = 0.2;
    this.friction = 0.98;
  }

  update() {
    this.speedX *= this.friction;
    this.speedY *= this.friction;
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
    this.size *= 0.97;
  }

  draw(ctx) {
    // Optimized: no save/restore, no shadow - just draw
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead() {
    return this.alpha <= 0 || this.size <= 0.5;
  }
}

export class ExplosionParticle extends Particle {
  constructor(x, y) {
    const colors = ["#ff3300", "#ff6600", "#ff9900", "#ffcc00", "#ffffff"];
    super(x, y, colors[Math.floor(Math.random() * colors.length)]);
    this.size = Math.random() * 6 + 3;
    this.speedX = (Math.random() - 0.5) * 12;
    this.speedY = (Math.random() - 0.5) * 12;
    this.decay = Math.random() * 0.03 + 0.02;
  }
}

export class ProjectileTrail extends Particle {
  constructor(x, y) {
    super(x, y, "#ffff00");
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.decay = 0.05;
    this.gravity = 0;
  }
}
