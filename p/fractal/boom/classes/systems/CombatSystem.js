// CombatSystem.js - Handles shooting, projectiles, and combat mechanics

import Projectile from "../projectiles/Projectile.js";
import EnemyProjectile from "../projectiles/EnemyProjectile.js";
import NovaLaser from "../projectiles/NovaLaser.js";
import Particle, {
  ExplosionParticle,
  ProjectileTrail,
} from "../effects/Particle.js";
import XPOrb from "../items/XPOrb.js";
import ComboPopup from "../effects/ComboPopup.js";
import Bomb from "../items/Bomb.js";
import PlaceableBomb from "../items/PlaceableBomb.js";
import Star from "../items/Star.js";
import ShockCrystal from "../items/ShockCrystal.js";
import Light from "../effects/Light.js";
import { CONFIG, getXPOrbConfig } from "../config/GameConfig.js";

export default class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  shoot(targetX, targetY) {
    const game = this.game;
    if (game.gameOver || game.paused) return;

    // Trigger cursor shoot animation
    game.cursor.triggerShoot();

    if (game.multiShotActive) {
      // Multi-shot with current bullet count (x3 to x7)
      const bulletCount = game.multiShotBulletCount || 3;
      const spreadAngle = CONFIG.POWERUPS.MULTISHOT.SPREAD_ANGLE;
      const totalSpread = spreadAngle * (bulletCount - 1);
      const startAngle = -totalSpread / 2;

      for (let i = 0; i < bulletCount; i++) {
        const angleOffset = startAngle + spreadAngle * i;
        const dx = targetX - game.player.getCenterX();
        const dy = targetY - game.player.getCenterY();
        const angle = Math.atan2(dy, dx) + angleOffset;
        const distance = 500; // arbitrary distance for direction
        const newTargetX =
          game.player.getCenterX() + Math.cos(angle) * distance;
        const newTargetY =
          game.player.getCenterY() + Math.sin(angle) * distance;

        const projectile = new Projectile(
          game.player.getCenterX(),
          game.player.getCenterY(),
          newTargetX,
          newTargetY
        );
        game.projectiles.push(projectile);
      }
    } else {
      // Normal single shot
      const projectile = new Projectile(
        game.player.getCenterX(),
        game.player.getCenterY(),
        targetX,
        targetY
      );
      game.projectiles.push(projectile);
    }

    // Muzzle flash particles - use pool
    game.particlePool.spawnTrail(
      game.player.getCenterX(),
      game.player.getCenterY(),
      "#ffff00",
      3
    );
  }

  placeBomb(x, y) {
    const game = this.game;
    if (game.gameOver || game.paused) return;

    // Use item from currently selected slot
    const itemType = game.player.useItemFromSlot(game.selectedSlot);

    if (itemType === "crystal") {
      // Use shock crystal - trigger shockwave
      this.triggerShockwave();
    } else if (itemType === "star") {
      // Throw star in direction of mouse
      this.throwStar(x, y);
    } else if (itemType === "bomb") {
      // Place bomb at location
      const tooClose = game.placedBombs.some((bomb) => {
        const dx = bomb.x - x;
        const dy = bomb.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 100;
      });

      if (!tooClose) {
        game.placedBombs.push(new PlaceableBomb(x, y));
      } else {
        // Refund if can't place
        game.player.addItem("bomb");
      }
    }
  }

  throwStar(targetX, targetY) {
    const game = this.game;
    // Calculate direction from player to target
    const dx = targetX - game.player.getCenterX();
    const dy = targetY - game.player.getCenterY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Create star
      const star = new Star(
        game.player.getCenterX() - 20,
        game.player.getCenterY() - 20,
        dirX,
        dirY
      );

      game.stars.push(star);

      // Visual feedback
      game.screenShake.shake(10, 15);
      game.particlePool.spawnTrail(
        game.player.getCenterX(),
        game.player.getCenterY(),
        "#ffff00",
        10
      );
    }
  }

  triggerShockwave() {
    const game = this.game;
    // Create massive shockwave particles - use pool
    game.particlePool.spawnTrail(
      game.player.getCenterX(),
      game.player.getCenterY(),
      "#00ffff",
      100
    );

    // Screen shake
    game.screenShake.shake(
      CONFIG.SCREEN_SHAKE.SHOCKWAVE.INTENSITY,
      CONFIG.SCREEN_SHAKE.SHOCKWAVE.DURATION
    );
    game.triggerGlitch(
      20,
      1.0,
      game.player.getCenterX(),
      game.player.getCenterY(),
      300
    );

    // Kill all enemies
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const enemy = game.enemies[i];

      // Create explosion particles using pool
      game.particlePool.spawnExplosion(
        enemy.getCenterX(),
        enemy.getCenterY(),
        50
      );

      // Spawn XP orbs using config helper
      const xpConfig = getXPOrbConfig(enemy.type);
      for (let k = 0; k < xpConfig.count; k++) {
        game.xpOrbs.push(
          new XPOrb(enemy.getCenterX(), enemy.getCenterY(), xpConfig.value)
        );
      }

      // Add to score
      game.score += CONFIG.SCORING.ENEMY_KILL_BASE;
      game.enemiesKilled++;
      game.totalKills++;

      // Remove enemy
      game.enemies.splice(i, 1);
    }

    // Check for level up
    if (game.enemiesKilled >= game.enemiesPerLevel) {
      game.level++;
      game.enemiesKilled = 0;
      game.enemiesPerLevel += CONFIG.PROGRESSION.ENEMIES_INCREMENT;
      game.startLevelTransition();
    }
  }

  forceBuyStarOrb() {
    const game = this.game;
    if (
      game.score >= CONFIG.SCORING.STAR_ORB_COST &&
      game.player.canAddItem("star")
    ) {
      game.score -= CONFIG.SCORING.STAR_ORB_COST;
      game.player.addStar();

      // Remove any existing star orbs
      game.starOrbs = [];

      // Visual feedback using pool
      game.particlePool.spawnTrail(
        game.player.getCenterX(),
        game.player.getCenterY(),
        "#ffff00",
        15
      );
      game.screenShake.shake(15, 20);
    }
  }

  // Update projectiles and handle collisions
  updateProjectiles() {
    const game = this.game;

    // Update projectiles
    game.projectiles = game.projectiles.filter((projectile) => {
      projectile.update();

      // Add trail particles using pool - throttled for performance
      if (
        game.particlePool.getActiveCount() < CONFIG.POOLS.PARTICLES * 0.7 &&
        Math.random() < 0.3
      ) {
        game.particlePool.spawnTrail(projectile.x, projectile.y);
      }

      // Remove if off screen
      if (projectile.isOffScreen(game.width, game.height)) {
        return false;
      }

      // Check collision with enemies
      for (let i = game.enemies.length - 1; i >= 0; i--) {
        if (projectile.checkCollision(game.enemies[i])) {
          // Count hit and track damage dealt
          game.shotsHit++;
          game.damageDealt += projectile.damage;

          if (game.enemies[i].takeDamage(projectile.damage)) {
            const enemy = game.enemies[i];

            // Increment combo
            game.comboCount++;
            game.comboTimer = CONFIG.COMBO.DECAY_TIME;

            // Create combo popup at enemy death location
            if (game.comboCount >= CONFIG.COMBO.MIN_FOR_DISPLAY) {
              game.comboPopups.push(
                new ComboPopup(
                  enemy.getCenterX(),
                  enemy.getCenterY(),
                  game.comboCount
                )
              );
            }

            // Create explosion using pool
            game.particlePool.spawnExplosion(
              enemy.getCenterX(),
              enemy.getCenterY(),
              20
            );

            // Screen shake - MORE INTENSE!
            game.screenShake.shake(
              CONFIG.SCREEN_SHAKE.ENEMY_KILL.INTENSITY,
              CONFIG.SCREEN_SHAKE.ENEMY_KILL.DURATION
            );

            // Trigger VHS glitch effect only on smart enemy kills (25% chance) - localized
            if (enemy.type === "smart") {
              game.triggerGlitch(
                8,
                0.25,
                enemy.getCenterX(),
                enemy.getCenterY(),
                150
              );
            }

            // 10% chance for dumb enemies to spawn bomb on death
            if (enemy.type === "dumb" && Math.random() < 0.1) {
              const bomb = new Bomb(
                enemy.getCenterX(),
                enemy.getCenterY() - 100,
                game.height - 20
              );
              game.bombs.push(bomb);
            }

            // 30% chance for medium/smart enemies to drop placeable bomb
            if (
              (enemy.type === "medium" || enemy.type === "smart") &&
              Math.random() < 0.3
            ) {
              if (game.player.canAddItem("bomb")) {
                game.player.addItem("bomb");
              }
            }

            // Add explosion light
            const explosionLight = new Light(
              enemy.getCenterX(),
              enemy.getCenterY(),
              200,
              "rgba(255, 100, 0, 0.8)"
            );
            game.lightingSystem.addLight(explosionLight);
            setTimeout(() => {
              game.lightingSystem.removeLight(explosionLight);
            }, 300);

            game.enemies.splice(i, 1);

            // Spawn XP orbs based on enemy type using config
            const xpConfig = getXPOrbConfig(enemy.type);
            for (let k = 0; k < xpConfig.count; k++) {
              game.xpOrbs.push(
                new XPOrb(
                  enemy.getCenterX(),
                  enemy.getCenterY(),
                  xpConfig.value
                )
              );
            }

            game.enemiesKilled++;
            game.totalKills++;

            // Check for level up
            if (game.enemiesKilled >= game.enemiesPerLevel) {
              game.level++;
              game.enemiesKilled = 0;
              game.enemiesPerLevel += CONFIG.PROGRESSION.ENEMIES_INCREMENT;
              game.startLevelTransition();
            }
          }
          return false; // Remove projectile
        }
      }

      // Check collision with Mage
      if (game.mage && projectile.checkCollision(game.mage)) {
        game.damageDealt += projectile.damage;
        if (game.mage.takeDamage(projectile.damage)) {
          // Mage defeated!
          game.particlePool.spawnExplosion(
            game.mage.getCenterX(),
            game.mage.getCenterY(),
            60
          );

          game.screenShake.shake(
            CONFIG.SCREEN_SHAKE.BOSS_DEFEAT.INTENSITY,
            CONFIG.SCREEN_SHAKE.BOSS_DEFEAT.DURATION
          );
          game.triggerGlitch(
            15,
            1.0,
            game.mage.getCenterX(),
            game.mage.getCenterY(),
            300
          );

          // Drop lots of XP
          for (let i = 0; i < 20; i++) {
            game.xpOrbs.push(
              new XPOrb(game.mage.getCenterX(), game.mage.getCenterY(), 10)
            );
          }

          // Drop shock crystal
          game.shockCrystals.push(
            new ShockCrystal(
              game.mage.getCenterX() - 8,
              game.mage.getCenterY() - 8
            )
          );

          game.mage = null;
          game.walls = []; // Remove all walls
          game.bossDefeatedThisSession = true; // Enable time warp spawns
          game.mageDefeatedOnce = true; // Mark Mage defeated for respawn logic

          // Level up
          game.level++;
          game.enemiesKilled = 0;
          game.startLevelTransition();
        }
        return false;
      }

      // Check collision with Nova
      if (
        game.nova &&
        game.nova.isActive &&
        projectile.checkCollision(game.nova)
      ) {
        game.damageDealt += projectile.damage;
        if (game.nova.takeDamage(projectile.damage)) {
          // Nova defeated!
          game.particlePool.spawnExplosion(
            game.nova.getCenterX(),
            game.nova.getCenterY(),
            100
          );

          game.screenShake.shake(
            CONFIG.SCREEN_SHAKE.BOSS_DEFEAT.INTENSITY + 10,
            CONFIG.SCREEN_SHAKE.BOSS_DEFEAT.DURATION + 10
          );
          game.triggerGlitch(
            20,
            1.0,
            game.nova.getCenterX(),
            game.nova.getCenterY(),
            400
          );

          // Drop massive XP
          for (let i = 0; i < 30; i++) {
            game.xpOrbs.push(
              new XPOrb(game.nova.getCenterX(), game.nova.getCenterY(), 15)
            );
          }

          game.nova = null;
          game.novaActive = false;
          game.novaDefeatedOnce = true; // Mark Nova as defeated once for respawn logic
          game.bossDefeatedThisSession = true; // Enable time warp spawns
          game.novaLasers = [];

          // Level up
          game.level++;
          game.enemiesKilled = 0;
          game.startLevelTransition();
        }
        return false;
      }

      // Check collision with Walls - walls block projectiles but don't get destroyed
      for (let i = game.walls.length - 1; i >= 0; i--) {
        if (
          game.walls[i].checkCollision({
            x: projectile.x - 2,
            y: projectile.y - 2,
            width: 4,
            height: 4,
          })
        ) {
          // Wall blocks projectile (no destruction)
          return false;
        }
      }

      return true;
    });
  }

  // Update enemy projectiles
  updateEnemyProjectiles() {
    const game = this.game;
    const timeScale = game.getTimeScale();

    game.enemyProjectiles = game.enemyProjectiles.filter((proj) => {
      // Apply time warp to enemy projectiles
      const originalSpeed = proj.speed;
      proj.speed = originalSpeed * timeScale;
      proj.update();
      proj.speed = originalSpeed;

      // Remove if off screen
      if (proj.isOffScreen(game.width, game.height)) {
        return false;
      }

      // Check collision with player (skip if player is invincible from dash or Nova grab)
      if (
        !game.player.isInvincible &&
        !game.novaGrabActive &&
        proj.checkCollision(game.player)
      ) {
        game.damageTaken += proj.damage;
        if (game.player.takeDamage(proj.damage)) {
          game.startDeathAnimation();
        }
        return false;
      }

      return true;
    });
  }

  // Update stars and their collisions
  updateStars() {
    const game = this.game;

    game.stars.forEach((star) => star.update(game.width, game.height));

    // Check star collision with enemies
    for (let i = game.stars.length - 1; i >= 0; i--) {
      const star = game.stars[i];

      if (star.isDead()) {
        game.stars.splice(i, 1);
        continue;
      }

      // Check Mage collision - stars deal damage regardless of shield
      if (game.mage && star.checkCollision(game.mage)) {
        const mageX = game.mage.getCenterX();
        const mageY = game.mage.getCenterY();

        // Deal 150 damage to Mage
        if (game.mage.takeDamage(150, true)) {
          // true = bypass shield
          // Mage defeated
          game.particlePool.spawnExplosion(mageX, mageY, 20);
          game.score += CONFIG.SCORING.MAGE_DEFEAT;
          game.mage = null;
        } else {
          // Hit effect
          game.particlePool.spawnExplosion(mageX, mageY, 8);
        }
        game.screenShake.shake(15, 20);
        star.die();
        continue;
      }

      // Check Nova collision - stars break shield
      if (game.nova && game.nova.isActive && star.checkCollision(game.nova)) {
        const novaX = game.nova.getCenterX();
        const novaY = game.nova.getCenterY();

        if (!game.nova.isVulnerable) {
          // Break Nova's shield permanently!
          game.nova.shieldBroken = true;
          game.nova.isVulnerable = true;
          // Shield break effect
          game.particlePool.spawnTrail(novaX, novaY, "#ffff00", 15);
          game.screenShake.shake(25, 30);
        } else {
          // Deal 150 damage to Nova
          if (game.nova.takeDamage(150, true)) {
            // true = bypass shield
            // Nova defeated
            game.particlePool.spawnExplosion(novaX, novaY, 20);
            game.score += CONFIG.SCORING.NOVA_DEFEAT;
            game.nova = null;
            game.novaActive = false;
          } else {
            // Hit effect
            game.particlePool.spawnExplosion(novaX, novaY, 8);
          }
        }
        game.screenShake.shake(15, 20);
        star.die();
        continue;
      }

      // Check enemy collisions
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        if (star.checkCollision(game.enemies[j])) {
          const enemy = game.enemies[j];

          // Kill enemy instantly
          game.particlePool.spawnExplosion(
            enemy.getCenterX(),
            enemy.getCenterY(),
            15
          );

          game.screenShake.shake(10, 15);

          // Drop XP using config
          const xpConfig = getXPOrbConfig(enemy.type);
          for (let k = 0; k < xpConfig.count; k++) {
            game.xpOrbs.push(
              new XPOrb(enemy.getCenterX(), enemy.getCenterY(), xpConfig.value)
            );
          }

          game.score += CONFIG.SCORING.ENEMY_KILL_BASE;
          game.enemiesKilled++;
          game.enemies.splice(j, 1);
        }
      }
    }

    // Remove dead stars
    game.stars = game.stars.filter((star) => !star.isDead());
  }

  // Update Nova lasers
  updateNovaLasers() {
    const game = this.game;

    game.novaLasers.forEach((laser) => laser.update());

    // Check Nova laser collisions
    for (let i = game.novaLasers.length - 1; i >= 0; i--) {
      const laser = game.novaLasers[i];

      // Apply screen shake from laser
      const shakeAmount = laser.getScreenShake();
      if (shakeAmount > 0) {
        game.screenShake.shake(shakeAmount, shakeAmount);
      }

      // Remove if off screen (beam expired)
      if (laser.isOffScreen(game.width, game.height)) {
        game.novaLasers.splice(i, 1);
        continue;
      }

      // Check collision with player (skip if Nova grab active)
      if (!game.novaGrabActive && laser.checkCollision(game.player)) {
        game.damageTaken += laser.damage;
        if (game.player.takeDamage(laser.damage)) {
          game.startDeathAnimation();
        }
      }

      // Check collision with enemies (kills them all)
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        if (laser.checkCollision(game.enemies[j])) {
          const enemy = game.enemies[j];

          // Instant kill using pool
          game.particlePool.spawnExplosion(
            enemy.getCenterX(),
            enemy.getCenterY(),
            15
          );

          // Drop XP using config
          const xpConfig = getXPOrbConfig(enemy.type);
          for (let k = 0; k < xpConfig.count; k++) {
            game.xpOrbs.push(
              new XPOrb(enemy.getCenterX(), enemy.getCenterY(), xpConfig.value)
            );
          }

          game.score += CONFIG.SCORING.ENEMY_KILL_BASE;
          game.enemiesKilled++;
          game.totalKills++;
          game.enemies.splice(j, 1);
        }
      }
    }
  }

  // Update multi-shot timer
  updateMultiShot() {
    const game = this.game;
    if (game.multiShotActive) {
      game.multiShotTimer--;
      if (game.multiShotTimer <= 0) {
        game.multiShotActive = false;
      }
    }
  }

  // Update orb attraction timer
  updateOrbAttraction() {
    const game = this.game;
    if (game.orbAttractionActive) {
      game.orbAttractionTimer--;
      if (game.orbAttractionTimer <= 0) {
        game.orbAttractionActive = false;
      }
    }
  }

  // Auto-shoot when holding left mouse button
  updateAutoShoot() {
    const game = this.game;
    if (game.input.mouseDown && !game.gameOver && !game.paused) {
      game.autoShootTimer++;
      if (game.autoShootTimer >= game.autoShootCooldown) {
        this.shoot(game.input.mouse.x, game.input.mouse.y);
        game.autoShootTimer = 0;
      }
    } else {
      game.autoShootTimer = game.autoShootCooldown; // Ready to fire immediately on next click
    }
  }
}
