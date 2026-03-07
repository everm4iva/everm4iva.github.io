import EnemyProjectile from "../projectiles/EnemyProjectile.js";

export default class ItemSystem {
  constructor(game) {
    this.game = game;
  }

  // Update enemies
  updateEnemies() {
    const game = this.game;
    const timeScale = game.getTimeScale();

    game.enemies.forEach((enemy) => {
      enemy._gameEnemies = game.enemies;
      enemy._gameWalls = game.walls;
      // Apply time warp - slow down enemy
      const originalSpeed = enemy.speed;
      enemy.speed = originalSpeed * timeScale;

      enemy.update(
        game.player.getCenterX(),
        game.player.getCenterY(),
        game.projectiles,
        game.bombs
      );

      // Restore original speed
      enemy.speed = originalSpeed;

      // Smart and medium enemies shoot (also affected by time warp)
      if (enemy.shouldShoot()) {
        // During time warp, reduce shoot frequency
        if (!game.timeWarpActive || Math.random() < timeScale) {
          const enemyProj = new EnemyProjectile(
            enemy.getCenterX(),
            enemy.getCenterY(),
            game.player.getCenterX(),
            game.player.getCenterY()
          );
          // Slow down projectile speed during time warp
          enemyProj.speed = enemyProj.speed * timeScale;
          game.enemyProjectiles.push(enemyProj);
        }
      }
      // Clean up reference
      delete enemy._gameEnemies;
      delete enemy._gameWalls;
    });
  }

  // Update XP orbs
  updateXPOrbs() {
    const game = this.game;

    // If orb attraction is active, force all orbs toward player
    if (game.orbAttractionActive) {
      const playerCenterX = game.player.getCenterX();
      const playerCenterY = game.player.getCenterY();

      game.xpOrbs.forEach((orb) => {
        orb.forceAttractToPlayer(playerCenterX, playerCenterY, 8);
      });
    } else {
      // Normal orb behavior
      game.xpOrbs.forEach((orb) =>
        orb.update(
          game.player.getCenterX(),
          game.player.getCenterY(),
          game.xpOrbs
        )
      );
    }
  }

  // Update power-ups
  updatePowerUps() {
    const game = this.game;
    game.powerUps.forEach((powerUp) => powerUp.update());
  }

  // Update shock crystals
  updateShockCrystals() {
    const game = this.game;
    game.shockCrystals.forEach((crystal) => crystal.update());
  }

  // Update star orbs
  updateStarOrbs() {
    const game = this.game;
    game.starOrbs.forEach((orb) => orb.update());
  }

  // Update particles - both legacy array and pool
  updateParticles() {
    const game = this.game;

    // Process queued particles (staggered spawning for legacy system)
    game.processParticleQueue();

    // Update legacy particles
    game.particles = game.particles.filter((particle) => {
      particle.update();
      return !particle.isDead();
    });

    // Enforce particle cap - remove oldest particles if exceeded
    if (game.particles.length > game.MAX_PARTICLES) {
      game.particles.splice(0, game.particles.length - game.MAX_PARTICLES);
    }

    // Update particle pool (handles its own lifecycle)
    if (game.particlePool) {
      game.particlePool.update();
    }
  }

  // Main update method
  update() {
    this.updateEnemies();
    this.updateXPOrbs();
    this.updatePowerUps();
    this.updateShockCrystals();
    this.updateStarOrbs();
    this.updateParticles();
  }
}
