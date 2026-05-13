(function () {
	'use strict';
	window.App = window.App || {};

	App.I18N = {
		en: {
			title: 'lasagna',
			subtitle: 'Convert currency ↔ lasagna',
			results: 'Results',
			settings: 'Settings',
			manual: 'Manual',
			chart: 'Chart',
			about: 'About',
			calculate: 'Calculate',
			compact: 'Compact view',
			averagePrice: 'Average price →',
			averageSize: 'Average size →',
			median: 'Median →',
			typical: 'Typical →',
			amount: 'Amount',
			currency: 'Currency',
			lang: 'Language',
			defaultView: 'Default view',
			groupStep: 'Grouping step (g)',
			basisLabel: 'Calculate by',
			footer: 'Data cached locally. Rates from exchangerate.host.',
			inputMode: 'Input mode',
			save: 'Save settings',
			reset: 'Reset defaults',
			swap: 'Swap input/output',
			seeMore: 'See more',
			hideDetails: 'Hide',
			loading: 'Loading data…',
			errorPositiveAmount: 'Enter a positive amount',
			errorRateUnavailable: 'Rate not available',
			lasagnas: 'lasagnas',
			avgPkg: 'Avg pkg',
			avgPerKg: 'Avg',
			details_bestPrice: 'Best price',
			details_worstPrice: 'Worst price',
			details_bestQuality: 'Best quality',
			details_markets: 'Markets',
			details_byWeight: 'By weight',
			itemsWord: 'items',
			avgWord: 'Avg',
			byWeightText: 'You get {g} g ({kg} kg) for €{eur}',
			summaryLine: '€{eur} → {kg} kg (~{units} × 400g)',
			opt_currency_eur: '€ — Euro',
			opt_currency_usd: '$ — US Dollar',
			opt_currency_brl: 'R$ — Brazilian Real',
			opt_currency_gbp: '£ — British Pound',
			opt_currency_gold: 'Gold (grams)',
			opt_inputmode_currency: 'Currency amount',
			opt_inputmode_lasagna: 'Number of lasagnas',
			opt_basis_typical: 'Typical (avg)',
			opt_basis_cheapest_pkg: 'Cheapest (per package)',
			opt_basis_cheapest_kg: 'Cheapest (per kg)',
			opt_basis_best_quality: 'Best quality (largest)',
			opt_default_compact: 'Compact',
			opt_default_list: 'List',
			manualTitle: 'Manual',
			chartTitle: 'Live chart',
			chartStatCurrencyLabel: 'Currency',
			chartStatBasisLabel: 'Lasagna',
			chartStatAvgLabel: 'Average',
			chartCurrencyFmt: '1 {cur} = €{eur}',
			chartBasisFmt: '{basis}: €{price}/lasagna',
			chartAvgFmt: 'Avg: €{price}/lasagna',
			aboutTitle: 'About',
			aboutHtml:
				'<p><strong>lasagna</strong> is a simple and cute currency converter that expresses prices in lasagnas.</p>' +
				'<p>v1.0.0</p>' +
				'<h4>Credits</h4>' +
				'<ul>' +
				'<li>Created by: <a href="https://everm4iva.github.io/social/index.html" target="_blank" rel="noopener noreferrer">everm4iva</a></li>' +
				'<li>Uses: <code>exchangerate.host</code> for EUR currency rates.</li>' +
				'<li>Framework: <code>Apache Cordova</code> for mobile app development.</li>' +
				'</ul>' +
				'<h4>Privacy</h4>' +
				'<p><small>No account. Settings and cached data are stored locally on your device.</small></p>',
			manualHtml:
				'<p>This app converts money to <strong>lasagna</strong> (and the other way around).</p>' +
				'<h4>Quick start</h4>' +
				'<ul>' +
				'<li>Choose <code>Input mode</code>: <strong>Currency amount</strong> or <strong>Number of lasagnas</strong>.</li>' +
				'<li>Enter the amount, pick a currency, choose <code>Calculate by</code>, then tap <strong>Calculate</strong>.</li>' +
				'<li>Use <strong>⇄</strong> to swap the input/output direction.</li>' +
				'</ul>' +
				'<h4>Results</h4>' +
				'<ul>' +
				'<li>The big card shows the main conversion and the chosen basis.</li>' +
				'<li><strong>See more</strong> reveals the item list and extra stats.</li>' +
				'</ul>' +
				'<h4>Settings</h4>' +
				'<ul>' +
				'<li><strong>Language</strong> changes all labels and texts.</li>' +
				'<li><strong>Default view</strong> controls compact vs list view.</li>' +
				'<li><strong>Grouping step</strong> changes how weights are grouped in compact view.</li>' +
				'</ul>' +
				'<p><small>Note: data and rates are cached locally for faster loading.</small></p>',
		},
		pt: {
			title: 'lasanha',
			subtitle: 'Converte moeda ↔ lasanha',
			results: 'Resultados',
			settings: 'Definições',
			manual: 'Manual',
			chart: 'Gráfico',
			about: 'Sobre',
			calculate: 'Calcular',
			compact: 'Vista compacta',
			averagePrice: 'Preço médio →',
			averageSize: 'Tamanho médio →',
			median: 'Mediana →',
			typical: 'Típico →',
			amount: 'Quantidade',
			currency: 'Moeda',
			lang: 'Idioma',
			defaultView: 'Vista padrão',
			groupStep: 'Agrupar (g)',
			basisLabel: 'Calcular por',
			footer: 'Dados em cache localmente. Taxas de exchangerate.host.',
			inputMode: 'Modo de entrada',
			save: 'Guardar',
			reset: 'Repor',
			swap: 'Trocar entrada/saída',
			seeMore: 'Ver mais',
			hideDetails: 'Ocultar',
			loading: 'A carregar dados…',
			errorPositiveAmount: 'Insere uma quantidade positiva',
			errorRateUnavailable: 'Taxa indisponível',
			lasagnas: 'lasanhas',
			avgPkg: 'Emb. média',
			avgPerKg: 'Média',
			details_bestPrice: 'Melhor preço',
			details_worstPrice: 'Pior preço',
			details_bestQuality: 'Melhor qualidade',
			details_markets: 'Mercados',
			details_byWeight: 'Por peso',
			itemsWord: 'itens',
			avgWord: 'Média',
			byWeightText: 'Consegues {g} g ({kg} kg) por €{eur}',
			summaryLine: '€{eur} → {kg} kg (~{units} × 400g)',
			opt_currency_eur: '€ — Euro',
			opt_currency_usd: '$ — Dólar (EUA)',
			opt_currency_brl: 'R$ — Real (Brasil)',
			opt_currency_gbp: '£ — Libra (Reino Unido)',
			opt_currency_gold: 'Ouro (gramas)',
			opt_inputmode_currency: 'Valor em moeda',
			opt_inputmode_lasagna: 'Nº de lasanhas',
			opt_basis_typical: 'Típico (média)',
			opt_basis_cheapest_pkg: 'Mais barato (por embalagem)',
			opt_basis_cheapest_kg: 'Mais barato (por kg)',
			opt_basis_best_quality: 'Melhor qualidade (maior)',
			opt_default_compact: 'Compacta',
			opt_default_list: 'Lista',
			manualTitle: 'Manual',
			chartTitle: 'Gráfico ao vivo',
			chartStatCurrencyLabel: 'Moeda',
			chartStatBasisLabel: 'Lasanha',
			chartStatAvgLabel: 'Média',
			chartCurrencyFmt: '1 {cur} = €{eur}',
			chartBasisFmt: '{basis}: €{price}/lasanha',
			chartAvgFmt: 'Média: €{price}/lasanha',
			aboutTitle: 'Sobre',
			aboutHtml:
				'<p><strong>lasanha</strong> é uma app simples e fofinha que converte moeda em lasanha!</p>' +
				'<p>v1.0.0</p>' +
				'<h4>Creditos</h4>' +
				'<ul>' +
				'<li>Criado por: <a href="https://everm4iva.github.io/social/index.html" target="_blank" rel="noopener noreferrer">everm4iva</a></li>' +
				'<li>Usa: <code>exchangerate.host</code> para taxas (base EUR).</li>' +
				'<li>Framework: <code>Apache Cordova</code> para desenvolvimento de apps movel.</li>' +
				'</ul>' +
				'<h4>Privacidade</h4>' +
				'<p><small>Sem conta. Definições e cache ficam guardados localmente no dispositivo.</small></p>',
			manualHtml:
				'<p>Esta app converte dinheiro para <strong>lasanha</strong> (e vice‑versa).</p>' +
				'<h4>Como usar</h4>' +
				'<ul>' +
				'<li>Escolhe o <code>Modo de entrada</code>: <strong>Valor em moeda</strong> ou <strong>Nº de lasanhas</strong>.</li>' +
				'<li>Insere a quantidade, escolhe a moeda, escolhe <code>Calcular por</code> e carrega em <strong>Calcular</strong>.</li>' +
				'<li>Usa <strong>⇄</strong> para trocar a direção da conversão.</li>' +
				'</ul>' +
				'<h4>Resultados</h4>' +
				'<ul>' +
				'<li>O cartão grande mostra a conversão principal e a base escolhida.</li>' +
				'<li><strong>Ver mais</strong> mostra a lista de itens e estatísticas extra.</li>' +
				'</ul>' +
				'<h4>Definições</h4>' +
				'<ul>' +
				'<li><strong>Idioma</strong> altera todos os textos.</li>' +
				'<li><strong>Vista padrão</strong> define compacta vs lista.</li>' +
				'<li><strong>Agrupar (g)</strong> muda como os pesos são agrupados na vista compacta.</li>' +
				'</ul>' +
				'<p><small>Nota: os dados e as taxas ficam em cache local para carregar mais rápido.</small></p>',
		},
	};

	App.strings = function strings(lang) {
		return App.I18N[lang] || App.I18N.en;
	};

	App.tr = function tr(key) {
		const s = App.strings(App.state.currentLang);
		return s[key] ?? App.I18N.en[key] ?? key;
	};

	App.format = function format(str, vars) {
		return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''));
	};

	App.translateOptions = function translateOptions(t) {
		document.querySelectorAll('option[data-i18n]').forEach((opt) => {
			const k = opt.getAttribute('data-i18n');
			if (k && t[k]) opt.textContent = t[k];
		});
	};

	App.applyTranslations = function applyTranslations(lang, data) {
		App.state.currentLang = lang || 'en';
		const t = App.strings(App.state.currentLang);

		const titleEl = document.getElementById('title');
		if (titleEl) titleEl.textContent = t.title || titleEl.textContent;
		const subtitleEl = document.getElementById('subtitle');
		if (subtitleEl) subtitleEl.textContent = t.subtitle || subtitleEl.textContent;

		document.getElementById('tabResults').textContent = t.results;
		document.getElementById('tabSettings').textContent = t.settings;
		const tabManual = document.getElementById('tabManual');
		if (tabManual) tabManual.textContent = t.manual;
		const tabChart = document.getElementById('tabChart');
		if (tabChart) tabChart.textContent = t.chart;
		const tabAbout = document.getElementById('tabAbout');
		if (tabAbout) tabAbout.textContent = t.about;

		const amountLabel = document.getElementById('amountLabel');
		if (amountLabel) amountLabel.textContent = t.amount;
		const currencyLabel = document.getElementById('currencyLabel');
		if (currencyLabel) currencyLabel.textContent = t.currency;
		const inputModeLabel = document.getElementById('inputModeLabel');
		if (inputModeLabel) inputModeLabel.textContent = t.inputMode;
		const basisLabel = document.getElementById('basisLabel');
		if (basisLabel) basisLabel.textContent = t.basisLabel;

		const calcBtn = document.getElementById('calc');
		if (calcBtn) calcBtn.textContent = t.calculate;
		const compactLabelEl = document.getElementById('compactLabel');
		if (compactLabelEl) compactLabelEl.textContent = t.compact;

		const swapBtn = document.getElementById('swapMode');
		if (swapBtn) {
			swapBtn.title = t.swap;
			swapBtn.setAttribute('aria-label', t.swap);
		}

		App.translateOptions(t);

		const settingsTitle = document.getElementById('settingsTitle');
		if (settingsTitle) settingsTitle.textContent = t.settings;
		const langLabel = document.getElementById('langLabel');
		if (langLabel) langLabel.textContent = t.lang;
		const defaultViewLabel = document.getElementById('defaultViewLabel');
		if (defaultViewLabel) defaultViewLabel.textContent = t.defaultView;
		const groupStepLabel = document.getElementById('groupStepLabel');
		if (groupStepLabel) groupStepLabel.textContent = t.groupStep;
		const saveSettingsBtn = document.getElementById('saveSettings');
		if (saveSettingsBtn) saveSettingsBtn.textContent = t.save;
		const resetSettingsBtn = document.getElementById('resetSettings');
		if (resetSettingsBtn) resetSettingsBtn.textContent = t.reset;

		const foot = document.querySelector('.foot');
		if (foot) foot.textContent = t.footer;

		// some labeled text
		const summaryEl = document.getElementById('summary');
		if (data && summaryEl) {
			summaryEl.textContent = `${t.averagePrice} €${data.avgPerKg.toFixed(2)} / kg`;
		}

		const manualTitle = document.getElementById('manualTitle');
		if (manualTitle) manualTitle.textContent = t.manualTitle || t.manual;
		const manualContent = document.getElementById('manualContent');
		if (manualContent) manualContent.innerHTML = t.manualHtml || '';

		const aboutTitle = document.getElementById('aboutTitle');
		if (aboutTitle) aboutTitle.textContent = t.aboutTitle || t.about;
		const aboutContent = document.getElementById('aboutContent');
		if (aboutContent) aboutContent.innerHTML = t.aboutHtml || '';

		const chartTitle = document.getElementById('chartTitle');
		if (chartTitle) chartTitle.textContent = t.chartTitle || t.chart;
		const chartStatCurrencyLabel = document.getElementById('chartStatCurrencyLabel');
		if (chartStatCurrencyLabel) chartStatCurrencyLabel.textContent = t.chartStatCurrencyLabel;
		const chartStatBasisLabel = document.getElementById('chartStatBasisLabel');
		if (chartStatBasisLabel) chartStatBasisLabel.textContent = t.chartStatBasisLabel;
		const chartStatAvgLabel = document.getElementById('chartStatAvgLabel');
		if (chartStatAvgLabel) chartStatAvgLabel.textContent = t.chartStatAvgLabel;

		if (typeof App.updateSeeMoreLabel === 'function') App.updateSeeMoreLabel();
	};
})();
