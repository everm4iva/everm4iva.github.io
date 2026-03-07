// UISystem.js - Handles all UI updates and overlays

export default class UISystem {
  constructor(game) {
    this.game = game;
  }

  // Scramble text if Nova is active
  scrambleText(text) {
    const game = this.game;
    if (game.nova && game.nova.isActive && Math.random() > 0.8) {
      const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      return text
        .split("")
        .map((char) =>
          Math.random() > 0.7
            ? chars[Math.floor(Math.random() * chars.length)]
            : char
        )
        .join("");
    }
    return text;
  }

  // Update all HTML UI elements
  updateUI() {
    const game = this.game;

    // Hide UI during VHS boot sequence
    const hudOverlay = document.querySelector(".hud-overlay");
    const controlsAscii = document.querySelector(".controls-ascii");
    const bombSlots = document.getElementById("bombSlots");
    const crystalSlots = document.getElementById("crystalSlots");
    const starSlots = document.getElementById("starSlots");

    if (game.vhsState !== "ready") {
      if (hudOverlay) hudOverlay.style.display = "none";
      if (controlsAscii) controlsAscii.style.display = "none";
      if (bombSlots) bombSlots.style.display = "none";
      if (crystalSlots) crystalSlots.style.display = "none";
      if (starSlots) starSlots.style.display = "none";
      return;
    }

    // Show UI when game is ready
    if (hudOverlay) hudOverlay.style.display = "block";

    const levelDisplay = document.getElementById("levelDisplay");
    const scoreDisplay = document.getElementById("scoreDisplay");
    const healthBar = document.getElementById("healthBar");
    const killsDisplay = document.getElementById("killsDisplay");
    const accuracyDisplay = document.getElementById("accuracyDisplay");
    const multishotPanel = document.getElementById("multishotPanel");
    const multishotProgress = document.getElementById("multishotProgress");
    const multishotIcon = document.getElementById("multishotIcon");
    const timewarpPanel = document.getElementById("timewarpPanel");
    const timewarpProgress = document.getElementById("timewarpProgress");
    const pushpullPanel = document.getElementById("pushpullPanel");
    const pushpullProgress = document.getElementById("pushpullProgress");

    // Hide controls after first input + 10 seconds
    if (controlsAscii) {
      controlsAscii.style.display = game.input.shouldShowInstructions()
        ? "block"
        : "none";
    }

    // Update unified inventory bar
    const inventoryBar = document.getElementById("inventoryBar");
    if (inventoryBar) {
      const hasItems = game.player.getTotalItemCount() > 0;
      if (!game.input.shouldShowInstructions() && hasItems) {
        inventoryBar.style.display = "flex";

        // Update each slot
        for (let i = 0; i < 3; i++) {
          const slotEl = document.getElementById(`invSlot${i}`);
          if (slotEl) {
            const slotType = game.player.getSlotType(i);
            const slotCount = game.player.getSlotCount(i);
            const iconEl = slotEl.querySelector(".inv-icon");
            const countEl = slotEl.querySelector(".inv-count");

            // Update classes
            let className = "inv-slot";
            if (i === game.selectedSlot) className += " selected";
            if (slotType) className += " has-item";
            slotEl.className = className;

            // Update icon and count
            if (slotType && iconEl && countEl) {
              const icons = { bomb: "💣", crystal: "💎", star: "⭐" };
              iconEl.textContent = icons[slotType] || "";
              countEl.textContent = slotCount > 1 ? slotCount : "";
            } else if (iconEl && countEl) {
              iconEl.textContent = "";
              countEl.textContent = "";
            }
          }
        }
      } else {
        inventoryBar.style.display = "none";
      }
    }

    // Update cursor based on selected item
    const selectedItemType = game.player.getSlotType(game.selectedSlot);
    game.cursor.setState(selectedItemType || "default");

    if (levelDisplay)
      levelDisplay.textContent = this.scrambleText(`>> LVL ${game.level}`);
    if (scoreDisplay)
      scoreDisplay.textContent = this.scrambleText(`SCORE: ${game.score}`);
    if (killsDisplay)
      killsDisplay.textContent = this.scrambleText(
        `KILLS: ${game.enemiesKilled}/${game.enemiesPerLevel}`
      );

    // Health bar
    if (healthBar) {
      const healthPercent = game.player.health / 100;
      healthBar.style.width = `${healthPercent * 100}%`;
      if (healthPercent > 0.6) {
        healthBar.style.background = "#00ff00";
        healthBar.style.boxShadow = "0 0 10px rgba(0, 255, 0, 0.8)";
      } else if (healthPercent > 0.3) {
        healthBar.style.background = "#ffff00";
        healthBar.style.boxShadow = "0 0 10px rgba(255, 255, 0, 0.8)";
      } else {
        healthBar.style.background = "#ff0000";
        healthBar.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.8)";
      }
    }

    // Playstyle (renamed from accuracy)
    const playstyle = game.getPlaystyle();
    if (accuracyDisplay) accuracyDisplay.textContent = playstyle;

    // Multi-shot
    if (multishotPanel && multishotProgress) {
      if (game.multiShotActive) {
        multishotPanel.style.display = "flex";
        const progress = (game.multiShotTimer / game.multiShotDuration) * 100;
        multishotProgress.style.width = `${progress}%`;
        // Update icon with current bullet count
        if (multishotIcon) {
          multishotIcon.textContent = `×${game.multiShotBulletCount || 3}`;
        }
      } else {
        multishotPanel.style.display = "none";
      }
    }

    // Time warp
    if (timewarpPanel && timewarpProgress) {
      if (game.timeWarpActive) {
        timewarpPanel.style.display = "flex";
        const progress = (game.timeWarpTimer / game.timeWarpDuration) * 100;
        timewarpProgress.style.width = `${progress}%`;
      } else {
        timewarpPanel.style.display = "none";
      }
    }

    // Push/Pull
    if (pushpullPanel && pushpullProgress) {
      if (game.pushPullActive) {
        pushpullPanel.style.display = "flex";
        const progress = (game.pushPullTimer / game.pushPullDuration) * 100;
        pushpullProgress.style.width = `${progress}%`;
      } else {
        pushpullPanel.style.display = "none";
      }
    }
  }

  // Draw time warp effect overlay (just the visual effect, UI is in HTML now)
  drawTimeWarpEffect(ctx) {
    const game = this.game;
    if (!game.timeWarpActive) return;

    // Cyan tint overlay
    ctx.save();
    ctx.fillStyle = `rgba(0, 255, 255, ${
      0.06 + Math.sin(Date.now() / 100) * 0.02
    })`;
    ctx.fillRect(0, 0, game.width, game.height);

    // Pulsing vignette
    const gradient = ctx.createRadialGradient(
      game.width / 2,
      game.height / 2,
      game.height * 0.3,
      game.width / 2,
      game.height / 2,
      game.height * 0.8
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(
      1,
      `rgba(0, 255, 255, ${0.12 + Math.sin(Date.now() / 150) * 0.04})`
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.restore();
  }

  // Draw push/pull effect - white glow around player
  drawPushPullEffect(ctx) {
    const game = this.game;
    if (!game.pushPullActive) return;

    ctx.save();

    // White vignette from player position
    const playerX = game.player.getCenterX();
    const playerY = game.player.getCenterY();
    const pulseIntensity = 0.15 + Math.sin(Date.now() / 80) * 0.05;

    const gradient = ctx.createRadialGradient(
      playerX,
      playerY,
      30,
      playerX,
      playerY,
      250
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${pulseIntensity * 0.3})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Draw pull lines towards XP orbs
    ctx.strokeStyle = `rgba(255, 255, 255, ${
      0.2 + Math.sin(Date.now() / 100) * 0.1
    })`;
    ctx.lineWidth = 1;
    game.xpOrbs.forEach((orb) => {
      const dist = Math.sqrt(
        Math.pow(orb.x - playerX, 2) + Math.pow(orb.y - playerY, 2)
      );
      if (dist < 400) {
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(orb.x, orb.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Draw paused overlay
  drawPaused(ctx) {
    const game = this.game;

    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.strokeRect(game.width / 2 - 200, game.height / 2 - 80, 400, 160);

    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 56px Outfit";
    ctx.textAlign = "center";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff00";
    ctx.fillText("|| PAUSED ||", game.width / 2, game.height / 2);
    ctx.shadowBlur = 0;
    ctx.font = "20px Outfit";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("» ESC / P = resume", game.width / 2, game.height / 2 + 40);
    ctx.fillText("» R = restart", game.width / 2, game.height / 2 + 70);
    ctx.textAlign = "left";
  }

  // Draw game over screen
  drawGameOver(ctx) {
    const game = this.game;

    // Full screen VHS static overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.98)";
    ctx.fillRect(0, 0, game.width, game.height);

    // VHS noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
      ctx.fillRect(
        Math.random() * game.width,
        Math.random() * game.height,
        2,
        2
      );
    }

    // Larger VHS-style container
    const boxWidth = 900;
    const boxHeight = 550;
    const boxX = game.width / 2 - boxWidth / 2;
    const boxY = game.height / 2 - boxHeight / 2;

    // VHS-style scanlines background
    for (let y = boxY; y < boxY + boxHeight; y += 2) {
      ctx.fillStyle =
        y % 4 === 0 ? "rgba(0, 0, 0, 0.9)" : "rgba(10, 0, 0, 0.85)";
      ctx.fillRect(boxX, y, boxWidth, 2);
    }

    // Chunky retro border
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 6;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = "#660000";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX + 8, boxY + 8, boxWidth - 16, boxHeight - 16);

    // VHS glitch line effect
    const glitchY = boxY + Math.random() * boxHeight;
    ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3})`;
    ctx.fillRect(boxX, glitchY, boxWidth, 3);

    // Retro GAME OVER text with VHS chromatic aberration
    ctx.font = "bold 80px Courier New";
    ctx.textAlign = "center";

    // Red channel offset
    ctx.fillStyle = "#ff0000";
    ctx.fillText("× GAME OVER ×", game.width / 2 - 3, boxY + 90);
    // Cyan channel offset
    ctx.fillStyle = "#00ffff";
    ctx.fillText("× GAME OVER ×", game.width / 2 + 3, boxY + 90);
    // Main white text
    ctx.fillStyle = "#ffffff";
    ctx.fillText("× GAME OVER ×", game.width / 2, boxY + 90);

    // VHS-style score display
    ctx.font = "bold 28px Courier New";
    ctx.fillStyle = "#ffff00";
    ctx.fillText(
      `LVL ${game.level} /// SCORE ${game.score} /// KILLS ${game.totalKills}`,
      game.width / 2,
      boxY + 145
    );

    // Retro separator line
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 50, boxY + 165);
    ctx.lineTo(boxX + boxWidth - 50, boxY + 165);
    ctx.stroke();

    // VHS-style playstyle title
    const playstyleData = game.getPlaystylePercentage();
    ctx.font = "bold 24px Courier New";
    ctx.fillStyle = "#00ff00";
    ctx.fillText(">> PLAYSTYLE ANALYSIS <<", game.width / 2, boxY + 205);

    // Blocky retro playstyle bar
    const barWidth = 600;
    const barHeight = 40;
    const barX = game.width / 2 - barWidth / 2;
    const barY = boxY + 225;

    // Bar background with scanlines
    ctx.fillStyle = "#000000";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Attack portion - blocky red with dithering
    const attackWidth = (barWidth * playstyleData.attack) / 100;
    for (let y = 0; y < barHeight; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? "#ff0000" : "#cc0000";
      ctx.fillRect(barX, barY + y, attackWidth, 2);
    }

    // Defense portion - blocky blue with dithering
    const defenseWidth = (barWidth * playstyleData.defense) / 100;
    for (let y = 0; y < barHeight; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? "#0066ff" : "#0044cc";
      ctx.fillRect(barX + attackWidth, barY + y, defenseWidth, 2);
    }

    // Chunky bar border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // VHS-style labels
    ctx.font = "bold 22px Courier New";
    ctx.fillStyle = "#ff4444";
    ctx.textAlign = "left";
    ctx.fillText(
      `[ATTACK: ${playstyleData.attack}%]`,
      barX,
      barY + barHeight + 35
    );

    ctx.fillStyle = "#4444ff";
    ctx.textAlign = "right";
    ctx.fillText(
      `[DEFENCE: ${playstyleData.defense}%]`,
      barX + barWidth,
      barY + barHeight + 35
    );
    ctx.textAlign = "center";

    // Another separator
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 50, barY + barHeight + 55);
    ctx.lineTo(boxX + boxWidth - 50, barY + barHeight + 55);
    ctx.stroke();

    // Death cause - VHS style
    ctx.font = "bold 26px Courier New";
    ctx.fillStyle = "#ff6666";
    ctx.fillText(
      `[!] ${game.deathCause.toUpperCase()} [!]`,
      game.width / 2,
      barY + barHeight + 95
    );

    // Death message - retro monospace
    ctx.font = "20px Courier New";
    ctx.fillStyle = "#cccccc";

    // Wrap text
    const maxWidth = boxWidth - 120;
    const words = game.deathMessage.split(" ");
    let line = "";
    let y = barY + barHeight + 135;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(`> ${line.trim()}`, game.width / 2, y);
        line = words[i] + " ";
        y += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(`> ${line.trim()}`, game.width / 2, y);

    // VHS timestamp effect
    const timestamp =
      new Date().toISOString().split("T")[0] +
      " " +
      new Date().toTimeString().split(" ")[0];
    ctx.font = "14px Courier New";
    ctx.fillStyle = "#666666";
    ctx.textAlign = "right";
    ctx.fillText(
      `REC ${timestamp}`,
      boxX + boxWidth - 20,
      boxY + boxHeight - 50
    );

    // Restart prompt - blinking VHS style
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
      ctx.font = "bold 24px Courier New";
      ctx.fillStyle = "#00ff00";
      ctx.textAlign = "center";
      ctx.fillText(
        "[PRESS R TO RESTART]",
        game.width / 2,
        boxY + boxHeight - 35
      );
    }

    ctx.textAlign = "left";
  }

  // Draw level transition overlay
  drawLevelTransition(ctx) {
    const game = this.game;
    const timer = game.levelTransitionTimer;
    let boxScale = 0;
    let alpha = 0;

    // Calculate box scale based on animation phase
    if (timer < game.levelTransitionExpandDuration) {
      // Expanding phase
      const progress = timer / game.levelTransitionExpandDuration;
      boxScale = game.easeOutElastic(progress);
      alpha = progress;
    } else if (
      timer <
      game.levelTransitionExpandDuration + game.levelTransitionHoldDuration
    ) {
      // Hold phase
      boxScale = 1;
      alpha = 1;
    } else {
      // Shrinking phase
      const shrinkTimer =
        timer -
        game.levelTransitionExpandDuration -
        game.levelTransitionHoldDuration;
      const progress = shrinkTimer / game.levelTransitionShrinkDuration;
      boxScale = 1 - game.easeInBack(progress);
      alpha = 1 - progress;
    }

    // Dark overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
    ctx.fillRect(0, 0, game.width, game.height);

    if (boxScale > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha;

      const boxWidth = 500 * boxScale;
      const boxHeight = 150 * boxScale;
      const boxX = game.width / 2 - boxWidth / 2;
      const boxY = game.height / 2 - boxHeight / 2;

      // Box background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Glitch effect border
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 4 * boxScale;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2 * boxScale;
      ctx.strokeRect(boxX - 3, boxY - 3, boxWidth + 6, boxHeight + 6);

      // Text (only show when box is at least 50% size)
      if (boxScale > 0.5) {
        const textAlpha = (boxScale - 0.5) * 2; // Fade in text
        ctx.globalAlpha = alpha * textAlpha;

        ctx.fillStyle = "#00ff00";
        ctx.font = `bold ${72 * boxScale}px Arial`;
        ctx.textAlign = "center";
        ctx.shadowBlur = 20 * boxScale;
        ctx.shadowColor = "#00ff00";
        ctx.fillText(
          `>> LEVEL ${game.level} <<`,
          game.width / 2,
          game.height / 2 - 20 * boxScale + boxHeight / 2 - 60
        );
        ctx.shadowBlur = 0;
        ctx.font = `bold ${36 * boxScale}px Arial`;
        ctx.fillStyle = "#ffff00";
        ctx.fillText(
          "! GET READY !",
          game.width / 2,
          game.height / 2 + 40 * boxScale + boxHeight / 2 - 60
        );
      }

      ctx.restore();
      ctx.textAlign = "left";
    }
  }
}
