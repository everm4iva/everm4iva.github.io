// PushPull.js - White orb with gravitational wave effect
// When collected: immortality, pull XP, push enemies

import { CONFIG } from "../config/GameConfig.js";

export default class PushPull {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.POWERUPS.PUSH_PULL.WIDTH;
    this.height = CONFIG.POWERUPS.PUSH_PULL.HEIGHT;
    this.color = CONFIG.POWERUPS.PUSH_PULL.COLOR;

    // Animation
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.06;
    this.rotation = 0;
    this.rotationSpeed = 0.04;
    this.pulsePhase = 0;

    // Gravitational wave rings
    this.waves = [
      { radius: 0, alpha: 1 },
      { radius: 0, alpha: 1 },
      { radius: 0, alpha: 1 },
    ];
    this.waveSpeed = 1.5;
    this.maxWaveRadius = 60;

    // Lifetime (optional - set to 0 for infinite)
    this.lifetime = CONFIG.POWERUPS.PUSH_PULL.LIFETIME || 0;
    this.age = 0;

    // Particle orbits
    this.orbitParticles = [];
    for (let i = 0; i < 6; i++) {
      this.orbitParticles.push({
        angle: (i / 6) * Math.PI * 2,
        distance: 15 + Math.random() * 5,
        speed: 0.05 + Math.random() * 0.02,
        size: 2 + Math.random() * 2,
      });
    }
  }

  update() {
    this.bobOffset += this.bobSpeed;
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.12;
    this.age++;

    // Update gravitational waves
    this.waves.forEach((wave, i) => {
      wave.radius += this.waveSpeed;
      wave.alpha = 1 - wave.radius / this.maxWaveRadius;

      // Reset wave when it reaches max radius (staggered)
      if (wave.radius >= this.maxWaveRadius) {
        wave.radius = 0;
        wave.alpha = 1;
      }
    });

    // Stagger the waves
    if (this.waves[0].radius === 0) {
      this.waves[1].radius = this.maxWaveRadius * 0.33;
      this.waves[2].radius = this.maxWaveRadius * 0.66;
    }

    // Update orbit particles
    this.orbitParticles.forEach((p) => {
      p.angle += p.speed;
    });
  }

  draw(ctx) {
    ctx.save();

    const bobY = Math.sin(this.bobOffset) * 5;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
    const fadeOut =
      this.lifetime > 0 && this.age > this.lifetime - 120
        ? (this.lifetime - this.age) / 120
        : 1;

    ctx.globalAlpha = fadeOut;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + bobY;

    // Draw gravitational wave rings (expanding outward)
    this.waves.forEach((wave) => {
      if (wave.alpha > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha * 0.4 * fadeOut})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw orbiting particles
    this.orbitParticles.forEach((p) => {
      const px = centerX + Math.cos(p.angle) * p.distance * pulse;
      const py = centerY + Math.sin(p.angle) * p.distance * pulse;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * fadeOut})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw outer glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = this.color;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    // Draw main orb (gradient white sphere)
    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      (this.width / 2) * pulse
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.5, "#f0f0f0");
    gradient.addColorStop(1, "rgba(200, 200, 200, 0.8)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, (this.width / 2) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner bright core
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, (this.width / 4) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw push/pull arrows symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⟷", 0, 0);

    // Draw attraction/repulsion lines (like magnetic field)
    ctx.strokeStyle = `rgba(255, 255, 255, ${
      0.3 + Math.sin(this.pulsePhase * 2) * 0.2
    })`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.rotation * 0.5;
      const innerR = (this.width / 2) * pulse + 3;
      const outerR =
        (this.width / 2) * pulse + 8 + Math.sin(this.pulsePhase + i) * 3;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

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
    return this.lifetime > 0 && this.age >= this.lifetime;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}
