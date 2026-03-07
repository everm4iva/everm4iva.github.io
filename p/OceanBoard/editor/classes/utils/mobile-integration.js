/**
 * OceanBoard Mobile Integration Helper
 * Helps all mobile features work
 */

class MobileIntegration {
	constructor() {
		this.isInitialized = false;
		this.touchSupported =
			"ontouchstart" in window || navigator.maxTouchPoints > 0;
		this.isMobile = window.innerWidth <= 767;
	}

	init() {
		if (this.isInitialized) return;

		this.setupMobileCompatibility();
		this.enhanceExistingElements();
		this.setupEventDelegation();
		this.fixViewportIssues();

		this.isInitialized = true;
		console.log(
			"[Mobile Integration] Mobile features integrated successfully"
		);
	}

	setupMobileCompatibility() {
		// Mobile class to body for CSS
		if (this.isMobile) {
			document.body.classList.add("ob-mobile");
		}

		if (this.touchSupported) {
			document.body.classList.add("ob-touch");
		}

		// Disable double-tap zoom
		let lastTouchEnd = 0;
		document.addEventListener(
			"touchend",
			(e) => {
				const now = new Date().getTime();
				if (now - lastTouchEnd <= 300) {
					e.preventDefault();
				}
				lastTouchEnd = now;
			},
			false
		);

		// NoNoNo zoom on input focus
		const viewportMeta = document.querySelector('meta[name="viewport"]');
		if (viewportMeta) {
			viewportMeta.setAttribute(
				"content",
				"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
			);
		}
	}

	enhanceExistingElements() {
		// Context menu attributes to already existing elements
		this.addContextMenuAttributes();

		// Touch targets
		this.improveTouchTargets();

		// Haptic feedback classes
		this.addHapticFeedback();
	}

	addContextMenuAttributes() {
		// Add to existing file items
		document
			.querySelectorAll(".ob-tree-list li:not([data-context-menu])")
			.forEach((li) => {
				if (li.querySelector(".ob-tree-folder")) {
					li.setAttribute("data-context-menu", "folder-item");
				} else {
					li.setAttribute("data-context-menu", "file-item");
					li.setAttribute(
						"data-file-id",
						`file-${Date.now()}-${Math.random()
							.toString(36)
							.substr(2, 9)}`
					);
				}
			});

		// Add to existing series tiles
		document
			.querySelectorAll(".ob-series-tile:not([data-context-menu])")
			.forEach((tile) => {
				tile.setAttribute("data-context-menu", "series-item");
			});

		// Add to season titles and special sections
		document
			.querySelectorAll(".ob-tree-title:not([data-context-menu])")
			.forEach((title) => {
				if (title.classList.contains("ob-special-title")) {
					title.setAttribute(
						"data-context-menu",
						"components-section"
					);
				} else {
					title.setAttribute("data-context-menu", "season-item");
				}
			});

		// Add to existing component items
		document
			.querySelectorAll(
				".ob-special-section .ob-tree-list li:not([data-context-menu])"
			)
			.forEach((li) => {
				li.setAttribute("data-context-menu", "component-item");
				li.setAttribute(
					"data-file-id",
					`component-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`
				);
			});
	}

	improveTouchTargets() {
		const smallElements = document.querySelectorAll(`
            .ob-header-btn,
            .ob-md-btn,
            .ob-tree-list li,
            .ob-tab,
            .ob-series-tile
        `);

		smallElements.forEach((element) => {
			if (!element.classList.contains("ob-touch-enhanced")) {
				element.classList.add("ob-touch-enhanced");

				// Minimum touch target size
				const computed = getComputedStyle(element);
				const minSize = 44;

				if (parseInt(computed.height) < minSize) {
					element.style.minHeight = `${minSize}px`;
				}

				if (parseInt(computed.width) < minSize) {
					element.style.minWidth = `${minSize}px`;
				}
			}
		});
	}

	addHapticFeedback() {
		const interactiveElements = document.querySelectorAll(`
            .ob-tree-list li,
            .ob-series-tile,
            .ob-tab,
            button
        `);

		interactiveElements.forEach((element) => {
			if (!element.classList.contains("ob-haptic-ready")) {
				element.classList.add("ob-haptic-ready");

				element.addEventListener(
					"touchstart",
					() => {
						if (navigator.vibrate && this.isMobile) {
							navigator.vibrate(10); // Light haptic feedback
						}
						element.classList.add("ob-haptic-feedback");
						setTimeout(() => {
							element.classList.remove("ob-haptic-feedback");
						}, 100);
					},
					{ passive: true }
				);
			}
		});
	}

	setupEventDelegation() {
		// Dynamic content with event delegation
		document.addEventListener("DOMNodeInserted", (e) => {
			if (e.target.nodeType === 1) {
				this.processNewElement(e.target);
			}
		});

		// Alternative for browsers that support it
		if (window.MutationObserver) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === 1) {
							this.processNewElement(node);
						}
					});
				});
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
	}

	processNewElement(element) {
		// Context menu attributes to new elements
		if (element.matches && element.matches(".ob-tree-list li")) {
			if (!element.hasAttribute("data-context-menu")) {
				element.setAttribute("data-context-menu", "file-item");
				element.setAttribute(
					"data-file-id",
					`file-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`
				);
			}
		}

		if (element.matches && element.matches(".ob-series-tile")) {
			if (!element.hasAttribute("data-context-menu")) {
				element.setAttribute("data-context-menu", "series-item");
			}
		}

		// Haptic feedback to new interactive elements
		if (
			element.matches &&
			element.matches(
				"button, .ob-tree-list li, .ob-series-tile, .ob-tab"
			)
		) {
			this.addHapticFeedback();
		}
	}

	fixViewportIssues() {
		// Viewport height on mobile browsers - blehus
		const setVH = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		setVH();

		// Update on resize and orientation change
		window.addEventListener("resize", setVH);
		window.addEventListener("orientationchange", () => {
			setTimeout(setVH, 100);
		});

		// Keyboard mobile height
		if (this.isMobile) {
			const originalHeight = window.innerHeight;

			window.addEventListener("resize", () => {
				const heightDiff = originalHeight - window.innerHeight;
				if (heightDiff > 150) {
					// Keyboard must be visible from this height
					document.body.classList.add("ob-keyboard-visible");
				} else {
					document.body.classList.remove("ob-keyboard-visible");
				}
			});
		}
	}

	// Update mobile state on resize
	updateMobileState() {
		const wasMobile = this.isMobile;
		this.isMobile = window.innerWidth <= 767;

		if (wasMobile !== this.isMobile) {
			if (this.isMobile) {
				document.body.classList.add("ob-mobile");
			} else {
				document.body.classList.remove("ob-mobile");
			}
		}
	}
}

const mobileIntegration = new MobileIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		mobileIntegration.init();
	});
} else {
	mobileIntegration.init();
}

window.addEventListener("resize", () => {
	mobileIntegration.updateMobileState();
});

export { MobileIntegration, mobileIntegration };
