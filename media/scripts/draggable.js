// Simple, draggable behavior for the `.me` element.
// - Uses Pointer Events (works with mouse & touch)
// - Adds keyboard support (arrow keys to nudge, Shift for larger steps)
// - Constrains movement inside the viewport
// - bounces, shakes, and falls when hitting edges based on drag velocity
// - Uses CSS classes to trigger different visual states (defined in MeDummy.css)

(function () {
	function clamp(v, a, b) {
		return Math.min(b, Math.max(a, v));
	}

	document.addEventListener('DOMContentLoaded', () => {
		const el = document.querySelector('.me');
		if (!el) return;

		// ? element is focusable/accessible
		if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
		if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
		if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Draggable avatar');
		el.setAttribute('aria-grabbed', 'false');

		// ! makes sure there's an initial left/top -> can set pixels relative to a scroll container
		const rect = el.getBoundingClientRect();
		const scroller = el.closest('.left-cont') || document.documentElement;
		const scrollerRect = scroller.getBoundingClientRect();
		// visual coordinates inside scroller's content (accounts for scroll position)
		let visualLeft = rect.left - scrollerRect.left + (scroller.scrollLeft || 0) || 20;
		let visualTop = rect.top - scrollerRect.top + (scroller.scrollTop || 0) || 20;
		// position element relative to scroller viewport so it will appear at the right spot
		el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
		el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';

		let dragging = false;
		let startX = 0;
		let startY = -50;
		let startTime = 0;
		let lastX = 0;
		let lastTime = 0;
		let originVisualLeft = 0;
		let originVisualTop = 0;
		let currentDirection = null; // 'left' or 'right'
		let currentForce = null; // 'normal' or 'strong'
		let isWalled = false;
		const STRONG_VELOCITY_THRESHOLD = 0.3; // pixels per millisecond
		const WALL_COLLISION_DISTANCE = 20; // pixels from edge

		function shakeScreen() {
			document.body.classList.add('shake');
			setTimeout(() => {
				document.body.classList.remove('shake');
			}, 300);
		}

		function hitWall(direction) {
			if (isWalled) return;
			isWalled = true;
			dragging = false;

			// screen shake on impact
			shakeScreen();

			// ! check if it was a strong hit
			const isStrongHit = currentForce === 'strong';

			// show walled state
			el.classList.remove('dragging');
			el.classList.remove(`drag-normal-left`);
			el.classList.remove(`drag-normal-right`);
			el.classList.remove(`drag-strong-left`);
			el.classList.remove(`drag-strong-right`);

			if (isStrongHit) {
				// bounce animation for strong hits
				el.classList.add(`bounced-${direction}`);
				el.classList.add('bouncing');

				// after bounce and fall, add falling class for mid-air effect
				setTimeout(() => {
					el.classList.add('falling-impact');
				}, 400);

				// return to idle after full sequence
				setTimeout(() => {
					el.classList.remove(`bounced-${direction}`);
					el.classList.remove('bouncing');
					el.classList.remove('falling-impact');
					visualLeft = originVisualLeft;
					visualTop = originVisualTop;
					el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
					el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
					isWalled = false;
				}, 1800);
			} else {
				// slide animation for normal hits
				el.classList.add(`walled-${direction}`);

				// after wall slide and pop, return to idle
				setTimeout(() => {
					el.classList.remove(`walled-${direction}`);
					visualLeft = originVisualLeft;
					visualTop = originVisualTop;
					el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
					el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
					isWalled = false;
				}, 2800);
			}
		}

		function updateDragState(dx, dt) {
			// calculate velocity (pixels per millisecond)
			const velocity = dt > 0 ? Math.abs(dx) / dt : 0;

			// determine direction
			const newDirection = dx < -5 ? 'left' : dx > 5 ? 'right' : null;

			// determine force
			const newForce = velocity > STRONG_VELOCITY_THRESHOLD ? 'strong' : 'normal';

			// ! if direction changed
			if (newDirection !== currentDirection) {
				if (currentDirection) {
					// had a direction, now losing it (entering deadzone)
					el.classList.remove(`drag-${currentForce}-${currentDirection}`);
					if (!newDirection) {
						// still holding, but slow/stopped - show idle direction state
						el.classList.add(`drag-normal-${currentDirection}`);
					}
				} else if (newDirection) {
					// just got a direction for first time - remove dragging class
					el.classList.remove('dragging');
				}
				currentDirection = newDirection;
				currentForce = null; // reset force when direction changes
			}

			// update force if we have a direction and force changed
			if (currentDirection && newForce !== currentForce) {
				if (currentForce) {
					el.classList.remove(`drag-${currentForce}-${currentDirection}`);
				}
				currentForce = newForce;
				el.classList.add(`drag-${currentForce}-${currentDirection}`);
			} else if (currentDirection && !currentForce) {
				// First time setting force for this direction
				currentForce = newForce;
				el.classList.add(`drag-${currentForce}-${currentDirection}`);
			}
		}

		function onPointerDown(e) {
			// only respond to primary button
			if (e.button && e.button !== 0) return;
			el.setPointerCapture && el.setPointerCapture(e.pointerId);
			dragging = true;
			startX = e.clientX;
			startY = e.clientY;
			startTime = performance.now();
			lastX = startX;
			lastTime = startTime;
			// store visual origin (inside scroller content coordinates)
			originVisualLeft = visualLeft;
			originVisualTop = visualTop;
			el.classList.add('dragging');
			el.setAttribute('aria-grabbed', 'true');
			e.preventDefault();
		}

		function onPointerMove(e) {
			if (!dragging || isWalled) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			const now = performance.now();
			const dt = now - lastTime;
			const dxSinceLast = e.clientX - lastX;

			// update drag direction and force
			updateDragState(dxSinceLast, dt);

			lastX = e.clientX;
			lastTime = now;

			// work in visual content coordinates so position follows scrolling
			const maxLeft = Math.max(0, (scroller.scrollWidth || scroller.clientWidth) - el.offsetWidth);
			const maxTop = Math.max(0, (scroller.scrollHeight || scroller.clientHeight) - el.offsetHeight);
			const newVisualLeft = clamp(originVisualLeft + dx, 0, maxLeft);
			const newVisualTop = clamp(originVisualTop + dy, 0, maxTop);
			visualLeft = newVisualLeft;
			visualTop = newVisualTop;
			// place element relative to scroller's viewport (subtract scroll)
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';

			// check for wall collision
			if (visualLeft <= WALL_COLLISION_DISTANCE) {
				hitWall('left');
			} else if (visualLeft >= maxLeft - WALL_COLLISION_DISTANCE) {
				hitWall('right');
			}
		}

		function endDrag(e) {
			if (!dragging) return;
			dragging = false;
			try {
				el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
			} catch (err) {}
			el.classList.remove('dragging');
			// clean all drag direction/force classes
			el.classList.remove(`drag-normal-left`);
			el.classList.remove(`drag-normal-right`);
			el.classList.remove(`drag-strong-left`);
			el.classList.remove(`drag-strong-right`);
			if (currentDirection && currentForce) {
				el.classList.remove(`drag-${currentForce}-${currentDirection}`);
			}
			currentDirection = null;
			currentForce = null;
			el.setAttribute('aria-grabbed', 'false');

			// add falling effect on release
			el.classList.add('falling');
			setTimeout(() => {
				el.classList.remove('falling');
			}, 400);
		}

		// update display when scroller moves so the element appears to scroll with content
		scroller.addEventListener('scroll', () => {
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
		});

		function onKeyDown(e) {
			const step = e.shiftKey ? 20 : 5;
			const rect = el.getBoundingClientRect();
			// operate on visual coordinates inside scroller
			let left = visualLeft;
			let top = visualTop;
			if (e.key === 'ArrowLeft') {
				left -= step;
			} else if (e.key === 'ArrowRight') {
				left += step;
			} else if (e.key === 'ArrowUp') {
				top -= step;
			} else if (e.key === 'ArrowDown') {
				top += step;
			} else if (e.key === 'Home') {
				left = 0;
				top = 0;
			} else if (e.key === 'End') {
				const maxLeft = Math.max(0, (scroller.scrollWidth || scroller.clientWidth) - rect.width);
				const maxTop = Math.max(0, (scroller.scrollHeight || scroller.clientHeight) - rect.height);
				left = maxLeft;
				top = maxTop;
			} else return;
			e.preventDefault();
			const maxLeft = Math.max(0, (scroller.scrollWidth || scroller.clientWidth) - rect.width);
			const maxTop = Math.max(0, (scroller.scrollHeight || scroller.clientHeight) - rect.height);
			left = clamp(left, 0, maxLeft);
			top = clamp(top, 0, maxTop);
			visualLeft = left;
			visualTop = top;
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
		}

		el.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);

		el.addEventListener('keydown', onKeyDown);
		el.addEventListener('dblclick', () => {
			visualLeft = 10;
			visualTop = 30;
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
		});
	});
})();
