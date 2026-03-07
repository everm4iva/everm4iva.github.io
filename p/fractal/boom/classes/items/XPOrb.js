export default class XPOrb {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.value = value; // XP points (1, 5, or 10)
    this.vx = 0;
    this.vy = 0;
    this.radius = this.getRadiusForValue(value);
    this.pickupRadius = 150; // Distance at which it's attracted to player (increased from 100)
    this.attractionSpeed = 2.5; // Speed when moving toward player (slightly faster)

    // Visual
    this.pulseTimer = Math.random() * Math.PI * 2;
    this.color = this.getColorForValue(value);

    // Clumping
    this.canClump = true;
    this.clumpTimer = 0;
    this.clumpDelay = 30; // Frames before can clump

    // Lifetime
    this.lifetime = 0;
    this.maxLifetime = 6000; // 100 seconds

    // Floating animation
    this.floatOffset = Math.random() * Math.PI * 2;
    this.baseY = y;
  }

  getRadiusForValue(value) {
    if (value >= 10) return 8;
    if (value >= 5) return 6;
    return 4;
  }

  getColorForValue(value) {
    if (value >= 10) return "#00ffff"; // Cyan for big orbs
    if (value >= 5) return "#00ff00"; // Green for medium orbs
    return "#ffff00"; // Yellow for small orbs
  }

  update(playerX, playerY, otherOrbs = []) {
    this.lifetime++;
    this.clumpTimer++;
    this.pulseTimer += 0.1;
    this.floatOffset += 0.05;

    // Calculate distance to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Slow attraction to player when in range
    if (distToPlayer < this.pickupRadius && distToPlayer > 0) {
      const dirX = dx / distToPlayer;
      const dirY = dy / distToPlayer;
      this.x += dirX * this.attractionSpeed;
      this.y += dirY * this.attractionSpeed;
    } else {
      // Gentle floating animation when idle
      const floatAmount = Math.sin(this.floatOffset) * 0.5;
      this.y = this.baseY + floatAmount;

      // Slow drift toward other orbs of same value
      if (this.canClump && this.clumpTimer > this.clumpDelay) {
        let closestOrb = null;
        let closestDist = Infinity;

        otherOrbs.forEach((orb) => {
          if (orb !== this && orb.value === this.value && orb.canClump) {
            const odx = orb.x - this.x;
            const ody = orb.y - this.y;
            const dist = Math.sqrt(odx * odx + ody * ody);

            if (dist < 100 && dist < closestDist) {
              closestOrb = orb;
              closestDist = dist;
            }
          }
        });

        // Slowly drift toward closest same-value orb
        if (closestOrb && closestDist > 10) {
          const odx = closestOrb.x - this.x;
          const ody = closestOrb.y - this.y;
          const dist = Math.sqrt(odx * odx + ody * ody);
          if (dist > 0) {
            this.x += (odx / dist) * 0.3;
            this.baseY += (ody / dist) * 0.3;
          }
        }
      }
    }
  }

  draw(ctx) {
    const pulse = Math.sin(this.pulseTimer) * 0.3 + 0.7;
    const currentRadius = this.radius * pulse;

    // Glow effect
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    // Outer glow
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Main orb
    ctx.globalAlpha = 1;
    const gradient = ctx.createRadialGradient(
      this.x - currentRadius * 0.3,
      this.y - currentRadius * 0.3,
      0,
      this.x,
      this.y,
      currentRadius
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.4, this.color);
    gradient.addColorStop(1, this.getDarkerColor(this.color));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      this.x - currentRadius * 0.3,
      this.y - currentRadius * 0.3,
      currentRadius * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  getDarkerColor(color) {
    // Simple darkening
    if (color === "#ffff00") return "#aa8800";
    if (color === "#00ff00") return "#00aa00";
    if (color === "#00ffff") return "#00aaaa";
    return color;
  }

  checkCollision(player) {
    const dx = this.x - (player.x + player.width / 2);
    const dy = this.y - (player.y + player.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + 15; // Player pickup radius
  }

  isExpired() {
    return this.lifetime > this.maxLifetime;
  }

  merge(otherOrb) {
    // Merge with another orb of same value
    if (otherOrb.value === this.value) {
      this.value += otherOrb.value;
      // Update visual properties
      this.radius = this.getRadiusForValue(this.value);
      this.color = this.getColorForValue(this.value);
      return true;
    }
    return false;
  }

  // Force attract orb to player (faster than normal attraction)
  forceAttractToPlayer(playerX, playerY, speed = 8) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      this.x += dirX * speed;
      this.y += dirY * speed;
    }
  }
}
