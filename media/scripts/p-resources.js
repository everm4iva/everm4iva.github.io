/* p-resources.js — builds guide, groups sections and adds filtering/search/collapse */
document.addEventListener('DOMContentLoaded', () => {
	const results = document.querySelector('.results');
	if (!results) return;

	// Group existing h4 + blockquotes into sections
	const children = Array.from(results.children);
	const sections = [];
	let current = null;

	children.forEach((node) => {
		if (node.matches && node.matches('h4')) {
			const title = node.textContent.trim();
			const section = document.createElement('section');
			section.className = 'section';
			section.dataset.title = title;

			const header = document.createElement('div');
			header.className = 'section-header';
			header.setAttribute('role', 'button');
			header.setAttribute('tabindex', '0');
			header.setAttribute('aria-expanded', 'true');

			const titleEl = node.cloneNode(true);
			titleEl.classList.add('section-title');
			header.appendChild(titleEl);

			const body = document.createElement('div');
			body.className = 'section-body';

			section.appendChild(header);
			section.appendChild(body);
			sections.push(section);
			current = section;
		} else if (current) {
			current.querySelector('.section-body').appendChild(node.cloneNode(true));
		}
	});

	// Replace results content with new sections
	results.innerHTML = '';
	sections.forEach((s) => results.appendChild(s));

	// Build guide list: All sections + every top-level section
	const guideList = document.getElementById('guide-list');
	if (!guideList) return;

	function makeGuideItem(label, filt) {
		const li = document.createElement('li');
		li.className = 'guide-item';
		li.textContent = label;
		li.dataset.filter = filt;
		li.tabIndex = 0;
		return li;
	}

	guideList.appendChild(makeGuideItem('All sections', 'all'));
	sections.forEach((s) => guideList.appendChild(makeGuideItem(s.dataset.title, s.dataset.title)));

	// Helpers
	const guideItems = () => Array.from(guideList.querySelectorAll('.guide-item'));

	function selectGuide(item) {
		guideItems().forEach((i) => i.classList.remove('active'));
		item.classList.add('active');
		const f = item.dataset.filter;
		if (f === 'all') {
			sections.forEach((s) => {
				s.style.display = '';
			});
		} else {
			sections.forEach((s) => {
				s.style.display = s.dataset.title === f ? '' : 'none';
			});
		}
	}

	// Interactions for guide
	guideList.addEventListener('click', (e) => {
		const item = e.target.closest('.guide-item');
		if (!item) return;
		selectGuide(item);
	});
	guideList.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			const item = e.target.closest('.guide-item');
			if (item) {
				e.preventDefault();
				selectGuide(item);
			}
		}
	});

	// default: all sections
	const allItem = guideList.querySelector('.guide-item[data-filter="all"]');
	if (allItem) selectGuide(allItem);

	// Collapse/expand handlers
	results.addEventListener('click', (e) => {
		const header = e.target.closest('.section-header');
		if (!header) return;
		const body = header.nextElementSibling;
		const expanded = header.getAttribute('aria-expanded') === 'true';
		header.setAttribute('aria-expanded', expanded ? 'false' : 'true');
		body.style.display = expanded ? 'none' : '';
	});
	results.addEventListener('keydown', (e) => {
		const header = e.target.closest('.section-header');
		if (!header) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			header.click();
		}
	});

	// Search: filters items by title and inner text + highlights
	const search = document.getElementById('search');
	if (!search) return;

	function escapeRegExp(s) {
		return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
	}

	function clearHighlights() {
		results.querySelectorAll('.search-match').forEach((el) => {
			el.replaceWith(document.createTextNode(el.textContent));
		});
	}

	function highlightInElement(el, q) {
		if (!q || !el) return;
		const regex = new RegExp(escapeRegExp(q), 'gi');
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
		const nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach((node) => {
			if (!node.nodeValue) return;
			const text = node.nodeValue;
			if (!regex.test(text)) return;
			regex.lastIndex = 0;
			const frag = document.createDocumentFragment();
			let lastIndex = 0;
			let m;
			while ((m = regex.exec(text)) !== null) {
				const before = text.slice(lastIndex, m.index);
				if (before) frag.appendChild(document.createTextNode(before));
				const span = document.createElement('span');
				span.className = 'search-match';
				span.textContent = m[0];
				frag.appendChild(span);
				lastIndex = regex.lastIndex;
			}
			const after = text.slice(lastIndex);
			if (after) frag.appendChild(document.createTextNode(after));
			node.parentNode.replaceChild(frag, node);
		});
	}

	search.addEventListener('input', () => {
		const q = search.value.trim();
		// clear previous highlights
		clearHighlights();
		if (q.length) {
			const qLower = q.toLowerCase();
			// switch guide to All
			guideItems().forEach((i) => i.classList.remove('active'));
			const a = guideList.querySelector('.guide-item[data-filter="all"]');
			if (a) a.classList.add('active');

			sections.forEach((s) => {
				let matched = s.dataset.title.toLowerCase().includes(qLower);
				s.querySelectorAll('a, blockquote, .section-title').forEach((el) => {
					if (el.textContent.toLowerCase().includes(qLower)) matched = true;
				});
				s.style.display = matched ? '' : 'none';
				if (matched) {
					s.querySelector('.section-body').style.display = '';
					s.querySelector('.section-header').setAttribute('aria-expanded', 'true');
					// highlight matches inside header and body
					highlightInElement(s.querySelector('.section-header'), q);
					highlightInElement(s.querySelector('.section-body'), q);
				}
			});
		} else {
			// restore to selected guide
			const active = guideList.querySelector('.guide-item.active') || allItem;
			if (active) selectGuide(active);
			clearHighlights();
		}
	});
});
