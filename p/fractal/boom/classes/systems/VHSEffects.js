// VHSEffects.js - Handles all VHS visual effects, boot sequence, and drawing

export default class VHSEffects {
  constructor(game) {
    this.game = game;
  }

  // Trigger glitch effect
  triggerGlitch(intensity = 5, chance = 0.4, x = null, y = null, radius = 200) {
    const game = this.game;
    // Cooldown: don't trigger if already glitching
    if (game.glitchActive) return;

    if (Math.random() < chance) {
      game.glitchActive = true;
      game.glitchIntensity = Math.min(intensity, 10); // Cap intensity
      game.glitchSourceX = x !== null ? x : game.width / 2;
      game.glitchSourceY = y !== null ? y : game.height / 2;
      game.glitchRadius = Math.min(radius, 200); // Cap radius
      game.chromaticAberration = intensity * 0.2; // Reduced
    }
  }

  // Update VHS effects
  update() {
    const game = this.game;

    // VHS Effects
    game.scanlineOffset += 0.5;
    if (game.scanlineOffset > 4) game.scanlineOffset = 0;

    // Glitch decay
    if (game.glitchActive) {
      game.glitchIntensity *= 0.8;
      game.chromaticAberration *= 0.8;
      if (game.glitchIntensity < 0.1) game.glitchActive = false;
    }
    game.vhsOffset = Math.sin(Date.now() * 0.001) * 2;
  }

  // Draw VHS waiting state
  drawWaiting(ctx) {
    const game = this.game;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, game.width, game.height);

    // Blinking "INSERT CARD" text
    const blink = Math.floor(game.vhsBlinkTimer / 30) % 2 === 0;
    if (blink) {
      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 32px Courier New";
      ctx.textAlign = "center";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ff00";
      ctx.fillText(">>> INSERT CARD <<<", game.width / 2, game.height / 2);
      ctx.shadowBlur = 0;

      // Subtle hint
      ctx.fillStyle = "#00ff00";
      ctx.font = "14px Courier New";
      ctx.globalAlpha = 0.5;
      ctx.fillText("(click anywhere)", game.width / 2, game.height / 2 + 40);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
  }

  // Draw VHS boot sequence
  drawBooting(ctx) {
    const game = this.game;
    const progress = game.vhsBootTimer / game.vhsBootDuration;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, game.width, game.height);

    // Phase 1: Heavy static (0-30%)
    if (progress < 0.3) {
      const staticIntensity = 1 - progress / 0.3;
      game.vhsStatic.forEach((s) => {
        ctx.fillStyle = `rgba(${s.brightness * 255}, ${s.brightness * 255}, ${
          s.brightness * 255
        }, ${staticIntensity})`;
        ctx.fillRect(s.x, s.y, 2, 2);
      });

      // Tracking lines
      for (let i = 0; i < 5; i++) {
        const y = (game.vhsBootTimer * 10 + i * 100) % game.height;
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(0, y, game.width, 3);
      }
    }
    // Phase 2: Color bars (30-50%)
    else if (progress < 0.5) {
      const colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
        "#ffffff",
      ];
      const barWidth = game.width / colors.length;
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(i * barWidth, 0, barWidth, game.height);
      });

      // Glitch effect
      if (Math.random() > 0.7) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(
          Math.random() * game.width,
          Math.random() * game.height,
          100,
          50
        );
      }
    }
    // Phase 3: Logo with VHS effects (50-70%)
    else if (progress < 0.7) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, game.width, game.height);

      // Show logo image with effects
      if (game.vhsLogo) {
        game.vhsLogo.style.display = "block";
        game.vhsLogo.style.left = "50%";
        game.vhsLogo.style.top = "50%";

        // Glitch effect on logo
        const glitch = Math.random() > 0.7;
        if (glitch) {
          const offset = (Math.random() - 0.5) * 20;
          game.vhsLogo.style.transform = `translate(calc(-50% + ${offset}px), -50%)`;
          game.vhsLogo.style.filter = `hue-rotate(${
            Math.random() * 360
          }deg) saturate(${1 + Math.random() * 2})`;
        } else {
          game.vhsLogo.style.transform = "translate(-50%, -50%)";
          game.vhsLogo.style.filter = "none";
        }
      }

      // "FRACTAL" text appears below logo
      const textProgress = (progress - 0.5) / 0.2; // 0 to 1 within phase 3
      if (textProgress > 0.3) {
        // Show text after logo has been visible for a bit
        const textGlitch = Math.random() > 0.8;
        const xOffset = textGlitch ? (Math.random() - 0.5) * 15 : 0;

        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 64px Courier New";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ff00";

        // RGB split effect on text
        if (textGlitch) {
          ctx.fillStyle = "#ff0000";
          ctx.fillText(
            "FRACTAL",
            game.width / 2 + xOffset - 2,
            game.height / 2 + 250
          );
          ctx.fillStyle = "#00ff00";
          ctx.fillText(
            "FRACTAL",
            game.width / 2 + xOffset,
            game.height / 2 + 250
          );
          ctx.fillStyle = "#0000ff";
          ctx.fillText(
            "FRACTAL",
            game.width / 2 + xOffset + 2,
            game.height / 2 + 250
          );
        } else {
          ctx.fillText(
            "FRACTAL",
            game.width / 2 + xOffset,
            game.height / 2 + 250
          );
        }

        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
      }

      // Scanlines over logo
      ctx.globalAlpha = 0.3;
      for (let y = 0; y < game.height; y += 4) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, y, game.width, 2);
      }
      ctx.globalAlpha = 1;

      // Static overlay
      if (Math.random() > 0.8) {
        game.vhsStatic.slice(0, 200).forEach((s) => {
          ctx.fillStyle = `rgba(${s.brightness * 255}, ${s.brightness * 255}, ${
            s.brightness * 255
          }, 0.3)`;
          ctx.fillRect(s.x, s.y, 2, 2);
        });
      }
    }
    // Phase 4: Fade to game (70-100%)
    else {
      // Hide logo
      if (game.vhsLogo) {
        game.vhsLogo.style.display = "none";
      }

      return true; // Signal to draw game with fade overlay
    }

    return false;
  }

  // Draw fade overlay for boot phase 4
  drawFadeOverlay(ctx) {
    const game = this.game;
    const progress = game.vhsBootTimer / game.vhsBootDuration;
    const fadeProgress = (progress - 0.7) / 0.3;

    ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeProgress})`;
    ctx.fillRect(0, 0, game.width, game.height);

    // Scanlines fade out
    ctx.globalAlpha = 1 - fadeProgress;
    for (let y = 0; y < game.height; y += 4) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, y, game.width, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Draw VHS scanlines
  drawScanlines(ctx) {
    const game = this.game;

    ctx.globalAlpha = 0.1;
    for (let y = game.scanlineOffset; y < game.height; y += 4) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(-game.screenShake.x, y, game.width, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Draw localized glitch effect
  drawGlitch(ctx) {
    const game = this.game;

    if (game.glitchActive) {
      for (let i = 0; i < 3; i++) {
        // Generate glitch lines within radius of source
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * game.glitchRadius;
        const glitchX = game.glitchSourceX + Math.cos(angle) * distance;
        const glitchY = game.glitchSourceY + Math.sin(angle) * distance;
        const width = Math.random() * 80 + 30;
        const height = Math.random() * 10 + 3;

        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        }, 0.15)`;
        ctx.fillRect(
          glitchX -
            width / 2 -
            game.screenShake.x +
            Math.random() * game.glitchIntensity,
          glitchY - height / 2,
          width,
          height
        );
      }
    }
  }

  // Draw vignette effect
  drawVignette(ctx) {
    const game = this.game;

    const gradient = ctx.createRadialGradient(
      game.width / 2,
      game.height / 2,
      game.height * 0.3,
      game.width / 2,
      game.height / 2,
      game.height * 0.8
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = gradient;
    ctx.fillRect(
      -game.screenShake.x,
      -game.screenShake.y,
      game.width,
      game.height
    );
  }

  // Draw Nova glitch areas
  drawNovaGlitch(ctx) {
    const game = this.game;

    if (game.nova && game.nova.isActive && Math.random() > 0.5) {
      const glitchCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < glitchCount; i++) {
        const x = Math.random() * game.width;
        const y = Math.random() * game.height;
        const width = Math.random() * 200 + 50;
        const height = Math.random() * 200 + 50;

        ctx.save();
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        }, 0.2)`;
        ctx.fillRect(x, y, width, height);

        // Glitch overlay
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = Math.random() > 0.5 ? "#ff00ff" : "#00ffff";
        ctx.fillRect(
          x + Math.random() * 10,
          y + Math.random() * 10,
          width,
          height
        );
        ctx.restore();
      }
    }
  }
}
