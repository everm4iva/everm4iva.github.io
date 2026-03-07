// ObjectPool.js - Reusable object pooling system for performance
// Instead of creating/destroying objects, we recycle them!

import CONFIG from "../config/GameConfig.js";

export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 50) {
    this.createFn = createFn; // Function to create new object
    this.resetFn = resetFn; // Function to reset object for reuse
    this.pool = [];
    this.active = [];

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(...args) {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    this.resetFn(obj, ...args);
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop());
    }
  }

  getActive() {
    return this.active;
  }

  getActiveCount() {
    return this.active.length;
  }

  getAvailableCount() {
    return this.pool.length;
  }
}

export class ParticlePool {
  constructor(initialSize = CONFIG.POOLS.PARTICLES) {
    this.pool = [];
    this.active = [];

    // Pre-populate with generic particle objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this._createParticle());
    }
  }

  _createParticle() {
    return {
      x: 0,
      y: 0,
      size: 0,
      speedX: 0,
      speedY: 0,
      color: "#ffffff",
      alpha: 1,
      decay: 0.02,
      gravity: 0,
      friction: 0.98,
      type: "default", // 'default', 'explosion', 'trail'
      active: false,
    };
  }

  // Spawn a default particle
  spawn(x, y, color = "#ff6600") {
    const p = this.pool.length > 0 ? this.pool.pop() : this._createParticle();
    const cfg = CONFIG.PARTICLES.DEFAULT;

    p.x = x;
    p.y = y;
    p.size = Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE) + cfg.MIN_SIZE;
    p.speedX = (Math.random() - 0.5) * cfg.MAX_SPEED;
    p.speedY = (Math.random() - 0.5) * cfg.MAX_SPEED;
    p.color = color;
    p.alpha = 1;
    p.decay = Math.random() * (cfg.MAX_DECAY - cfg.MIN_DECAY) + cfg.MIN_DECAY;
    p.gravity = cfg.GRAVITY;
    p.friction = cfg.FRICTION;
    p.type = "default";
    p.active = true;

    this.active.push(p);
    return p;
  }

  // Spawn an explosion particle (single)

  _spawnExplosionSingle(x, y) {
    const p = this.pool.length > 0 ? this.pool.pop() : this._createParticle();
    const cfg = CONFIG.PARTICLES.EXPLOSION;

    p.x = x;
    p.y = y;
    p.size = Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE) + cfg.MIN_SIZE;
    p.speedX = (Math.random() - 0.5) * cfg.MAX_SPEED;
    p.speedY = (Math.random() - 0.5) * cfg.MAX_SPEED;
    p.color = cfg.COLORS[Math.floor(Math.random() * cfg.COLORS.length)];
    p.alpha = 1;
    p.decay = Math.random() * (cfg.MAX_DECAY - cfg.MIN_DECAY) + cfg.MIN_DECAY;
    p.gravity = CONFIG.PARTICLES.DEFAULT.GRAVITY;
    p.friction = CONFIG.PARTICLES.DEFAULT.FRICTION;
    p.type = "explosion";
    p.active = true;

    this.active.push(p);
    return p;
  }

  // Spawn multiple explosion particles
  spawnExplosion(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this._spawnExplosionSingle(x, y);
    }
  }

  // Spawn a projectile trail particle (single)
  _spawnTrailSingle(x, y, color = "#ffff00") {
    const p = this.pool.length > 0 ? this.pool.pop() : this._createParticle();
    const cfg = CONFIG.PARTICLES.TRAIL;

    p.x = x;
    p.y = y;
    p.size = Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE) + cfg.MIN_SIZE;
    p.speedX = (Math.random() - 0.5) * cfg.SPEED;
    p.speedY = (Math.random() - 0.5) * cfg.SPEED;
    p.color = color;
    p.alpha = 1;
    p.decay = cfg.DECAY;
    p.gravity = 0;
    p.friction = 1;
    p.type = "trail";
    p.active = true;

    this.active.push(p);
    return p;
  }

  // Spawn trail particles (batch version with optional color and count)
  spawnTrail(x, y, color = "#ffff00", count = 1) {
    for (let i = 0; i < count; i++) {
      this._spawnTrailSingle(x, y, color);
    }
  }

  // Update all active particles
  update() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];

      // Physics update
      p.speedX *= p.friction;
      p.speedY *= p.friction;
      p.speedY += p.gravity;
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= p.decay;
      p.size *= 0.97;

      // Check if dead
      if (p.alpha <= 0 || p.size <= 0.5) {
        p.active = false;
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  // Draw all active particles
  draw(ctx) {
    for (let i = 0; i < this.active.length; i++) {
      const p = this.active[i];
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Get count of active particles
  getActiveCount() {
    return this.active.length;
  }

  // Clear all particles
  clear() {
    while (this.active.length > 0) {
      const p = this.active.pop();
      p.active = false;
      this.pool.push(p);
    }
  }
}

// Projectile Pool - Specialized pool for projectiles
export class ProjectilePool {
  constructor(initialSize = CONFIG.POOLS.PROJECTILES) {
    this.pool = [];
    this.active = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this._createProjectile());
    }
  }

  _createProjectile() {
    return {
      x: 0,
      y: 0,
      width: 5,
      height: 5,
      speed: 7,
      damage: 20,
      color: "#ffff00",
      velocityX: 0,
      velocityY: 0,
      active: false,
      isEnemy: false,
    };
  }

  // Spawn a player projectile
  spawn(x, y, targetX, targetY) {
    const p = this.pool.length > 0 ? this.pool.pop() : this._createProjectile();
    const cfg = CONFIG.PROJECTILES.PLAYER;

    p.x = x;
    p.y = y;
    p.width = cfg.WIDTH;
    p.height = cfg.HEIGHT;
    p.speed = cfg.SPEED;
    p.damage = cfg.DAMAGE;
    p.color = cfg.COLOR;
    p.isEnemy = false;
    p.active = true;

    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    p.velocityX = (dx / distance) * p.speed;
    p.velocityY = (dy / distance) * p.speed;

    this.active.push(p);
    return p;
  }

  // Spawn an enemy projectile
  spawnEnemy(x, y, targetX, targetY) {
    const p = this.pool.length > 0 ? this.pool.pop() : this._createProjectile();
    const cfg = CONFIG.PROJECTILES.ENEMY;

    p.x = x;
    p.y = y;
    p.width = cfg.WIDTH;
    p.height = cfg.HEIGHT;
    p.speed = cfg.SPEED;
    p.damage = cfg.DAMAGE;
    p.color = cfg.COLOR;
    p.isEnemy = true;
    p.active = true;

    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    p.velocityX = (dx / distance) * p.speed;
    p.velocityY = (dy / distance) * p.speed;

    this.active.push(p);
    return p;
  }

  // Update all active projectiles
  update() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.x += p.velocityX;
      p.y += p.velocityY;
    }
  }

  // Release a projectile back to pool
  release(projectile) {
    const index = this.active.indexOf(projectile);
    if (index > -1) {
      projectile.active = false;
      this.active.splice(index, 1);
      this.pool.push(projectile);
    }
  }

  // Check if projectile is off screen and release it
  releaseIfOffScreen(projectile, width, height) {
    const margin = projectile.isEnemy ? 50 : 0;
    if (
      projectile.x < -margin ||
      projectile.x > width + margin ||
      projectile.y < -margin ||
      projectile.y > height + margin
    ) {
      this.release(projectile);
      return true;
    }
    return false;
  }

  // Draw all active projectiles
  draw(ctx) {
    for (let i = 0; i < this.active.length; i++) {
      const p = this.active[i];

      ctx.save();
      ctx.shadowBlur = p.isEnemy ? 15 : 20;
      ctx.shadowColor = p.color;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.isEnemy ? p.width / 2 : p.width,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Center dot
      ctx.fillStyle = p.isEnemy ? "#000000" : "#ffffff";
      ctx.beginPath();
      ctx.arc(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.isEnemy ? p.width / 4 : p.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
    }
  }

  // Get all active projectiles
  getActive() {
    return this.active;
  }

  // Clear all projectiles
  clear() {
    while (this.active.length > 0) {
      const p = this.active.pop();
      p.active = false;
      this.pool.push(p);
    }
  }

  // Check collision with entity
  checkCollision(projectile, entity) {
    return (
      projectile.x < entity.x + entity.width &&
      projectile.x + projectile.width > entity.x &&
      projectile.y < entity.y + entity.height &&
      projectile.y + projectile.height > entity.y
    );
  }
}

export default { ObjectPool, ParticlePool, ProjectilePool };
