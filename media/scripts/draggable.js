// Simple, accessible draggable behavior for the `.me` element.
// - Uses Pointer Events (works with mouse & touch)
// - Adds keyboard support (arrow keys to nudge, Shift for larger steps)
// - Constrains movement inside the viewport

(function () {
	function clamp(v, a, b) {
		return Math.min(b, Math.max(a, v));
	}

	document.addEventListener('DOMContentLoaded', () => {
		const el = document.querySelector('.me');
		if (!el) return;

		// Ensure element is focusable/accessible
		if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
		if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
		if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Draggable avatar');
		el.setAttribute('aria-grabbed', 'false');

		// Make sure there's an initial left/top so we can set pixels relative to a scroll container
		const rect = el.getBoundingClientRect();
		const scroller = el.closest('.left-cont') || document.documentElement;
		const scrollerRect = scroller.getBoundingClientRect();
		// Visual coordinates inside scroller's content (accounts for scroll position)
		let visualLeft = rect.left - scrollerRect.left + (scroller.scrollLeft || 0) || 20;
		let visualTop = rect.top - scrollerRect.top + (scroller.scrollTop || 0) || 20;
		// Position element relative to scroller viewport so it will appear at the right spot
		el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
		el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';

		let dragging = false;
		let startX = 0;
		let startY = 0;
		let originVisualLeft = 0;
		let originVisualTop = 0;

		function onPointerDown(e) {
			// Only respond to primary button
			if (e.button && e.button !== 0) return;
			el.setPointerCapture && el.setPointerCapture(e.pointerId);
			dragging = true;
			startX = e.clientX;
			startY = e.clientY;
			// store visual origin (inside scroller content coordinates)
			originVisualLeft = visualLeft;
			originVisualTop = visualTop;
			el.classList.add('dragging');
			el.setAttribute('aria-grabbed', 'true');
			e.preventDefault();
		}

		function onPointerMove(e) {
			if (!dragging) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			// Work in visual content coordinates so position follows scrolling
			const maxLeft = Math.max(0, (scroller.scrollWidth || scroller.clientWidth) - el.offsetWidth);
			const maxTop = Math.max(0, (scroller.scrollHeight || scroller.clientHeight) - el.offsetHeight);
			const newVisualLeft = clamp(originVisualLeft + dx, 0, maxLeft);
			const newVisualTop = clamp(originVisualTop + dy, 0, maxTop);
			visualLeft = newVisualLeft;
			visualTop = newVisualTop;
			// place element relative to scroller's viewport (subtract scroll)
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
		}

		function endDrag(e) {
			if (!dragging) return;
			dragging = false;
			try {
				el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
			} catch (err) {}
			el.classList.remove('dragging');
			el.setAttribute('aria-grabbed', 'false');
		}

		// Update display when scroller moves so the element appears to scroll with content
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
			visualTop = 10;
			el.style.left = visualLeft - (scroller.scrollLeft || 0) + 'px';
			el.style.top = visualTop - (scroller.scrollTop || 0) + 'px';
		});
	});
})();
