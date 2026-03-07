document.addEventListener('DOMContentLoaded', () => {
	const pop = document.querySelector('.pop');
	if (!pop) return;
	const me = document.querySelector('.me');
	const audioElement = document.querySelector('.audio-element');
	let collectedByMe = false;
	let respawnTimer = null;
	let respawned = false;
	let meIsDown = false;

	let loose = false;
	let raf = null;
	let vx = 0,
		vy = 0;
	const restitution = 0.72; // boing energy retained
	const gravity = 0.5;
	const friction = 0.992; // air friction
	let size = 0;
	let pos = {x: 0, y: 0}; // viewport coordinates of top-left

	// squish / stuck state
	let stuck = false;
	let stuckSide = null; // 'left'|'right'|'top'|'bottom'
	// Cooldown to avoid re-collect on respawn
	let collectCooldown = false;
	let collectCooldownTimer = null;
	const COLLECTION_COOLDOWN_MS = 300; // ms
	// no-stick timestamp to avoid sticking after respawn
	let noStickUntil = 0;

	// short cooldown preventing collection
	function setCollectionCooldown(ms = COLLECTION_COOLDOWN_MS) {
		collectCooldown = true;
		if (collectCooldownTimer) clearTimeout(collectCooldownTimer);
		collectCooldownTimer = setTimeout(() => {
			collectCooldown = false;
			collectCooldownTimer = null;
		}, ms);
	}

	function setNoStick(ms = 300) {
		noStickUntil = Date.now() + ms;
	}

	// store inline style to restore later
	const originalInline = {
		position: pop.style.position || '',
		left: pop.style.left || '',
		top: pop.style.top || '',
		zIndex: pop.style.zIndex || '',
	};

	function startLoose() {
		if (loose) return;
		loose = true;
		stuck = false;
		size = pop.getBoundingClientRect().width || 24;

		// starting position from current bounding rect
		const r = pop.getBoundingClientRect();
		pos.x = clamp(r.left, 0, window.innerWidth - size);
		pos.y = clamp(r.top, 0, window.innerHeight - size);

		// set to fixed so it floats over content
		pop.classList.add('loose');
		pop.classList.remove('stuck');
		pop.style.position = 'fixed';
		pop.style.left = pos.x + 'px';
		pop.style.top = pos.y + 'px';
		pop.style.zIndex = 9999;

		// give it an initial random push
		vx = (Math.random() - 0.5) * 16;
		vy = -8 - Math.random() * 8;

		animate();
		pop.setAttribute('aria-pressed', 'true');
	}

	function stopLoose() {
		if (!loose) return;
		loose = false;
		stuck = false;
		cancelAnimationFrame(raf);
		raf = null;
		pop.classList.remove('loose');
		pop.classList.remove('squish');
		pop.classList.remove('stuck');
		// restore inline styles to let CSS control placement
		pop.style.position = originalInline.position;
		pop.style.left = originalInline.left;
		pop.style.top = originalInline.top;
		pop.style.zIndex = originalInline.zIndex;
		pop.style.transform = '';
		pop.setAttribute('aria-pressed', 'false');
	}

	// Hide the pop when collected by the .me element
	function hidePopCollected() {
		collectedByMe = true;
		// stop motion and hide
		if (raf) {
			cancelAnimationFrame(raf);
			raf = null;
		}
		loose = false;
		stuck = false;
		pop.classList.remove('loose');
		pop.classList.remove('squish');
		pop.classList.remove('stuck');
		// visually hide and mark
		pop.style.visibility = 'hidden';
		pop.setAttribute('aria-hidden', 'true');
		pop.classList.add('collected');
		// prevent immediate re-collection
		setCollectionCooldown();
	}

	// Bring the pop back at the .me position and let it drop
	function respawnAtMe() {
		if (!me) return;
		collectedByMe = false;
		pop.classList.remove('collected');
		pop.style.visibility = '';
		pop.setAttribute('aria-hidden', 'false');

		// position the pop at the .me element (spawn slightly above to avoid overlap)
		const r = me.getBoundingClientRect();
		pop.style.position = 'fixed';
		pop.style.left = Math.round(r.left) + 'px';
		// spawn slightly above the avatar so it will visibly drop
		const spawnAbove = Math.max(0, Math.round(r.top) - (size || 24) - 8);
		pop.style.top = spawnAbove + 'px';
		pop.style.zIndex = 9999;

		try {
			me.classList.remove('ball');
		} catch (err) {}

		// size and pos for physics
		size = pop.getBoundingClientRect().width || size;
		pos.x = clamp(r.left, 0, window.innerWidth - size);
		pos.y = clamp(spawnAbove, 0, window.innerHeight - size);

		// small nudge so it drops
		vx = (Math.random() - 0.5) * 1.6;
		vy = 4; // stronger downward push so it clears quickly
		loose = true;
		stuck = false;
		setCollectionCooldown(700);
		setNoStick(700);
		if (!raf) animate();
	}

	function clamp(v, a, b) {
		return Math.min(Math.max(v, a), b);
	}

	function animate() {
		raf = requestAnimationFrame(animate);

		if (stuck) return; // while stuck, remain in place until clicked/un-stuck

		// update physics
		vy += gravity;
		vx *= friction;
		vy *= friction;

		pos.x += vx;
		pos.y += vy;

		const maxX = window.innerWidth - size;
		const maxY = window.innerHeight - size;

		let collided = false;
		let collidedAxis = null;

		// bounce left/right
		if (pos.x <= 0) {
			pos.x = 0;
			vx = Math.abs(vx) * restitution;
			collided = true;
			collidedAxis = 'left';
		} else if (pos.x >= maxX) {
			pos.x = maxX;
			vx = -Math.abs(vx) * restitution;
			collided = true;
			collidedAxis = 'right';
		}

		// bounce top/bottom
		if (pos.y <= 0) {
			pos.y = 0;
			vy = Math.abs(vy) * restitution;
			collided = true;
			collidedAxis = 'top';
		} else if (pos.y >= maxY) {
			pos.y = maxY;
			vy = -Math.abs(vy) * restitution;
			collided = true;
			collidedAxis = 'bottom';
			// reduce small velocities but don't stop completely
			if (Math.abs(vy) < 0.6) vy *= 0.5;
			if (Math.abs(vx) < 0.02) vx *= 0.5;
		}

		// collision effects (possible stick)
		if (collided) {
			// decide whether it sticks: higher chance on bottom collisions, avoid sticking to walls
			const speed = Math.sqrt(vx * vx + vy * vy);
			const stickChance = collidedAxis === 'bottom' ? 0.25 : 0.02; // mostly avoid side/top sticks
			// also avoid sticking if we recently respawned and require low speed
			if (Date.now() > noStickUntil && Math.random() < stickChance && speed < 0.35) {
				// visual cling effect but don't stop physics; reduce momentum
				pop.classList.add('stuck');
				// remove visual cling class after a short time so it doesn't persist
				setTimeout(() => {
					try {
						pop.classList.remove('stuck');
					} catch (e) {}
				}, 800);
				// anchoring: it hugs the edge but nudge inward so it doesn't get trapped
				if (collidedAxis === 'left') {
					pos.x = 2; // small inset
				} else if (collidedAxis === 'right') {
					pos.x = Math.max(0, maxX - 2);
				} else if (collidedAxis === 'top') {
					pos.y = 2;
				} else if (collidedAxis === 'bottom') {
					pos.y = Math.max(0, maxY - 2);
				}

				// keep it visually slightly flattened when clinging
				const rotate = vx * 6;
				pop.style.left = Math.round(pos.x) + 'px';
				pop.style.top = Math.round(pos.y) + 'px';
				if (collidedAxis === 'left' || collidedAxis === 'right') {
					pop.style.transform = `rotate(${rotate}deg) scaleX(${0.96}) scaleY(${1.02})`;
				} else {
					pop.style.transform = `rotate(${rotate}deg) scaleX(${1.02}) scaleY(${0.96})`;
				}

				// apply momentum loss to simulate energy loss on cling (but do not stop)
				vx *= 0.25;
				vy *= 0.05;
				// animation continues
			}
		}
		// allow the ball to be collected by the .me element
		if (!collectedByMe && me && pop.style.visibility !== 'hidden' && !collectCooldown && !meIsDown) {
			const popRect = pop.getBoundingClientRect();
			const meRectR = me.getBoundingClientRect();
			if (
				!(
					popRect.right < meRectR.left ||
					popRect.left > meRectR.right ||
					popRect.bottom < meRectR.top ||
					popRect.top > meRectR.bottom
				)
			) {
				// collision!
				try {
					if (me.classList.contains('rock')) me.classList.remove('rock');
					me.classList.add('ball');
				} catch (err) {}
				hidePopCollected();
				return; // stop processing this frame
			}
		}
		// apply visual rotation based on horizontal velocity
		const rot = vx * 6;
		// simple uniform scale
		let scaleX = 1,
			scaleY = 1;

		pop.style.left = Math.round(pos.x) + 'px';
		pop.style.top = Math.round(pos.y) + 'px';
		pop.style.transform = `rotate(${rot}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
	}

	// pointer / click handlers: support grab & throw
	let dragging = false;
	let dragPointerId = null;
	let dragOffset = {x: 0, y: 0};
	let lastX = 0,
		lastY = 0,
		lastT = 0;
	let recentPointer = false; // used to suppress the click after pointer interactions
	let startDownX = 0,
		startDownY = 0,
		movedWhileDown = false;
	// keep a short history of pointer samples
	let samples = [];

	function onPointerDown(e) {
		e.stopPropagation();
		// track start position to decide whether it was a drag or just a tap
		startDownX = e.clientX;
		startDownY = e.clientY;
		movedWhileDown = false;

		// begin grabbing the ball: if not loose, make it loose first
		if (!loose) {
			startLoose();
			// slight delay to ensure startLoose has positioned it
		}

		// if stuck, unstick and let the user immediately take it
		if (stuck) {
			stuck = false;
			stuckSide = null;
			pop.classList.remove('stuck');
		}

		try {
			pop.setPointerCapture(e.pointerId);
		} catch (err) {}
		dragging = true;
		dragPointerId = e.pointerId;
		pop.classList.add('dragging');

		const r = pop.getBoundingClientRect();
		dragOffset.x = e.clientX - r.left;
		dragOffset.y = e.clientY - r.top;

		if (raf) {
			cancelAnimationFrame(raf);
			raf = null;
		}

		// initial last sample
		lastX = e.clientX;
		lastY = e.clientY;
		lastT = performance.now();
		samples = [{t: lastT, x: lastX, y: lastY}];
	}

	function onPointerMove(e) {
		if (!dragging || e.pointerId !== dragPointerId) return;
		e.preventDefault();
		const now = performance.now();
		const dt = Math.max(1, now - lastT);

		// detect movement large enough to be considered a drag
		if (!movedWhileDown) {
			const dx = e.clientX - startDownX;
			const dy = e.clientY - startDownY;
			if (Math.hypot(dx, dy) > 6) movedWhileDown = true;
		}

		// place the pop under the pointer accounting for the initial offset
		pos.x = clamp(e.clientX - dragOffset.x, 0, window.innerWidth - size);
		pos.y = clamp(e.clientY - dragOffset.y, 0, window.innerHeight - size);
		pop.style.left = Math.round(pos.x) + 'px';
		pop.style.top = Math.round(pos.y) + 'px';

		// sample instantaneous velocity (px/ms)
		const vxSample = (e.clientX - lastX) / dt;
		const vySample = (e.clientY - lastY) / dt;
		// store as pixels/ms for final conversion
		lastX = e.clientX;
		lastY = e.clientY;
		lastT = now;
		// push a sample for history and keep buffer short
		samples.push({t: now, x: e.clientX, y: e.clientY});
		if (samples.length > 8) samples.shift();

		// keep a small live visual rotation based on movement
		pop.style.transform = `rotate(${vxSample * 40}deg) scale(1.08)`;
	}

	function onPointerUp(e) {
		if (!dragging || e.pointerId !== dragPointerId) return;
		try {
			pop.releasePointerCapture(e.pointerId);
		} catch (err) {}
		dragging = false;
		pop.classList.remove('dragging');

		const now = performance.now();

		// choose a sample ~60ms before now for a stable velocity
		let ref = null;
		for (let i = samples.length - 1; i >= 0; i--) {
			if (now - samples[i].t >= 60) {
				ref = samples[i];
				break;
			}
		}
		if (!ref && samples.length) ref = samples[0];

		let vxMs = 0,
			vyMs = 0;
		if (ref) {
			const dtRef = Math.max(6, now - ref.t); // ms
			vxMs = (e.clientX - ref.x) / dtRef;
			vyMs = (e.clientY - ref.y) / dtRef;
		} else {
			// fallback to last delta
			const dt = Math.max(1, now - lastT);
			vxMs = (e.clientX - lastX) / dt;
			vyMs = (e.clientY - lastY) / dt;
		}

		// convert px/ms -> px/frame and scale
		const factor = 1000 / 60; // ~16.67
		const throwMult = 1.6;
		vx = vxMs * factor * throwMult;
		vy = vyMs * factor * throwMult;

		// if this interaction included a drag movement, suppress the next click
		if (movedWhileDown) {
			recentPointer = true;
			setTimeout(() => {
				recentPointer = false;
			}, 350);
		}
		movedWhileDown = false;
		samples = []; // clear history

		// resume physics
		if (!raf) animate();
		dragPointerId = null;
	}

	// clicking (non-pointer) toggles like before, but ignore clicks that immediately follow pointer drags
	pop.addEventListener('click', (e) => {
		e.stopPropagation();
		if (recentPointer) {
			recentPointer = false;
			return;
		}
		if (!loose) startLoose();
		else if (stuck) {
			// unstick with a strong push away from the surface
			stuck = false;
			pop.classList.remove('stuck');
			// give an initial kick away from surface
			if (stuckSide === 'left') {
				vx = 6 + Math.random() * 4;
			} else if (stuckSide === 'right') {
				vx = -6 - Math.random() * 4;
			} else if (stuckSide === 'top') {
				vy = 6 + Math.random() * 4;
			} else if (stuckSide === 'bottom') {
				vy = -9 - Math.random() * 4;
			}
			// resume animation
			animate();
		} else {
			stopLoose();
		}
	});

	// pointer events for drag/throw
	pop.addEventListener('pointerdown', onPointerDown);
	pop.addEventListener('pointermove', onPointerMove);
	pop.addEventListener('pointerup', onPointerUp);
	pop.addEventListener('pointercancel', onPointerUp);

	// keep the ball inside if window resized
	window.addEventListener('resize', () => {
		if (!loose) return;
		size = pop.getBoundingClientRect().width || size;
		pos.x = clamp(pos.x, 0, window.innerWidth - size);
		pos.y = clamp(pos.y, 0, window.innerHeight - size);
		pop.style.left = pos.x + 'px';
		pop.style.top = pos.y + 'px';
	});

	pop.addEventListener('dblclick', (e) => {
		e.stopPropagation();
		stopLoose();
	});

	pop.addEventListener('keydown', (e) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (!loose) startLoose();
			else stopLoose();
		}
	});

	if (me) {
		me.addEventListener('pointerdown', (e) => {
			e.stopPropagation();
			if (!me.classList.contains('ball')) return;
			// mark avatar as being grabbed so we avoid picking up the falling pop
			meIsDown = true;
			// remove the ball state immediately so the avatar looks normal
			me.classList.remove('ball');
			try {
				if (audioElement && !audioElement.paused) me.classList.add('rock');
				else me.classList.remove('rock');
			} catch (err) {}

			// Clear any previous scheduler
			if (respawnTimer) {
				clearTimeout(respawnTimer);
				respawnTimer = null;
			}
			respawned = false;

			// Quick scheduled respawn (covers quick taps or no-drag use)
			respawnTimer = setTimeout(() => {
				respawnAtMe();
				respawned = true;
				respawnTimer = null;
			}, 20);

			function finishRespawn() {
				window.removeEventListener('pointerup', finishRespawn);
				window.removeEventListener('pointercancel', finishRespawn);
				if (respawnTimer) {
					clearTimeout(respawnTimer);
					respawnTimer = null;
				}
				// If we already respawned, reposition to the final .me rect and nudge it downward
				if (respawned) {
					const r = me.getBoundingClientRect();
					pop.style.left = Math.round(r.left) + 'px';
					pop.style.top = Math.round(r.top) + 'px';
					pos.x = clamp(r.left, 0, window.innerWidth - size);
					pos.y = clamp(r.top, 0, window.innerHeight - size);
					vy = Math.max(vy, 2);
					loose = true;
					if (!raf) animate();
				} else {
					// otherwise just respawn now
					respawnAtMe();
				}
				// clear grab flag now that pointer is up
				meIsDown = false;
			}
			window.addEventListener('pointerup', finishRespawn);
			window.addEventListener('pointercancel', finishRespawn);
		});

		me.addEventListener('keydown', (e) => {
			if ((e.key === ' ' || e.key === 'Enter') && me.classList.contains('ball')) {
				e.preventDefault();
				me.classList.remove('ball');
				try {
					if (audioElement && !audioElement.paused) me.classList.add('rock');
				} catch (err) {}
				respawnAtMe();
			}
		});
	}

	// --- Idle / sleep behavior ---
	let idleTimer = null;
	const IDLE_MS = 60_000; // 1 minute
	let isSleeping = false;
	let idleCollected = false;

	function startIdleTimer() {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(goToSleep, IDLE_MS);
	}

	function resetIdleTimer() {
		if (idleTimer) clearTimeout(idleTimer);
		// if we are sleeping, wake up immediately
		if (isSleeping) wakeFromSleep();
		startIdleTimer();
	}

	function stopIdleTimer() {
		if (idleTimer) {
			clearTimeout(idleTimer);
			idleTimer = null;
		}
	}

	function goToSleep() {
		if (!me) return;
		// remove visual classes and mark sleeping
		try {
			me.classList.remove('rock');
			me.classList.remove('ball');
			me.classList.remove('dragging');
			me.classList.add('sleep');
		} catch (err) {}
		isSleeping = true;
		if (pop.style.visibility !== 'hidden') {
			hidePopCollected();
			idleCollected = true;
		} else {
			idleCollected = false;
		}
		// longer cooldown while sleeping to avoid accidental pickup
		setCollectionCooldown(1000);
		setNoStick(1000);
	}

	function wakeFromSleep() {
		if (!me) return;
		isSleeping = false;
		try {
			me.classList.remove('sleep');
			// restore rock if audio is playing
			if (audioElement && !audioElement.paused) me.classList.add('rock');
		} catch (err) {}
		// if we hid the pop due to sleeping, respawn it at the avatar
		if (idleCollected) {
			// small delay so layout settles
			setTimeout(() => {
				try {
					setNoStick(400);
				} catch (e) {}
				respawnAtMe();
				idleCollected = false;
			}, 50);
		}
	}

	const activityHandler = (e) => resetIdleTimer();
	document.addEventListener('click', activityHandler, {passive: true});
	document.addEventListener('selectionchange', activityHandler);
	document.addEventListener('scroll', activityHandler, {passive: true});
	document.addEventListener('keydown', activityHandler, {passive: true});
	document.addEventListener('pointerdown', activityHandler, {passive: true});
	document.addEventListener('mousemove', activityHandler, {passive: true});
	document.addEventListener('touchstart', activityHandler, {passive: true});
	window.addEventListener('focus', activityHandler);
	startIdleTimer();
});
