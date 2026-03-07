import { CONFIG } from "../config/GameConfig.js";

export default class Player {
  constructor(
    x,
    y,
    width = CONFIG.PLAYER.WIDTH,
    height = CONFIG.PLAYER.HEIGHT
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = CONFIG.PLAYER.SPEED;
    this.health = CONFIG.PLAYER.MAX_HEALTH;
    this.color = CONFIG.PLAYER.COLOR;

    // Unified inventory system: 3 slots, each can hold stacks of items
    // Each slot: { type: 'bomb'|'crystal'|'star'|null, count: number }
    this.inventory = [
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
    ];
    this.maxStackSize = CONFIG.PLAYER.MAX_STACK_SIZE;

    // DASH SYSTEM (values from CONFIG)
    this.dashSpeed = CONFIG.PLAYER.DASH.SPEED;
    this.dashDuration = CONFIG.PLAYER.DASH.DURATION;
    this.dashCooldown = CONFIG.PLAYER.DASH.COOLDOWN;
    this.dashTimer = 0; // Current dash progress
    this.dashCooldownTimer = 0; // Cooldown tracker
    this.isDashing = false;
    this.dashDirection = { x: 0, y: 0 };
    this.isInvincible = false;
    this.invincibilityDuration = CONFIG.PLAYER.DASH.INVINCIBILITY_DURATION;
    this.invincibilityTimer = 0;
    this.dashTrailPositions = []; // For visual trail effect

    // Load sprite
    this.sprite = new Image();
    this.sprite.src = "";
    this.spriteLoaded = false;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
  }

  // Trigger a dash in a direction
  dash(dirX, dirY) {
    if (this.dashCooldownTimer > 0 || this.isDashing) return false;

    // Normalize direction
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);
    if (mag === 0) return false;

    this.dashDirection.x = dirX / mag;
    this.dashDirection.y = dirY / mag;
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.dashCooldown;
    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;
    this.dashTrailPositions = [];

    return true;
  }

  update(input, canvasWidth, canvasHeight) {
    // Update cooldowns
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) this.isInvincible = false;
    }

    // Handle dashing
    if (this.isDashing) {
      // Store position for trail
      this.dashTrailPositions.push({ x: this.x, y: this.y });
      if (this.dashTrailPositions.length > 5) {
        this.dashTrailPositions.shift();
      }

      // Move in dash direction
      this.x += this.dashDirection.x * this.dashSpeed;
      this.y += this.dashDirection.y * this.dashSpeed;

      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.dashTrailPositions = [];
      }
    } else {
      // Normal movement
      if (
        input.keys.has("ArrowLeft") ||
        input.keys.has("a") ||
        input.keys.has("A")
      ) {
        this.x -= this.speed;
      }
      if (
        input.keys.has("ArrowRight") ||
        input.keys.has("d") ||
        input.keys.has("D")
      ) {
        this.x += this.speed;
      }
      if (
        input.keys.has("ArrowUp") ||
        input.keys.has("w") ||
        input.keys.has("W")
      ) {
        this.y -= this.speed;
      }
      if (
        input.keys.has("ArrowDown") ||
        input.keys.has("s") ||
        input.keys.has("S")
      ) {
        this.y += this.speed;
      }
    }

    // Keep player within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
  }

  draw(ctx) {
    // Draw dash trail
    if (this.dashTrailPositions.length > 0) {
      this.dashTrailPositions.forEach((pos, i) => {
        const alpha = ((i + 1) / (this.dashTrailPositions.length + 1)) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.isInvincible ? "#00ffff" : this.color;
        ctx.fillRect(pos.x, pos.y, this.width, this.height);
      });
      ctx.globalAlpha = 1;
    }

    // Flash when invincible
    if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#00ffff";
    } else if (this.spriteLoaded) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // Draw health bar
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 100), 5);

    // Draw dash cooldown indicator (cyan bar above health)
    if (this.dashCooldownTimer > 0) {
      const cooldownProgress = 1 - this.dashCooldownTimer / this.dashCooldown;
      ctx.fillStyle = "#00ffff";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(this.x, this.y - 15, this.width * cooldownProgress, 2);
      ctx.globalAlpha = 1;
    } else {
      // Ready to dash - bright cyan bar
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(this.x, this.y - 15, this.width, 2);
    }

    // Add glow effect
    if (this.spriteLoaded) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ff00";
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
      ctx.shadowBlur = 0;
    }
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }

  // Add item to inventory - finds existing stack or empty slot
  addItem(type) {
    // First, try to stack with existing same-type slot
    for (let slot of this.inventory) {
      if (slot.type === type && slot.count < this.maxStackSize) {
        slot.count++;
        return true;
      }
    }
    // Then, try to find an empty slot
    for (let slot of this.inventory) {
      if (slot.type === null) {
        slot.type = type;
        slot.count = 1;
        return true;
      }
    }
    return false; // Inventory full
  }

  // Use item from specific slot
  useItemFromSlot(slotIndex) {
    const slot = this.inventory[slotIndex];
    if (slot && slot.type && slot.count > 0) {
      const type = slot.type;
      slot.count--;
      if (slot.count <= 0) {
        slot.type = null;
        slot.count = 0;
      }
      return type;
    }
    return null;
  }

  // Get item type in slot
  getSlotType(slotIndex) {
    return this.inventory[slotIndex]?.type || null;
  }

  // Get item count in slot
  getSlotCount(slotIndex) {
    return this.inventory[slotIndex]?.count || 0;
  }

  // Check if can add item (has space)
  canAddItem(type) {
    // Check for existing stack with space
    for (let slot of this.inventory) {
      if (slot.type === type && slot.count < this.maxStackSize) {
        return true;
      }
    }
    // Check for empty slot
    for (let slot of this.inventory) {
      if (slot.type === null) {
        return true;
      }
    }
    return false;
  }

  // Legacy support methods
  addShockCrystal() {
    return this.addItem("crystal");
  }

  hasShockCrystal() {
    return this.inventory.some(
      (slot) => slot.type === "crystal" && slot.count > 0
    );
  }

  addStar() {
    return this.addItem("star");
  }

  hasStar() {
    return this.inventory.some(
      (slot) => slot.type === "star" && slot.count > 0
    );
  }

  addBomb() {
    return this.addItem("bomb");
  }

  hasBomb() {
    return this.inventory.some(
      (slot) => slot.type === "bomb" && slot.count > 0
    );
  }

  hasInventorySpace() {
    return (
      this.canAddItem("bomb") ||
      this.canAddItem("crystal") ||
      this.canAddItem("star")
    );
  }

  getTotalItemCount() {
    return this.inventory.reduce((sum, slot) => sum + slot.count, 0);
  }
}
