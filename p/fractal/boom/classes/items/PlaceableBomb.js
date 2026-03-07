export default class PlaceableBomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;

        // States: 'placed', 'warning', 'exploding'
        this.state = 'placed';

        // Warning phase - always 2 seconds
        this.warningTimer = 0;
        this.warningDuration = 120; // 2 seconds
        this.warningRadius = 20;
        this.maxWarningRadius = 100;

        // Explosion
        this.explosionRadius = 120;
        this.exploded = false;

        // Animation
        this.pulseTimer = 0;

        // Sprite
        this.sprite = new Image();
        this.sprite.src = './img/bomb.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    update() {
        if (this.state === 'placed') {
            this.state = 'warning';
        } else if (this.state === 'warning') {
            this.warningTimer++;
            this.pulseTimer += 0.2;

            // Expand warning radius
            const progress = this.warningTimer / this.warningDuration;
            this.warningRadius = 20 + (this.maxWarningRadius - 20) * progress;

            // Check if should explode
            if (this.warningTimer >= this.warningDuration) {
                this.state = 'exploding';
            }
        }
    }

    shouldExplode() {
        return this.state === 'exploding';
    }

    draw(ctx) {
        ctx.save();

        // Draw placed bomb
        if (this.spriteLoaded) {
            ctx.globalAlpha = 0.9;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ff00';
            ctx.drawImage(this.sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.state === 'warning') {
            // Draw warning circle
            const pulse = Math.sin(this.pulseTimer * 6) * 0.4 + 0.6;
            const urgency = this.warningTimer / this.warningDuration;

            // Outer circle
            ctx.strokeStyle = `rgba(0, 255, ${Math.floor(255 * (1 - urgency))}, ${0.7 * pulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.warningRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner fill
            ctx.fillStyle = `rgba(0, 255, 0, ${0.15 * pulse})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.warningRadius, 0, Math.PI * 2);
            ctx.fill();

            // Center indicator
            ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Crosshair
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 * pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.warningRadius, this.y);
            ctx.lineTo(this.x + this.warningRadius, this.y);
            ctx.moveTo(this.x, this.y - this.warningRadius);
            ctx.lineTo(this.x, this.y + this.warningRadius);
            ctx.stroke();
        }

        ctx.restore();
    }
}
