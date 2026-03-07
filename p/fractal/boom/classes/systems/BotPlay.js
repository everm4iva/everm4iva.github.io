// BotPlay.js - AI player system

export default class BotPlay {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.targetX = game.width / 2;
    this.targetY = game.height / 2;
    this.actionCooldown = 0;
    this.actionInterval = 20; // Frames between AI decisions
    this.shootCooldown = 0;
    this.shootInterval = 10; // Frames between shots
    this.dashCooldown = 0;
    this.dashMinDistance = 150; // Minimum distance to dash away from enemies
    this.itemUseCooldown = 0;
    this.itemUseInterval = 30; // Use items
    this.dodgeCooldown = 0;
    this.lastHealth = 100;
    this.inBossFight = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  update() {
    if (!this.enabled) return;

    this.actionCooldown--;
    this.shootCooldown--;
    this.dashCooldown--;
    this.itemUseCooldown--;
    this.dodgeCooldown--;

    // Check if in boss fight
    const boss = this.game.nova || this.game.mage;
    this.inBossFight = boss && boss.health > 0;

    if (this.dodgeCooldown <= 0) {
      if (this.dodgeProjectiles()) {
        this.dodgeCooldown = 80; // Small cooldown after dodging
      }
    }

    // Make AI decisions periodically
    if (this.actionCooldown <= 0) {
      this.makeDecision();
      this.actionCooldown = this.actionInterval;
    } else {
      // Continue moving towards target even when not making new decisions
      this.moveTowardTarget();
    }

    // Use items when beneficial (PRIORITY over shooting when in danger)
    const player = this.game.player;
    const enemies = this.game.enemies;
    const inDanger = player.health < 40 || enemies.length > 5;

    if (this.itemUseCooldown <= 0) {
      this.useItems();
      this.itemUseCooldown = this.itemUseInterval;
    }

    // Auto-shoot at enemies (but not when in critical danger)
    if (this.shootCooldown <= 0 && !inDanger) {
      this.shootAtEnemy();
      this.shootCooldown = this.shootInterval;
    } else if (inDanger) {
      // In danger - reduce shooting frequency to prioritize survival
      this.shootCooldown = Math.max(0, this.shootCooldown - 1);
    }
  }

  makeDecision() {
    const player = this.game.player;
    const enemies = this.game.enemies;
    const input = this.game.input;

    // Check for boss
    const boss = this.game.nova || this.game.mage;

    if (boss && boss.health > 0) {
      // BOSS FIGHT STRATEGY
      this.handleBossFight(boss);
      return;
    }

    if (enemies.length === 0) {
      // No enemies - prioritize picking up XP
      const closestXP = this.findClosestXPOrb();
      if (closestXP) {
        this.targetX = closestXP.x;
        this.targetY = closestXP.y;
      } else {
        this.targetX = this.game.width / 2;
        this.targetY = this.game.height / 2;
      }
      return;
    }

    // SURVIVAL PRIORITY: When health is critical or heavily outnumbered, seek powerups
    if (player.health < 30 || enemies.length > 7) {
      // First priority: grab nearby crystal (boss drop) for area explosion
      const closestCrystal = this.findClosestCrystal(300);
      if (closestCrystal) {
        this.targetX = closestCrystal.x;
        this.targetY = closestCrystal.y;
        this.moveTowardTarget();
        return;
      }

      // Second priority: grab nearby star for offensive power
      const closestStar = this.findClosestStar(300);
      if (closestStar) {
        this.targetX = closestStar.x;
        this.targetY = closestStar.y;
        this.moveTowardTarget();
        return;
      }

      // Fallback: run to center to escape
      const centerX = this.game.width / 2;
      const centerY = this.game.height / 2;
      this.targetX = centerX;
      this.targetY = centerY;
      this.moveTowardTarget();
      return;
    }

    // HIGH ENEMY COUNT: Seek powerups even when health is decent
    if (enemies.length > 5) {
      const closestCrystal = this.findClosestCrystal(250);
      if (closestCrystal) {
        this.targetX = closestCrystal.x;
        this.targetY = closestCrystal.y;
        this.moveTowardTarget();
        return;
      }

      const closestStar = this.findClosestStar(250);
      if (closestStar) {
        this.targetX = closestStar.x;
        this.targetY = closestStar.y;
        this.moveTowardTarget();
        return;
      }
    }

    // Find closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;

    enemies.forEach((enemy) => {
      const dx = enemy.getCenterX() - player.getCenterX();
      const dy = enemy.getCenterY() - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      // Calculate direction away from enemy
      const dx = player.getCenterX() - closestEnemy.getCenterX();
      const dy = player.getCenterY() - closestEnemy.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If enemy is too close and health is low, dodge more aggressively
      const healthThreshold = player.health < 50 ? 200 : this.dashMinDistance;

      if (distance < healthThreshold && this.dashCooldown <= 0) {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        if (player.dash(normalizedX, normalizedY)) {
          this.dashCooldown = 150;
        }
      }

      // Move in direction away from enemy with dynamic distance
      if (distance < 350) {
        const moveDistance = distance < 200 ? 200 : 150;
        this.targetX = player.getCenterX() + (dx / distance) * moveDistance;
        this.targetY = player.getCenterY() + (dy / distance) * moveDistance;

        // If health is good and far from immediate danger, consider XP nearby
        if (player.health > 60 && distance > 250) {
          const closestXP = this.findClosestXPOrbNear(
            this.targetX,
            this.targetY,
            150
          );
          if (closestXP) {
            // If XP is close to kiting path, pick it up
            this.targetX = closestXP.x;
            this.targetY = closestXP.y;
          }
        }
      }
    }

    // Move player towards target
    this.moveTowardTarget();
  }

  moveTowardTarget() {
    const player = this.game.player;
    const input = this.game.input;
    const threshold = 20;

    // Clear previous inputs
    input.keys.delete("w");
    input.keys.delete("a");
    input.keys.delete("s");
    input.keys.delete("d");
    input.keys.delete("W");
    input.keys.delete("A");
    input.keys.delete("S");
    input.keys.delete("D");

    const playerX = player.getCenterX();
    const playerY = player.getCenterY();
    const gameWidth = this.game.width;
    const gameHeight = this.game.height;

    // Calculate distances to walls
    const distToLeft = playerX;
    const distToRight = gameWidth - playerX;
    const distToTop = playerY;
    const distToBottom = gameHeight - playerY;
    const minWallDist = Math.min(
      distToLeft,
      distToRight,
      distToTop,
      distToBottom
    );

    // AGGRESSIVE WALL ESCAPE: If very close to wall, override target and escape
    if (minWallDist < 60) {
      // Emergency wall escape - force movement away from nearest wall
      let escapeX = playerX;
      let escapeY = playerY;

      if (distToLeft === minWallDist) escapeX += 150; // Push right
      if (distToRight === minWallDist) escapeX -= 150; // Push left
      if (distToTop === minWallDist) escapeY += 150; // Push down
      if (distToBottom === minWallDist) escapeY -= 150; // Push up

      // Dash escape if available
      if (this.dashCooldown <= 0 && minWallDist < 40) {
        const escapeDirX = escapeX - playerX;
        const escapeDirY = escapeY - playerY;
        const escapeMag = Math.sqrt(
          escapeDirX * escapeDirX + escapeDirY * escapeDirY
        );
        if (escapeMag > 0) {
          if (
            this.game.player.dash(
              escapeDirX / escapeMag,
              escapeDirY / escapeMag
            )
          ) {
            this.dashCooldown = 120;
            return; // Escape executed, return early
          }
        }
      }

      // Manual movement away from wall
      if (distToLeft === minWallDist) {
        input.keys.add("d");
      }
      if (distToRight === minWallDist) {
        input.keys.add("a");
      }
      if (distToTop === minWallDist) {
        input.keys.add("s");
      }
      if (distToBottom === minWallDist) {
        input.keys.add("w");
      }
      return; // Don't apply target direction when escaping walls
    }

    // Normal pathfinding with wall avoidance
    let dx = this.targetX - playerX;
    let dy = this.targetY - playerY;

    // WALL AVOIDANCE: Blend away from walls when approaching them
    const wallMargin = 140; // Larger safety margin

    if (minWallDist < wallMargin) {
      // Calculate center push direction
      const centerX = gameWidth / 2;
      const centerY = gameHeight / 2;
      let wallAvoidDx = centerX - playerX;
      let wallAvoidDy = centerY - playerY;
      const wallAvoidDist = Math.sqrt(
        wallAvoidDx * wallAvoidDx + wallAvoidDy * wallAvoidDy
      );

      if (wallAvoidDist > 0) {
        wallAvoidDx /= wallAvoidDist;
        wallAvoidDy /= wallAvoidDist;

        // Normalize target direction
        const targetDist = Math.sqrt(dx * dx + dy * dy);
        if (targetDist > 0) {
          dx /= targetDist;
          dy /= targetDist;

          // Calculate blend ratio based on how close to wall (closer = more avoidance)
          const closenessRatio = (wallMargin - minWallDist) / wallMargin;
          const avoidanceStrength = Math.min(0.9, closenessRatio * 0.9); // 0 to 0.9 strength

          dx = wallAvoidDx * avoidanceStrength + dx * (1 - avoidanceStrength);
          dy = wallAvoidDy * avoidanceStrength + dy * (1 - avoidanceStrength);

          // Renormalize
          const newDist = Math.sqrt(dx * dx + dy * dy);
          if (newDist > 0) {
            dx /= newDist;
            dy /= newDist;
          }
        } else {
          dx = wallAvoidDx;
          dy = wallAvoidDy;
        }
      }
    }

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > threshold) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Add movement keys based on direction
      if (normalizedX < -0.3) {
        input.keys.add("a");
      } else if (normalizedX > 0.3) {
        input.keys.add("d");
      }

      if (normalizedY < -0.3) {
        input.keys.add("w");
      } else if (normalizedY > 0.3) {
        input.keys.add("s");
      }
    }
  }

  shootAtEnemy() {
    const game = this.game;
    const player = game.player;
    const enemies = game.enemies;
    const boss = game.nova || game.mage;

    // Prioritize boss if it's alive
    if (boss && boss.health > 0) {
      game.combatSystem.shoot(boss.getCenterX(), boss.getCenterY());
      return;
    }

    // Otherwise shoot at closest enemy
    if (enemies.length === 0) return;

    // Find closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;

    enemies.forEach((enemy) => {
      const dx = enemy.getCenterX() - player.getCenterX();
      const dy = enemy.getCenterY() - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      // Directly call combat system to shoot at enemy
      const targetX = closestEnemy.getCenterX();
      const targetY = closestEnemy.getCenterY();
      game.combatSystem.shoot(targetX, targetY);
    }
  }

  handleBossFight(boss) {
    const player = this.game.player;

    // PRIORITY: Grab health powerup if health is low and powerup is nearby
    if (player.health < 60) {
      const closestHealth = this.findClosestPowerup("health");
      if (closestHealth) {
        const dx = closestHealth.getCenterX() - player.getCenterX();
        const dy = closestHealth.getCenterY() - player.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 400) {
          // Grab health powerup - boss fight pause
          this.targetX = closestHealth.getCenterX();
          this.targetY = closestHealth.getCenterY();
          this.moveTowardTarget();
          return;
        }
      }
    }

    // PRIORITY: Grab multishot if health is good and powerup is nearby
    if (player.health > 70) {
      const closestMultishot = this.findClosestPowerup("multishot");
      if (closestMultishot) {
        const dx = closestMultishot.getCenterX() - player.getCenterX();
        const dy = closestMultishot.getCenterY() - player.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 400) {
          // Grab multishot - boss fight pause
          this.targetX = closestMultishot.getCenterX();
          this.targetY = closestMultishot.getCenterY();
          this.moveTowardTarget();
          return;
        }
      }
    }

    // KITING PATTERN: Normal boss fight behavior
    const dx = boss.getCenterX() - player.getCenterX();
    const dy = boss.getCenterY() - player.getCenterY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Maintain middle distance - not too close, not too far
    const idealDistance = 250;

    if (distance < idealDistance - 100) {
      // Boss too close, back away aggressively
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      this.targetX = player.getCenterX() - normalizedX * 200;
      this.targetY = player.getCenterY() - normalizedY * 200;

      // Dash away if boss is very close or health is low
      if ((distance < 150 || player.health < 50) && this.dashCooldown <= 0) {
        if (player.dash(-normalizedX, -normalizedY)) {
          this.dashCooldown = 100;
        }
      }
    } else if (distance > idealDistance + 50) {
      // Boss too far, get closer
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      this.targetX = player.getCenterX() + normalizedX * 100;
      this.targetY = player.getCenterY() + normalizedY * 100;
    } else {
      // At ideal range - kite in circular pattern to avoid getting cornered
      const angle = Math.atan2(dy, dx);
      const perpAngle = angle + Math.PI / 3; // Offset by 60 degrees for circular kiting
      const kiteDistance = 200;
      this.targetX = player.getCenterX() + Math.cos(perpAngle) * kiteDistance;
      this.targetY = player.getCenterY() + Math.sin(perpAngle) * kiteDistance;
    }

    this.moveTowardTarget();
  }

  dodgeProjectiles() {
    const game = this.game;
    const player = game.player;

    // Check all enemy projectiles for danger
    const dangerousProjectiles = game.enemyProjectiles.filter((proj) => {
      const dx = proj.x - player.getCenterX();
      const dy = proj.y - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only dodge projectiles within 200 units that are moving towards player
      if (distance > 200) return false;

      // Check if projectile is moving towards player
      const projDx = proj.velocityX;
      const projDy = proj.velocityY;
      const dotProduct = dx * projDx + dy * projDy;

      return dotProduct < 0; // Projectile moving towards player
    });

    if (dangerousProjectiles.length === 0) return false;

    // Find dodge direction (perpendicular to incoming projectile)
    const proj = dangerousProjectiles[0];
    const perpX = -proj.velocityY;
    const perpY = proj.velocityX;
    const mag = Math.sqrt(perpX * perpX + perpY * perpY);

    if (mag > 0 && this.dashCooldown <= 0) {
      const dashX = perpX / mag;
      const dashY = perpY / mag;

      // Randomly choose left or right perpendicular
      if (Math.random() > 0.5) {
        return player.dash(-dashX, -dashY);
      } else {
        return player.dash(dashX, dashY);
      }
    }

    return false;
  }

  useItems() {
    const game = this.game;
    const player = game.player;
    const enemies = game.enemies;

    // PRIORITY 0: Surrounded by many enemies - use crystal to clear immediately
    if (enemies.length > 6) {
      for (let i = 0; i < 3; i++) {
        const slotType = player.getSlotType(i);
        if (slotType === "crystal" && player.getSlotCount(i) > 0) {
          player.selectedSlot = i;
          game.combatSystem.placeBomb(player.getCenterX(), player.getCenterY());
          return; // Emergency escape - don't do anything else
        }
      }
    }

    // PRIORITY 1: Critical health - pick up health powerups
    if (player.health < 50) {
      const closestPowerup = this.findClosestPowerup("health");
      if (closestPowerup) {
        const dx = closestPowerup.getCenterX() - player.getCenterX();
        const dy = closestPowerup.getCenterY() - player.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 350) {
          // Move towards powerup - PRIORITY over everything
          this.targetX = closestPowerup.getCenterX();
          this.targetY = closestPowerup.getCenterY();
          this.moveTowardTarget();
          return;
        }
      }
    }

    // PRIORITY 2: Good health but want multishot for offense - seek purple powerups
    if (player.health > 70 && enemies.length > 0 && !game.multiShotActive) {
      const closestMultishot = this.findClosestPowerup("multishot");
      if (closestMultishot) {
        const dx = closestMultishot.getCenterX() - player.getCenterX();
        const dy = closestMultishot.getCenterY() - player.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 400) {
          // Detour to get multishot
          this.targetX = closestMultishot.getCenterX();
          this.targetY = closestMultishot.getCenterY();
          this.moveTowardTarget();
          return;
        }
      }
    }

    // PRIORITY 3: Many enemies + have stars - use them aggressively
    if (enemies.length > 4) {
      // Find and switch to star slot
      for (let i = 0; i < 3; i++) {
        const slotType = player.getSlotType(i);
        if (slotType === "star" && player.getSlotCount(i) > 0) {
          player.selectedSlot = i;
          // Throw stars at closest enemies
          for (let j = 0; j < Math.min(2, player.getSlotCount(i)); j++) {
            const closestEnemy = this.findClosestEnemy();
            if (closestEnemy) {
              game.combatSystem.placeBomb(
                closestEnemy.getCenterX(),
                closestEnemy.getCenterY()
              );
            }
          }
          return;
        }
      }
    }

    // PRIORITY 4: Many enemies + have bombs - use them for area control
    if (enemies.length > 5) {
      for (let i = 0; i < 3; i++) {
        const slotType = player.getSlotType(i);
        if (slotType === "bomb" && player.getSlotCount(i) > 0) {
          player.selectedSlot = i;
          const bombX = player.getCenterX() + (Math.random() - 0.5) * 150;
          const bombY = player.getCenterY() + (Math.random() - 0.5) * 150;
          game.combatSystem.placeBomb(bombX, bombY);
          return;
        }
      }
    }

    // PRIORITY 5: Few enemies but have stars - use opportunistically
    if (enemies.length > 2) {
      for (let i = 0; i < 3; i++) {
        const slotType = player.getSlotType(i);
        if (slotType === "star" && player.getSlotCount(i) > 0) {
          player.selectedSlot = i;
          const closestEnemy = this.findClosestEnemy();
          if (closestEnemy) {
            game.combatSystem.placeBomb(
              closestEnemy.getCenterX(),
              closestEnemy.getCenterY()
            );
          }
          return;
        }
      }
    }

    // PRIORITY 6: Pickup time warp when health is critically low
    if (player.health < 25) {
      const closestTimeWarp = this.findClosestTimeWarp();
      if (closestTimeWarp) {
        const dx = closestTimeWarp.x - player.getCenterX();
        const dy = closestTimeWarp.y - player.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 250) {
          this.targetX = closestTimeWarp.x;
          this.targetY = closestTimeWarp.y;
          this.moveTowardTarget();
          return;
        }
      }
    }
  }

  findClosestPowerup(type) {
    const game = this.game;
    const player = game.player;
    let closestPowerup = null;
    let closestDistance = Infinity;

    game.powerUps.forEach((powerup) => {
      if (type && powerup.type !== type) return;

      const dx = powerup.getCenterX() - player.getCenterX();
      const dy = powerup.getCenterY() - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPowerup = powerup;
      }
    });

    return closestPowerup;
  }

  findClosestCrystal(maxDistance = 500) {
    const game = this.game;
    const player = game.player;
    let closestCrystal = null;
    let closestDistance = Infinity;

    game.shockCrystals.forEach((crystal) => {
      const dx = crystal.x - player.getCenterX();
      const dy = crystal.y - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance && distance < maxDistance) {
        closestDistance = distance;
        closestCrystal = crystal;
      }
    });

    return closestCrystal;
  }

  findClosestStar(maxDistance = 500) {
    const game = this.game;
    const player = game.player;
    let closestStar = null;
    let closestDistance = Infinity;

    game.stars.forEach((star) => {
      const dx = star.x - player.getCenterX();
      const dy = star.y - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance && distance < maxDistance) {
        closestDistance = distance;
        closestStar = star;
      }
    });

    return closestStar;
  }

  findClosestTimeWarp() {
    const game = this.game;
    const player = game.player;
    let closest = null;
    let closestDistance = Infinity;

    game.timeWarps.forEach((tw) => {
      const dx = tw.x - player.getCenterX();
      const dy = tw.y - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = tw;
      }
    });

    return closest;
  }

  findClosestEnemy() {
    const game = this.game;
    const player = game.player;
    let closestEnemy = null;
    let closestDistance = Infinity;

    game.enemies.forEach((enemy) => {
      const dx = enemy.getCenterX() - player.getCenterX();
      const dy = enemy.getCenterY() - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    return closestEnemy;
  }

  findClosestXPOrb() {
    const game = this.game;
    const player = game.player;
    let closestXP = null;
    let closestDistance = Infinity;

    game.xpOrbs.forEach((orb) => {
      const dx = orb.x - player.getCenterX();
      const dy = orb.y - player.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestXP = orb;
      }
    });

    return closestXP;
  }

  findClosestXPOrbNear(targetX, targetY, maxDistance) {
    const game = this.game;
    let closestXP = null;
    let closestDistance = Infinity;

    game.xpOrbs.forEach((orb) => {
      const dx = orb.x - targetX;
      const dy = orb.y - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance && distance < closestDistance) {
        closestDistance = distance;
        closestXP = orb;
      }
    });

    return closestXP;
  }

  draw(ctx) {
    if (!this.enabled) return;

    // Draw label in bottom right corner with background
    const padding = 10;
    const fontSize = 14;
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    const text = "[BOT PLAY ENABLED]";
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize + 4;

    const labelX = ctx.canvas.width - textWidth - padding * 2;
    const labelY = ctx.canvas.height - padding;

    ctx.save();

    // Draw background box
    ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.fillRect(
      labelX - padding,
      labelY - textHeight - padding,
      textWidth + padding * 2,
      textHeight + padding
    );
    ctx.strokeRect(
      labelX - padding,
      labelY - textHeight - padding,
      textWidth + padding * 2,
      textHeight + padding
    );

    // Draw text
    ctx.fillStyle = "#00ff00";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ff00";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, labelX, labelY);

    ctx.restore();
  }

  // Reset any temporary state
  reset() {
    this.actionCooldown = 0;
    this.shootCooldown = 0;
    this.dashCooldown = 0;
    this.itemUseCooldown = 0;
    this.lastHealth = 100;
  }
}
