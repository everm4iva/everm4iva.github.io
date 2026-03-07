export default class StarOrb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.05;
        this.rotation = 0;
        this.rotationSpeed = 0.1;
        this.pulsePhase = 0;
        
        // Lifetime management
        this.maxLifetime = 1500; // 25 seconds
        this.lifetime = 0;
        
        // Sparkle effects
        this.sparkles = [];
        for (let i = 0; i < 8; i++) {
            this.sparkles.push({
                angle: (Math.PI * 2 * i) / 8,
                distance: 15,
                speed: 0.05
            });
        }
    }

    update() {
        // Bobbing animation
        this.bobOffset += this.bobSpeed;
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.1;
        this.lifetime++;
        
        // Update sparkles
        this.sparkles.forEach(s => {
            s.angle += s.speed;
        });
    }

    draw(ctx) {
        ctx.save();
        
        const bobY = Math.sin(this.bobOffset) * 6;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.3;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + bobY;
        
        // Draw glow
        ctx.shadowBlur = 40 * pulse;
        ctx.shadowColor = '#ffff00';
        
        // Draw sparkles
        this.sparkles.forEach(s => {
            const sx = centerX + Math.cos(s.angle) * s.distance;
            const sy = centerY + Math.sin(s.angle) * s.distance;
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Rotate star
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.translate(-centerX, -centerY);
        
        // Draw star shape
        const spikes = 5;
        const outerRadius = (this.width / 2) * pulse;
        const innerRadius = outerRadius * 0.5;
        
        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Cost indicator
        ctx.restore();
        ctx.save();
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.fillText('-80 XP', centerX, centerY + this.height / 2 + 15);
        
        ctx.restore();
    }

    checkCollision(entity) {
        return this.x < entity.x + entity.width &&
               this.x + this.width > entity.x &&
               this.y < entity.y + entity.height &&
               this.y + this.height > entity.y;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }
    
    isExpired() {
        return this.lifetime >= this.maxLifetime;
    }
}
