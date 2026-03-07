(function () {
	const DETAILS_ID = 'content-right';
	const BREAKPOINT = 851;
	const details = document.getElementById(DETAILS_ID);
	if (!details) return;
	let desktopContainer = null;

	function createDesktopContainer() {
		desktopContainer = document.createElement('div');
		desktopContainer.className = 'content-right__desktop';
		desktopContainer.setAttribute('role', 'region');
		desktopContainer.setAttribute('aria-label', 'Quick links and social media');
	}

	function moveToDesktop() {
		if (details.dataset.moved === 'true') return;
		if (!desktopContainer) createDesktopContainer();
		const nodes = Array.from(details.childNodes).filter((n) => !(n.nodeType === 1 && n.matches('summary')));
		if (nodes.length === 0) return;
		desktopContainer.append(...nodes);
		details.insertAdjacentElement('afterend', desktopContainer);
		details.dataset.moved = 'true';
		details.querySelector('summary')?.setAttribute('aria-hidden', 'true');
		details.open = false;
	}

	function moveToDetails() {
		if (details.dataset.moved !== 'true' || !desktopContainer) return;
		const nodes = Array.from(desktopContainer.childNodes);
		details.append(...nodes);
		desktopContainer.remove();
		desktopContainer = null;
		delete details.dataset.moved;
		details.querySelector('summary')?.setAttribute('aria-hidden', 'false');
	}

	function check() {
		if (window.innerWidth >= BREAKPOINT) moveToDesktop();
		else moveToDetails();
	}

	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(check, 150);
	});
	document.addEventListener('DOMContentLoaded', check);
})();
