import { CONFIG } from "../config/GameConfig.js";

export default class Wall {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.ENTITY.WALL.WIDTH;
    this.height = CONFIG.ENTITY.WALL.HEIGHT;
    this.emerging = true;
    this.emergingTimer = 0;
    this.emergingDuration = CONFIG.ENTITY.WALL.EMERGING_DURATION;
    this.currentHeight = 0;
    this.shakeIntensity = CONFIG.ENTITY.WALL.SHAKE_INTENSITY;
    this.health = CONFIG.ENTITY.WALL.HEALTH;
    this.maxHealth = CONFIG.ENTITY.WALL.MAX_HEALTH;

    // Fragment properties for explosion
    this.fragments = [];
    this.exploding = false;
    this.explodingTimer = 0;
    this.explodingDuration = CONFIG.ENTITY.WALL.EXPLODING_DURATION;
  }

  update() {
    if (this.emerging) {
      this.emergingTimer++;
      const progress = this.emergingTimer / this.emergingDuration;
      this.currentHeight = this.height * Math.min(1, progress);

      if (this.emergingTimer >= this.emergingDuration) {
        this.emerging = false;
        this.currentHeight = this.height;
      }
    }

    if (this.exploding) {
      this.explodingTimer++;
      this.fragments.forEach((frag) => {
        frag.x += frag.vx;
        frag.y += frag.vy;
        frag.vy += 0.3; // Gravity
        frag.rotation += frag.rotationSpeed;
        frag.alpha -= 0.02;
      });
    }
  }

  draw(ctx) {
    if (this.exploding) {
      // Draw fragments
      this.fragments.forEach((frag) => {
        ctx.save();
        ctx.globalAlpha = frag.alpha;
        ctx.translate(frag.x, frag.y);
        ctx.rotate(frag.rotation);
        ctx.fillStyle = "#8800ff";
        ctx.fillRect(
          -frag.width / 2,
          -frag.height / 2,
          frag.width,
          frag.height
        );
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          -frag.width / 2,
          -frag.height / 2,
          frag.width,
          frag.height
        );
        ctx.restore();
      });
    } else {
      ctx.save();

      // Shake effect while emerging
      if (this.emerging) {
        const shake =
          this.shakeIntensity *
          (1 - this.emergingTimer / this.emergingDuration);
        ctx.translate((Math.random() - 0.5) * shake, 0);
      }

      // Draw wall from bottom up
      const drawY = this.y + this.height - this.currentHeight;

      // Main wall body
      ctx.fillStyle = "#8800ff";
      ctx.fillRect(this.x, drawY, this.width, this.currentHeight);

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, drawY, this.width, this.currentHeight);

      // Texture lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      for (let i = 10; i < this.currentHeight; i += 15) {
        ctx.beginPath();
        ctx.moveTo(this.x, drawY + i);
        ctx.lineTo(this.x + this.width, drawY + i);
        ctx.stroke();
      }

      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#8800ff";
      ctx.strokeStyle = "#aa00ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        this.x - 1,
        drawY - 1,
        this.width + 2,
        this.currentHeight + 2
      );

      ctx.restore();
    }
  }

  checkCollision(entity) {
    if (this.emerging || this.exploding) return false;
    return (
      this.x < entity.x + entity.width &&
      this.x + this.width > entity.x &&
      this.y < entity.y + entity.height &&
      this.y + this.height > entity.y
    );
  }

  checkProjectileCollision(projectile) {
    if (this.emerging || this.exploding) return false;
    const px = projectile.x;
    const py = projectile.y;
    return (
      px > this.x &&
      px < this.x + this.width &&
      py > this.y &&
      py < this.y + this.height
    );
  }

  explode(particlesArray = null) {
    this.exploding = true;

    // Add explosion particles if array provided
    if (particlesArray) {
      const ExplosionParticle = class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.vx = (Math.random() - 0.5) * 8;
          this.vy = (Math.random() - 0.5) * 8;
          this.size = Math.random() * 6 + 3;
          this.color = ["#8800ff", "#aa00ff", "#ff00ff"][
            Math.floor(Math.random() * 3)
          ];
          this.life = 30;
          this.maxLife = 30;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.2;
          this.life--;
        }

        draw(ctx) {
          ctx.save();
          ctx.globalAlpha = this.life / this.maxLife;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        isDead() {
          return this.life <= 0;
        }
      };

      for (let i = 0; i < 30; i++) {
        particlesArray.push(
          new ExplosionParticle(
            this.x + this.width / 2,
            this.y + this.height / 2
          )
        );
      }
    }

    // Create fragments
    const fragmentsX = 4;
    const fragmentsY = 6;
    const fragWidth = this.width / fragmentsX;
    const fragHeight = this.height / fragmentsY;

    for (let i = 0; i < fragmentsX; i++) {
      for (let j = 0; j < fragmentsY; j++) {
        this.fragments.push({
          x: this.x + i * fragWidth + fragWidth / 2,
          y: this.y + j * fragHeight + fragHeight / 2,
          width: fragWidth,
          height: fragHeight,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          alpha: 1,
        });
      }
    }
  }

  isDestroyed() {
    return this.exploding && this.explodingTimer >= this.explodingDuration;
  }

  shouldShake() {
    return this.emerging && this.emergingTimer < 20;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}
