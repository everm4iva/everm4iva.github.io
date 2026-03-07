export default class Nova {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 2;
    this.health = 800;
    this.maxHealth = 800;
    this.savedHealth = 800; // For when she disappears
    this.color = "#ff00ff";
    this.damage = 20;

    // AI behaviors
    this.behaviorTimer = 0;
    this.behaviorInterval = 120; // Change behavior every 2 seconds
    this.currentBehavior = "idle";

    // Abilities
    this.laserTimer = 0;
    this.laserInterval = 180; // Laser every 3 seconds
    this.teleportTimer = 0;
    this.teleportInterval = 200; // Teleport every 3.3 seconds
    this.playerTeleportTimer = 0;
    this.playerTeleportInterval = 360; // Teleport player every 6 seconds
    this.summonTimer = 0;
    this.summonInterval = 300; // Summon enemies every 5 seconds
    this.disappearTimer = 0;
    this.disappearInterval = 1800; // Disappear every 30 seconds

    // Teleport animation
    this.alpha = 1;
    this.isTeleporting = false;
    this.teleportPhase = 0; // 0 = fade out, 1 = fade in

    // Visual effects
    this.pulseTimer = 0;
    this.glitchAura = [];
    this.generateGlitchAura();

    // Invulnerability when no enemies around
    this.isVulnerable = false;
    this.shieldBroken = false; // Stars can break shield permanently

    // Active state (can disappear and come back)
    this.isActive = true;
    this.isDisappearing = false;
  }

  generateGlitchAura() {
    this.glitchAura = [];
    for (let i = 0; i < 20; i++) {
      this.glitchAura.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 40 + 20,
        speed: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 5 + 2,
      });
    }
  }

  update(playerX, playerY, projectiles, enemyCount, width, height) {
    if (!this.isActive) return;

    this.behaviorTimer++;
    this.laserTimer++;
    this.teleportTimer++;
    this.playerTeleportTimer++;
    this.summonTimer++;
    this.disappearTimer++;
    this.pulseTimer += 0.15;

    // Vulnerable only if no other enemies around OR if shield was broken by star
    this.isVulnerable = enemyCount === 0 || this.shieldBroken;

    // Update glitch aura
    this.glitchAura.forEach((g) => {
      g.angle += g.speed;
    });

    // Teleport behavior
    if (this.isTeleporting) {
      if (this.teleportPhase === 0) {
        // Fade out
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          // Teleport to new position - either near (250-400px) or far (500-700px)
          const isFarTeleport = Math.random() < 0.5;
          const angle = Math.random() * Math.PI * 2;
          const distance = isFarTeleport
            ? 500 + Math.random() * 200 // Far: 500-700px
            : 250 + Math.random() * 150; // Near: 250-400px
          this.x = Math.max(
            50,
            Math.min(width - 50, playerX + Math.cos(angle) * distance)
          );
          this.y = Math.max(
            50,
            Math.min(height - 50, playerY + Math.sin(angle) * distance)
          );
          this.teleportPhase = 1;
          this.generateGlitchAura();
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
      const behaviors = ["chase", "evade", "circle", "erratic"];
      this.currentBehavior =
        behaviors[Math.floor(Math.random() * behaviors.length)];
      this.behaviorTimer = 0;
    }

    // Movement based on behavior
    const dx = playerX - this.getCenterX();
    const dy = playerY - this.getCenterY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.currentBehavior === "chase") {
      if (distance > 150 && distance > 0) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    } else if (this.currentBehavior === "evade") {
      if (distance < 350 && distance > 0) {
        this.x -= (dx / distance) * this.speed;
        this.y -= (dy / distance) * this.speed;
      }
    } else if (this.currentBehavior === "circle") {
      if (distance > 0) {
        const perpX = -dy / distance;
        const perpY = dx / distance;
        this.x += perpX * this.speed;
        this.y += perpY * this.speed;
      }
    } else if (this.currentBehavior === "erratic") {
      // Random movement
      this.x += (Math.random() - 0.5) * this.speed * 3;
      this.y += (Math.random() - 0.5) * this.speed * 3;
    }

    // Dodge projectiles
    projectiles.forEach((proj) => {
      const pdx = proj.x - this.getCenterX();
      const pdy = proj.y - this.getCenterY();
      const dist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (dist < 120) {
        this.x -= (pdx / dist) * this.speed * 2;
        this.y -= (pdy / dist) * this.speed * 2;
      }
    });

    // Keep in bounds
    this.x = Math.max(0, Math.min(width - this.width, this.x));
    this.y = Math.max(0, Math.min(height - this.height, this.y));
  }

  shouldShootLaser() {
    if (this.laserTimer >= this.laserInterval) {
      this.laserTimer = 0;
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

  shouldTeleportPlayer() {
    if (this.playerTeleportTimer >= this.playerTeleportInterval) {
      this.playerTeleportTimer = 0;
      return true;
    }
    return false;
  }

  shouldSummonEnemies() {
    if (this.summonTimer >= this.summonInterval) {
      this.summonTimer = 0;
      return true;
    }
    return false;
  }

  shouldDisappear() {
    if (this.disappearTimer >= this.disappearInterval) {
      this.disappearTimer = 0;
      return true;
    }
    return false;
  }

  disappear() {
    this.savedHealth = this.health;
    this.isActive = false;
    this.isDisappearing = true;
  }

  reappear(x, y) {
    this.x = x;
    this.y = y;
    this.health = this.savedHealth;
    this.isActive = true;
    this.isDisappearing = false;
    this.alpha = 0;
    this.isTeleporting = true;
    this.teleportPhase = 1; // Fade in
    this.generateGlitchAura();
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Magenta/purple glow aura
    const pulse = Math.sin(this.pulseTimer) * 0.3 + 0.7;
    ctx.shadowBlur = 30 * pulse;
    ctx.shadowColor = "#ff00ff";

    // Draw glitch aura
    this.glitchAura.forEach((g) => {
      const gx = this.getCenterX() + Math.cos(g.angle) * g.distance;
      const gy = this.getCenterY() + Math.sin(g.angle) * g.distance;

      ctx.fillStyle = `rgba(255, 0, 255, ${pulse * 0.5})`;
      ctx.fillRect(gx - g.size / 2, gy - g.size / 2, g.size, g.size);
    });

    // Main body - glitchy square
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Inner glitch pattern
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);

    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(this.x + 15, this.y + 15, this.width - 30, this.height - 30);

    // Invulnerability indicator
    if (!this.isVulnerable) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);

      // Shield particles
      for (let i = 0; i < 4; i++) {
        const angle = this.pulseTimer * 2 + (Math.PI * 2 * i) / 4;
        const radius = 30 + Math.sin(this.pulseTimer * 3) * 5;
        const px = this.getCenterX() + Math.cos(angle) * radius;
        const py = this.getCenterY() + Math.sin(angle) * radius;

        ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glitch particles
    if (Math.random() < 0.5) {
      const px = this.x + Math.random() * this.width;
      const py = this.y + Math.random() * this.height;
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
        Math.random() * 255
      }, ${Math.random()})`;
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
