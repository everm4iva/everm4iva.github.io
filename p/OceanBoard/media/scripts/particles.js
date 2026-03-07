/* === Particle System === */

class ParticleSystem {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.particles = [];
		this.particleCount = 80;
		this.mouse = { x: null, y: null };
		
		this.resizeCanvas();
		this.initParticles();
		this.setupMouseTracking();
		this.animate();
		
		window.addEventListener('resize', () => this.resizeCanvas());
	}
	
	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}
	
	initParticles() {
		this.particles = [];
		for (let i = 0; i < this.particleCount; i++) {
			this.particles.push({
				x: Math.random() * this.canvas.width,
				y: Math.random() * this.canvas.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				size: Math.random() * 2 + 1
			});
		}
	}
	
	setupMouseTracking() {
		this.canvas.addEventListener('mousemove', (e) => {
			this.mouse.x = e.clientX;
			this.mouse.y = e.clientY;
		});
		
		this.canvas.addEventListener('mouseleave', () => {
			this.mouse.x = null;
			this.mouse.y = null;
		});
	}
	
	animate() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.particles.forEach(particle => {
			particle.x += particle.vx;
			particle.y += particle.vy;

			if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
			if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

			if (this.mouse.x !== null && this.mouse.y !== null) {
				const dx = this.mouse.x - particle.x;
				const dy = this.mouse.y - particle.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < 150) {
					const force = (150 - distance) / 150;
					particle.x -= dx * force * 0.03;
					particle.y -= dy * force * 0.03;
				}
			}

			this.ctx.beginPath();
			this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			this.ctx.fillStyle = 'rgba(255, 128, 170, 0.6)';
			this.ctx.fill();
		});

		this.particles.forEach((p1, i) => {
			this.particles.slice(i + 1).forEach(p2 => {
				const dx = p1.x - p2.x;
				const dy = p1.y - p2.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < 120) {
					this.ctx.beginPath();
					this.ctx.moveTo(p1.x, p1.y);
					this.ctx.lineTo(p2.x, p2.y);
					this.ctx.strokeStyle = `rgba(255, 128, 170, ${0.2 * (1 - distance / 120)})`;
					this.ctx.lineWidth = 0.5;
					this.ctx.stroke();
				}
			});
		});
		
		requestAnimationFrame(() => this.animate());
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('heroCanvas');
	if (canvas) {
		new ParticleSystem(canvas);
	}
});
