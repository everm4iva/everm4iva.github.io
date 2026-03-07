import { CONFIG } from "../config/GameConfig.js";

export default class EnemyProjectile {
  constructor(x, y, targetX, targetY, speed = CONFIG.PROJECTILES.ENEMY.SPEED) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.PROJECTILES.ENEMY.WIDTH;
    this.height = CONFIG.PROJECTILES.ENEMY.HEIGHT;
    this.speed = speed;
    this.damage = CONFIG.PROJECTILES.ENEMY.DAMAGE;
    this.color = CONFIG.PROJECTILES.ENEMY.COLOR;

    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  draw(ctx) {
    ctx.save();

    // Draw glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    // Draw projectile
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw dark center
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  isOffScreen(canvasWidth, canvasHeight) {
    return (
      this.x < -50 ||
      this.x > canvasWidth + 50 ||
      this.y < -50 ||
      this.y > canvasHeight + 50
    );
  }

  checkCollision(entity) {
    return (
      this.x < entity.x + entity.width &&
      this.x + this.width > entity.x &&
      this.y < entity.y + entity.height &&
      this.y + this.height > entity.y
    );
  }
}
