export default class Bomb {
  constructor(x, startY, groundY) {
    this.x = x;
    this.y = startY;
    this.groundY = groundY;
    this.width = 16;
    this.height = 16;

    // Bouncy physics
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = 0;
    this.gravity = 0.4;
    this.bounciness = 0.5 + Math.random() * 0.1;
    this.friction = 0.94;

    // States: 'bouncing', 'warning', 'exploding'
    this.state = "bouncing";

    // Stuck position targeting
    this.targetX = null;
    this.targetY = null;
    this.targetUpdateTimer = 0;
    this.targetUpdateInterval = 90; // Update target every 1.5 seconds
    this.moveForce = 0.4; // Force applied to move toward target
    this.hasReachedTarget = false;
    this.stuckTimer = 0;
    this.stuckDelay = 120; // Stay stuck for 2 seconds before warning

    // Warning phase
    this.warningTimer = 0;
    this.warningDuration = 60 + Math.random() * 240;
    this.warningRadius = 20;
    this.maxWarningRadius = 80;

    // Explosion
    this.explosionRadius = 100;
    this.exploded = false;

    // Fire bomb (50% chance)
    this.isFireBomb = Math.random() < 0.5;

    // Animation
    this.pulseTimer = 0;
    this.squishX = 1;
    this.squishY = 1;

    // Sprite
    this.sprite = new Image();
    this.sprite.src = "./img/bomb.png";
    this.spriteLoaded = false;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
  }

  findInconvenientSpot(playerX, playerY, enemies, width, height) {
    // Find clusters of enemies or player position
    const targets = [];

    // Always consider player position
    targets.push({ x: playerX, y: playerY, weight: 2 });

    // Add enemy positions
    enemies.forEach((enemy) => {
      targets.push({
        x: enemy.getCenterX(),
        y: enemy.getCenterY(),
        weight: 1,
      });
    });

    // Find densest area (cluster)
    let bestTarget = { x: playerX, y: playerY };
    let bestScore = 0;

    targets.forEach((target) => {
      let score = target.weight;
      // Count nearby targets
      targets.forEach((other) => {
        const dx = target.x - other.x;
        const dy = target.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          score += other.weight;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    });

    // Add some randomness and ensure it's on screen
    const offsetDist = 30 + Math.random() * 70;
    const angle = Math.random() * Math.PI * 2;
    this.targetX = Math.max(
      50,
      Math.min(width - 50, bestTarget.x + Math.cos(angle) * offsetDist)
    );
    this.targetY = Math.max(
      50,
      Math.min(height - 50, bestTarget.y + Math.sin(angle) * offsetDist)
    );
  }

  update(playerX, playerY, enemies, width, height) {
    this.targetUpdateTimer++;

    // Update target position periodically
    if (
      this.targetUpdateTimer >= this.targetUpdateInterval ||
      this.targetX === null
    ) {
      this.findInconvenientSpot(playerX, playerY, enemies, width, height);
      this.targetUpdateTimer = 0;
    }

    if (this.state === "bouncing") {
      // Apply physics
      this.vy += this.gravity;
      this.vx *= this.friction;

      // Apply force toward target while bouncing
      if (this.targetX !== null) {
        const dx = this.targetX - this.x;
        const distX = Math.abs(dx);

        // Apply horizontal force if not too close
        if (distX > 20) {
          this.vx += Math.sign(dx) * this.moveForce * 0.5;
        }

        // Check if reached target (only check X, Y will settle on ground)
        if (distX < 40 && Math.abs(this.vx) < 2 && Math.abs(this.vy) < 2) {
          // Reached target, start stuck timer
          this.hasReachedTarget = true;
        }
      }

      // Cap velocities to prevent crazy bouncing
      const maxVx = 6;
      const maxVy = 12;
      this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
      this.vy = Math.max(-maxVy, Math.min(maxVy, this.vy));

      this.x += this.vx;
      this.y += this.vy;

      // Bounce on ground - always bounce, never fall through
      if (this.y >= this.groundY - this.height) {
        this.y = this.groundY - this.height;
        this.vy = -Math.abs(this.vy) * this.bounciness;

        // Squish animation on bounce
        this.squishX = 1.3;
        this.squishY = 0.7;

        // Dampen more when close to target
        if (this.hasReachedTarget) {
          this.vy *= 0.5;
          this.vx *= 0.8;
        }
      }

      // Bounce on walls
      if (this.x < 0 || this.x > width) {
        this.vx = -this.vx * this.bounciness;
        this.x = Math.max(0, Math.min(width, this.x));
      }

      // Bounce on ceiling
      if (this.y < 0) {
        this.vy = -this.vy * this.bounciness;
        this.y = 0;
      }

      // Check if reached target and should stick
      if (this.hasReachedTarget) {
        this.stuckTimer++;
        if (this.stuckTimer >= this.stuckDelay) {
          this.state = "warning";
          this.vx = 0;
          this.vy = 0;
        }
      }
    } else if (this.state === "warning") {
      this.warningTimer++;
      this.pulseTimer += 0.15;

      // Expand warning radius
      const progress = this.warningTimer / this.warningDuration;
      this.warningRadius = 20 + (this.maxWarningRadius - 20) * progress;

      // Check if should explode
      if (this.warningTimer >= this.warningDuration) {
        this.state = "exploding";
      }
    }

    // Squish animation recovery
    this.squishX += (1 - this.squishX) * 0.1;
    this.squishY += (1 - this.squishY) * 0.1;
  }

  shouldExplode() {
    return this.state === "exploding";
  }

  draw(ctx) {
    ctx.save();

    if (this.state === "bouncing") {
      // Draw bouncing bomb with squish
      const color = this.isFireBomb ? "#ff4400" : "#ff0000";

      if (this.spriteLoaded) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.translate(this.x, this.y);
        ctx.scale(this.squishX, this.squishY);
        ctx.drawImage(
          this.sprite,
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
      } else {
        // Fallback slimy blob
        ctx.fillStyle = color;
        ctx.translate(this.x, this.y);
        ctx.scale(this.squishX, this.squishY);
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Shine for slimy effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(-3, -3, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.state === "warning") {
      // Draw stuck bomb
      const color = this.isFireBomb ? "#ff4400" : "#ff0000";

      if (this.spriteLoaded) {
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
          this.sprite,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw warning circle
      const pulse = Math.sin(this.pulseTimer * 5) * 0.3 + 0.7;
      const urgency = this.warningTimer / this.warningDuration;

      const warningColor = this.isFireBomb
        ? `rgba(255, ${Math.floor(100 * (1 - urgency))}, 0, ${0.6 * pulse})`
        : `rgba(255, ${Math.floor(255 * (1 - urgency))}, 0, ${0.6 * pulse})`;

      // Outer circle
      ctx.strokeStyle = warningColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.warningRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill
      const fillColor = this.isFireBomb
        ? `rgba(255, 100, 0, ${0.1 * pulse})`
        : `rgba(255, ${Math.floor(255 * (1 - urgency))}, 0, ${0.1 * pulse})`;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.warningRadius, 0, Math.PI * 2);
      ctx.fill();

      // Center indicator
      ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - this.warningRadius, this.y);
      ctx.lineTo(this.x + this.warningRadius, this.y);
      ctx.moveTo(this.x, this.y - this.warningRadius);
      ctx.lineTo(this.x, this.y + this.warningRadius);
      ctx.stroke();

      // Fire bomb indicator
      if (this.isFireBomb) {
        ctx.fillStyle = "#ff4400";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("FIRE!", this.x, this.y - this.warningRadius - 10);
      }
    }

    ctx.restore();
  }

  getWarningRadius() {
    return this.state === "warning" ? this.warningRadius + 50 : 0;
  }

  createFirePatch(width, height, existingPatches = []) {
    // Create fire patch data for firebomb
    const tileSize = 40; // Size of each "tile"
    const numTiles = 5 + Math.floor(Math.random() * 6); // 5-10 tiles
    const firePatches = [];
    const minDistance = 50; // Minimum distance from other fire patches

    for (let i = 0; i < numTiles; i++) {
      let angle = (Math.PI * 2 * i) / numTiles + (Math.random() - 0.5) * 0.5;
      let distance = Math.random() * 100 + 30;
      let patchX, patchY;
      let attempts = 0;
      const maxAttempts = 10;

      // Try to find a spot that doesn't overlap with existing fire
      do {
        patchX = Math.max(
          tileSize,
          Math.min(width - tileSize, this.x + Math.cos(angle) * distance)
        );
        patchY = Math.max(
          tileSize,
          Math.min(height - tileSize, this.y + Math.sin(angle) * distance)
        );

        // Check if too close to existing patches
        let tooClose = false;
        for (const existing of existingPatches) {
          const dx = patchX - existing.x;
          const dy = patchY - existing.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }

        // Also check patches we just created
        for (const newPatch of firePatches) {
          const dx = patchX - newPatch.x;
          const dy = patchY - newPatch.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) {
          // Move further away and try again
          distance += 40;
          angle += Math.random() * 0.5 - 0.25;
          attempts++;
        } else {
          break;
        }
      } while (attempts < maxAttempts);

      const patchSize = tileSize * (0.9 + Math.random() * 0.5); // Larger patches

      firePatches.push({
        x: patchX,
        y: patchY,
        size: patchSize,
        duration: 750 + Math.random() * 300, // 12.5-17.5 seconds (~15 avg)
        timer: 0,
      });
    }

    return firePatches;
  }
}
