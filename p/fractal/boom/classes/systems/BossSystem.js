// BossSystem.js

import Enemy from "../entities/Enemy.js";
import Wall from "../entities/Wall.js";
import EnemyProjectile from "../projectiles/EnemyProjectile.js";
import NovaLaser from "../projectiles/NovaLaser.js";
import Particle, { ExplosionParticle } from "../effects/Particle.js";

export default class BossSystem {
  constructor(game) {
    this.game = game;
  }

  // Update Mage boss
  updateMage() {
    const game = this.game;
    if (!game.mage) return;

    game.mage.update(
      game.player.getCenterX(),
      game.player.getCenterY(),
      game.projectiles,
      game.enemies.length,
      game.width,
      game.height
    );

    // Mage shooting
    if (game.mage.shouldShoot()) {
      const mageProj = new EnemyProjectile(
        game.mage.getCenterX(),
        game.mage.getCenterY(),
        game.player.getCenterX(),
        game.player.getCenterY()
      );
      mageProj.color = "#8800ff"; // Purple projectiles
      game.enemyProjectiles.push(mageProj);
    }

    // Mage teleport
    game.mage.shouldTeleport();

    // Mage wall summoning
    if (game.mage.shouldSummonWall()) {
      // Summon 2-4 walls around player
      const wallCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < wallCount; i++) {
        const angle = (Math.PI * 2 * i) / wallCount + Math.random() * 0.5;
        const distance = 100 + Math.random() * 100;
        const wallX =
          game.player.getCenterX() + Math.cos(angle) * distance - 20;
        const wallY =
          game.player.getCenterY() + Math.sin(angle) * distance - 30;

        // Check if new wall overlaps existing walls
        const overlaps = game.walls.some((wall) => {
          return Math.abs(wall.x - wallX) < 50 && Math.abs(wall.y - wallY) < 70;
        });

        // Only spawn if no overlap and under wall limit
        if (!overlaps && game.walls.length < 12) {
          game.walls.push(new Wall(wallX, wallY));
        }
      }

      game.screenShake.shake(10, 15);
    }

    // Mage push/pull
    const pushPull = game.mage.shouldPushPull();
    if (pushPull) {
      const dx = game.player.getCenterX() - game.mage.getCenterX();
      const dy = game.player.getCenterY() - game.mage.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const force = pushPull === "push" ? -15 : 15;
        const forceX = (dx / distance) * force;
        const forceY = (dy / distance) * force;

        // Apply force to player
        game.player.x += forceX;
        game.player.y += forceY;

        // Clamp to screen
        game.player.x = Math.max(
          0,
          Math.min(game.width - game.player.width, game.player.x)
        );
        game.player.y = Math.max(
          0,
          Math.min(game.height - game.player.height, game.player.y)
        );

        game.screenShake.shake(10, 15);

        // Visual effect
        for (let i = 0; i < 10; i++) {
          game.particles.push(
            new Particle(
              game.player.getCenterX(),
              game.player.getCenterY(),
              pushPull === "push" ? "#ff0000" : "#0000ff"
            )
          );
        }
      }
    }

    // Check collision with player (skip if Nova grab active)
    if (!game.novaGrabActive && game.mage.checkCollision(game.player)) {
      game.damageTaken += game.mage.damage;
      if (game.player.takeDamage(game.mage.damage)) {
        game.startDeathAnimation();
      }
    }
  }

  // Update Nova boss
  updateNova() {
    const game = this.game;
    if (!game.nova || !game.nova.isActive) {
      // Check for Nova reappearance
      if (
        game.nova &&
        !game.nova.isActive &&
        game.novaReappearLevel &&
        game.level >= game.novaReappearLevel
      ) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const x = Math.max(
          50,
          Math.min(
            game.width - 50,
            game.player.getCenterX() + Math.cos(angle) * distance
          )
        );
        const y = Math.max(
          50,
          Math.min(
            game.height - 50,
            game.player.getCenterY() + Math.sin(angle) * distance
          )
        );
        game.nova.reappear(x, y);
        game.novaReappearLevel = null;
        game.screenShake.shake(20, 25);
        game.triggerGlitch(10, 1.0, x, y, 200);
      }
      return;
    }

    game.nova.update(
      game.player.getCenterX(),
      game.player.getCenterY(),
      game.projectiles,
      game.enemies.length,
      game.width,
      game.height
    );

    // Nova laser shooting (don't shoot while grabbing or during cooldown)
    if (
      !game.novaGrabActive &&
      game.novaGrabCooldown === 0 &&
      game.nova.shouldShootLaser()
    ) {
      const angle = Math.atan2(
        game.player.getCenterY() - game.nova.getCenterY(),
        game.player.getCenterX() - game.nova.getCenterX()
      );
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);

      game.novaLasers.push(
        new NovaLaser(
          game.nova.getCenterX(),
          game.nova.getCenterY(),
          directionX,
          directionY
        )
      );

      game.screenShake.shake(8, 12);
    }

    // Nova teleport
    game.nova.shouldTeleport();

    // Nova grabs and drags player
    if (game.nova.shouldTeleportPlayer() && !game.novaGrabActive) {
      // Calculate safe target position (away from enemies and lasers)
      let safePosition = this.findSafePositionForPlayer(game);

      // Start grab
      game.novaGrabActive = true;
      game.novaGrabStartX = game.player.x;
      game.novaGrabStartY = game.player.y;
      game.novaGrabTargetX = safePosition.x;
      game.novaGrabTargetY = safePosition.y;
      game.novaGrabProgress = 0;

      // Visual effect at grab start
      for (let i = 0; i < 25; i++) {
        game.particles.push(
          new ExplosionParticle(
            game.player.getCenterX(),
            game.player.getCenterY()
          )
        );
      }

      game.screenShake.shake(15, 20);
      game.triggerGlitch(
        10,
        0.8,
        game.player.getCenterX(),
        game.player.getCenterY(),
        250
      );
    }

    // Nova summons enemies
    if (game.nova.shouldSummonEnemies()) {
      const enemyCount = Math.floor(Math.random() * 2) + 2; // 2-3 enemies
      for (let i = 0; i < enemyCount; i++) {
        const angle = (Math.PI * 2 * i) / enemyCount;
        const distance = 100 + Math.random() * 50;
        const x = game.nova.getCenterX() + Math.cos(angle) * distance;
        const y = game.nova.getCenterY() + Math.sin(angle) * distance;

        game.enemies.push(
          new Enemy(
            Math.max(0, Math.min(game.width - 30, x)),
            Math.max(0, Math.min(game.height - 30, y)),
            30,
            30
          )
        );
      }

      game.screenShake.shake(15, 18);
      game.triggerGlitch(
        8,
        0.8,
        game.nova.getCenterX(),
        game.nova.getCenterY(),
        200
      );
    }

    // Nova disappear/reappear
    if (game.nova.shouldDisappear()) {
      game.nova.disappear();
      game.novaReappearLevel = game.level + 2; // Reappear 2 levels later
      game.screenShake.shake(25, 30);
      game.triggerGlitch(
        15,
        1.0,
        game.nova.getCenterX(),
        game.nova.getCenterY(),
        250
      );
    }

    // Check collision with player (skip if Nova grab active)
    if (!game.novaGrabActive && game.nova.checkCollision(game.player)) {
      game.damageTaken += game.nova.damage;
      if (game.player.takeDamage(game.nova.damage)) {
        game.startDeathAnimation();
      }
    }
  }

  // Update walls
  updateWalls() {
    const game = this.game;
    game.walls.forEach((wall) => wall.update());
  }

  // Find safe position for player (away from enemies and lasers)
  findSafePositionForPlayer(game) {
    let bestX, bestY;
    let maxSafety = 0;
    const attempts = 20;

    for (let i = 0; i < attempts; i++) {
      const x = Math.random() * (game.width - game.player.width);
      const y = Math.random() * (game.height - game.player.height);

      // Calculate safety score (distance from threats)
      let safety = 0;

      // Check distance from enemies
      game.enemies.forEach((enemy) => {
        const dx = x + game.player.width / 2 - enemy.getCenterX();
        const dy = y + game.player.height / 2 - enemy.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);
        safety += Math.min(dist, 300); // Cap at 300px
      });

      // Check distance from Nova lasers
      game.novaLasers.forEach((laser) => {
        const dx = x + game.player.width / 2 - laser.x;
        const dy = y + game.player.height / 2 - laser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        safety += Math.min(dist, 200);
      });

      if (safety > maxSafety) {
        maxSafety = safety;
        bestX = x;
        bestY = y;
      }
    }

    return { x: bestX || game.width / 2, y: bestY || game.height / 2 };
  }

  // Main update method
  update() {
    this.updateMage();
    this.updateNova();
    this.updateWalls();
  }
}
