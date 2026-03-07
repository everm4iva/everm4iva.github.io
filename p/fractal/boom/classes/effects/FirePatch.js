export default class FirePatch {
    constructor(x, y, size, duration) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = duration;
        this.timer = 0;
        this.damage = 8; // Increased damage
        this.damageInterval = 30; // Damage every 0.5 seconds
        this.damageTimer = 0;

        // Spreading
        this.spreadTimer = 0;
        this.spreadInterval = 60; // Spread every 1 second
        this.spreadRadius = 40; // How far it spreads
        this.hasSpread = false;

        // Visual
        this.noiseOffset = Math.random() * 1000;
        this.flickerTimer = 0;
    }

    update() {
        this.timer++;
        this.damageTimer++;
        this.flickerTimer += 0.2;
        this.spreadTimer++;
    }

    shouldSpread() {
        if (!this.hasSpread && this.spreadTimer >= this.spreadInterval && this.timer < this.duration * 0.5) {
            this.hasSpread = true;
            return true;
        }
        return false;
    }

    createSpreadPatches(width, height) {
        // Create 2-4 smaller fire patches around this one
        const patches = [];
        const numPatches = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numPatches; i++) {
            const angle = (Math.PI * 2 * i) / numPatches + (Math.random() - 0.5) * 0.8;
            const distance = this.spreadRadius + Math.random() * 20;
            const patchX = Math.max(30, Math.min(width - 30, this.x + Math.cos(angle) * distance));
            const patchY = Math.max(30, Math.min(height - 30, this.y + Math.sin(angle) * distance));
            const patchSize = this.size * 0.6; // Smaller spread patches
            const patchDuration = this.duration * 0.7; // Shorter duration

            patches.push({
                x: patchX,
                y: patchY,
                size: patchSize,
                duration: patchDuration
            });
        }

        return patches;
    }

    draw(ctx) {
        const alpha = this.getAlpha();

        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Create noisy fire texture
        const noiseSize = 8;
        const cols = Math.ceil(this.size / noiseSize);
        const rows = Math.ceil(this.size / noiseSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const px = this.x - this.size / 2 + i * noiseSize;
                const py = this.y - this.size / 2 + j * noiseSize;

                // Simple noise-like random pattern
                const noise = this.noise(px * 0.1 + this.noiseOffset, py * 0.1 + this.noiseOffset, this.flickerTimer);

                if (noise > 0.3) {
                    // Fire colors based on noise
                    const r = 255;
                    const g = Math.floor(80 + noise * 120);
                    const b = 0;

                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillRect(px, py, noiseSize, noiseSize);
                }
            }
        }

        // Outer glow
        ctx.globalAlpha = alpha * 0.3;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#ff3300');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);

        ctx.restore();
    }

    // Simple pseudo-random noise function
    noise(x, y, t) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + t * 43.758) * 43758.5453;
        return n - Math.floor(n);
    }

    getAlpha() {
        const progress = this.timer / this.duration;
        if (progress < 0.2) {
            // Fade in quickly
            return progress * 5;
        } else if (progress > 0.7) {
            // Fade out slowly
            return (1 - progress) / 0.3;
        }
        return 1;
    }

    isExpired() {
        return this.timer >= this.duration;
    }

    checkPlayerCollision(player) {
        const dx = (player.x + player.width / 2) - this.x;
        const dy = (player.y + player.height / 2) - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.size / 2;
    }

    checkEnemyCollision(enemy) {
        const dx = enemy.getCenterX() - this.x;
        const dy = enemy.getCenterY() - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.size / 2;
    }

    shouldDamage() {
        if (this.damageTimer >= this.damageInterval) {
            this.damageTimer = 0;
            return true;
        }
        return false;
    }
}
