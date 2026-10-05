/**
 * ☆=========================================☆
 * Effects system - LOGIC
 * Audio-synced visual effects using web audio api
 * made partially with a.. to document and help-me build the logic
 * Spent most time here.. in this file, than any other one.. for nothing-- at least for now.
 * ☆=========================================☆
 */

class EffectSystem {
	constructor(audioElement) {
		this.audioElement = audioElement;
		this.activeEffects = new Map();
		this.effectAnimationFrameId = null;
		this.isPlaying = false;
		this.currentTrack = null;

		// Web Audio API setup
		this.audioContext = null;
		this.analyser = null;
		this.frequencyData = null;
		this.source = null;
		this.webAudioInitialized = false;
		this.bassValue = 0;

		// Create overlay container
		this.overlayContainer = document.createElement('div');
		this.overlayContainer.id = 'effect-overlay-container';
		this.overlayContainer.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 500;
		`;
		document.body.appendChild(this.overlayContainer);

		// listen to audio playback
		if (this.audioElement) {
			this.audioElement.addEventListener('play', () => this.onAudioPlay());
			this.audioElement.addEventListener('pause', () => this.onAudioPause());
			this.audioElement.addEventListener('ended', () => this.onAudioEnded());
			this.audioElement.addEventListener('play', () => this.retryWebAudioInit(), {once: true});
		}

		this.initAudioContext();
	}

	// retry Web Audio initialization after user interaction
	retryWebAudioInit() {
		if (this.webAudioInitialized) return;
		console.log('Retrying Web Audio initialization after user interaction');
		this.initAudioContext();
	}

	// initialize Web Audio API for frequency analysis
	initAudioContext() {
		if (!this.audioElement) {
			console.warn('No audio element found for Web Audio API');
			return;
		}

		if (this.webAudioInitialized) {
			console.log('Web Audio already initialized');
			return;
		}

		try {
			const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			console.log('AudioContext created:', audioCtx.state);

			// resume context if suspended
			if (audioCtx.state === 'suspended') {
				audioCtx
					.resume()
					.then(() => {
						console.log('AudioContext resumed');
					})
					.catch((e) => {
						console.warn('Could not resume AudioContext:', e);
					});
			}

			const source = audioCtx.createMediaElementSource(this.audioElement);
			console.log('MediaElementAudioSource created');

			const analyser = audioCtx.createAnalyser();
			console.log('Analyser created');

			analyser.fftSize = 256;
			source.connect(analyser);
			analyser.connect(audioCtx.destination);
			console.log('Audio graph connected');

			this.audioContext = audioCtx;
			this.analyser = analyser;
			this.source = source;
			this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
			this.timeDomainData = new Uint8Array(analyser.fftSize);
			this.webAudioInitialized = true;

			console.log('Web Audio API successfully initialized');
		} catch (e) {
			console.error('Failed to initialize Web Audio API:', e.message, e.name);
			this.webAudioInitialized = false;
		}
	}

	// gets current frequency/bass energy from audio (in a super rad way)
	getBassEnergy() {
		if (!this.analyser) {
			// fallback: estimate based on audio element play state and time
			if (this.audioElement && !this.audioElement.paused) {
				// audio is playing but Web Audio not ready - return minimal energy to prevent complete silence
				return 0.1;
			}
			return 0;
		}

		this.analyser.getByteFrequencyData(this.frequencyData);
		// get bass frequencies (first ~15 bins represent bass - expanded range for... more wide detection, i guess)
		let bassSum = 0;
		for (let i = 0; i < 15; i++) {
			bassSum += this.frequencyData[i];
		}
		const energy = Math.pow(bassSum / (15 * 255), 0.5);
		console.log('getBassEnergy:', energy.toFixed(4), 'raw:', bassSum, 'analyser:', !!this.analyser);
		return energy;
	}

	// get mid-range frequency energy
	getMidEnergy() {
		if (!this.analyser) return 0;

		this.analyser.getByteFrequencyData(this.frequencyData);
		// Get mid frequencies
		let midSum = 0;
		const startBin = Math.floor(this.analyser.frequencyBinCount * 0.2);
		const endBin = Math.floor(this.analyser.frequencyBinCount * 0.6);
		for (let i = startBin; i < endBin; i++) {
			midSum += this.frequencyData[i];
		}
		return midSum / ((endBin - startBin) * 255);
	}

	// get overall volume/amplitude from waveform (true loudness detection)
	getOverallVolume() {
		if (!this.analyser) {
			// fallback: if audio is playing, assume some volume
			if (this.audioElement && !this.audioElement.paused) {
				return Math.random() * 0.3 + 0.2; // 0.2-0.5 baseline for playing audio
			}
			return 0;
		}

		// get the actual waveform samples (NOT frequency data!!!!!11!!)
		this.analyser.getByteTimeDomainData(this.timeDomainData);

		// calculate RMS from waveform (true measure of loudness)
		let sum = 0;
		for (let i = 0; i < this.timeDomainData.length; i++) {
			// normalize from 0-255 range to -1 to 1 range (128 is silence)
			const sample = (this.timeDomainData[i] - 128) / 128;
			sum += sample * sample;
		}

		let rms = Math.sqrt(sum / this.timeDomainData.length);

		// apply aggressive power curve for dramatic sensitivity
		rms = Math.pow(rms, 3);

		console.log('getOverallVolume:', rms.toFixed(4), 'analyser:', !!this.analyser);

		return Math.min(1, rms);
	}

	parseIntensity(config) {
		const intensity = Math.max(0, Math.min(1, config.intensity || 0.5));

		// if min/max provided, use them; otherwise derive from intensity
		const min =
			config.minIntensity !== undefined
				? Math.max(0, Math.min(1, config.minIntensity))
				: Math.max(0, intensity - 0.2);
		const max =
			config.maxIntensity !== undefined
				? Math.max(0, Math.min(1, config.maxIntensity))
				: Math.min(1, intensity + 0.2);

		return {
			min: Math.min(min, max), // ensure min <= max
			avg: intensity,
			max: Math.max(min, max),
		};
	}

	getAudioEnergy(triggerType = 'bass') {
		// get overall volume (peak-based) - this has fallback for when analyser is unavailable
		const volume = this.getOverallVolume();

		// get frequency-based energy - this has fallback too
		let frequencyEnergy = 0;
		if (triggerType === 'beat') {
			// beat detection: combine bass and mid-ew frequencies
			const bass = this.getBassEnergy();
			const mid = this.getMidEnergy() * 0.5;
			frequencyEnergy = Math.min(1, bass + mid);
		} else {
			// fefault to bass
			frequencyEnergy = this.getBassEnergy();
		}

		// improved combination: use max to ensure either frequency or volume can trigger effect
		const combinedEnergy = Math.max(frequencyEnergy, frequencyEnergy * volume);

		console.log(
			'getAudioEnergy:',
			combinedEnergy.toFixed(4),
			'freq:',
			frequencyEnergy.toFixed(4),
			'vol:',
			volume.toFixed(4),
		);

		return Math.min(1, combinedEnergy);
	}

	applySensitivity(audioEnergy, sensitivity = 1) {
		const sens = Math.max(0, Math.min(1, sensitivity || 1));
		// exponential scaling so small sensitivities feel responsive heheh
		return Math.pow(audioEnergy, 2 - sens);
	}

	parseDuration(duration) {
		if (duration === 'consistent') {
			return null; // signals infinite duration
		}
		if (typeof duration === 'number') {
			return duration * 1000; // convert seconds to ms
		}
		return null;
	}

	applyEffects(track) {
		this.currentTrack = track; // store track for pause/resume
		this.clearAllEffects();

		if (!track || !track.effects) {
			console.log('No effects for track:', track?.title || 'Unknown');
			return;
		}

		console.log('Applying effects for:', track.title, track.effects);

		const effects = track.effects;
		if (effects === 'none') return;

		// handle screenshake
		if (effects.screenshake) {
			console.log('Adding screenshake');
			this.addScreenshake(effects.screenshake);
		}

		// handle color overlay (warm/cold)
		if (effects.colorOverlay) {
			console.log('Adding colorOverlay');
			this.addColorOverlay(effects.colorOverlay);
		}

		// handle image overlay
		if (effects.imageOverlay) {
			console.log('Adding imageOverlay');
			this.addImageOverlay(effects.imageOverlay);
		}

		// handle distortion/glitch effects
		if (effects.distortion) {
			console.log('Adding distortion');
			this.addDistortion(effects.distortion);
		}

		// handle pulsing/strobe
		if (effects.pulse) {
			console.log('Adding pulse');
			this.addPulse(effects.pulse);
		}
	}

	// screenshake effect synced with audio
	addScreenshake(config) {
		console.log('addScreenshake called with config:', config);
		const intensities = this.parseIntensity(config);

		this.activeEffects.set('screenshake', {
			intensities,
			sensitivity: config.sensitivity !== undefined ? config.sensitivity : 1,
			triggerType: config.triggerType || 'bass',
			duration: this.parseDuration(config.duration) || 3000,
			startTime: Date.now(),
			syncToAudio: config.syncToAudio !== false,
			audioStartTime: this.audioElement?.currentTime || 0,
			isConsistent: config.duration === 'consistent',
		});

		console.log('Screenshake effect added, activeEffects:', this.activeEffects.size);
		this.animateScreenshake();
	}

	// animate screenshake synced with audio playback
	animateScreenshake() {
		if (!this.activeEffects.has('screenshake')) return;

		const shake = this.activeEffects.get('screenshake');
		const currentTime = Date.now();
		const elapsed = currentTime - shake.startTime;
		const progress = shake.isConsistent ? 0 : elapsed / shake.duration;

		// stop if audio not playing or duration expired
		if (!this.isPlaying || (!shake.isConsistent && progress >= 1)) {
			this.activeEffects.delete('screenshake');
			document.documentElement.style.transform = '';
			console.log(
				'Screenshake animation ended: isPlaying=' + this.isPlaying + ', progress=' + progress.toFixed(2),
			);
			return;
		}

		// ease-out for intensity (only if not consistent)
		const easeProgress = shake.isConsistent ? 1 : 1 - progress;
		let intensity = shake.intensities.avg * easeProgress;

		console.log(
			'animateScreenshake running - syncToAudio:',
			shake.syncToAudio,
			'analyser:',
			!!this.analyser,
			'isPlaying:',
			this.isPlaying,
		);

		// sync with audio if enabled
		if (shake.syncToAudio && this.analyser) {
			const audioEnergy = this.getAudioEnergy(shake.triggerType);
			const SILENCE_THRESHOLD = 0.04; // lowered threshold for quicker response to subtle sounds (it's so sensitive ohhh godddd!!!)

			console.log('audioEnergy:', audioEnergy.toFixed(4), 'threshold:', SILENCE_THRESHOLD);

			if (audioEnergy < SILENCE_THRESHOLD) {
				// during silence, for consistent effects, stop early to prevent persistent effect
				if (shake.isConsistent) {
					// track silence duration
					if (!shake.silenceStartTime) {
						shake.silenceStartTime = Date.now();
					}
					const silenceDuration = Date.now() - shake.silenceStartTime;
					// if silent for more than 200ms, clear the effect like a good boy
					if (silenceDuration > 200) {
						console.log('Screenshake stopped due to extended silence');
						this.activeEffects.delete('screenshake');
						document.documentElement.style.transform = '';
						return;
					}
				}
				intensity = 0;
			} else {
				// reset silence timer when sound is detected
				shake.silenceStartTime = null;
				const scaledEnergy = this.applySensitivity(audioEnergy, shake.sensitivity);
				// lerp between min and max based on audio energy!!
				intensity = shake.intensities.min + (shake.intensities.max - shake.intensities.min) * scaledEnergy;
				intensity *= easeProgress;
			}
		}

		// jf intensity is effectively zero, clear transform but keep looping for reactive response
		if (intensity < 0.01) {
			document.documentElement.style.transform = '';
		} else {
			// rand shake with synchronized intensity - increased amplitude for better visibility
			const maxShake = 60;
			const offsetX = (Math.random() - 0.5) * maxShake * intensity;
			const offsetY = (Math.random() - 0.5) * maxShake * intensity;

			document.documentElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
		}

		this.effectAnimationFrameId = requestAnimationFrame(() => this.animateScreenshake());
	}
	// color overlay with audio sync
	addColorOverlay(config) {
		const intensities = this.parseIntensity(config);
		const type = config.type || 'warm';
		const durationMs = this.parseDuration(config.duration);
		const isConsistent = config.duration === 'consistent';

		this.activeEffects.set('colorOverlay', {
			type,
			intensities,
			sensitivity: config.sensitivity !== undefined ? config.sensitivity : 1,
			triggerType: config.triggerType || 'bass',
			duration: durationMs,
			startTime: Date.now(),
			syncToAudio: config.syncToAudio !== false,
			element: null,
			isConsistent,
		});

		const overlay = document.createElement('div');
		overlay.className = 'effect-color-overlay';
		overlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 501;
			opacity: ${intensities.avg};
			animation: fadeInOut 0.5s ease-out;
		`;

		if (type === 'warm') {
			overlay.style.backgroundColor = 'rgba(255, 100, 0, 0.3)';
		} else if (type === 'cold') {
			overlay.style.backgroundColor = 'rgba(0, 150, 255, 0.3)';
		}

		this.overlayContainer.appendChild(overlay);
		this.activeEffects.get('colorOverlay').element = overlay;

		// auto-remove after duration (unless consistent) or when audio stops
		if (!isConsistent && durationMs) {
			setTimeout(() => {
				if (this.activeEffects.has('colorOverlay')) {
					const ef = this.activeEffects.get('colorOverlay');
					if (ef.element?.parentNode) {
						ef.element.remove();
					}
					this.activeEffects.delete('colorOverlay');
				}
			}, durationMs);
		}
	}

	// Img overlay effect
	addImageOverlay(config) {
		const imageSrc = config.imageSrc;
		const intensities = this.parseIntensity(config);
		const blendMode = config.mode || 'screen';
		const durationMs = this.parseDuration(config.duration);
		const isConsistent = config.duration === 'consistent';

		if (!imageSrc) return;

		const overlay = document.createElement('div');
		overlay.className = 'effect-image-overlay';
		overlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 501;
			opacity: ${intensities.avg};
			background-image: url('${imageSrc}');
			background-size: cover;
			background-position: center;
			mix-blend-mode: ${blendMode};
			animation: fadeInOut 0.5s ease-out;
		`;

		this.overlayContainer.appendChild(overlay);

		this.activeEffects.set('imageOverlay', {
			element: overlay,
			intensities,
			sensitivity: config.sensitivity !== undefined ? config.sensitivity : 1,
			triggerType: config.triggerType || 'bass',
			duration: durationMs,
			startTime: Date.now(),
			syncToAudio: config.syncToAudio !== false,
			isConsistent,
		});

		if (!isConsistent && durationMs) {
			setTimeout(() => {
				if (this.activeEffects.has('imageOverlay')) {
					const ef = this.activeEffects.get('imageOverlay');
					if (ef.element?.parentNode) {
						ef.element.remove();
					}
					this.activeEffects.delete('imageOverlay');
				}
			}, durationMs);
		}
	}

	// distortion/glitch synced
	addDistortion(config) {
		const intensities = this.parseIntensity(config);
		const freqMap = {low: 100, medium: 50, high: 20};
		const baseFrequency = freqMap[config.frequency] || 50;
		const durationMs = this.parseDuration(config.duration);
		const isConsistent = config.duration === 'consistent';

		this.activeEffects.set('distortion', {
			intensities,
			sensitivity: config.sensitivity !== undefined ? config.sensitivity : 1,
			triggerType: config.triggerType || 'beat',
			duration: durationMs,
			startTime: Date.now(),
			baseFrequency,
			syncToAudio: config.syncToAudio !== false,
			element: null,
			isConsistent,
		});

		const distortionElement = document.createElement('div');
		distortionElement.className = 'effect-distortion';
		distortionElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 501;
			background: linear-gradient(
				0deg,
				rgba(255, 0, 0, ${intensities.avg * 0.2}),
				rgba(0, 255, 0, ${intensities.avg * 0.2}),
				rgba(0, 0, 255, ${intensities.avg * 0.2})
			);
			mix-blend-mode: screen;
		`;

		this.overlayContainer.appendChild(distortionElement);
		this.activeEffects.get('distortion').element = distortionElement;

		this.animateDistortion();

		if (!isConsistent && durationMs) {
			setTimeout(() => {
				if (this.activeEffects.has('distortion')) {
					const ef = this.activeEffects.get('distortion');
					if (ef.element?.parentNode) {
						ef.element.remove();
					}
					this.activeEffects.delete('distortion');
				}
			}, durationMs);
		}
	}

	// animate distortion based on audio
	animateDistortion() {
		if (!this.activeEffects.has('distortion')) return;

		const distortion = this.activeEffects.get('distortion');
		const elapsed = Date.now() - distortion.startTime;
		const progress = distortion.duration ? elapsed / distortion.duration : 0;

		if (!distortion.isConsistent && progress >= 1) {
			this.activeEffects.delete('distortion');
			return;
		}

		if (!this.isPlaying) {
			return;
		}

		const SILENCE_THRESHOLD = 0.08;

		// sync frequency response to audioo
		let frequency = distortion.baseFrequency;
		let clipAmount = 5;
		if (distortion.syncToAudio && this.analyser) {
			const audioEnergy = this.getAudioEnergy(distortion.triggerType);

			// jf silence, don't distort
			if (audioEnergy < SILENCE_THRESHOLD) {
				clipAmount = 0;
				frequency = distortion.baseFrequency;
			} else {
				const scaledEnergy = this.applySensitivity(audioEnergy, distortion.sensitivity);
				frequency = distortion.baseFrequency * (0.5 + scaledEnergy * 1.5);
				const minIntensity = distortion.intensities.min;
				const maxIntensity = distortion.intensities.max;
				const dynIntensity = minIntensity + (maxIntensity - minIntensity) * scaledEnergy;
				clipAmount = 3 + dynIntensity * 7;
			}
		}

		const element = distortion.element;
		if (element) {
			const offset = (elapsed % frequency) / frequency;
			const dynamicClip = Math.sin(offset * Math.PI * 2) * clipAmount;
			element.style.clipPath = `polygon(${dynamicClip}% 0%, 100% ${dynamicClip}%, ${100 - dynamicClip}% 100%, 0% ${100 - dynamicClip}%)`;
		}

		requestAnimationFrame(() => this.animateDistortion());
	}

	// Pulse/strobe/plop/boom/csh synced with audio
	addPulse(config) {
		const intensities = this.parseIntensity(config);
		const speedMap = {slow: 1, medium: 0.5, fast: 0.2};
		const speedSeconds = typeof config.speed === 'number' ? config.speed : speedMap[config.speed] || 0.5;
		const color = config.color === 'color' ? `rgba(255, 100, 0, 1)` : `rgba(255, 255, 255, 1)`;
		const durationMs = this.parseDuration(config.duration);
		const isConsistent = config.duration === 'consistent';

		this.activeEffects.set('pulse', {
			intensities,
			sensitivity: config.sensitivity !== undefined ? config.sensitivity : 1,
			triggerType: config.triggerType || 'beat',
			speedSeconds,
			duration: durationMs,
			startTime: Date.now(),
			audioStartTime: this.audioElement?.currentTime || 0,
			syncToAudio: config.syncToAudio !== false,
			element: null,
			color,
			isConsistent,
		});

		const pulseElement = document.createElement('div');
		pulseElement.className = 'effect-pulse';
		pulseElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 501;
			background-color: ${color};
		`;

		this.overlayContainer.appendChild(pulseElement);
		this.activeEffects.get('pulse').element = pulseElement;

		this.animatePulse();

		if (!isConsistent && durationMs) {
			setTimeout(() => {
				if (this.activeEffects.has('pulse')) {
					const ef = this.activeEffects.get('pulse');
					if (ef.element?.parentNode) {
						ef.element.remove();
					}
					this.activeEffects.delete('pulse');
				}
			}, durationMs);
		}
	}

	// animate pulse synced with audioa
	animatePulse() {
		if (!this.activeEffects.has('pulse')) return;

		const pulse = this.activeEffects.get('pulse');
		const elapsed = Date.now() - pulse.startTime;
		const progress = pulse.duration ? elapsed / pulse.duration : 0;

		if (!pulse.isConsistent && progress >= 1) {
			this.activeEffects.delete('pulse');
			return;
		}

		if (!this.isPlaying) {
			return;
		}

		const SILENCE_THRESHOLD = 0.08;

		// calculate position in pulse cycle (bc i need nerdy things)
		let cyclePosition = elapsed / 1000 / pulse.speedSeconds;
		if (pulse.syncToAudio) {
			// sync with audio playback instead of wall time
			const audioElapsed = (this.audioElement?.currentTime || 0) - pulse.audioStartTime;
			cyclePosition = (audioElapsed / pulse.speedSeconds) % 1;
		} else {
			cyclePosition = cyclePosition % 1;
		}

		// sine wave for smooth pulse (sinewaves are cool asf)
		let opacity = Math.abs(Math.sin(cyclePosition * Math.PI));

		// apply audio sync if enabled
		if (pulse.syncToAudio && this.analyser) {
			const audioEnergy = this.getAudioEnergy(pulse.triggerType);

			// if silence, no pulse
			if (audioEnergy < SILENCE_THRESHOLD) {
				opacity = 0;
			} else {
				const scaledEnergy = this.applySensitivity(audioEnergy, pulse.sensitivity);
				const minIntensity = pulse.intensities.min;
				const maxIntensity = pulse.intensities.max;
				const dynIntensity = minIntensity + (maxIntensity - minIntensity) * scaledEnergy;
				opacity = opacity * dynIntensity;
			}
		}

		if (pulse.element) {
			pulse.element.style.opacity = opacity;
		}

		requestAnimationFrame(() => this.animatePulse());
	}

	// Clear all active effects like a good boy heheh
	clearAllEffects() {
		// stop screenshake animation!
		if (this.effectAnimationFrameId) {
			cancelAnimationFrame(this.effectAnimationFrameId);
		}
		document.documentElement.style.transform = '';

		// clear all overlays and effects!
		for (const [key, effect] of this.activeEffects.entries()) {
			if (effect.element?.parentNode) {
				effect.element.remove();
			}
		}

		this.overlayContainer.innerHTML = '';
		this.activeEffects.clear();
		this.currentTrack = null;
		console.log('All effects cleared, currentTrack reset to null');
	}

	// audio playback lifecycle
	onAudioPlay() {
		console.log('Audio play event triggered');
		this.isPlaying = true;
		if (this.audioContext && this.audioContext.state === 'suspended') {
			this.audioContext.resume();
		}
		// re-apply effects when resuming from pause
		if (this.currentTrack) {
			console.log('Re-applying effects for:', this.currentTrack.title);
			this.applyEffects(this.currentTrack);
		}
	}

	onAudioPause() {
		this.isPlaying = false;
		this.clearAllEffects();
	}

	onAudioEnded() {
		this.isPlaying = false;
		this.clearAllEffects();
	}
}

// create global instance when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	window.effectSystem = new EffectSystem(document.querySelector('.audio-element'));

	const audioElement = document.querySelector('.audio-element');
	if (audioElement) {
		window.effectSystem = new EffectSystem(audioElement);
		console.log('EffectSystem initialized on audio element:', audioElement);
	} else {
		console.warn('Audio element not found for EffectSystem initialization');
	}
});
