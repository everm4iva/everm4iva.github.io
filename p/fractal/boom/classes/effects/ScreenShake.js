export default class ScreenShake {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.intensity = 0;
        this.duration = 0;
    }

    shake(intensity = 10, duration = 20) {
        this.intensity = intensity;
        this.duration = duration;
    }

    update() {
        if (this.duration > 0) {
            this.x = (Math.random() - 0.5) * this.intensity;
            this.y = (Math.random() - 0.5) * this.intensity;
            this.duration--;
            this.intensity *= 0.95; // Decay shake
        } else {
            this.x = 0;
            this.y = 0;
        }
    }

    isActive() {
        return this.duration > 0;
    }
}
