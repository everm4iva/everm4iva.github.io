(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', init);

	function pluralize(count, one, many) {
		return count === 1 ? one : many;
	}

	function updateSeeMoreLabel() {
		const appEl = document.querySelector('.app');
		const btn = App.state.seeMoreBtnRef || document.querySelector('.see-more');
		if (!appEl || !btn) return;
		btn.textContent = appEl.classList.contains('details-expanded') ? App.tr('hideDetails') : App.tr('seeMore');
	}
	App.updateSeeMoreLabel = updateSeeMoreLabel;

	function renderItems(items, el) {
		el.innerHTML = '';
		items.forEach((it) => {
			const li = document.createElement('li');
			li.className = 'item';
			li.innerHTML = `<strong>€${it.price.toFixed(2)}</strong> <small>${it.weight} g</small><div>€${it.perKg.toFixed(
				2,
			)} / kg</div>`;
			el.appendChild(li);
		});
	}

	function renderGroups(groups, el) {
		el.innerHTML = '';
		Object.keys(groups)
			.sort((a, b) => parseInt(a) - parseInt(b))
			.forEach((k) => {
				const g = groups[k];
				const itemWord =
					App.state.currentLang === 'pt'
						? pluralize(g.count, 'item', 'itens')
						: pluralize(g.count, 'item', 'items');
				const li = document.createElement('li');
				li.className = 'item';
				li.innerHTML = `<strong>${k} g — ${g.count} ${itemWord}</strong><div>${App.tr(
					'avgWord',
				)} €${g.avgPrice.toFixed(2)} · €${g.avgPerKg.toFixed(2)}/kg</div>`;
				el.appendChild(li);
			});
	}

	function renderView(compact, groups, items, el) {
		if (compact) renderGroups(groups, el);
		else renderItems(items, el);
	}

	function groupByRounded(items, step = 50) {
		const out = {};
		items.forEach((it) => {
			const k = String(Math.round(it.weight / step) * step);
			if (!out[k]) out[k] = {count: 0, sumPrice: 0, sumPerKg: 0};
			out[k].count++;
			out[k].sumPrice += it.price;
			out[k].sumPerKg += it.perKg;
		});
		Object.keys(out).forEach((k) => {
			out[k].avgPrice = out[k].sumPrice / out[k].count;
			out[k].avgPerKg = out[k].sumPerKg / out[k].count;
		});
		return out;
	}

	function loadSettings() {
		try {
			return JSON.parse(localStorage.getItem('lasanha_settings') || '{}');
		} catch (e) {
			return {};
		}
	}
	function saveSettings(s) {
		localStorage.setItem('lasanha_settings', JSON.stringify(s));
	}

	function renderSummaryCard(d) {
		const br = document.getElementById('bigResult');
		const bs = document.getElementById('bigSub');
		if (!br || !bs) return;
		br.textContent = `—`;
		bs.textContent = `${App.tr('avgPkg')} €${d.avgPackagePrice.toFixed(2)} · ${App.tr('avgPerKg')} €${d.avgPerKg.toFixed(
			2,
		)}/kg`;
	}

	function renderDetails(obj) {
		const el = document.getElementById('details');
		if (!el) return;
		el.innerHTML = '';
		const push = (title, text) => {
			const li = document.createElement('li');
			li.className = 'item';
			li.innerHTML = `<strong>${title}</strong><div>${text}</div>`;
			el.appendChild(li);
		};
		if (obj.bestItem)
			push(
				App.tr('details_bestPrice'),
				`€${obj.bestItem.price.toFixed(2)} — ${obj.bestItem.weight} g · €${obj.bestItem.perKg.toFixed(2)}/kg · ${
					obj.bestItem.desc || ''
				} · ${obj.bestItem.source || ''}`,
			);
		if (obj.worstItem)
			push(
				App.tr('details_worstPrice'),
				`€${obj.worstItem.price.toFixed(2)} — ${obj.worstItem.weight} g · €${obj.worstItem.perKg.toFixed(2)}/kg · ${
					obj.worstItem.desc || ''
				} · ${obj.worstItem.source || ''}`,
			);
		if (obj.bestQuality)
			push(
				App.tr('details_bestQuality'),
				`${obj.bestQuality.weight} g · €${obj.bestQuality.price.toFixed(2)} · ${obj.bestQuality.desc || ''}`,
			);
		if (obj.marketStats && obj.marketStats.length)
			push(
				App.tr('details_markets'),
				obj.marketStats
					.map((m) => {
						const itemWord =
							App.state.currentLang === 'pt'
								? pluralize(m.count, 'item', 'itens')
								: pluralize(m.count, 'item', 'items');
						const avgText = m.avgPerKgDisplay ? m.avgPerKgDisplay : `€${m.avgPerKg.toFixed(2)}`;
						return `${m.name}: ${m.count} ${itemWord} · ${App.tr('avgWord')} ${avgText}/kg`;
					})
					.join('<br>'),
			);
		if (obj.eurAmount)
			push(
				App.tr('details_byWeight'),
				App.format(App.tr('byWeightText'), {
					g: Math.round(obj.kg * 1000),
					kg: obj.kg.toFixed(3),
					eur: obj.displayAmount || (obj.eurAmount ? `€${obj.eurAmount.toFixed(2)}` : ''),
				}),
			);
	}

	async function init() {
		const elAmount = document.getElementById('amount');
		const elCurrency = document.getElementById('currency');
		const btn = document.getElementById('calc');
		const results = document.getElementById('results');
		const itemsList = document.getElementById('items');
		const summary = document.getElementById('summary');
		const tabResults = document.getElementById('tabResults');
		const tabSettings = document.getElementById('tabSettings');
		const tabManual = document.getElementById('tabManual');
		const tabChart = document.getElementById('tabChart');
		const tabAbout = document.getElementById('tabAbout');
		const resultsTab = document.getElementById('resultsTab');
		const settingsTab = document.getElementById('settingsTab');
		const manualTab = document.getElementById('manualTab');
		const chartTab = document.getElementById('chartTab');
		const aboutTab = document.getElementById('aboutTab');
		const chartCanvas = document.getElementById('chartCanvas');
		const chartStatCurrency = document.getElementById('chartStatCurrency');
		const chartStatBasis = document.getElementById('chartStatBasis');
		const chartStatAvg = document.getElementById('chartStatAvg');

		const langSel = document.getElementById('lang');
		const defaultViewSel = document.getElementById('defaultView');
		const groupStepSel = document.getElementById('groupStep');
		const saveSettingsBtn = document.getElementById('saveSettings');
		const resetSettingsBtn = document.getElementById('resetSettings');
		const compactToggle = document.getElementById('compact');

		const settings = loadSettings();
		App.state.currentLang = settings.lang || 'en';

		const inputModeSel = document.getElementById('inputMode');
		const basisSelectEl = document.getElementById('basisSelect');
		const bigResult = document.getElementById('bigResult');
		const bigSub = document.getElementById('bigSub');

		// rates may be fetched asynchronously; declare early to avoid TDZ when passed around
		let rates = null;

		const items = await App.fetchLasanhaData();
		if (!items || items.length === 0) {
			if (results) results.querySelector('#summary').textContent = App.tr('errorNoData') || 'No data available';
			return;
		}
		// fetch rates and setup gold fallback early so helper functions can use them
		const FALLBACK_RATES = {USD: 1.1, BRL: 5.0, GBP: 0.87};
		rates = (await App.fetchRates().catch(() => FALLBACK_RATES)) || FALLBACK_RATES;
		const DEFAULT_GOLD_PER_GRAM = 128.82;
		let goldPerGram = null;
		const avgPerKg = items.reduce((s, i) => s + i.perKg, 0) / Math.max(items.length, 1);
		let avgPackagePrice = items.reduce((s, i) => s + i.price, 0) / Math.max(items.length, 1);
		if (!avgPackagePrice || avgPackagePrice <= 0) avgPackagePrice = (items[0] && items[0].price) || 1;

		const weights = items.map((i) => i.weight).sort((a, b) => a - b);
		const avgWeight = weights.reduce((s, w) => s + w, 0) / Math.max(weights.length, 1);
		const medianWeight = weights.length ? weights[Math.floor(weights.length / 2)] : 0;
		const rounded = items.map((i) => Math.round(i.weight / 50) * 50);
		const mode = rounded
			.sort((a, b) => rounded.filter((v) => v === a).length - rounded.filter((v) => v === b).length)
			.pop();

		langSel.value = settings.lang || 'en';
		defaultViewSel.value = settings.defaultView || 'compact';
		groupStepSel.value = String(settings.groupStep || 50);
		compactToggle.checked = settings.defaultView === 'compact';

		App.applyTranslations(settings.lang || 'en', {avgPerKg, avgWeight, medianWeight, mode});

		const groups = groupByRounded(items, settings.groupStep || 50);

		// Localized render helpers that use selected currency conversion
		function renderItemsLocalized(itemsArr, el) {
			el.innerHTML = '';
			const cur = elCurrency.value;
			itemsArr.forEach((it) => {
				const priceText = formatAmountForDisplay(it.price, cur, rates).text;
				const perKgText = formatAmountForDisplay(it.perKg, cur, rates).text + ' / kg';
				const li = document.createElement('li');
				li.className = 'item';
				li.innerHTML = `<strong>${priceText}</strong> <small>${it.weight} g</small><div>${perKgText}</div>`;
				el.appendChild(li);
			});
		}

		function renderGroupsLocalized(groupsObj, el) {
			el.innerHTML = '';
			const cur = elCurrency.value;
			Object.keys(groupsObj)
				.sort((a, b) => parseInt(a) - parseInt(b))
				.forEach((k) => {
					const g = groupsObj[k];
					const itemWord =
						App.state.currentLang === 'pt'
							? pluralize(g.count, 'item', 'itens')
							: pluralize(g.count, 'item', 'items');
					const avgPriceText = formatAmountForDisplay(g.avgPrice, cur, rates).text;
					const avgPerKgText = formatAmountForDisplay(g.avgPerKg, cur, rates).text + '/kg';
					const li = document.createElement('li');
					li.className = 'item';
					li.innerHTML = `<strong>${k} g — ${g.count} ${itemWord}</strong><div>${App.tr('avgWord')} ${avgPriceText} · ${avgPerKgText}</div>`;
					el.appendChild(li);
				});
		}

		function renderSummaryCardLocalized(avgPkg, avgKg, avgWeightVal) {
			const br = document.getElementById('bigResult');
			const bs = document.getElementById('bigSub');
			if (!br || !bs) return;
			br.textContent = `—`;
			const cur = elCurrency.value;
			const pkgText = formatAmountForDisplay(avgPkg, cur, rates).text;
			const perKgText = formatAmountForDisplay(avgKg, cur, rates).text + '/kg';
			bs.textContent = `${App.tr('avgPkg')} ${pkgText} · ${App.tr('avgPerKg')} ${perKgText}`;
		}

		renderViewLocalized(compactToggle.checked, groups, items, itemsList);

		function renderViewLocalized(compact, groupsObj, itemsArr, el) {
			if (compact) renderGroupsLocalized(groupsObj, el);
			else renderItemsLocalized(itemsArr, el);
		}

		compactToggle.addEventListener('change', () =>
			renderViewLocalized(
				compactToggle.checked,
				groupByRounded(items, parseInt(groupStepSel.value, 10) || 50),
				items,
				itemsList,
			),
		);

		// see more toggle
		const appEl = document.querySelector('.app');
		if (appEl) appEl.classList.add('details-collapsed');
		const seeMoreBtn = document.createElement('button');
		seeMoreBtn.className = 'see-more';
		App.state.seeMoreBtnRef = seeMoreBtn;
		seeMoreBtn.textContent = App.tr('seeMore');
		seeMoreBtn.addEventListener('click', () => {
			if (appEl.classList.contains('details-expanded')) {
				appEl.classList.remove('details-expanded');
				appEl.classList.add('details-collapsed');
				updateSeeMoreLabel();
			} else {
				appEl.classList.remove('details-collapsed');
				appEl.classList.add('details-expanded');
				updateSeeMoreLabel();
			}
		});
		const rc = document.getElementById('resultCard');
		if (rc) rc.appendChild(seeMoreBtn);

		// swap button
		const swapBtn = document.getElementById('swapMode');
		if (swapBtn) {
			swapBtn.addEventListener('click', () => {
				const m = inputModeSel.value;
				inputModeSel.value = m === 'currency' ? 'lasagna' : 'currency';
				document.getElementById('amount').focus();
			});
		}

		const bestItem = items.length ? items.reduce((a, b) => (a.perKg < b.perKg ? a : b)) : null;
		const cheapestPackageItem = items.length ? items.reduce((a, b) => (a.price < b.price ? a : b)) : null;
		const worstItem = items.length ? items.reduce((a, b) => (a.perKg > b.perKg ? a : b)) : null;
		const bestQuality = items.length ? items.reduce((a, b) => (a.weight > b.weight ? a : b)) : null;

		const market = {};
		items.forEach((it) => {
			if (!it.source) it.source = 'unknown';
			if (!market[it.source]) market[it.source] = {count: 0, sumPerKg: 0};
			market[it.source].count++;
			market[it.source].sumPerKg += it.perKg;
		});
		const marketStats = Object.keys(market).map((k) => ({
			name: k,
			count: market[k].count,
			avgPerKg: market[k].sumPerKg / market[k].count,
		}));

		const marketStatsDisplay = marketStats.map((m) => ({
			...m,
			avgPerKgDisplay: formatAmountForDisplay(m.avgPerKg, elCurrency.value, rates).text,
		}));

		renderSummaryCardLocalized(avgPackagePrice, avgPerKg, avgWeight);
		renderDetails({bestItem, worstItem, bestQuality, marketStats: marketStatsDisplay});

		// tabs
		const showTab = (which) => {
			const isResults = which === 'results';
			const isSettings = which === 'settings';
			const isManual = which === 'manual';
			const isChart = which === 'chart';
			const isAbout = which === 'about';

			tabResults.classList.toggle('active', isResults);
			tabSettings.classList.toggle('active', isSettings);
			if (tabManual) tabManual.classList.toggle('active', isManual);
			if (tabChart) tabChart.classList.toggle('active', isChart);
			if (tabAbout) tabAbout.classList.toggle('active', isAbout);

			resultsTab.style.display = isResults ? 'block' : 'none';
			settingsTab.style.display = isSettings ? 'block' : 'none';
			if (manualTab) manualTab.style.display = isManual ? 'block' : 'none';
			if (chartTab) chartTab.style.display = isChart ? 'block' : 'none';
			if (aboutTab) aboutTab.style.display = isAbout ? 'block' : 'none';

			if (isChart) {
				App.chart.setCurrency(elCurrency.value);
				App.chart.start(getChartPrices);
			} else {
				App.chart.stop();
			}
		};
		tabResults.addEventListener('click', () => showTab('results'));
		tabSettings.addEventListener('click', () => showTab('settings'));
		if (tabManual) tabManual.addEventListener('click', () => showTab('manual'));
		if (tabChart) tabChart.addEventListener('click', () => showTab('chart'));
		if (tabAbout) tabAbout.addEventListener('click', () => showTab('about'));

		// chart wiring
		App.chart.init({
			canvas: chartCanvas,
			statCurrency: chartStatCurrency,
			statBasis: chartStatBasis,
			statAvg: chartStatAvg,
			selectedCurrency: elCurrency.value,
		});

		// Decide unit price based on selected basis -> returns price per lasagna
		function getBasisPrice(basis) {
			let v = avgPackagePrice;
			if (!basis || basis === 'typical') v = avgPackagePrice;
			else if (basis === 'cheapest_pkg')
				v = (cheapestPackageItem && cheapestPackageItem.price) || avgPackagePrice;
			else if (basis === 'cheapest_kg') v = (bestItem && bestItem.price) || avgPackagePrice;
			else if (basis === 'best_quality') v = (bestQuality && bestQuality.price) || avgPackagePrice;
			return v && v > 0 ? v : avgPackagePrice;
		}

		function currencySymbol(cur) {
			if (!cur) return '€';
			switch (cur) {
				case 'USD':
					return '$';
				case 'BRL':
					return 'R$';
				case 'GBP':
					return '£';
				case 'GOLD':
					return 'g';
				default:
					return '€';
			}
		}

		function formatAmountForDisplay(eurAmount, cur, ratesLocal) {
			if (cur === 'GOLD') {
				const gPer = goldPerGram || DEFAULT_GOLD_PER_GRAM || 1;
				const grams = gPer ? eurAmount / gPer : 0;
				return {text: `${grams.toFixed(3)} g`, raw: grams};
			}

			// prefer numeric rate from fetched `rates`, otherwise use sensible fallbacks
			const fallbackRates = {USD: 1.1, BRL: 5.0, GBP: 0.87};
			let rate = null;
			if (cur === 'EUR') rate = 1;
			else if (ratesLocal && typeof ratesLocal[cur] === 'number') rate = ratesLocal[cur];
			else if (fallbackRates[cur]) rate = fallbackRates[cur];

			let value = eurAmount;
			if (rate != null && cur !== 'EUR') value = eurAmount * rate;

			const sym = currencySymbol(cur);
			return {text: `${sym}${value.toFixed(2)}`, raw: value};
		}

		function getChartPrices() {
			const basis = basisSelectEl ? basisSelectEl.value : 'typical';
			const unitPrice = getBasisPrice(basis);
			return {unitPrice, avgPrice: avgPackagePrice, basisName: basisSelectEl?.selectedOptions?.[0]?.text || ''};
		}

		elCurrency.addEventListener('change', () => {
			App.chart.setCurrency(elCurrency.value);
			App.chart.reset();
			if (chartTab && chartTab.style.display !== 'none') App.chart.start(getChartPrices);
			// re-render UI with new currency formatting
			renderSummaryCardLocalized(avgPackagePrice, avgPerKg, avgWeight);
			renderViewLocalized(compactToggle.checked, groups, items, itemsList);
			const marketStatsDisp = marketStats.map((m) => ({
				...m,
				avgPerKgDisplay: formatAmountForDisplay(m.avgPerKg, elCurrency.value, rates).text,
			}));
			renderDetails({bestItem, worstItem, bestQuality, marketStats: marketStatsDisp});
		});
		if (basisSelectEl) {
			basisSelectEl.addEventListener('change', () => {
				App.chart.reset();
				if (chartTab && chartTab.style.display !== 'none') App.chart.start(getChartPrices);
			});
		}

		saveSettingsBtn.addEventListener('click', () => {
			const s = {
				lang: langSel.value,
				defaultView: defaultViewSel.value,
				groupStep: parseInt(groupStepSel.value, 10) || 50,
			};
			saveSettings(s);
			App.applyTranslations(s.lang, {avgPerKg, avgWeight, medianWeight, mode});
			compactToggle.checked = s.defaultView === 'compact';
			renderViewLocalized(compactToggle.checked, groupByRounded(items, s.groupStep), items, itemsList);
		});

		groupStepSel.addEventListener('change', () => {
			const step = parseInt(groupStepSel.value, 10) || 50;
			renderViewLocalized(compactToggle.checked, groupByRounded(items, step), items, itemsList);
		});
		defaultViewSel.addEventListener('change', () => {
			compactToggle.checked = defaultViewSel.value === 'compact';
			const step = parseInt(groupStepSel.value, 10) || 50;
			renderViewLocalized(compactToggle.checked, groupByRounded(items, step), items, itemsList);
		});

		resetSettingsBtn.addEventListener('click', () => {
			localStorage.removeItem('lasanha_settings');
			location.reload();
		});

		btn.addEventListener('click', async () => {
			const v = parseFloat(elAmount.value || 0);
			const cur = elCurrency.value;
			const mode = inputModeSel ? inputModeSel.value : 'currency';
			if (isNaN(v) || v <= 0) {
				results.querySelector('#summary').textContent = App.tr('errorPositiveAmount');
				return;
			}
			let eurAmount = 0;
			const basis = basisSelectEl ? basisSelectEl.value : 'typical';
			const unitPrice = getBasisPrice(basis);

			if (mode === 'lasagna') {
				eurAmount = v * unitPrice;
			} else {
				if (cur === 'EUR') eurAmount = v;
				else if (cur === 'GOLD') {
					if (goldPerGram == null)
						goldPerGram =
							(await App.fetchGoldPerGram().catch(() => DEFAULT_GOLD_PER_GRAM)) || DEFAULT_GOLD_PER_GRAM;
					eurAmount = v * goldPerGram;
				} else {
					const r = rates && typeof rates[cur] === 'number' ? rates[cur] : FALLBACK_RATES[cur] || null;
					if (!r) {
						results.querySelector('#summary').textContent = App.tr('errorRateUnavailable');
						return;
					}
					eurAmount = v / r;
				}
			}

			// Prepare display amount (converted to selected currency or grams for GOLD)
			const display = formatAmountForDisplay(eurAmount, elCurrency.value, rates);

			const kg = avgPerKg ? eurAmount / avgPerKg : 0;
			const units400 = (kg * 1000) / 400;

			const numLas = unitPrice ? eurAmount / unitPrice : 0;
			const absLas = Math.floor(numLas);
			const exactLas = numLas.toFixed(2);
			if (mode === 'lasagna') {
				bigResult.textContent = display.text;
				bigSub.textContent = `${absLas} ${App.tr('lasagnas')} (${exactLas}) · ${basisSelectEl?.selectedOptions[0]?.text || ''}`;
			} else {
				// show the exact number (with 2 decimals) and include the unit label to avoid confusion
				bigResult.textContent = `${exactLas} ${App.tr('lasagnas')}`;
				bigSub.textContent = `${display.text} · ${basisSelectEl?.selectedOptions[0]?.text || ''}`;
			}

			summary.innerHTML = App.format(App.tr('summaryLine'), {
				eur: display.text,
				kg: kg.toFixed(3),
				units: units400.toFixed(1),
			});
			const marketStatsDisp = marketStats.map((m) => ({
				...m,
				avgPerKgDisplay: formatAmountForDisplay(m.avgPerKg, elCurrency.value, rates).text,
			}));
			renderDetails({
				bestItem,
				worstItem,
				bestQuality,
				marketStats: marketStatsDisp,
				eurAmount,
				kg,
				displayAmount: display.text,
			});
		});
	}
})();
