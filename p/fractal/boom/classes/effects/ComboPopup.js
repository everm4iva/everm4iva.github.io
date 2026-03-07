import CONFIG from "../config/GameConfig.js";

export default class ComboPopup {
  constructor(x, y, comboCount) {
    this.x = x;
    this.y = y;
    this.comboCount = comboCount;
    this.lifetime = 0;
    this.maxLifetime = CONFIG.COMBO.POPUP_DURATION;
    this.riseSpeed = CONFIG.COMBO.POPUP_RISE_SPEED;

    // Comic-style effects
    this.scale = 0;
    this.rotation = (Math.random() - 0.5) * 0.3; // Slight random tilt
    this.pulsePhase = 0;
  }

  update() {
    this.lifetime++;
    this.y -= this.riseSpeed;
    this.pulsePhase += 0.3;

    // Aggressive grow animation with shake
    if (this.scale < 1) {
      this.scale += 0.25; // Faster growth
    }

    // Add violent shake/jitter
    this.rotation += (Math.random() - 0.5) * 0.15;

    return this.lifetime < this.maxLifetime;
  }

  draw(ctx) {
    const alpha = 1 - this.lifetime / this.maxLifetime;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.3; // More intense pulse
    const currentScale = this.scale * pulse;

    // Violent shake offset
    const shakeX = (Math.random() - 0.5) * 3 * currentScale;
    const shakeY = (Math.random() - 0.5) * 3 * currentScale;

    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = alpha;

    // Comic-style starburst background (sharp lines only)
    const starburstSize = 60 * currentScale;
    ctx.fillStyle = "#ffff00";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ffff00";

    // Draw starburst spikes
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const outerX = Math.cos(angle) * starburstSize;
      const outerY = Math.sin(angle) * starburstSize;
      const innerAngle = angle + Math.PI / 8;
      const innerX = Math.cos(innerAngle) * (starburstSize * 0.4);
      const innerY = Math.sin(innerAngle) * (starburstSize * 0.4);

      if (i === 0) {
        ctx.moveTo(innerX, innerY);
      }
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();

    // Draw combo text directly on starburst (no circle)
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#000000";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * currentScale;
    ctx.font = `bold ${28 * currentScale}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // White outline for readability
    ctx.strokeText(`${this.comboCount}X`, 0, -5 * currentScale);
    ctx.fillText(`${this.comboCount}X`, 0, -5 * currentScale);

    // "COMBO" text smaller
    ctx.font = `bold ${11 * currentScale}px 'Courier New', monospace`;
    ctx.strokeText("COMBO", 0, 12 * currentScale);
    ctx.fillText("COMBO", 0, 12 * currentScale);

    ctx.restore();
  }
}
