(function () {
	'use strict';
	window.App = window.App || {};

	const chartState = {
		running: false,
		timer: null,
		points: [],
		maxPoints: 60,
		lastRatesFetch: 0,
		lastGoldFetch: 0,
		rates: null,
		goldPerGram: null,
		canvas: null,
		ctx: null,
		els: null,
		selectedCurrency: 'EUR',
	};

	function hexToRgba(hex, alpha) {
		const h = String(hex || '').trim();
		const m = h.match(/^#?([0-9a-f]{6})$/i);
		if (!m) return `rgba(0,0,0,${alpha})`;
		const v = m[1];
		const r = parseInt(v.slice(0, 2), 16);
		const g = parseInt(v.slice(2, 4), 16);
		const b = parseInt(v.slice(4, 6), 16);
		return `rgba(${r},${g},${b},${alpha})`;
	}

	async function fetchRatesLive() {
		// light fetch without local cache; chart handles its own short TTL
		try {
			const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD,BRL,GBP');
			const j = await res.json();
			return j.rates || {};
		} catch (e) {
			return {USD: 1.1, BRL: 5.0, GBP: 0.87};
		}
	}

	async function fetchGoldPerGramLive(rates) {
		try {
			const res = await fetch('https://api.metals.live/v1/spot');
			const j = await res.json();
			const gold = Array.isArray(j) ? j.find((x) => x && /gold/i.test(x.metal)) : null;
			if (gold && gold.price) {
				const usdPerOz = parseFloat(gold.price);
				const r = rates || (await fetchRatesLive());
				const usdPerEur = (r && r.USD) || 1.1; // 1 EUR = usdPerEur USD
				const eurPerOz = usdPerOz / usdPerEur;
				return eurPerOz / 31.1034768;
			}
		} catch (e) {}
		return 60.0;
	}

	async function ensureData(selectedCurrency) {
		const now = Date.now();
		let refreshedRates = false;
		if (!chartState.rates || now - chartState.lastRatesFetch > 30000) {
			chartState.rates = await fetchRatesLive();
			chartState.lastRatesFetch = now;
			refreshedRates = true;
		}
		if (selectedCurrency === 'GOLD') {
			if (!chartState.goldPerGram || refreshedRates || now - chartState.lastGoldFetch > 300000) {
				chartState.goldPerGram = await fetchGoldPerGramLive(chartState.rates);
				chartState.lastGoldFetch = now;
			}
		}
	}

	function resizeToContainer() {
		if (!chartState.canvas || !chartState.ctx) return;
		const rect = chartState.canvas.getBoundingClientRect();
		const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
		const w = Math.max(280, Math.floor(rect.width));
		const h = Math.max(220, Math.floor(Math.min(360, rect.width * 0.5)));
		if (chartState.canvas.width !== w * dpr || chartState.canvas.height !== h * dpr) {
			chartState.canvas.width = w * dpr;
			chartState.canvas.height = h * dpr;
			chartState.canvas.style.height = `${h}px`;
			chartState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
	}

	function draw() {
		if (!chartState.ctx || !chartState.canvas) return;
		resizeToContainer();
		const ctx = chartState.ctx;
		const w = Math.floor(chartState.canvas.width / (window.devicePixelRatio || 1));
		const h = Math.floor(chartState.canvas.height / (window.devicePixelRatio || 1));

		ctx.clearRect(0, 0, w, h);

		const root = getComputedStyle(document.documentElement);
		const accent = root.getPropertyValue('--accent').trim() || '#ff8a5b';
		const text = root.getPropertyValue('--text').trim() || '#42291b';
		const border = root.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.06)';
		const gridColor = border.startsWith('#') ? hexToRgba(border, 0.6) : border;

		const padL = 46;
		const padR = 64;
		const padT = 18;
		const padB = 28;
		const plotW = w - padL - padR;
		const plotH = h - padT - padB;

		const points = chartState.points;
		if (!points.length) {
			ctx.fillStyle = hexToRgba(text, 0.75);
			ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
			ctx.fillText(App.tr('loading'), padL, padT + 14);
			return;
		}

		const y1Vals = points.map((p) => p.eurPerUnit).filter((v) => Number.isFinite(v));
		const y2Vals = points.flatMap((p) => [p.unitPrice, p.avgPrice]).filter((v) => Number.isFinite(v));
		let y1Min = Math.min(...y1Vals);
		let y1Max = Math.max(...y1Vals);
		let y2Min = Math.min(...y2Vals);
		let y2Max = Math.max(...y2Vals);
		// ensure ranges are not degenerate -> add small padding
		const ensureRange = (min, max, padFactor, basePad) => {
			if (min === max) {
				min -= min * padFactor + basePad;
				max += max * padFactor + basePad;
			}
			return [min, max];
		};
		[y1Min, y1Max] = ensureRange(y1Min, y1Max, 0.02, 0.01);
		[y2Min, y2Max] = ensureRange(y2Min, y2Max, 0.05, 0.05);

		const mapX = (i) => padL + (plotW * i) / Math.max(1, points.length - 1);
		const mapY1 = (v) => padT + plotH * (1 - (v - y1Min) / (y1Max - y1Min));
		const mapY2 = (v) => padT + plotH * (1 - (v - y2Min) / (y2Max - y2Min));

		// border + grid
		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, padT);
		ctx.lineTo(padL, padT + plotH);
		ctx.lineTo(padL + plotW, padT + plotH);
		ctx.lineTo(padL + plotW, padT);
		ctx.stroke();
		for (let j = 1; j <= 3; j++) {
			const y = padT + (plotH * j) / 4;
			ctx.beginPath();
			ctx.moveTo(padL, y);
			ctx.lineTo(padL + plotW, y);
			ctx.stroke();
		}

		ctx.fillStyle = hexToRgba(text, 0.85);
		ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
		ctx.fillText(`€/${chartState.selectedCurrency}`, 6, padT + 10);
		ctx.fillText('€/lasanha', w - padR + 8, padT + 10);

		const y1Label = (v) => (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3));
		const y2Label = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2));
		const y1Ticks = [y1Max, (y1Max + y1Min) / 2, y1Min];
		const y2Ticks = [y2Max, (y2Max + y2Min) / 2, y2Min];
		ctx.fillText(y1Label(y1Ticks[0]), 6, padT + 22);
		ctx.fillText(y1Label(y1Ticks[1]), 6, padT + plotH / 2 + 4);
		ctx.fillText(y1Label(y1Ticks[2]), 6, padT + plotH + 4);
		ctx.fillText(y2Label(y2Ticks[0]), w - padR + 8, padT + 22);
		ctx.fillText(y2Label(y2Ticks[1]), w - padR + 8, padT + plotH / 2 + 4);
		ctx.fillText(y2Label(y2Ticks[2]), w - padR + 8, padT + plotH + 4);

		// currency series
		ctx.strokeStyle = accent;
		ctx.lineWidth = 2;
		ctx.setLineDash([]);
		ctx.beginPath();
		points.forEach((p, i) => {
			const x = mapX(i);
			const y = mapY1(p.eurPerUnit);
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();

		// basis series
		ctx.strokeStyle = text;
		ctx.lineWidth = 2;
		ctx.setLineDash([]);
		ctx.beginPath();
		points.forEach((p, i) => {
			const x = mapX(i);
			const y = mapY2(p.unitPrice);
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();

		// avg series
		ctx.strokeStyle = hexToRgba(text, 0.55);
		ctx.lineWidth = 2;
		ctx.setLineDash([6, 4]);
		ctx.beginPath();
		points.forEach((p, i) => {
			const x = mapX(i);
			const y = mapY2(p.avgPrice);
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();
		ctx.setLineDash([]);
	}

	function reset() {
		chartState.points = [];
		draw();
	}

	async function sample(getPrices) {
		if (!chartState.running) return;
		const {unitPrice, avgPrice, basisName} = getPrices();
		const cur = chartState.selectedCurrency;
		await ensureData(cur);

		let eurPerUnit = 1;
		if (cur === 'EUR') eurPerUnit = 1;
		else if (cur === 'GOLD') eurPerUnit = chartState.goldPerGram || 60.0;
		else {
			const r = chartState.rates ? chartState.rates[cur] : null; // 1 EUR = r cur
			eurPerUnit = r ? 1 / r : NaN;
		}

		chartState.points.push({t: Date.now(), eurPerUnit, unitPrice, avgPrice});
		if (chartState.points.length > chartState.maxPoints) {
			chartState.points = chartState.points.slice(chartState.points.length - chartState.maxPoints);
		}

		if (chartState.els) {
			const currencyDigits = cur === 'GOLD' ? 2 : 4;
			chartState.els.statCurrency.textContent = App.format(App.tr('chartCurrencyFmt'), {
				cur: cur === 'GOLD' ? 'g' : cur,
				eur: eurPerUnit.toFixed(currencyDigits),
			});
			chartState.els.statBasis.textContent = App.format(App.tr('chartBasisFmt'), {
				basis: basisName,
				price: unitPrice.toFixed(2),
			});
			chartState.els.statAvg.textContent = App.format(App.tr('chartAvgFmt'), {price: avgPrice.toFixed(2)});
		}

		draw();
	}

	function start(getPrices) {
		if (chartState.running) return;
		chartState.running = true;
		const tick = async () => {
			if (!chartState.running) return;
			try {
				await sample(getPrices);
			} finally {
				chartState.timer = setTimeout(tick, 5000);
			}
		};
		tick();
	}

	function stop() {
		chartState.running = false;
		if (chartState.timer) {
			clearTimeout(chartState.timer);
			chartState.timer = null;
		}
	}

	function init({canvas, statCurrency, statBasis, statAvg, selectedCurrency}) {
		if (!canvas || !canvas.getContext) return;
		chartState.canvas = canvas;
		chartState.ctx = canvas.getContext('2d');
		chartState.els = {statCurrency, statBasis, statAvg};
		chartState.selectedCurrency = selectedCurrency || 'EUR';
		window.addEventListener('resize', () => draw());
		draw();
	}

	function setCurrency(cur) {
		chartState.selectedCurrency = cur;
	}

	App.chart = {init, start, stop, reset, setCurrency, _state: chartState};
})();
