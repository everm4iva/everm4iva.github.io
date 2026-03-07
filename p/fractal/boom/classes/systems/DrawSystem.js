// DrawSystem.js - Handles all game object rendering

import Light from "../effects/Light.js";
import { CONFIG } from "../config/GameConfig.js";

export default class DrawSystem {
  constructor(game) {
    this.game = game;
  }

  // Draw all game objects
  drawGameObjects(ctx) {
    const game = this.game;

    // Draw fire patches (behind everything)
    game.firePatches.forEach((patch) => patch.draw(ctx));

    // Draw particles - use pool if available, fallback to legacy array
    if (game.particlePool) {
      game.particlePool.draw(ctx);
    }
    game.particles.forEach((particle) => particle.draw(ctx));

    // Draw bombs
    game.bombs.forEach((bomb) => bomb.draw(ctx));

    // Draw placed bombs
    game.placedBombs.forEach((bomb) => bomb.draw(ctx));

    // Draw walls
    game.walls.forEach((wall) => wall.draw(ctx));

    // Draw projectiles
    game.projectiles.forEach((projectile) => projectile.draw(ctx));

    // Draw enemy projectiles
    game.enemyProjectiles.forEach((proj) => proj.draw(ctx));

    // Draw enemies with lights
    game.enemies.forEach((enemy) => {
      enemy.draw(ctx);

      // Add enemy light
      const enemyLight = new Light(
        enemy.getCenterX(),
        enemy.getCenterY(),
        CONFIG.LIGHTING.ENEMY_LIGHT_RADIUS,
        CONFIG.LIGHTING.ENEMY_LIGHT_COLOR
      );
      enemyLight.draw(ctx);
    });

    // Draw Mage boss
    if (game.mage) {
      this.drawMage(ctx);
    }

    // Draw Nova boss
    if (game.nova && game.nova.isActive) {
      this.drawNova(ctx);
    }

    // Draw power-ups
    game.powerUps.forEach((powerUp) => {
      powerUp.draw(ctx);

      // Add power-up light
      const powerUpLight = new Light(
        powerUp.getCenterX(),
        powerUp.getCenterY(),
        100,
        powerUp.type === "health"
          ? "rgba(255, 255, 0, 0.3)"
          : "rgba(255, 0, 255, 0.3)"
      );
      powerUpLight.draw(ctx);
    });

    // Draw shock crystals
    game.shockCrystals.forEach((crystal) => {
      crystal.draw(ctx);

      // Add crystal light
      const crystalLight = new Light(
        crystal.getCenterX(),
        crystal.getCenterY(),
        80,
        "rgba(0, 255, 255, 0.4)"
      );
      crystalLight.draw(ctx);
    });

    // Draw star orbs
    game.starOrbs.forEach((orb) => {
      orb.draw(ctx);

      // Add star orb light
      const orbLight = new Light(
        orb.getCenterX(),
        orb.getCenterY(),
        100,
        "rgba(255, 255, 0, 0.4)"
      );
      orbLight.draw(ctx);
    });

    // Draw time warp pickups
    game.timeWarps.forEach((tw) => {
      tw.draw(ctx);

      // Add time warp light
      const twLight = new Light(
        tw.getCenterX(),
        tw.getCenterY(),
        120,
        "rgba(0, 255, 255, 0.5)"
      );
      twLight.draw(ctx);
    });

    // Draw PushPull pickups
    game.pushPulls.forEach((pp) => {
      pp.draw(ctx);

      // Add white light
      const ppLight = new Light(
        pp.getCenterX(),
        pp.getCenterY(),
        140,
        "rgba(255, 255, 255, 0.6)"
      );
      ppLight.draw(ctx);
    });

    // Draw XP orbs
    game.xpOrbs.forEach((orb) => orb.draw(ctx));

    // Draw stars
    game.stars.forEach((star) => star.draw(ctx));

    // Draw Nova lasers
    game.novaLasers.forEach((laser) => laser.draw(ctx));

    // Draw combo popups
    game.comboPopups.forEach((popup) => popup.draw(ctx));

    // Draw player (unless in death animation)
    if (!game.deathAnimation) {
      // Override player color when pushpull is active
      const originalColor = game.player.color;
      if (game.pushPullActive) {
        game.player.color = "#ffffff";
      }

      // Scale up player when grabbed
      if (game.novaGrabActive) {
        ctx.save();
        const playerCenterX = game.player.x + game.player.width / 2;
        const playerCenterY = game.player.y + game.player.height / 2;
        ctx.translate(playerCenterX, playerCenterY);
        ctx.scale(1.5, 1.5); // 50% bigger
        ctx.translate(-playerCenterX, -playerCenterY);
        game.player.draw(ctx);
        ctx.restore();
      } else {
        game.player.draw(ctx);
      }

      game.player.color = originalColor;
    }

    // Draw Nova grab hand with trail
    if (game.novaGrabActive && game.grabHandImg && game.grabHandImg.complete) {
      const handSize = 120;
      const t = game.novaGrabProgress / game.novaGrabDuration;

      // Hand position above player (higher up for lifting effect)
      const handX = game.player.x + game.player.width / 2 - handSize / 2;
      const handY = game.player.y - handSize * 0.8; // Higher above player

      // Draw glowing trail from hand to player
      ctx.save();
      const trailGradient = ctx.createLinearGradient(
        handX + handSize / 2,
        handY + handSize,
        game.player.x + game.player.width / 2,
        game.player.y
      );
      trailGradient.addColorStop(0, "rgba(255, 0, 255, 0.6)");
      trailGradient.addColorStop(0.5, "rgba(255, 0, 255, 0.3)");
      trailGradient.addColorStop(1, "rgba(255, 0, 255, 0)");

      ctx.fillStyle = trailGradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ff00ff";

      // Draw trail beam
      ctx.beginPath();
      ctx.moveTo(handX + handSize / 2 - 15, handY + handSize);
      ctx.lineTo(handX + handSize / 2 + 15, handY + handSize);
      ctx.lineTo(game.player.x + game.player.width / 2 + 15, game.player.y);
      ctx.lineTo(game.player.x + game.player.width / 2 - 15, game.player.y);
      ctx.closePath();
      ctx.fill();

      // Extra glow particles along trail
      for (let i = 0; i < 5; i++) {
        const particleT = i / 5 + ((t * 2) % 1);
        const px =
          handX +
          handSize / 2 +
          (game.player.x + game.player.width / 2 - handX - handSize / 2) *
            particleT;
        const py =
          handY + handSize + (game.player.y - handY - handSize) * particleT;

        const radius = Math.max(2, 8 - particleT * 5); // Ensure radius stays positive
        ctx.fillStyle = `rgba(255, 0, 255, ${0.6 - particleT * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Hand appears only in first 70% of animation (grabs then disappears)
      if (t < 0.7) {
        const handAlpha = t < 0.6 ? 0.9 - t * 0.3 : 1 - (t - 0.6) / 0.1; // Fade out at end
        const squeeze = 1 + Math.sin(t * Math.PI * 8) * 0.15;

        ctx.save();
        ctx.globalAlpha = handAlpha;
        ctx.translate(handX + handSize / 2, handY + handSize / 2);
        ctx.scale(squeeze, squeeze);
        ctx.rotate(Math.sin(t * Math.PI * 6) * 0.15);

        // Strong magenta glow
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#ff00ff";

        ctx.drawImage(
          game.grabHandImg,
          -handSize / 2,
          -handSize / 2,
          handSize,
          handSize
        );
        ctx.restore();
      }
    }

    // Draw aiming line if player has star
    if (game.player.hasStar() && !game.gameOver && !game.paused) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(game.player.getCenterX(), game.player.getCenterY());
      ctx.lineTo(game.input.mouse.x, game.input.mouse.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw lighting system
    game.lightingSystem.draw(ctx, game.width, game.height);
  }

  // Draw Mage boss with health bar
  drawMage(ctx) {
    const game = this.game;

    game.mage.draw(ctx);

    // Add mage light
    const mageLight = new Light(
      game.mage.getCenterX(),
      game.mage.getCenterY(),
      150,
      "rgba(136, 0, 255, 0.4)"
    );
    mageLight.draw(ctx);

    // Draw Mage health bar (scales with max health)
    const pixelsPerHP = 0.6; // Each HP adds 0.6 pixels to width
    const barWidth = Math.min(
      700,
      Math.max(150, game.mage.maxHealth * pixelsPerHP)
    );
    const barHeight = 30;
    const barX = game.width / 2 - barWidth / 2;
    const barY = game.height - 60;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Border
    ctx.strokeStyle = "#8800ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Health fill
    const healthPercent = Math.min(
      1,
      Math.max(0, game.mage.health / game.mage.maxHealth)
    );
    const healthWidth = barWidth * healthPercent;

    // Gradient health bar
    const gradient = ctx.createLinearGradient(barX, 0, barX + healthWidth, 0);
    gradient.addColorStop(0, "#ff00ff");
    gradient.addColorStop(1, "#8800ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#8800ff";
    ctx.fillText(`MAGE BOSS`, game.width / 2, barY - 15);
    ctx.fillText(
      `${Math.ceil(game.mage.health)} / ${game.mage.maxHealth}`,
      game.width / 2,
      barY + barHeight / 2 + 5
    );
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";

    // Invulnerability indicator
    if (!game.mage.isVulnerable) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "DEFEAT ALL ENEMIES FIRST!",
        game.width / 2,
        barY + barHeight + 20
      );
      ctx.textAlign = "left";
    }
  }

  // Draw Nova boss with health bar
  drawNova(ctx) {
    const game = this.game;

    game.nova.draw(ctx);

    // Add nova light
    const novaLight = new Light(
      game.nova.getCenterX(),
      game.nova.getCenterY(),
      200,
      "rgba(255, 0, 255, 0.5)"
    );
    novaLight.draw(ctx);

    // Draw Nova health bar (scales with max health)
    const pixelsPerHPNova = 0.6; // Each HP adds 0.6 pixels to width
    const barWidth = Math.min(
      800,
      Math.max(150, game.nova.maxHealth * pixelsPerHPNova)
    );
    const barHeight = 35;
    const barX = game.width / 2 - barWidth / 2;
    const barY = game.height - 70;

    // Background with glitch
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Glitchy border (reduced frequency)
    ctx.strokeStyle = Math.random() > 0.95 ? "#00ffff" : "#ff00ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // Health fill
    const healthPercent = Math.min(
      1,
      Math.max(0, game.nova.health / game.nova.maxHealth)
    );
    const healthWidth = barWidth * healthPercent;

    // Gradient health bar with glitch
    const gradient = ctx.createLinearGradient(barX, 0, barX + healthWidth, 0);
    gradient.addColorStop(0, "#ff00ff");
    gradient.addColorStop(0.5, "#00ffff");
    gradient.addColorStop(1, "#ff00ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Glitch overlay (reduced frequency and opacity)
    if (Math.random() > 0.9) {
      ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
      ctx.fillRect(barX + Math.random() * healthWidth, barY, 20, barHeight);
    }

    // Text with glitch (reduced)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 15;
    ctx.shadowColor = Math.random() > 0.9 ? "#00ffff" : "#ff00ff";
    ctx.fillText(`NOVA BOSS`, game.width / 2, barY - 18);
    ctx.fillText(
      `${Math.ceil(game.nova.health)} / ${game.nova.maxHealth}`,
      game.width / 2,
      barY + barHeight / 2 + 6
    );
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";

    // Invulnerability indicator
    if (!game.nova.isVulnerable) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "INVULNERABLE SHIELD!",
        game.width / 2,
        barY + barHeight + 25
      );
      ctx.textAlign = "left";
    }
  }
}
