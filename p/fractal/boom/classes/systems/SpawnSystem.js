// SpawnSystem.js - Handles enemy, power-up, and bomb spawning logic

import Enemy from "../entities/Enemy.js";
import PowerUp from "../items/PowerUp.js";
import PushPull from "../items/PushPull.js";
import Bomb from "../items/Bomb.js";
import StarOrb from "../items/StarOrb.js";
import Mage from "../bosses/Mage.js";
import Nova from "../bosses/Nova.js";
import { ExplosionParticle } from "../effects/Particle.js";
import { CONFIG, getEnemyConfig } from "../config/GameConfig.js";

export default class SpawnSystem {
  constructor(game) {
    this.game = game;
  }

  spawnEnemy() {
    const game = this.game;
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // Top
        x = Math.random() * game.width;
        y = -30;
        break;
      case 1: // Right
        x = game.width + 30;
        y = Math.random() * game.height;
        break;
      case 2: // Bottom
        x = Math.random() * game.width;
        y = game.height + 30;
        break;
      case 3: // Left
        x = -30;
        y = Math.random() * game.height;
        break;
    }

    // Choose enemy type based on level
    let type = "dumb";
    const rand = Math.random();

    if (game.level >= 4) {
      // Level 4+: all types including medium
      if (rand < 0.25) type = "dumb";
      else if (rand < 0.5) type = "medium";
      else if (rand < 0.75) type = "smart";
      else type = "teleport";
    } else if (game.level >= 3) {
      // Level 3: dumb, medium, smart, teleport
      if (rand < 0.3) type = "dumb";
      else if (rand < 0.5) type = "medium";
      else if (rand < 0.75) type = "smart";
      else type = "teleport";
    } else if (game.level >= 2) {
      // Level 2: dumb, medium, smart
      if (rand < 0.4) type = "dumb";
      else if (rand < 0.7) type = "medium";
      else type = "smart";
    }
    // Level 1: only dumb
    game.enemies.push(new Enemy(x, y, 30, 30, type));
  }

  spawnPowerUp() {
    const game = this.game;
    const x = Math.random() * (game.width - 40) + 20;
    const y = Math.random() * (game.height - 40) + 20;

    // Determine powerup type with chances
    const rand = Math.random();

    // 20% chance for PushPull (separate item) after level 5
    if (
      rand > 0.8 &&
      game.level >= CONFIG.POWERUPS.PUSH_PULL.MIN_LEVEL &&
      game.pushPulls.length === 0
    ) {
      game.pushPulls.push(new PushPull(x, y));
      return;
    }

    // Regular powerups
    const type = Math.random() < 0.5 ? "health" : "multishot";
    game.powerUps.push(new PowerUp(x, y, type));
  }

  spawnBomb() {
    const game = this.game;
    const x = Math.random() * (game.width - 100) + 50;
    const bomb = new Bomb(x, -50, game.height - 20);
    game.bombs.push(bomb);
  }

  spawnStarOrb() {
    const game = this.game;
    const x = Math.random() * (game.width - 100) + 50;
    const y = Math.random() * (game.height - 100) + 50;
    game.starOrbs.push(new StarOrb(x, y));
  }

  spawnMage() {
    const game = this.game;
    const x = game.width / 2 - 25;
    const y = game.height / 2 - 25;
    game.mage = new Mage(
      x,
      y,
      CONFIG.BOSSES.MAGE.WIDTH,
      CONFIG.BOSSES.MAGE.HEIGHT
    );

    // Clear all enemies and enemy projectiles
    game.enemies = [];
    game.enemyProjectiles = [];

    // Mage spawn particles using pool
    game.particlePool.spawnExplosion(
      game.mage.getCenterX(),
      game.mage.getCenterY(),
      20
    );

    game.screenShake.shake(
      CONFIG.SCREEN_SHAKE.BOSS_HIT.INTENSITY,
      CONFIG.SCREEN_SHAKE.BOSS_HIT.DURATION
    );
    game.triggerGlitch(
      5,
      1.0,
      game.mage.getCenterX(),
      game.mage.getCenterY(),
      150
    );
  }

  spawnNova() {
    const game = this.game;
    const x = game.width / 2 - 25;
    const y = game.height / 2 - 25;
    game.nova = new Nova(
      x,
      y,
      CONFIG.BOSSES.NOVA.WIDTH,
      CONFIG.BOSSES.NOVA.HEIGHT
    );
    game.novaActive = true;

    // Clear all enemies and enemy projectiles
    game.enemies = [];
    game.enemyProjectiles = [];

    // Nova spawn particles using pool
    game.particlePool.spawnExplosion(
      game.nova.getCenterX(),
      game.nova.getCenterY(),
      25
    );

    game.screenShake.shake(
      CONFIG.SCREEN_SHAKE.BOSS_HIT.INTENSITY + 5,
      CONFIG.SCREEN_SHAKE.BOSS_HIT.DURATION + 5
    );
    game.triggerGlitch(
      6,
      1.0,
      game.nova.getCenterX(),
      game.nova.getCenterY(),
      180
    );
  }

  // Update spawning timers and trigger spawns
  update() {
    const game = this.game;

    // Spawn enemies (only if no mage)
    if (!game.mage) {
      game.enemySpawnTimer++;
      if (game.enemySpawnTimer >= game.enemySpawnInterval) {
        this.spawnEnemy();
        game.enemySpawnTimer = 0;

        // Gradually increase difficulty
        if (game.enemySpawnInterval > CONFIG.SPAWNING.ENEMY_MIN_INTERVAL) {
          game.enemySpawnInterval -= CONFIG.SPAWNING.ENEMY_INTERVAL_DECREASE;
        }
      }
    }

    // Spawn Mage boss (first at SPAWN_LEVEL, then every RESPAWN_INTERVAL after being defeated)
    if (
      !game.mage &&
      !game.nova && // Don't spawn Mage if Nova is active
      game.level >= CONFIG.BOSSES.MAGE.SPAWN_LEVEL &&
      game.enemies.length === 0
    ) {
      const spawnLevel = CONFIG.BOSSES.MAGE.SPAWN_LEVEL;
      const respawnInterval = CONFIG.BOSSES.MAGE.RESPAWN_INTERVAL;

      if (!game.mageDefeatedOnce) {
        // First opportunity at or after spawn level
        this.spawnMage();
      } else {
        // After defeat, only spawn at proper respawn intervals
        if ((game.level - spawnLevel) % respawnInterval === 0) {
          this.spawnMage();
        }
      }
    }

    // Spawn Nova boss (first at SPAWN_LEVEL, then every RESPAWN_INTERVAL after being killed)
    if (
      !game.nova &&
      !game.mage && // Don't spawn Nova if Mage is active
      game.enemies.length === 0
    ) {
      const novaSpawnLevel = CONFIG.BOSSES.NOVA.SPAWN_LEVEL;
      const novaRespawnInterval = CONFIG.BOSSES.NOVA.RESPAWN_INTERVAL;

      // First opportunity at or after spawn level
      if (!game.novaDefeatedOnce && game.level >= novaSpawnLevel) {
        this.spawnNova();
      }
      // After being killed, respawn every RESPAWN_INTERVAL (20, 30, ...)
      else if (
        game.novaDefeatedOnce &&
        game.level >= novaSpawnLevel &&
        (game.level - novaSpawnLevel) % novaRespawnInterval === 0
      ) {
        this.spawnNova();
      }
    }

    // Auto-spawn star orb if score >= cost and no star orb exists
    if (
      game.score >= CONFIG.SCORING.STAR_ORB_COST &&
      game.starOrbs.length === 0 &&
      game.player.canAddItem("star")
    ) {
      this.spawnStarOrb();
    }

    // Spawn power-ups
    game.powerUpSpawnTimer++;
    if (game.powerUpSpawnTimer >= game.powerUpSpawnInterval) {
      this.spawnPowerUp();
      game.powerUpSpawnTimer = 0;
    }

    // Spawn bombs (level 3+)
    if (game.level >= CONFIG.SPAWNING.BOMB_START_LEVEL) {
      game.bombSpawnTimer++;
      if (game.bombSpawnTimer >= game.bombSpawnInterval) {
        if (Math.random() < CONFIG.SPAWNING.BOMB_SPAWN_CHANCE) {
          this.spawnBomb();
        }
        game.bombSpawnTimer = 0;
      }
    }
  }
}
