// Game.js - Main game class with core variables

// Entities //
import Player from "./entities/Player.js";

// Effects //
import Particle, { ExplosionParticle } from "./effects/Particle.js";
import ScreenShake from "./effects/ScreenShake.js";
import Light, { LightingSystem } from "./effects/Light.js";

// Systems //
import InputHandler from "./systems/InputHandler.js";
import Cursor from "./systems/Cursor.js";
import RPCDetector from "./systems/RPCDetector.js";
import SpawnSystem from "./systems/SpawnSystem.js";
import CombatSystem from "./systems/CombatSystem.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import VHSEffects from "./systems/VHSEffects.js";
import UISystem from "./systems/UISystem.js";
import BossSystem from "./systems/BossSystem.js";
import ItemSystem from "./systems/ItemSystem.js";
import DrawSystem from "./systems/DrawSystem.js";
import BotPlay from "./systems/BotPlay.js";
import { ParticlePool, ProjectilePool } from "./systems/ObjectPool.js";

// Config //
import { CONFIG } from "./config/GameConfig.js";

// Items //
import TimeWarp from "./items/TimeWarp.js";
import PowerUp from "./items/PowerUp.js";
import PushPull from "./items/PushPull.js";

// Utils //
import DeathMessages from "./utils/DeathMessages.js";

export default class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Make canvas fullscreen
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    /* BOOT SEQUENCE */
    this.vhsState = "waiting"; // waiting, booting, ready
    this.vhsBootTimer = 0;
    this.vhsBootDuration = CONFIG.VHS.BOOT_DURATION;
    this.vhsStatic = [];
    this.vhsBlinkTimer = 0;
    this.vhsLogo = document.getElementById("vhsLogo");

    // Generate static pattern
    for (let i = 0; i < CONFIG.VHS.STATIC_COUNT; i++) {
      this.vhsStatic.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        brightness: Math.random(),
      });
    }

    // Click to start VHS boot
    this.canvas.addEventListener(
      "click",
      () => {
        if (this.vhsState === "waiting") {
          this.vhsState = "booting";
          this.vhsBootTimer = 0;
        }
      },
      { once: true }
    );

    // Auto-pause when window loses focus
    window.addEventListener("blur", () => {
      if (this.vhsState === "ready" && !this.gameOver && !this.paused) {
        this.paused = true;
      }
    });

    // Create input handler once in constructor
    this.input = new InputHandler();

    // Create custom cursor
    this.cursor = new Cursor();

    // Create Discord RPC detector
    this.rpcDetector = new RPCDetector(this);

    // Initialize all game systems
    this.spawnSystem = new SpawnSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.collisionSystem = new CollisionSystem(this);
    this.vhsEffects = new VHSEffects(this);
    this.uiSystem = new UISystem(this);
    this.bossSystem = new BossSystem(this);
    this.itemSystem = new ItemSystem(this);
    this.drawSystem = new DrawSystem(this);
    this.botPlay = new BotPlay(this);

    // Setup mouse listeners once in constructor
    this.input.setupMouseListeners(
      this.canvas,
      (x, y) => this.combatSystem.shoot(x, y),
      (x, y) => this.combatSystem.placeBomb(x, y)
    );

    // Initialize totalKills once - persists across game resets
    this.totalKills = 0;

    this.init();

    // Start game loop
    this.lastTime = 0;
    this.animate(0);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  init() {
    this.player = new Player(this.width / 2, this.height / 2);

    // Zoom limits (prevent browser zoom from exceeding 130% or going below 60%)
    const MIN_ALLOWED = 0.6; // 60%
    const MAX_ALLOWED = 1.3; // 130%
    const wrapper = document.querySelector(".game-wrapper");
    if (wrapper) {
      wrapper.style.transformOrigin = "0 0";
      const zoomWarning = document.getElementById("zoomWarning");

      const enforceZoom = () => {
        const actual = window.devicePixelRatio || 1;
        const clamped = Math.min(MAX_ALLOWED, Math.max(MIN_ALLOWED, actual));
        const scale = clamped / actual;
        wrapper.style.transform = `scale(${scale})`;

        if (zoomWarning) {
          zoomWarning.style.display = clamped !== actual ? "flex" : "none";
        }
      };
      enforceZoom();
      window.addEventListener("resize", enforceZoom);
      try {
        const mq = window.matchMedia(
          `(resolution: ${window.devicePixelRatio}dppx)`
        );
        if (mq && "addEventListener" in mq) {
          mq.addEventListener("change", enforceZoom);
        }
      } catch (e) {
        // ignore
      }
    }

    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];

    // Object pools for performance
    this.particlePool = new ParticlePool(CONFIG.POOLS.PARTICLES, 5);
    this.projectilePool = new ProjectilePool(CONFIG.POOLS.PROJECTILES);

    // Legacy arrays for backwards compatibility (earlier versions ahh)
    this.particles = [];
    this.MAX_PARTICLES = CONFIG.POOLS.PARTICLES;
    this.particleQueue = [];
    this.PARTICLES_PER_FRAME = 5;

    this.powerUps = [];
    this.xpOrbs = [];
    this.shockCrystals = [];
    this.starOrbs = [];
    this.stars = [];
    this.timeWarps = []; // Time warp pickups
    this.pushPulls = []; // PushPull pickups
    this.mage = null;
    this.nova = null;
    this.novaActive = false;
    this.novaReappearLevel = null;
    this.novaDefeatedOnce = false; // Track if Nova was ever killed (for respawn logic)
    this.mageDefeatedOnce = false; // Track if Mage was ever killed (for respawn logic)
    this.novaLasers = [];
    this.walls = [];
    this.screenShake = new ScreenShake();
    this.lightingSystem = new LightingSystem();

    /* GENERAL INFO */
    this.score = 0;
    this.level = 1;
    this.enemiesKilled = 0;
    this.enemiesPerLevel = CONFIG.PROGRESSION.STARTING_ENEMIES_PER_LEVEL;
    this.gameOver = false;
    this.paused = false;
    this.bossDefeatedThisSession = false; // Track if any boss was defeated (enables time warp spawns)

    /* ANIMATION STUFF */
    this.levelTransition = false;
    this.levelTransitionTimer = 0;
    this.levelTransitionDuration = CONFIG.ANIMATION.LEVEL_TRANSITION_DURATION;
    this.levelTransitionExpandDuration =
      CONFIG.ANIMATION.LEVEL_TRANSITION_EXPAND;
    this.levelTransitionHoldDuration = CONFIG.ANIMATION.LEVEL_TRANSITION_HOLD;
    this.levelTransitionShrinkDuration =
      CONFIG.ANIMATION.LEVEL_TRANSITION_SHRINK;
    this.deathAnimation = false;
    this.deathAnimationTimer = 0;
    this.deathAnimationDuration = CONFIG.ANIMATION.DEATH_ANIMATION_DURATION;
    this.deathMessage = "";
    this.deathCause = "";

    /* PLAYSTYLE TRACKING */
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.shotsHit = 0;
    this.timeNearEnemies = 0;
    this.timeFarFromEnemies = 0;
    this.currentPlaystyle = "ATTACK";

    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = CONFIG.SPAWNING.ENEMY_INTERVAL;
    this.powerUpSpawnTimer = 0;
    this.powerUpSpawnInterval = CONFIG.SPAWNING.POWERUP_INTERVAL;

    /* POWERUP INFO */
    this.multiShotActive = false;
    this.multiShotTimer = 0;
    this.multiShotBulletCount = 3; // Random x3 to x7 bullets
    this.multiShotDuration = CONFIG.POWERUPS.MULTISHOT.DURATION;

    /* ORB ATTRACTION SYSTEM */
    this.orbAttractionActive = false;
    this.orbAttractionTimer = 0;
    this.orbAttractionDuration = 180;

    /* TIME WARP SYSTEM */
    this.timeWarps = []; // Spawned time warp pickups
    this.timeWarpActive = false;
    this.timeWarpTimer = 0;
    this.timeWarpDuration = CONFIG.POWERUPS.TIME_WARP.DURATION;
    this.timeWarpSlowFactor = CONFIG.POWERUPS.TIME_WARP.SLOW_FACTOR;

    /* PUSH PULL SYSTEM */
    this.pushPullActive = false;
    this.pushPullTimer = 0;
    this.pushPullDuration = CONFIG.POWERUPS.PUSH_PULL.DURATION;

    /* AUTO-SHOOT SYSTEM */
    this.autoShootCooldown = CONFIG.COMBAT.AUTO_SHOOT_COOLDOWN;
    this.autoShootTimer = 0;

    /* VHS EFFECTS */
    this.vhsOffset = 0;
    this.glitchTimer = 0;
    this.glitchActive = false;
    this.glitchIntensity = 0;
    this.glitchSourceX = 0;
    this.glitchSourceY = 0;
    this.glitchRadius = 0;
    this.chromaticAberration = 0;
    this.scanlineOffset = 0;

    /* SCREENSHOT */
    this.screenshotMessage = "";
    this.screenshotMessageTimer = 0;

    /* COMBO SYSTEM */
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboPopups = []; // Array of active combo popups

    /* NOVA GRAB SYSTEM */
    this.novaGrabActive = false;
    this.novaGrabStartX = 0;
    this.novaGrabStartY = 0;
    this.novaGrabTargetX = 0;
    this.novaGrabTargetY = 0;
    this.novaGrabProgress = 0;
    this.novaGrabDuration = 120;
    this.novaGrabCooldown = 0;

    /* BOMB SYSTEM */
    this.bombs = [];
    this.bombSpawnTimer = 0;
    this.bombSpawnInterval = CONFIG.SPAWNING.BOMB_INTERVAL;
    this.firePatches = [];

    /* INVENTORY */
    this.placedBombs = [];
    this.selectedSlot = 0;

    // Player light //
    this.playerLight = new Light(
      this.player.getCenterX(),
      this.player.getCenterY(),
      CONFIG.LIGHTING.PLAYER_LIGHT_RADIUS,
      CONFIG.LIGHTING.PLAYER_LIGHT_COLOR
    );
    this.lightingSystem.addLight(this.playerLight);

    // Get VHS logo element
    if (!this.vhsLogo) {
      this.vhsLogo = document.getElementById("vhsLogo");
    }

    // Load grab hand image - nova's fight
    if (!this.grabHandImg) {
      this.grabHandImg = new Image();
      this.grabHandImg.src = "img/grab.svg";
    }
  }

  reset() {
    this.init();
    if (this.rpcDetector) {
      this.rpcDetector.onNewGame();
    }
  }

  // Delegate to VHSEffects system
  triggerGlitch(intensity, chance, x, y, radius) {
    this.vhsEffects.triggerGlitch(intensity, chance, x, y, radius);
  }

  // Activate time warp effect
  activateTimeWarp() {
    this.timeWarpActive = true;
    this.timeWarpTimer = this.timeWarpDuration;

    // Visual feedback
    this.screenShake.shake(15, 20);
    this.triggerGlitch(
      10,
      1.0,
      this.player.getCenterX(),
      this.player.getCenterY(),
      300
    );

    // Spawn particles in a ring
    this.particlePool.spawnExplosion(
      this.player.getCenterX(),
      this.player.getCenterY(),
      25
    );
  }

  // Get time scale factor
  getTimeScale() {
    return this.timeWarpActive ? this.timeWarpSlowFactor : 1;
  }

  // Queue particles to spawn over multiple frames
  queueParticles(particleArray) {
    this.particleQueue.push(...particleArray);
  }

  // Process queued particles
  processParticleQueue() {
    const toSpawn = Math.min(
      this.PARTICLES_PER_FRAME,
      this.particleQueue.length
    );
    for (let i = 0; i < toSpawn; i++) {
      if (this.particles.length < this.MAX_PARTICLES) {
        this.particles.push(this.particleQueue.shift());
      } else {
        this.particleQueue.shift();
      }
    }
  }

  getPlaystyle() {
    const attackScore = this.damageDealt + this.shotsHit * 5;
    const survivalBonus = Math.max(0, 500 - this.damageTaken);
    const defenseScore = survivalBonus;

    if (attackScore > defenseScore * 1.5) {
      this.currentPlaystyle = "ATTACK";
    } else {
      this.currentPlaystyle = "DEFENCE";
    }

    return this.currentPlaystyle;
  }

  getPlaystylePercentage() {
    const attackScore = this.damageDealt + this.shotsHit * 5;
    const survivalBonus = Math.max(0, 500 - this.damageTaken);
    const defenseScore = survivalBonus;
    const total = attackScore + defenseScore;

    if (total === 0) return { attack: 50, defense: 50 };

    return {
      attack: Math.round((attackScore / total) * 100),
      defense: Math.round((defenseScore / total) * 100),
    };
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  easeInBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  }

  startLevelTransition() {
    this.levelTransition = true;
    this.levelTransitionTimer = 0;

    // Process enemies: some explode, some stay
    setTimeout(() => {
      const survivingEnemies = [];

      this.enemies.forEach((enemy) => {
        const fate = Math.random();

        if (fate < 0.5) {
          // Use particle pool for explosion
          this.particlePool.spawnExplosion(
            enemy.getCenterX(),
            enemy.getCenterY(),
            8
          );
        } else {
          survivingEnemies.push(enemy);
        }
      });

      this.enemies = survivingEnemies;
      this.enemyProjectiles = [];
    }, 200);

    // YAY particles - use particle pool
    const colors = ["#ffff00", "#00ff00", "#00ffff", "#ff00ff"];
    for (let i = 0; i < 20; i++) {
      this.particlePool.spawn(
        this.width / 2,
        this.height / 2,
        colors[Math.floor(Math.random() * colors.length)],
        "normal"
      );
    }
  }

  startDeathAnimation() {
    this.deathAnimation = true;
    this.deathAnimationTimer = 0;
    this.deathMessage = DeathMessages.getDeathMessage(this);
    this.deathCause = DeathMessages.getDeathCause(this);

    if (this.rpcDetector) {
      this.rpcDetector.onDeath(this.deathMessage);
    }

    // Use particle pool for death explosion
    this.particlePool.spawnExplosion(
      this.player.getCenterX(),
      this.player.getCenterY(),
      15
    );

    this.screenShake.shake(
      CONFIG.SCREEN_SHAKE.DEATH.INTENSITY,
      CONFIG.SCREEN_SHAKE.DEATH.DURATION
    );
  }

  update() {
    // VHS boot sequence
    if (this.vhsState === "waiting") {
      this.vhsBlinkTimer++;
      return;
    }

    if (this.vhsState === "booting") {
      this.vhsBootTimer++;
      if (this.vhsBootTimer >= this.vhsBootDuration) {
        this.vhsState = "ready";
      }
      return;
    }

    // Check for reset
    if (this.input.consumeResetPress()) {
      this.reset();
      return;
    }

    // Check for pause
    if (this.input.consumePausePress()) {
      this.paused = !this.paused;
    }

    // Handle inventory slot selection (1-3)
    if (this.input.keys.has("1")) {
      this.selectedSlot = 0;
      this.input.keys.delete("1");
    }
    if (this.input.keys.has("2")) {
      this.selectedSlot = 1;
      this.input.keys.delete("2");
    }
    if (this.input.keys.has("3")) {
      this.selectedSlot = 2;
      this.input.keys.delete("3");
    }

    if (this.paused) return;

    // Death animation
    if (this.deathAnimation) {
      this.deathAnimationTimer++;
      this.screenShake.update();

      // Update both legacy particles and pool
      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter((particle) => !particle.isDead());
      this.particlePool.update();

      if (this.deathAnimationTimer >= this.deathAnimationDuration) {
        this.gameOver = true;
        this.deathAnimation = false;
      }
      return;
    }

    // Level transition
    if (this.levelTransition) {
      this.levelTransitionTimer++;

      if (this.levelTransitionTimer >= this.levelTransitionDuration) {
        this.levelTransition = false;
        this.enemySpawnInterval = Math.max(
          CONFIG.SPAWNING.ENEMY_MIN_INTERVAL,
          this.enemySpawnInterval - CONFIG.SPAWNING.ENEMY_INTERVAL_DECREASE
        );
      }
    }

    if (this.gameOver) return;

    // Check for dash input (double-tap)
    const dashRequest = this.input.consumeDashRequest();
    if (dashRequest) {
      if (this.player.dash(dashRequest.x, dashRequest.y)) {
        // Dash triggered! Add visual effects
        this.screenShake.shake(8, 10);
        this.particlePool.spawnTrail(
          this.player.getCenterX(),
          this.player.getCenterY(),
          "#00ffff",
          8
        );
      }
    }

    // Calculate time scale (for time warp)
    const timeScale = this.timeWarpActive ? this.timeWarpSlowFactor : 1;

    // Update time warp
    if (this.timeWarpActive) {
      this.timeWarpTimer--;
      if (this.timeWarpTimer <= 0) {
        this.timeWarpActive = false;
        // End effect - burst of particles
        this.particlePool.spawnExplosion(
          this.player.getCenterX(),
          this.player.getCenterY(),
          15
        );
      }
    }

    // Update push/pull effect
    if (this.pushPullActive) {
      this.pushPullTimer--;

      // Continuous effects while active
      const pullSpeed = CONFIG.POWERUPS.PUSH_PULL.PULL_SPEED;
      const pushForce = CONFIG.POWERUPS.PUSH_PULL.PUSH_FORCE;

      // Pull all XP orbs towards player
      this.xpOrbs.forEach((orb) => {
        const dx = this.player.getCenterX() - orb.x;
        const dy = this.player.getCenterY() - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          orb.x += (dx / dist) * pullSpeed;
          orb.y += (dy / dist) * pullSpeed;
        }
      });

      // Gently push enemies away continuously
      this.enemies.forEach((enemy) => {
        const dx = enemy.getCenterX() - this.player.getCenterX();
        const dy = enemy.getCenterY() - this.player.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 300) {
          // Only push if within range
          const force = pushForce * (1 - dist / 300); // Stronger when closer
          enemy.x += (dx / dist) * force;
          enemy.y += (dy / dist) * force;
        }
      });

      // White glow particles around player
      if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        this.particlePool.spawnTrail(
          this.player.getCenterX() + Math.cos(angle) * dist,
          this.player.getCenterY() + Math.sin(angle) * dist,
          "#ffffff",
          1
        );
      }

      if (this.pushPullTimer <= 0) {
        this.pushPullActive = false;
        this.player.isInvincible = false;
        // End effect - burst of white particles
        this.particlePool.spawnExplosion(
          this.player.getCenterX(),
          this.player.getCenterY(),
          20
        );
      }
    }

    // Update time warp pickups
    this.timeWarps = this.timeWarps.filter((tw) => {
      tw.update();

      // Check collision with player
      if (tw.checkCollision(this.player)) {
        this.activateTimeWarp();
        return false;
      }

      return !tw.isDead();
    });

    // Spawn time warp pickups occasionally
    this.timeWarpSpawnTimer++;
    if (this.timeWarpSpawnTimer >= this.timeWarpSpawnInterval) {
      this.timeWarpSpawnTimer = 0;
      if (Math.random() < 0.4 && this.timeWarps.length === 0) {
        // 40% chance, only one at a time
        const x = Math.random() * (this.width - 100) + 50;
        const y = Math.random() * (this.height - 100) + 50;
        this.timeWarps.push(new TimeWarp(x, y));
      }
    }

    // Update core systems
    this.screenShake.update();
    this.vhsEffects.update();
    this.player.update(this.input, this.width, this.height);
    this.playerLight.update(this.player.getCenterX(), this.player.getCenterY());

    // Update all game systems
    this.combatSystem.updateAutoShoot();
    this.itemSystem.update();
    this.bossSystem.update();
    this.combatSystem.updateProjectiles();
    this.combatSystem.updateEnemyProjectiles();
    this.combatSystem.updateStars();
    this.combatSystem.updateNovaLasers();
    this.combatSystem.updateMultiShot();
    this.combatSystem.updateOrbAttraction();
    this.collisionSystem.update();
    this.spawnSystem.update();

    // Update combo system
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0; // Reset combo when timer expires
      }
    }

    // Update combo popups
    this.comboPopups = this.comboPopups.filter((popup) => popup.update());

    // Update Nova grab system
    if (this.novaGrabActive) {
      this.novaGrabProgress++;

      // Smooth easing (ease-out)
      const t = this.novaGrabProgress / this.novaGrabDuration;
      const easeT = 1 - Math.pow(1 - t, 3); // Cubic ease-out

      // Interpolate player position
      this.player.x =
        this.novaGrabStartX +
        (this.novaGrabTargetX - this.novaGrabStartX) * easeT;
      this.player.y =
        this.novaGrabStartY +
        (this.novaGrabTargetY - this.novaGrabStartY) * easeT;

      // Push enemies away from player during grab
      const repelRadius = 200;
      const repelForce = 8;
      this.enemies.forEach((enemy) => {
        const dx = enemy.getCenterX() - this.player.getCenterX();
        const dy = enemy.getCenterY() - this.player.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * repelForce;
          enemy.x += (dx / dist) * force;
          enemy.y += (dy / dist) * force;
        }
      });

      // End grab when complete
      if (this.novaGrabProgress >= this.novaGrabDuration) {
        this.novaGrabActive = false;
        this.novaGrabCooldown = 300;

        // Visual effect at destination
        for (let i = 0; i < 25; i++) {
          this.particles.push(
            new ExplosionParticle(
              this.player.getCenterX(),
              this.player.getCenterY()
            )
          );
        }
        this.screenShake.shake(20, 25);
      }
    }

    // Update grab cooldown
    if (this.novaGrabCooldown > 0) {
      this.novaGrabCooldown--;
    }

    // Debug keys
    if (this.input.keys.has("9") && !this.mage) {
      this.spawnSystem.spawnMage();
      this.input.keys.delete("9");
    }
    if (this.input.keys.has("7") && !this.nova) {
      this.spawnSystem.spawnNova();
      this.input.keys.delete("7");
    }
    if (this.input.keys.has("k") || this.input.keys.has("K")) {
      if (this.nova) {
        this.nova.isActive = !this.nova.isActive;
      }
      this.input.keys.delete("k");
      this.input.keys.delete("K");
    }

    // Bot play toggle with B key
    if (this.input.keys.has("b") || this.input.keys.has("B")) {
      this.botPlay.toggle();
      this.input.keys.delete("b");
      this.input.keys.delete("B");
    }

    // Update bot play system
    this.botPlay.update();

    // Screenshot with F2
    if (this.input.keys.has("F2")) {
      this.takeScreenshot();
      this.input.keys.delete("F2");
    }
  }

  // Take a screenshot of the game canvas
  async takeScreenshot() {
    const dataUrl = this.canvas.toDataURL("image/png");

    // Use Electron API if available (saves to Documents/FRACTAL/screenshots/)
    if (window.electronAPI && window.electronAPI.saveScreenshot) {
      const result = await window.electronAPI.saveScreenshot(dataUrl);
      if (result.success) {
        // Show brief feedback
        this.showScreenshotFeedback("Screenshot saved!");
      } else {
        console.error("Screenshot failed:", result.error);
        // Fallback to download
        this.downloadScreenshot(dataUrl);
      }
    } else {
      // Fallback for non-Electron (browser)
      this.downloadScreenshot(dataUrl);
    }
  }

  // Fallback download method
  downloadScreenshot(dataUrl) {
    const link = document.createElement("a");
    link.download = `fractal_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  // Show screenshot feedback on screen
  showScreenshotFeedback(message) {
    this.screenshotMessage = message;
    this.screenshotMessageTimer = 120;
  }

  draw() {
    // VHS WAITING STATE
    if (this.vhsState === "waiting") {
      this.vhsEffects.drawWaiting(this.ctx);
      return;
    }

    // VHS BOOT SEQUENCE
    if (this.vhsState === "booting") {
      const shouldDrawGame = this.vhsEffects.drawBooting(this.ctx);
      if (shouldDrawGame) {
        this.drawGame();
        this.vhsEffects.drawFadeOverlay(this.ctx);
      }
      return;
    }

    // NORMAL GAME DRAW
    this.drawGame();
  }

  drawGame() {
    // Apply screen shake
    this.ctx.save();
    this.ctx.translate(this.screenShake.x, this.screenShake.y);

    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(
      -this.screenShake.x,
      -this.screenShake.y,
      this.width,
      this.height
    );

    // Draw all game objects
    this.drawSystem.drawGameObjects(this.ctx);

    // Draw Nova glitch areas
    this.vhsEffects.drawNovaGlitch(this.ctx);

    // VHS Scanlines
    this.vhsEffects.drawScanlines(this.ctx);

    // Localized glitch
    this.vhsEffects.drawGlitch(this.ctx);

    // Vignette
    this.vhsEffects.drawVignette(this.ctx);

    this.ctx.filter = "none";
    this.ctx.restore();

    // Update HTML UI
    this.uiSystem.updateUI();

    // Time warp overlay (before other overlays)
    if (this.timeWarpActive) {
      this.uiSystem.drawTimeWarpEffect(this.ctx);
    }

    // Push/pull overlay
    if (this.pushPullActive) {
      this.uiSystem.drawPushPullEffect(this.ctx);
    }

    // Level transition overlay
    if (this.levelTransition) {
      this.uiSystem.drawLevelTransition(this.ctx);
    }

    if (this.paused) {
      this.uiSystem.drawPaused(this.ctx);
    }

    if (this.gameOver) {
      this.uiSystem.drawGameOver(this.ctx);
    }

    // Bot play label
    this.botPlay.draw(this.ctx);

    // Screenshot message feedback (small text above player)
    if (this.screenshotMessageTimer > 0) {
      this.screenshotMessageTimer--;
      const alpha = Math.min(1, this.screenshotMessageTimer / 30);
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.font = "12px 'Courier New', monospace";
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = "#ffffff";
      // Draw above player
      const textY = this.player.y - 40;
      this.ctx.fillText(this.screenshotMessage, this.player.x, textY);
      this.ctx.restore();
    }
  }

  animate(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update();
    this.draw();

    requestAnimationFrame((time) => this.animate(time));
  }
}
