export default class ShockCrystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.floatOffset = 0;
        this.floatSpeed = 0.08;
        this.pulseTimer = 0;
        this.sparkles = [];

        // Generate initial sparkles
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * 12 + 6,
                speed: Math.random() * 0.05 + 0.02,
                size: Math.random() * 2 + 1
            });
        }
    }

    update() {
        this.floatOffset += this.floatSpeed;
        this.pulseTimer += 0.1;

        // Update sparkles
        this.sparkles.forEach(sparkle => {
            sparkle.angle += sparkle.speed;
        });
    }

    draw(ctx) {
        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + Math.sin(this.floatOffset) * 3;
        const pulse = Math.sin(this.pulseTimer) * 0.3 + 0.7;

        // Glow aura
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = '#00ffff';

        // Sparkles around crystal
        this.sparkles.forEach(sparkle => {
            const sx = centerX + Math.cos(sparkle.angle) * sparkle.distance;
            const sy = centerY + Math.sin(sparkle.angle) * sparkle.distance;

            ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Crystal body (diamond shape)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - this.height / 2); // Top
        ctx.lineTo(centerX + this.width / 3, centerY); // Right
        ctx.lineTo(centerX, centerY + this.height / 2); // Bottom
        ctx.lineTo(centerX - this.width / 3, centerY); // Left
        ctx.closePath();
        ctx.fill();

        // Inner crystal highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - this.height / 3);
        ctx.lineTo(centerX + this.width / 6, centerY);
        ctx.lineTo(centerX, centerY + this.height / 6);
        ctx.lineTo(centerX - this.width / 6, centerY);
        ctx.closePath();
        ctx.fill();

        // Electric lines (fewer for smaller size)
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const angle = (Math.PI * 2 * i) / 2 + this.pulseTimer;
            const x1 = centerX + Math.cos(angle) * 5;
            const y1 = centerY + Math.sin(angle) * 5;
            const x2 = centerX + Math.cos(angle) * 10;
            const y2 = centerY + Math.sin(angle) * 10;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.restore();
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    checkCollision(entity) {
        return this.x < entity.x + entity.width &&
            this.x + this.width > entity.x &&
            this.y < entity.y + entity.height &&
            this.y + this.height > entity.y;
    }
}
