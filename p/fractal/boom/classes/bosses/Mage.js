export default class Mage {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 1.5;
    this.health = 600;
    this.maxHealth = 400;
    this.color = "#8800ff";
    this.damage = 12;

    // AI behaviors
    this.behaviorTimer = 0;
    this.behaviorInterval = 180; // Change behavior every 3 seconds
    this.currentBehavior = "idle";

    // Abilities
    this.shootTimer = 0;
    this.shootInterval = 120; // Shoot every 2 seconds
    this.teleportTimer = 0;
    this.teleportInterval = 240; // Teleport every 4 seconds
    this.wallSummonTimer = 0;
    this.wallSummonInterval = 300; // Summon walls every 5 seconds
    this.pushPullTimer = 0;
    this.pushPullInterval = 200; // Push/pull every 3.3 seconds

    // Dodge mechanics
    this.dodgeTimer = 0;
    this.dodgeDirection = { x: 0, y: 0 };

    // Teleport animation
    this.alpha = 1;
    this.isTeleporting = false;
    this.teleportPhase = 0; // 0 = fade out, 1 = fade in

    // Visual effects
    this.pulseTimer = 0;
    this.trailParticles = [];

    // Invulnerability when no enemies around
    this.isVulnerable = false;
  }

  update(playerX, playerY, projectiles, enemyCount, width, height) {
    this.behaviorTimer++;
    this.shootTimer++;
    this.teleportTimer++;
    this.wallSummonTimer++;
    this.pushPullTimer++;
    this.pulseTimer += 0.1;

    // Vulnerable only if no other enemies around
    this.isVulnerable = enemyCount === 0;

    // Teleport behavior
    if (this.isTeleporting) {
      if (this.teleportPhase === 0) {
        // Fade out
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          // Teleport to new position
          const angle = Math.random() * Math.PI * 2;
          const distance = 150 + Math.random() * 150;
          this.x = Math.max(
            50,
            Math.min(width - 50, playerX + Math.cos(angle) * distance)
          );
          this.y = Math.max(
            50,
            Math.min(height - 50, playerY + Math.sin(angle) * distance)
          );
          this.teleportPhase = 1;
        }
      } else {
        // Fade in
        this.alpha += 0.05;
        if (this.alpha >= 1) {
          this.alpha = 1;
          this.isTeleporting = false;
          this.teleportPhase = 0;
        }
      }
      return; // Don't do other behaviors while teleporting
    }

    // Choose behavior
    if (this.behaviorTimer >= this.behaviorInterval) {
      const behaviors = ["chase", "evade", "circle"];
      this.currentBehavior =
        behaviors[Math.floor(Math.random() * behaviors.length)];
      this.behaviorTimer = 0;
    }

    // Movement based on behavior
    const dx = playerX - this.getCenterX();
    const dy = playerY - this.getCenterY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.currentBehavior === "chase") {
      // Move toward player
      if (distance > 200 && distance > 0) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    } else if (this.currentBehavior === "evade") {
      // Move away from player
      if (distance < 300 && distance > 0) {
        this.x -= (dx / distance) * this.speed;
        this.y -= (dy / distance) * this.speed;
      }
    } else if (this.currentBehavior === "circle") {
      // Circle around player
      if (distance > 0) {
        const perpX = -dy / distance;
        const perpY = dx / distance;
        this.x += perpX * this.speed;
        this.y += perpY * this.speed;
      }
    }

    // Dodge projectiles
    projectiles.forEach((proj) => {
      const pdx = proj.x - this.getCenterX();
      const pdy = proj.y - this.getCenterY();
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (dist < 100) {
        // Dodge perpendicular to projectile
        this.dodgeDirection.x = -pdy / dist;
        this.dodgeDirection.y = pdx / dist;
        this.x += this.dodgeDirection.x * this.speed * 2;
        this.y += this.dodgeDirection.y * this.speed * 2;
      }
    });

    // Keep in bounds
    this.x = Math.max(0, Math.min(width - this.width, this.x));
    this.y = Math.max(0, Math.min(height - this.height, this.y));
  }

  shouldShoot() {
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      return true;
    }
    return false;
  }

  shouldTeleport() {
    if (this.teleportTimer >= this.teleportInterval && !this.isTeleporting) {
      this.teleportTimer = 0;
      this.isTeleporting = true;
      return true;
    }
    return false;
  }

  shouldSummonWall() {
    if (this.wallSummonTimer >= this.wallSummonInterval) {
      this.wallSummonTimer = 0;
      return true;
    }
    return false;
  }

  shouldPushPull() {
    if (this.pushPullTimer >= this.pushPullInterval) {
      this.pushPullTimer = 0;
      return Math.random() < 0.5 ? "push" : "pull";
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Purple glow aura
    const pulse = Math.sin(this.pulseTimer) * 0.3 + 0.7;
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = "#8800ff";

    // Purple robed mage
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Robe highlight
    ctx.fillStyle = "#aa00ff";
    ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);

    // Invulnerability indicator
    if (!this.isVulnerable) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);

      // Shield particles
      for (let i = 0; i < 4; i++) {
        const angle = this.pulseTimer * 2 + (Math.PI * 2 * i) / 4;
        const radius = 25 + Math.sin(this.pulseTimer * 3) * 5;
        const px = this.getCenterX() + Math.cos(angle) * radius;
        const py = this.getCenterY() + Math.sin(angle) * radius;

        ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Purple energy particles
    if (Math.random() < 0.3) {
      const px = this.x + Math.random() * this.width;
      const py = this.y + Math.random() * this.height;
      ctx.fillStyle = `rgba(136, 0, 255, ${Math.random()})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

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

  takeDamage(amount, bypassShield = false) {
    if (!this.isVulnerable && !bypassShield) return false;
    this.health -= amount;
    return this.health <= 0;
  }
}
