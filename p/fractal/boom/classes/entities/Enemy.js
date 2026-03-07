import { CONFIG, getEnemyConfig } from "../config/GameConfig.js";

export default class Enemy {
  constructor(
    x,
    y,
    width = CONFIG.ENEMY.DEFAULT_SIZE,
    height = CONFIG.ENEMY.DEFAULT_SIZE,
    type = "dumb"
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'dumb', 'medium', 'smart', 'teleport'

    // Get config for this enemy type
    const config = getEnemyConfig(type);
    this.speed = config.SPEED;
    this.health = config.HEALTH;
    this.damage = config.DAMAGE;
    this.color = "#ff0000";

    // Fire transformation
    this.onFire = false;
    this.originalType = type;
    this.originalSpeed = this.speed;

    // Smart and medium enemy properties
    this.shootTimer = 0;
    this.shootInterval = config.SHOOT_INTERVAL || 120;
    this.dodgeTimer = 0;
    this.dodgeDirection = { x: 0, y: 0 };

    // Teleport enemy properties
    this.teleportTimer = 0;
    this.teleportInterval = config.TELEPORT_INTERVAL || 180;
    this.teleportCooldown = 0;
    this.alpha = 1;
    this.isTeleporting = false;

    // Load sprite
    this.sprite = new Image();
    this.sprite.src = "";
    this.spriteLoaded = false;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
  }

  update(playerX, playerY, projectiles = [], bombs = []) {
    // Helper functions
    const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y) || 1;
    const normalize = (v) => {
      const L = length(v);
      return { x: v.x / L, y: v.y / L };
    };
    const clampMag = (v, max) => {
      const L = length(v);
      if (L > max) return { x: (v.x / L) * max, y: (v.y / L) * max };
      return v;
    };

    // --- Shared avoidance: bombs ---
    let bombAvoid = { x: 0, y: 0 };
    let avoidingBomb = false;
    bombs.forEach((bomb) => {
      const dx = this.getCenterX() - bomb.x;
      const dy = this.getCenterY() - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const warningRadius = bomb.getWarningRadius();
      if (warningRadius > 0 && dist < warningRadius) {
        avoidingBomb = true;
        if (dist > 0) {
          bombAvoid.x += (dx / dist) * 3;
          bombAvoid.y += (dy / dist) * 3;
        }
      }
    });
    if (avoidingBomb) {
      const b = clampMag(bombAvoid, this.speed * 1.5);
      this.x += b.x;
      this.y += b.y;
      this._lastVel = b;
      return;
    }

    // --- Flocking components  --- //
    let flockSteer = { x: 0, y: 0 };
    if (
      CONFIG.ENEMY.FLOCKING &&
      CONFIG.ENEMY.FLOCKING.ENABLED &&
      this._gameEnemies
    ) {
      const cfg = CONFIG.ENEMY.FLOCKING;
      let sep = { x: 0, y: 0 },
        align = { x: 0, y: 0 },
        coh = { x: 0, y: 0 };
      let sepCount = 0,
        alignCount = 0,
        cohCount = 0,
        avgVel = { x: 0, y: 0 };
      for (const other of this._gameEnemies) {
        if (other === this) continue;
        const dx = this.getCenterX() - other.getCenterX();
        const dy = this.getCenterY() - other.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cfg.SEPARATION_RADIUS && dist > 0) {
          sep.x += dx / (dist * dist);
          sep.y += dy / (dist * dist);
          sepCount++;
        }
        if (dist < cfg.ALIGN_RADIUS && other._lastVel) {
          avgVel.x += other._lastVel.x;
          avgVel.y += other._lastVel.y;
          alignCount++;
        }
        if (dist < cfg.COHESION_RADIUS) {
          coh.x += other.getCenterX();
          coh.y += other.getCenterY();
          cohCount++;
        }
      }
      if (sepCount > 0) {
        flockSteer.x += (sep.x / sepCount) * cfg.SEPARATION_FORCE;
        flockSteer.y += (sep.y / sepCount) * cfg.SEPARATION_FORCE;
      }
      if (alignCount > 0) {
        flockSteer.x += (avgVel.x / alignCount) * cfg.ALIGN_FORCE;
        flockSteer.y += (avgVel.y / alignCount) * cfg.ALIGN_FORCE;
      }
      if (cohCount > 0) {
        const cx = coh.x / cohCount - this.getCenterX();
        const cy = coh.y / cohCount - this.getCenterY();
        flockSteer.x += (cx * cfg.COHESION_FORCE) / 100;
        flockSteer.y += (cy * cfg.COHESION_FORCE) / 100;
      }
      // Wall avoidance from flock config
      if (this._gameWalls) {
        for (const wall of this._gameWalls) {
          const wx = wall.x + wall.width / 2;
          const wy = wall.y + wall.height / 2;
          const dx = this.getCenterX() - wx;
          const dy = this.getCenterY() - wy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < cfg.WALL_AVOID_RADIUS && dist > 0) {
            flockSteer.x += (dx / (dist * dist)) * cfg.WALL_AVOID_FORCE;
            flockSteer.y += (dy / (dist * dist)) * cfg.WALL_AVOID_FORCE;
          }
        }
      }
      // Small randomness
      flockSteer.x += (Math.random() - 0.5) * cfg.RANDOMNESS;
      flockSteer.y += (Math.random() - 0.5) * cfg.RANDOMNESS;
    }

    // --- Projectile dodge (smart/teleport only) ---
    let dodgeSteer = { x: 0, y: 0 };
    if (
      (this.type === "smart" || this.type === "teleport") &&
      projectiles.length
    ) {
      for (const proj of projectiles) {
        const dx = proj.x - this.getCenterX();
        const dy = proj.y - this.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (CONFIG.ENEMY.TYPES.SMART.DODGE_RANGE || 80)) {
          // Predict projectile heading if available
          const pvx = proj.vx || 0;
          const pvy = proj.vy || 0;
          // Dodge perpendicular to projectile velocity or move away
          if (pvx !== 0 || pvy !== 0) {
            dodgeSteer.x += -pvy / (dist || 1);
            dodgeSteer.y += pvx / (dist || 1);
          } else {
            dodgeSteer.x += -dx / (dist || 1);
            dodgeSteer.y += -dy / (dist || 1);
          }
        }
      }
    }

    // --- Strategic point --- //
    let strategicSteer = { x: 0, y: 0 };
    if (this._gamePowerups && this._gamePowerups.length) {
      // Bias some enemies to move toward nearby powerups
      for (const pu of this._gamePowerups) {
        const dx = pu.x - this.getCenterX();
        const dy = pu.y - this.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && Math.random() < 0.01) {
          // occasional interest
          strategicSteer.x += dx / (dist || 1);
          strategicSteer.y += dy / (dist || 1);
        }
      }
    }

    // --- Type-based goal (seek player, keep distance, etc.) ---
    let goalSteer = { x: 0, y: 0 };
    if (this.type === "dumb") {
      // Dumb: direct seek (linear), no dodging, minimal flock influence
      const dx = playerX - this.getCenterX();
      const dy = playerY - this.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      goalSteer.x = (dx / dist) * this.speed;
      goalSteer.y = (dy / dist) * this.speed;
    } else if (this.type === "medium") {
      // Medium: seeks player, shoots; obeys flock steering but still mostly linear
      const dx = playerX - this.getCenterX();
      const dy = playerY - this.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desired = {
        x: (dx / dist) * this.speed,
        y: (dy / dist) * this.speed,
      };
      // maintain a comfortable distance
      if (dist < 100) {
        desired.x *= 0.5;
        desired.y *= 0.5;
      }
      goalSteer = desired;
      this.shootTimer++;
    } else if (this.type === "smart" || this.type === "teleport") {
      // Smart: more nuanced - keep some distance and circle, dodge projectiles
      const dx = playerX - this.getCenterX();
      const dy = playerY - this.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // prefer to stay at an optimal distance
      const optimal = CONFIG.ENEMY.TYPES.SMART.KEEP_DISTANCE || 150;
      const toPlayer = { x: dx / dist, y: dy / dist };
      // If too close, retreat; if too far, approach; else circle
      if (dist < optimal * 0.8) {
        goalSteer.x = -toPlayer.x * this.speed;
        goalSteer.y = -toPlayer.y * this.speed;
      } else if (dist > optimal * 1.2) {
        goalSteer.x = toPlayer.x * this.speed;
        goalSteer.y = toPlayer.y * this.speed;
      } else {
        // circle around player
        goalSteer.x = -toPlayer.y * this.speed * 0.6;
        goalSteer.y = toPlayer.x * this.speed * 0.6;
      }
      this.shootTimer++;
    }

    // Combine influences with weights
    const combined = { x: 0, y: 0 };
    // Base type goal is primary
    combined.x += goalSteer.x * 1.0;
    combined.y += goalSteer.y * 1.0;
    // flock contributes but less for dumb
    const flockWeight = this.type === "dumb" ? 0.3 : 0.8;
    combined.x += flockSteer.x * flockWeight;
    combined.y += flockSteer.y * flockWeight;
    // strategic points mild
    combined.x += strategicSteer.x * 0.6;
    combined.y += strategicSteer.y * 0.6;
    // dodge stronger for smart/teleport
    const dodgeWeight =
      this.type === "smart" || this.type === "teleport" ? 1.6 : 0.0;
    combined.x += dodgeSteer.x * dodgeWeight;
    combined.y += dodgeSteer.y * dodgeWeight;

    // Normalize and apply speed
    const final = clampMag(combined, this.speed * 1.5);

    // Apply movement & store last velocity
    this.x += final.x;
    this.y += final.y;
    this._lastVel = { x: final.x, y: final.y };

    // Teleport handling (overlay on smart behaviour)
    if (this.type === "teleport") {
      if (this.isTeleporting) {
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          const isFarTeleport = Math.random() < 0.5;
          const angle = Math.random() * Math.PI * 2;
          const distance = isFarTeleport
            ? 400 + Math.random() * 200
            : 200 + Math.random() * 150;
          this.x = playerX + Math.cos(angle) * distance;
          this.y = playerY + Math.sin(angle) * distance;
          this.isTeleporting = false;
          this.teleportCooldown = 60;
        }
      } else if (this.alpha < 1) {
        this.alpha += 0.05;
      } else {
        this.teleportTimer++;
        if (
          this.teleportTimer >= this.teleportInterval &&
          this.teleportCooldown === 0
        ) {
          this.isTeleporting = true;
          this.teleportTimer = 0;
        }
        if (this.teleportCooldown > 0) this.teleportCooldown--;
      }
    }
  }

  shouldShoot() {
    // Smart enemies aim more precisely; medium are easier
    const canShoot = this.type === "smart" || this.type === "medium";
    if (!canShoot) return false;

    const dx = (this._targetX || 0) - this.getCenterX();
    const dy = (this._targetY || 0) - this.getCenterY();
    const angleToTarget = Math.atan2(dy, dx);

    // If we don't have an aimed target, default to player position
    // (caller should set this._targetX/_targetY before calling shouldShoot)

    // Precision requirement
    const precision = this.type === "smart" ? 0.25 : 0.7; // radians tolerance

    // Only allow shooting when timer ready and roughly facing target
    if (this.shootTimer >= this.shootInterval) {
      // Compute facing vector from last velocity
      const last = this._lastVel || { x: 1, y: 0 };
      const facing = Math.atan2(last.y, last.x);
      const diff = Math.abs(
        ((angleToTarget - facing + Math.PI) % (2 * Math.PI)) - Math.PI
      );
      if (diff <= precision) {
        this.shootTimer = 0;
        return true;
      }
    }
    return false;
  }

  ignite() {
    if (!this.onFire) {
      this.onFire = true;
      // Transform to smart behavior if not already smart
      if (this.originalType !== "smart") {
        this.type = "smart";
        this.speed = this.originalSpeed * 1.5;
      } else {
        this.speed = this.originalSpeed * 1.5;
      }
    }
  }

  draw(ctx) {
    if (this.spriteLoaded) {
      ctx.save();

      // Apply teleport alpha
      if (this.type === "teleport") {
        ctx.globalAlpha = this.alpha;
      }

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff0000";
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

      // Draw type indicator (small dot)
      ctx.shadowBlur = 0;
      if (this.type === "smart") {
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      } else if (this.type === "medium") {
        ctx.fillStyle = "#ff8800";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      } else if (this.type === "teleport") {
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      }

      ctx.restore();
    } else {
      // Fallback to colored rectangle
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw fire effect if on fire
    if (this.onFire) {
      ctx.save();
      // White outline
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      // Fire texture overlay (simple noisy effect)
      ctx.globalAlpha = 0.4;
      const noiseSize = 4;
      for (let i = 0; i < this.width; i += noiseSize) {
        for (let j = 0; j < this.height; j += noiseSize) {
          if (Math.random() > 0.5) {
            const brightness = Math.floor(100 + Math.random() * 155);
            ctx.fillStyle = `rgb(255, ${brightness}, 0)`;
            ctx.fillRect(this.x + i, this.y + j, noiseSize, noiseSize);
          }
        }
      }
      ctx.restore();
    }
  }

  shouldLeaveFireTrail() {
    if (this.onFire && this.fireTrailTimer >= this.fireTrailInterval) {
      this.fireTrailTimer = 0;
      return true;
    }
    return false;
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

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
}
