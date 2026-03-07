export default class Light {
    constructor(x, y, radius, color = 'rgba(255, 200, 100, 0.3)') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.intensity = 1;
        this.flicker = false;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
        
        if (this.flicker) {
            this.intensity = 0.7 + Math.random() * 0.3;
        }
    }

    draw(ctx) {
        ctx.save();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        
        // Parse color and apply intensity
        const alpha = this.intensity * 0.5;
        gradient.addColorStop(0, this.color.replace(/[\d.]+\)$/g, alpha + ')'));
        gradient.addColorStop(0.5, this.color.replace(/[\d.]+\)$/g, (alpha * 0.5) + ')'));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}

export class LightingSystem {
    constructor() {
        this.lights = [];
        this.ambientDarkness = 0.3; // 0 = no darkness, 1 = complete darkness
    }

    addLight(light) {
        this.lights.push(light);
    }

    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
        }
    }

    clear() {
        this.lights = [];
    }

    draw(ctx, width, height) {
        // Draw ambient darkness overlay
        if (this.ambientDarkness > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${this.ambientDarkness})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // Draw all lights
        this.lights.forEach(light => light.draw(ctx));
    }
}
