(function () {
	'use strict';
	window.App = window.App || {};

	// simple stable hash -> used to cache parsed data keyed by file contents
	App.hashString = function hashString(str) {
		// FNV-1a 32-bit
		let h = 0x811c9dc5;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
		}
		return ('00000000' + h.toString(16)).slice(-8);
	};

	// parse the local lasanha data file -> returns array of items {price, weight (g), perKg, desc, source}
	App.parseLasanha = function parseLasanha(raw) {
		const lines = String(raw || '')
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter(Boolean);
		const result = [];
		let currentSection = '';

		// each line looks like: - 2,50 € 400 g (Brand) description
		const itemRe = /-\s*([\d.,]+)\s*€\s*([\d.,]+)\s*(kg|g|gr)?\s*(?:\(([^)]+)\))?\s*(.*)?$/i;

		for (const line of lines) {
			if (/^\[.+\]$/.test(line)) {
				currentSection = line.replace(/^\[|\]$/g, '').trim();
				continue;
			}
			const m = line.match(itemRe);
			if (!m) continue;
			const rawPrice = m[1];
			const rawWeight = m[2];
			const unit = (m[3] || 'g').toLowerCase();
			const note = (m[4] || '').trim();
			const tailDesc = (m[5] || '').trim();

			const price = parseFloat(rawPrice.replace(',', '.')) || 0;
			let weight = parseFloat(rawWeight.replace(',', '.')) || 0;
			if (unit.startsWith('kg')) weight = weight * 1000;

			const desc = (note || tailDesc).trim();
			const perKg = weight > 0 ? (price / weight) * 1000 : 0;

			result.push({price, weight, perKg, desc, source: currentSection});
		}

		return result;
	};

	// light fetch + local cache wrapper
	App.fetchText = async function fetchText(url) {
		const cached = App.cache.get(url);
		if (cached) return cached;
		const res = await fetch(url);
		const text = await res.text();
		App.cache.set(url, text, 24); // cache raw file for 24 hours
		return text;
	};

	// fetch currency rates (EUR base) -> cached for 12h
	App.fetchRates = async function fetchRates() {
		const key = 'rates_v1';
		const cached = App.cache.get(key);
		if (cached) return cached;
		try {
			const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD,BRL,GBP');
			const json = await res.json();
			const rates = json.rates || {};
			App.cache.set(key, rates, 12);
			return rates;
		} catch (err) {
			// fallback values when offline or API fails
			return {USD: 1.1, BRL: 5.0, GBP: 0.87};
		}
	};

	// fetch gold price and convert -> EUR per gram. Cached for a few hours.
	App.fetchGoldPerGram = async function fetchGoldPerGram() {
		const key = 'gold_v1';
		const cached = App.cache.get(key);
		if (cached) return cached;
		try {
			const res = await fetch('https://api.metals.live/v1/spot');
			const json = await res.json();
			const gold = Array.isArray(json) ? json.find((x) => x && /gold/i.test(x.metal)) : null;
			if (gold && gold.price) {
				const usdPerOz = parseFloat(gold.price) || 0;
				const rates = await App.fetchRates();
				const usdPerEur = rates.USD || 1.1;
				const eurPerOz = usdPerOz / usdPerEur;
				const eurPerGram = eurPerOz / 31.1034768;
				App.cache.set(key, eurPerGram, 6);
				return eurPerGram;
			}
		} catch (err) {
			// ignore and fallback
		}
		const fallback = 60.0; // conservative fallback
		App.cache.set(key, fallback, 24);
		return fallback;
	};

	// reads and parses local lasanha dataset -> cached by file hash for longer (7 days)
	App.fetchLasanhaData = async function fetchLasanhaData() {
		const url = './data/lasanha.txt';
		const raw = await App.fetchText(url);
		const hash = App.hashString(raw || '');
		const parsedKey = `lasanha_parsed_${hash}`;
		const cachedParsed = App.cache.get(parsedKey);
		if (cachedParsed && Array.isArray(cachedParsed)) return cachedParsed;
		const items = App.parseLasanha(raw);
		App.cache.set(parsedKey, items, 24 * 7);
		return items;
	};
})();
