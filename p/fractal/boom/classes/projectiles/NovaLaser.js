import { CONFIG } from "../config/GameConfig.js";

export default class NovaLaser {
  constructor(x, y, directionX, directionY) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    const novaCfg =
      CONFIG.BOSSES?.NOVA?.NOVA_LASER || CONFIG.PROJECTILES?.NOVA_LASER || {};
    this.damage = novaCfg.DAMAGE;
    this.thickness = novaCfg.THICKNESS || novaCfg.WIDTH || 15;

    // Warning phase
    this.warningTimer = 0;
    this.warningDuration = novaCfg.WARNING_DURATION || 40;
    this.isWarning = true;

    // Active phase
    this.activeTimer = 0;
    this.activeDuration = novaCfg.ACTIVE_DURATION || 25;
    this.isActive = false;

    // Visual effects
    this.pulseTimer = 0;
    this.intensity = 0;

    // Calculate beam length (goes through entire screen)
    this.length = novaCfg.LENGTH || 2000;
  }

  update() {
    this.pulseTimer += 0.3;

    if (this.isWarning) {
      this.warningTimer++;
      this.intensity = Math.min(1, this.warningTimer / this.warningDuration);

      if (this.warningTimer >= this.warningDuration) {
        this.isWarning = false;
        this.isActive = true;
      }
    } else if (this.isActive) {
      this.activeTimer++;
      this.intensity = 1;

      if (this.activeTimer >= this.activeDuration) {
        this.isActive = false;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Calculate beam endpoints
    const endX = this.x + this.directionX * this.length;
    const endY = this.y + this.directionY * this.length;

    if (this.isWarning) {
      // Warning - bright pulsing beam with particles
      const pulse = Math.sin(this.pulseTimer * 2) * 0.5 + 0.5;
      const warningThickness = 15 + pulse * 10;

      // Outer glow
      ctx.strokeStyle = `rgba(255, 0, 0, ${this.intensity * 0.3})`;
      ctx.lineWidth = warningThickness * 2;
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#ff0000";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Main warning beam
      ctx.strokeStyle = `rgba(255, 50, 50, ${this.intensity * 0.8})`;
      ctx.lineWidth = warningThickness;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ff3333";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Bright core line
      ctx.strokeStyle = `rgba(255, 200, 200, ${this.intensity})`;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (this.isActive) {
      // Active beam - thick white beam
      const pulse = Math.sin(this.pulseTimer * 2) * 0.2 + 0.8;

      // Outer glow (wider, softer)
      const outerGlow = ctx.createLinearGradient(
        this.x,
        this.y - this.thickness,
        this.x,
        this.y + this.thickness
      );
      outerGlow.addColorStop(0, "rgba(255, 255, 255, 0)");
      outerGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
      outerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.strokeStyle = outerGlow;
      ctx.lineWidth = this.thickness * 1.5 * pulse;
      ctx.lineCap = "round";
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Main beam (thick white)
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.lineWidth = this.thickness;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Inner core (very bright)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = this.thickness * 0.5;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  isOffScreen(width, height) {
    // Beam lasts for warning + active duration
    return !this.isWarning && !this.isActive;
  }

  checkCollision(entity) {
    // Only collide during active phase
    if (!this.isActive) return false;

    // Point-to-line distance calculation
    const entityCenterX = entity.x + entity.width / 2;
    const entityCenterY = entity.y + entity.height / 2;

    // Calculate beam as line segment
    const endX = this.x + this.directionX * this.length;
    const endY = this.y + this.directionY * this.length;

    // Vector from start to end of beam
    const lineX = endX - this.x;
    const lineY = endY - this.y;
    const lineLength = Math.sqrt(lineX * lineX + lineY * lineY);

    // Normalized direction
    const normX = lineX / lineLength;
    const normY = lineY / lineLength;

    // Vector from beam start to entity
    const toEntityX = entityCenterX - this.x;
    const toEntityY = entityCenterY - this.y;

    // Project entity onto beam line
    const projection = toEntityX * normX + toEntityY * normY;

    // Find closest point on beam
    const closestX =
      this.x + normX * Math.max(0, Math.min(projection, lineLength));
    const closestY =
      this.y + normY * Math.max(0, Math.min(projection, lineLength));

    // Distance from entity to closest point on beam
    const dx = entityCenterX - closestX;
    const dy = entityCenterY - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if within beam thickness
    return (
      distance < this.thickness / 2 + Math.min(entity.width, entity.height) / 2
    );
  }

  getScreenShake() {
    // Return screen shake intensity based on phase
    if (this.isActive) {
      return 15; // Strong shake during active beam
    } else if (
      this.isWarning &&
      this.warningTimer > this.warningDuration * 0.7
    ) {
      return 5; // Small shake near end of warning
    }
    return 0;
  }
}
