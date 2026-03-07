// CollisionSystem.js - Handles entity collision detection and responses

import Particle, { ExplosionParticle } from "../effects/Particle.js";
import XPOrb from "../items/XPOrb.js";
import FirePatch from "../effects/FirePatch.js";
import TimeWarp from "../items/TimeWarp.js";
import PushPull from "../items/PushPull.js";
import { CONFIG, getXPOrbConfig } from "../config/GameConfig.js";

export default class CollisionSystem {
  constructor(game) {
    this.game = game;
  }

  // Update enemy collisions with player
  updateEnemyCollisions() {
    const game = this.game;

    game.enemies.forEach((enemy) => {
      // Check collision with player (skip if player is invincible from dash or Nova grab)
      if (
        !game.player.isInvincible &&
        !game.novaGrabActive &&
        enemy.checkCollision(game.player)
      ) {
        game.damageTaken += enemy.damage;
        if (game.player.takeDamage(enemy.damage)) {
          game.startDeathAnimation();
        }
      }
    });
  }

  // Check power-up collisions
  updatePowerUpCollisions() {
    const game = this.game;

    for (let i = game.powerUps.length - 1; i >= 0; i--) {
      if (game.powerUps[i].checkCollision(game.player)) {
        const powerUp = game.powerUps[i];

        // Explode/kill nearby enemies on powerup pickup
        const EXPLOSION_RADIUS = CONFIG.POWERUPS.PICKUP_EXPLOSION_RADIUS;
        let enemiesKilled = 0;
        for (let j = game.enemies.length - 1; j >= 0; j--) {
          const enemy = game.enemies[j];
          const dx = enemy.getCenterX() - powerUp.getCenterX();
          const dy = enemy.getCenterY() - powerUp.getCenterY();
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < EXPLOSION_RADIUS) {
            // Spawn explosion effect
            game.particlePool.spawnExplosion(
              enemy.getCenterX(),
              enemy.getCenterY(),
              10
            );
            // Remove enemy
            game.enemies.splice(j, 1);
            enemiesKilled++;
          }
        }
        if (enemiesKilled > 0) {
          game.screenShake.shake(20, 25);
        }

        if (powerUp.type === "health") {
          // Heal player
          game.player.health = Math.min(
            CONFIG.PLAYER.MAX_HEALTH,
            game.player.health + CONFIG.POWERUPS.HEALTH_RESTORE
          );

          // Activate orb attraction effect!
          game.orbAttractionActive = true;
          game.orbAttractionTimer = game.orbAttractionDuration;

          // Healing particles using pool
          game.particlePool.spawnTrail(
            powerUp.getCenterX(),
            powerUp.getCenterY(),
            "#00ff00",
            12
          );
        } else if (powerUp.type === "multishot") {
          // Activate multi-shot with the powerup's bullet count (x3 to x7)
          game.multiShotBulletCount = powerUp.bulletCount || 3;
          game.multiShotActive = true;
          game.multiShotTimer = game.multiShotDuration;

          // Power-up particles using pool
          game.particlePool.spawnTrail(
            powerUp.getCenterX(),
            powerUp.getCenterY(),
            "#ff00ff",
            12
          );
        }

        game.powerUps.splice(i, 1);
      }
    }
  }

  // Check PushPull item collisions
  updatePushPullCollisions() {
    const game = this.game;

    game.pushPulls = game.pushPulls.filter((pp) => {
      pp.update();

      // Check collision with player
      if (pp.checkCollision(game.player)) {
        // Activate push/pull - immortal + pull XP + push enemies
        game.pushPullActive = true;
        game.pushPullTimer = game.pushPullDuration;
        game.player.isInvincible = true;
        game.player.invincibilityTimer = game.pushPullDuration;

        // Initial burst - push all enemies away!
        const pushForce = CONFIG.POWERUPS.PUSH_PULL.PUSH_FORCE;
        game.enemies.forEach((enemy) => {
          const dx = enemy.getCenterX() - game.player.getCenterX();
          const dy = enemy.getCenterY() - game.player.getCenterY();
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            enemy.x += (dx / dist) * pushForce * 15;
            enemy.y += (dy / dist) * pushForce * 15;
          }
        });

        // Big white explosion particles
        game.particlePool.spawnExplosion(pp.getCenterX(), pp.getCenterY(), 30);
        game.screenShake.shake(25, 30);

        return false; // Remove the pickup
      }

      return !pp.isDead();
    });
  }

  // Check shock crystal collection
  updateCrystalCollisions() {
    const game = this.game;

    for (let i = game.shockCrystals.length - 1; i >= 0; i--) {
      if (game.shockCrystals[i].checkCollision(game.player)) {
        game.player.addShockCrystal();

        // Collection particles using pool
        game.particlePool.spawnTrail(
          game.shockCrystals[i].getCenterX(),
          game.shockCrystals[i].getCenterY(),
          "#00ffff",
          12
        );

        game.screenShake.shake(15, 20);
        game.shockCrystals.splice(i, 1);
      }
    }
  }

  // Check star orb collection
  updateStarOrbCollisions() {
    const game = this.game;

    for (let i = game.starOrbs.length - 1; i >= 0; i--) {
      const orb = game.starOrbs[i];

      if (orb.isExpired()) {
        // Remove expired star orb
        game.starOrbs.splice(i, 1);
      } else if (
        orb.checkCollision(game.player) &&
        game.score >= CONFIG.SCORING.STAR_ORB_COST &&
        game.player.canAddItem("star")
      ) {
        // Purchase star orb
        game.score -= CONFIG.SCORING.STAR_ORB_COST;
        game.player.addStar();

        // --- Explode/kill nearby enemies on star pickup --- //
        const EXPLOSION_RADIUS = CONFIG.POWERUPS.PICKUP_EXPLOSION_RADIUS;
        let enemiesKilled = 0;
        for (let j = game.enemies.length - 1; j >= 0; j--) {
          const enemy = game.enemies[j];
          const dx = enemy.getCenterX() - orb.getCenterX();
          const dy = enemy.getCenterY() - orb.getCenterY();
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < EXPLOSION_RADIUS) {
            game.particlePool.spawnExplosion(
              enemy.getCenterX(),
              enemy.getCenterY(),
              10
            );
            game.enemies.splice(j, 1);
            enemiesKilled++;
          }
        }
        if (enemiesKilled > 0) {
          game.screenShake.shake(20, 25);
        }

        // Collection particles using pool
        game.particlePool.spawnTrail(
          orb.getCenterX(),
          orb.getCenterY(),
          "#ffff00",
          18
        );

        game.screenShake.shake(20, 25);
        game.starOrbs.splice(i, 1);
      }
    }
  }

  // Check XP orb collection and merging
  updateXPOrbCollisions() {
    const game = this.game;

    for (let i = game.xpOrbs.length - 1; i >= 0; i--) {
      if (game.xpOrbs[i].checkCollision(game.player)) {
        // Apply combo multiplier to score if enabled
        let scoreValue = game.xpOrbs[i].value;
        if (CONFIG.COMBO.SCORE_MULTIPLIER && game.comboCount > 0) {
          scoreValue *= game.comboCount;
        }
        game.score += scoreValue;

        // Collection particles using pool
        game.particlePool.spawnTrail(
          game.xpOrbs[i].x,
          game.xpOrbs[i].y,
          game.xpOrbs[i].color,
          3
        );

        game.xpOrbs.splice(i, 1);
      } else if (game.xpOrbs[i].isExpired()) {
        // Remove expired orbs
        game.xpOrbs.splice(i, 1);
      }
    }

    // Clump nearby XP orbs of same value
    for (let i = game.xpOrbs.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const orb1 = game.xpOrbs[i];
        const orb2 = game.xpOrbs[j];

        if (orb1 && orb2 && orb1.value === orb2.value) {
          const dx = orb1.x - orb2.x;
          const dy = orb1.y - orb2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            // Merge orbs
            orb1.merge(orb2);
            game.xpOrbs.splice(j, 1);
            i--; // Adjust index
            break;
          }
        }
      }
    }
  }

  // Check wall collisions with player
  updateWallCollisions() {
    const game = this.game;

    game.walls.forEach((wall) => {
      if (wall.checkCollision(game.player)) {
        // Push player out of wall
        const dx = game.player.getCenterX() - wall.getCenterX();
        const dy = game.player.getCenterY() - wall.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const pushX = (dx / distance) * 5;
          const pushY = (dy / distance) * 5;
          game.player.x += pushX;
          game.player.y += pushY;
        }
      }
    });
  }

  // Update fire patch collisions
  updateFirePatchCollisions() {
    const game = this.game;

    game.firePatches = game.firePatches.filter((patch) => {
      patch.update();

      // Spread fire
      if (patch.shouldSpread()) {
        const spreadPatches = patch.createSpreadPatches(
          game.width,
          game.height
        );
        spreadPatches.forEach((sp) => {
          game.firePatches.push(
            new FirePatch(sp.x, sp.y, sp.size, sp.duration)
          );
        });
      }

      // Damage player in fire (skip if Nova grab active)
      if (
        !game.novaGrabActive &&
        patch.checkPlayerCollision(game.player) &&
        patch.shouldDamage()
      ) {
        if (game.player.takeDamage(patch.damage)) {
          game.startDeathAnimation();
        }
      }

      // Transform enemies in fire
      game.enemies.forEach((enemy) => {
        if (patch.checkEnemyCollision(enemy) && !enemy.onFire) {
          enemy.ignite();
        }
      });

      return !patch.isExpired();
    });

    // Enemies on fire leave fire trails
    game.enemies.forEach((enemy) => {
      if (enemy.shouldLeaveFireTrail && enemy.shouldLeaveFireTrail()) {
        game.firePatches.push(
          new FirePatch(
            enemy.getCenterX(),
            enemy.getCenterY(),
            30,
            180 // 3 seconds
          )
        );
      }
    });
  }

  // Update placed bomb collisions and explosions
  updatePlacedBombCollisions() {
    const game = this.game;

    game.placedBombs = game.placedBombs.filter((bomb) => {
      bomb.update();

      if (bomb.shouldExplode()) {
        // Create explosion using pool
        game.particlePool.spawnExplosion(bomb.x, bomb.y, 12);

        // Damage enemies in radius
        for (let i = game.enemies.length - 1; i >= 0; i--) {
          const enemy = game.enemies[i];
          const dx = enemy.getCenterX() - bomb.x;
          const dy = enemy.getCenterY() - bomb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bomb.explosionRadius) {
            if (enemy.takeDamage(CONFIG.COMBAT.PLACED_BOMB_DAMAGE)) {
              // Enemy dies, spawn XP using config
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

              game.enemies.splice(i, 1);
              game.score += xpConfig.value * xpConfig.count;
              game.enemiesKilled++;
              game.totalKills++;

              if (game.enemiesKilled >= game.enemiesPerLevel) {
                game.level++;
                game.enemiesKilled = 0;
                game.enemiesPerLevel += 5;
                game.startLevelTransition();
              }
            }
          }
        }

        // Damage player if in radius (skip if Nova grab active)
        const pdx = game.player.getCenterX() - bomb.x;
        const pdy = game.player.getCenterY() - bomb.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (!game.novaGrabActive && pdist < bomb.explosionRadius) {
          if (game.player.takeDamage(20)) {
            game.startDeathAnimation();
          }
        }

        // Screen shake
        game.screenShake.shake(20, 25);

        // 10% chance to spawn PushPull powerup
        if (Math.random() < 0.1) {
          game.pushPulls.push(new PushPull(bomb.x, bomb.y));
        }

        return false;
      }

      return true;
    });
  }

  // Update falling bombs
  updateBombCollisions() {
    const game = this.game;

    game.bombs = game.bombs.filter((bomb) => {
      bomb.update(
        game.player.getCenterX(),
        game.player.getCenterY(),
        game.enemies,
        game.width,
        game.height
      );

      if (bomb.shouldExplode()) {
        // Create explosion using pool
        game.particlePool.spawnExplosion(bomb.x, bomb.y, 12);

        // Fire bomb creates fire patches
        if (bomb.isFireBomb) {
          const patches = bomb.createFirePatch(
            game.width,
            game.height,
            game.firePatches
          );
          patches.forEach((patch) => {
            game.firePatches.push(
              new FirePatch(patch.x, patch.y, patch.size, patch.duration)
            );
          });
        } else {
          // Normal bomb damages enemies
          game.enemies.forEach((enemy) => {
            const dx = enemy.getCenterX() - bomb.x;
            const dy = enemy.getCenterY() - bomb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bomb.explosionRadius) {
              enemy.takeDamage(CONFIG.COMBAT.BOMB_EXPLOSION_DAMAGE);
            }
          });
        }

        // Bomb destroys walls - use pool for explosion particles
        for (let i = game.walls.length - 1; i >= 0; i--) {
          const wall = game.walls[i];
          const dx = wall.getCenterX() - bomb.x;
          const dy = wall.getCenterY() - bomb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bomb.explosionRadius) {
            game.particlePool.spawnExplosion(
              wall.getCenterX(),
              wall.getCenterY(),
              8
            );
            game.walls.splice(i, 1);
          }
        }

        // Damage player if in radius (skip if Nova grab active)
        const pdx = game.player.getCenterX() - bomb.x;
        const pdy = game.player.getCenterY() - bomb.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (!game.novaGrabActive && pdist < bomb.explosionRadius) {
          game.damageTaken += CONFIG.COMBAT.BOMB_PLAYER_DAMAGE;
          if (game.player.takeDamage(CONFIG.COMBAT.BOMB_PLAYER_DAMAGE)) {
            game.startDeathAnimation();
          }
        }

        // Screen shake and glitch
        game.screenShake.shake(
          CONFIG.SCREEN_SHAKE.BOMB_EXPLOSION.INTENSITY,
          CONFIG.SCREEN_SHAKE.BOMB_EXPLOSION.DURATION
        );
        game.triggerGlitch(
          10,
          1.0,
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2,
          250
        );

        // Chance to spawn time warp pickup (only after level 8 or after boss fight)
        const canSpawnTimeWarp =
          game.level >= CONFIG.POWERUPS.TIME_WARP.MIN_LEVEL ||
          game.bossDefeatedThisSession;
        if (
          canSpawnTimeWarp &&
          Math.random() < CONFIG.POWERUPS.TIME_WARP.SPAWN_CHANCE &&
          game.timeWarps.length === 0
        ) {
          game.timeWarps.push(new TimeWarp(bomb.x, bomb.y));
        }

        // 10% chance to spawn PushPull powerup
        if (Math.random() < 0.1) {
          game.pushPulls.push(new PushPull(bomb.x, bomb.y));
        }

        return false;
      }

      return !bomb.exploded;
    });
  }

  // Main update method
  update() {
    this.updateEnemyCollisions();
    this.updatePowerUpCollisions();
    this.updatePushPullCollisions();
    this.updateCrystalCollisions();
    this.updateStarOrbCollisions();
    this.updateXPOrbCollisions();
    this.updateWallCollisions();
    this.updateFirePatchCollisions();
    this.updatePlacedBombCollisions();
    this.updateBombCollisions();
  }
}
