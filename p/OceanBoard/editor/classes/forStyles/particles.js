/* ===### Particle System ###=== */
/* === Note: Floating particles for OceanBoard === */

class ParticleSystem {
	constructor(container) {
		this.container = container;
		this.particles = [];
		this.maxParticles = 50;
		this.animationFrame = null;
		this.canvas = null;
		this.ctx = null;
		this.isRunning = false;
	}

	init() {
		// Create canvas
		this.canvas = document.createElement('canvas');
		this.canvas.classList.add('ob-particle-canvas');
		this.canvas.width = this.container.offsetWidth;
		this.canvas.height = this.container.offsetHeight;
		this.container.appendChild(this.canvas);
		
		this.ctx = this.canvas.getContext('2d');
		
		// Create particles
		for (let i = 0; i < this.maxParticles; i++) {
			this.particles.push(this.createParticle());
		}
		
		// Handle resize
		window.addEventListener('resize', () => this.handleResize());
		
		console.log('[Particles] System initialized with', this.maxParticles, 'particles');
	}

	createParticle() {
		return {
			x: Math.random() * this.canvas.width,
			y: Math.random() * this.canvas.height,
			size: Math.random() * 3 + 1,
			speedX: (Math.random() - 0.5) * 0.5,
			speedY: (Math.random() - 0.5) * 0.5,
			opacity: Math.random() * 0.5 + 0.2,
			hue: Math.random() * 20 + 330 // Pink-ish hues (330-350)
		};
	}

	handleResize() {
		this.canvas.width = this.container.offsetWidth;
		this.canvas.height = this.container.offsetHeight;
	}

	update() {
		this.particles.forEach(particle => {
			// Update position
			particle.x += particle.speedX;
			particle.y += particle.speedY;
			
			// Wrap around edges
			if (particle.x < 0) particle.x = this.canvas.width;
			if (particle.x > this.canvas.width) particle.x = 0;
			if (particle.y < 0) particle.y = this.canvas.height;
			if (particle.y > this.canvas.height) particle.y = 0;
			
			// Subtle opacity pulse
			particle.opacity += (Math.random() - 0.5) * 0.01;
			particle.opacity = Math.max(0.1, Math.min(0.6, particle.opacity));
		});
	}

	draw() {
		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		// Draw particles
		this.particles.forEach(particle => {
			this.ctx.beginPath();
			this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			this.ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
			this.ctx.fill();
			
			// Draw glow
			const gradient = this.ctx.createRadialGradient(
				particle.x, particle.y, 0,
				particle.x, particle.y, particle.size * 3
			);
			gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, ${particle.opacity * 0.5})`);
			gradient.addColorStop(1, 'transparent');
			
			this.ctx.fillStyle = gradient;
			this.ctx.fillRect(
				particle.x - particle.size * 3,
				particle.y - particle.size * 3,
				particle.size * 6,
				particle.size * 6
			);
		});
		
		// Draw connections between nearby particles
		this.drawConnections();
	}

	drawConnections() {
		for (let i = 0; i < this.particles.length; i++) {
			for (let j = i + 1; j < this.particles.length; j++) {
				const dx = this.particles[i].x - this.particles[j].x;
				const dy = this.particles[i].y - this.particles[j].y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < 100) {
					const opacity = (1 - distance / 100) * 0.2;
					this.ctx.beginPath();
					this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
					this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
					this.ctx.strokeStyle = `rgba(228, 57, 103, ${opacity})`;
					this.ctx.lineWidth = 1;
					this.ctx.stroke();
				}
			}
		}
	}

	animate() {
		if (!this.isRunning) return;
		
		this.update();
		this.draw();
		
		this.animationFrame = requestAnimationFrame(() => this.animate());
	}

	start() {
		if (this.isRunning) return;
		this.isRunning = true;
		this.animate();
		console.log('[Particles] Animation started');
	}

	stop() {
		this.isRunning = false;
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
		}
		console.log('[Particles] Animation stopped');
	}

	destroy() {
		this.stop();
		if (this.canvas && this.canvas.parentNode) {
			this.canvas.parentNode.removeChild(this.canvas);
		}
		this.particles = [];
		console.log('[Particles] System destroyed');
	}
}

/* ===### Export ###=== */
export { ParticleSystem };
