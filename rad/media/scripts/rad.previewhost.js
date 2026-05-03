/**
 * ☆=========================================☆
 * rad.previewhost.js - floating preview window
 * ☆=========================================☆
 */

const q = (id) => document.getElementById(id);

export const bind_previewhost = () => {
	return {
		host: q('fxPreviewHost'),
		bar: q('fxPreviewBar'),
		title: q('fxPreviewTitle'),
		max: q('fxPreviewMax'),
		hide: q('fxPreviewHide'),
		frame: q('fxPreviewFrame'),
	};
};

export const preview_set = (ph, data) => {
	if (!ph?.host || !ph?.frame) return;
	const src = data?.src;
	if (!src) return;

	const title = data?.title ?? 'preview';
	const meta = data?.meta ?? '';

	if (ph.title) ph.title.textContent = title;
	const url = new URL('./preview.html', window.location.href);
	url.searchParams.set('src', src);
	url.searchParams.set('title', title);
	if (meta) url.searchParams.set('meta', meta);
	ph.frame.src = url.toString();
	ph.host.classList.remove('hidden');
	ph.host.classList.remove('is-min');
	ph.hide && (ph.hide.textContent = 'hide');
};

export const preview_hide = (ph) => {
	ph?.host?.classList.add('hidden');
};

export const preview_toggle_min = (ph) => {
	if (!ph?.host) return;
	ph.host.classList.remove('is-max');
	if (ph.max) ph.max.textContent = 'max';
	const on = ph.host.classList.toggle('is-min');
	if (ph.hide) ph.hide.textContent = on ? 'show' : 'hide';
};

export const preview_toggle_max = (ph, restore) => {
	if (!ph?.host) return restore;

	if (!ph.host.classList.contains('is-max')) {
		const next_restore = {
			left: ph.host.style.left,
			top: ph.host.style.top,
			right: ph.host.style.right,
			bottom: ph.host.style.bottom,
			width: ph.host.style.width,
			height: ph.host.style.height,
		};

		ph.host.classList.remove('is-min');
		if (ph.hide) ph.hide.textContent = 'hide';
		ph.host.classList.add('is-max');
		if (ph.max) ph.max.textContent = 'restore';

		ph.host.style.left = '';
		ph.host.style.top = '';
		ph.host.style.right = '';
		ph.host.style.bottom = '';
		ph.host.style.width = '';
		ph.host.style.height = '';
		return next_restore;
	}

	ph.host.classList.remove('is-max');
	if (ph.max) ph.max.textContent = 'max';
	if (restore) {
		ph.host.style.left = restore.left;
		ph.host.style.top = restore.top;
		ph.host.style.right = restore.right;
		ph.host.style.bottom = restore.bottom;
		ph.host.style.width = restore.width;
		ph.host.style.height = restore.height;
	}
	return restore;
};

export const preview_init_drag = (ph) => {
	if (!ph?.host || !ph?.bar) return;

	let drag = null;
	let restore = null;

	ph.bar.addEventListener('pointerdown', (ev) => {
		if (ev.button !== 0) return;
		if (ph.host.classList.contains('is-max')) return;
		if (ev.target && ev.target.closest && ev.target.closest('button, a, input, textarea, select')) return;
		const r = ph.host.getBoundingClientRect();
		drag = {id: ev.pointerId, dx: ev.clientX - r.left, dy: ev.clientY - r.top};

		ph.host.style.right = 'auto';
		ph.host.style.bottom = 'auto';
		ph.host.style.left = `${r.left}px`;
		ph.host.style.top = `${r.top}px`;
		ph.bar.setPointerCapture(ev.pointerId);
	});

	ph.bar.addEventListener('pointermove', (ev) => {
		if (!drag || ev.pointerId !== drag.id) return;
		const x = Math.max(8, ev.clientX - drag.dx);
		const y = Math.max(8, ev.clientY - drag.dy);
		ph.host.style.left = `${x}px`;
		ph.host.style.top = `${y}px`;
	});

	const stop = (ev) => {
		if (!drag || ev.pointerId !== drag.id) return;
		drag = null;
		try {
			ph.bar.releasePointerCapture(ev.pointerId);
		} catch {}
	};

	ph.bar.addEventListener('pointerup', stop);
	ph.bar.addEventListener('pointercancel', stop);

	ph.hide?.addEventListener('click', (ev) => {
		ev.preventDefault();
		preview_toggle_min(ph);
	});

	ph.max?.addEventListener('click', (ev) => {
		ev.preventDefault();
		restore = preview_toggle_max(ph, restore);
	});
};
