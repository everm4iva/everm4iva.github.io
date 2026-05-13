(function () {
	'use strict';
	window.App = window.App || {};

	const prefix = `lasanha_v${App.VERSION || '1'}_`;

	// small localStorage cache with TTL (hours).
	App.cache = {
		get(key) {
			try {
				const raw = localStorage.getItem(prefix + key) || 'null';
				const obj = JSON.parse(raw);
				if (!obj) return null;
				if (Date.now() > obj.expires) {
					localStorage.removeItem(prefix + key);
					return null;
				}
				return obj.v;
			} catch (err) {
				return null;
			}
		},
		set(key, value, hrs = 12) {
			const payload = {v: value, expires: Date.now() + hrs * 3600 * 1000};
			try {
				localStorage.setItem(prefix + key, JSON.stringify(payload));
			} catch (err) {
				// ignore quota errors
			}
		},
		remove(key) {
			try {
				localStorage.removeItem(prefix + key);
			} catch (err) {}
		},
		clearAll() {
			// only clear keys for this version/prefix.
			try {
				for (let i = localStorage.length - 1; i >= 0; i--) {
					const k = localStorage.key(i);
					if (k && k.startsWith(prefix)) localStorage.removeItem(k);
				}
			} catch (err) {}
		},
	};
})();
