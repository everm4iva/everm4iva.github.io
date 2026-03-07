/**
 * OceanBoard Keyboard Shortcuts Manager
 * Keyboard shortcuts - 'cause why not 🙄
 */

class KeyboardManager {
	constructor() {
		this.shortcuts = new Map();
		this.isEnabled = true;
		this.init();
	}

	init() {
		console.log("KeyboardManager initializing...");
		this.registerDefaultShortcuts();
		this.setupEventListeners();
		this.createShortcutsHelp();
		console.log(
			"KeyboardManager initialized with",
			this.shortcuts.size,
			"shortcuts"
		);

		// Test shortcut to verify functionality
		window.testKeyboard = () => {
			console.log(
				"Keyboard shortcuts registered:",
				Array.from(this.shortcuts.keys())
			);
			this.showCommandPalette();
		};
	}

	setupEventListeners() {
		document.addEventListener(
			"keydown",
			(e) => {
				if (!this.isEnabled) return;

				const key = this.getKeyString(e);

				// Skip if no actual key (just modifiers)
				if (!key) return;

				if (this.preventBrowserDefault(e, key)) {
					// Browser default prevented
				}

				// Don't trigger shortcuts when typing in inputs
				if (this.isInputFocused(e.target)) {
					// Only allow specific shortcuts in inputs
					if (!this.isAllowedInInput(e)) return;
				}

				const shortcut = this.shortcuts.get(key);

				if (shortcut) {
					e.preventDefault();
					e.stopPropagation();
					try {
						shortcut.handler(e);
					} catch (error) {
						console.error("Shortcut execution error:", error);
						window.feedbackManager?.showError(
							"Shortcut failed to execute"
						);
					}
				}
			},
			{ capture: true }
		);
	}

	isInputFocused(element) {
		return (
			element &&
			(element.tagName === "INPUT" ||
				element.tagName === "TEXTAREA" ||
				element.contentEditable === "true" ||
				element.classList.contains("ob-md-input"))
		);
	}

	isAllowedInInput(e) {
		const key = this.getKeyString(e);
		const allowedInInputs = [
			"ctrl+s",
			"cmd+s", // Save
			"ctrl+z",
			"cmd+z", // Undo
			"ctrl+y",
			"cmd+shift+z", // Redo
			"ctrl+f",
			"cmd+f", // Find
			"ctrl+n",
			"cmd+n", // New
			"ctrl+k",
			"cmd+k", // Command palette
			"ctrl+p",
			"cmd+p", // Quick switcher
			"f11",
			"escape", // Fullscreen, Exit
		];
		return allowedInInputs.includes(key);
	}

	getKeyString(e) {
		const parts = [];

		if (e.ctrlKey && !e.metaKey) parts.push("ctrl");
		if (e.metaKey) parts.push("cmd");
		if (e.altKey) parts.push("alt");
		if (e.shiftKey) parts.push("shift");

		const key = e.key.toLowerCase();

		if (
			key !== "control" &&
			key !== "meta" &&
			key !== "alt" &&
			key !== "shift" &&
			key.length > 0
		) {
			parts.push(key);
			return parts.join("+");
		}

		// Return empty string for modifier-only presses
		return "";
	}

	preventBrowserDefault(e, key) {
		// Prevent specific browser shortcuts that conflict with ours
		const problematicShortcuts = [
			"ctrl+n",
			"cmd+n", // New window
			"ctrl+t",
			"cmd+t", // New tab
			"ctrl+w",
			"cmd+w", // Close tab
			"ctrl+shift+t",
			"cmd+shift+t", // Reopen tab
			"ctrl+p",
			"cmd+p", // Print
			"ctrl+k",
			"cmd+k", // Address bar / Search
			"ctrl+f",
			"cmd+f", // Find
			"ctrl+shift+f",
			"cmd+shift+f", // Find in files
		];

		if (problematicShortcuts.includes(key)) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return true;
		}
		return false;
	}

	registerShortcut(key, handler, description = "", category = "General") {
		this.shortcuts.set(key, { handler, description, category });
	}

	registerDefaultShortcuts() {
		// File operations
		this.registerShortcut(
			"ctrl+s",
			() => this.saveCurrentFile(),
			"Save current file",
			"File"
		);
		this.registerShortcut(
			"cmd+s",
			() => this.saveCurrentFile(),
			"Save current file",
			"File"
		);

		this.registerShortcut(
			"ctrl+n",
			() => this.createNewFile(),
			"Create new file",
			"File"
		);
		this.registerShortcut(
			"cmd+n",
			() => this.createNewFile(),
			"Create new file",
			"File"
		);

		this.registerShortcut(
			"ctrl+o",
			() => this.openFile(),
			"Open file",
			"File"
		);
		this.registerShortcut(
			"cmd+o",
			() => this.openFile(),
			"Open file",
			"File"
		);

		// Navigation
		this.registerShortcut(
			"ctrl+p",
			() => this.showQuickSwitcher(),
			"Quick file switcher",
			"Navigation"
		);
		this.registerShortcut(
			"cmd+p",
			() => this.showQuickSwitcher(),
			"Quick file switcher",
			"Navigation"
		);

		this.registerShortcut(
			"ctrl+k",
			() => this.showCommandPalette(),
			"Command palette",
			"Navigation"
		);
		this.registerShortcut(
			"cmd+k",
			() => this.showCommandPalette(),
			"Command palette",
			"Navigation"
		);

		// Tabs
		this.registerShortcut(
			"ctrl+w",
			() => this.closeCurrentTab(),
			"Close current tab",
			"Tabs"
		);
		this.registerShortcut(
			"cmd+w",
			() => this.closeCurrentTab(),
			"Close current tab",
			"Tabs"
		);

		this.registerShortcut(
			"ctrl+tab",
			() => this.nextTab(),
			"Next tab",
			"Tabs"
		);
		this.registerShortcut(
			"ctrl+shift+tab",
			() => this.previousTab(),
			"Previous tab",
			"Tabs"
		);

		this.registerShortcut(
			"ctrl+1",
			() => this.switchToTab(0),
			"Switch to tab 1",
			"Tabs"
		);
		this.registerShortcut(
			"ctrl+2",
			() => this.switchToTab(1),
			"Switch to tab 2",
			"Tabs"
		);
		this.registerShortcut(
			"ctrl+3",
			() => this.switchToTab(2),
			"Switch to tab 3",
			"Tabs"
		);
		this.registerShortcut(
			"ctrl+4",
			() => this.switchToTab(3),
			"Switch to tab 4",
			"Tabs"
		);
		this.registerShortcut(
			"ctrl+5",
			() => this.switchToTab(4),
			"Switch to tab 5",
			"Tabs"
		);

		// View
		this.registerShortcut(
			"f11",
			() => this.toggleFullscreen(),
			"Toggle fullscreen",
			"View"
		);
		this.registerShortcut(
			"ctrl+shift+f",
			() => this.toggleFocusMode(),
			"Toggle focus mode",
			"View"
		);
		this.registerShortcut(
			"cmd+shift+f",
			() => this.toggleFocusMode(),
			"Toggle focus mode",
			"View"
		);

		// Search
		this.registerShortcut(
			"ctrl+f",
			() => this.showSearch(),
			"Search in file",
			"Search"
		);
		this.registerShortcut(
			"cmd+f",
			() => this.showSearch(),
			"Search in file",
			"Search"
		);

		this.registerShortcut(
			"ctrl+shift+f",
			() => this.showGlobalSearch(),
			"Global search",
			"Search"
		);
		this.registerShortcut(
			"cmd+shift+f",
			() => this.showGlobalSearch(),
			"Global search",
			"Search"
		);

		// Settings
		this.registerShortcut(
			"ctrl+,",
			() => this.openSettings(),
			"Open settings",
			"Settings"
		);
		this.registerShortcut(
			"cmd+,",
			() => this.openSettings(),
			"Open settings",
			"Settings"
		);

		// Help
		this.registerShortcut("f1", () => this.showHelp(), "Show help", "Help");
		this.registerShortcut(
			"ctrl+/",
			() => this.showKeyboardShortcuts(),
			"Show keyboard shortcuts",
			"Help"
		);
		this.registerShortcut(
			"cmd+/",
			() => this.showKeyboardShortcuts(),
			"Show keyboard shortcuts",
			"Help"
		);

		// Escape to close modals/overlays
		this.registerShortcut(
			"escape",
			() => this.handleEscape(),
			"Close modal/overlay",
			"General"
		);
	}

	// Shortcut handlers
	saveCurrentFile() {
		const activeTab = document.querySelector(".ob-tab.active");
		if (activeTab) {
			const textarea = document.querySelector(".ob-md-input");
			if (textarea) {
				// Trigger save event
				textarea.dispatchEvent(new Event("input"));
				window.feedbackManager?.showSuccess("File saved");
			}
		} else {
			window.feedbackManager?.showSuccess("All changes saved");
		}
	}

	createNewFile() {
		const addBtn = document.querySelector(".ob-action-episode");
		if (addBtn) {
			addBtn.click();
		}
	}

	openFile() {
		this.showQuickSwitcher();
	}

	showQuickSwitcher() {
		this.createQuickSwitcherModal();
	}

	showCommandPalette() {
		this.createCommandPaletteModal();
	}

	closeCurrentTab() {
		const activeTab = document.querySelector(".ob-tab.active");
		if (activeTab) {
			const closeBtn = activeTab.querySelector(".ob-tab-close");
			if (closeBtn) {
				closeBtn.click();
			}
		}
	}

	nextTab() {
		const tabs = document.querySelectorAll(".ob-tab");
		const activeTab = document.querySelector(".ob-tab.active");
		if (!activeTab || tabs.length <= 1) return;

		const currentIndex = Array.from(tabs).indexOf(activeTab);
		const nextIndex = (currentIndex + 1) % tabs.length;
		tabs[nextIndex].click();
	}

	previousTab() {
		const tabs = document.querySelectorAll(".ob-tab");
		const activeTab = document.querySelector(".ob-tab.active");
		if (!activeTab || tabs.length <= 1) return;

		const currentIndex = Array.from(tabs).indexOf(activeTab);
		const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		tabs[prevIndex].click();
	}

	switchToTab(index) {
		const tabs = document.querySelectorAll(".ob-tab");
		if (tabs[index]) {
			tabs[index].click();
		}
	}

	toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	toggleFocusMode() {
		document.body.classList.toggle("ob-focus-mode");
		const isInFocusMode = document.body.classList.contains("ob-focus-mode");
		window.feedbackManager?.showSuccess(
			isInFocusMode ? "Focus mode enabled" : "Focus mode disabled"
		);
	}

	showSearch() {
		const textarea = document.querySelector(".ob-md-input");
		if (textarea) {
			// Browser's native search
			document.execCommand("find");
		}
	}

	showGlobalSearch() {
		this.createGlobalSearchModal();
	}

	openSettings() {
		const settingsBtn = document.querySelector(
			'.ob-header-controls button[title="Settings"]'
		);
		if (settingsBtn) {
			settingsBtn.click();
		}
	}

	showHelp() {
		this.showKeyboardShortcuts();
	}

	showKeyboardShortcuts() {
		this.showShortcutsModal();
	}

	handleEscape() {
		// Close any open modals or overlays
		const modal = document.querySelector(
			".ob-modal-overlay.active, .ob-settings-overlay.active"
		);
		if (modal) {
			const closeBtn = modal.querySelector(
				".ob-modal-close, .ob-settings-close"
			);
			if (closeBtn) {
				closeBtn.click();
				return;
			}
		}

		// Exit focus mode
		if (document.body.classList.contains("ob-focus-mode")) {
			this.toggleFocusMode();
			return;
		}

		// Exit fullscreen
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}
	}

	// Create shortcuts help modal
	createShortcutsHelp() {
		// This will be called when user presses Ctrl+/
	}

	showShortcutsModal() {
		const modal = document.createElement("div");
		modal.className = "ob-modal-overlay";

		const categories = this.groupShortcutsByCategory();
		let shortcutsHTML = "";

		Object.entries(categories).forEach(([category, shortcuts]) => {
			shortcutsHTML += `
                <div class="ob-shortcuts-category">
                    <h3>${category}</h3>
                    <div class="ob-shortcuts-list">
                        ${shortcuts
							.map(
								({ key, description }) => `
                            <div class="ob-shortcut-item">
                                <kbd class="ob-shortcut-key">${this.formatKey(
									key
								)}</kbd>
                                <span class="ob-shortcut-desc">${description}</span>
                            </div>
                        `
							)
							.join("")}
                    </div>
                </div>
            `;
		});

		modal.innerHTML = `
            <div class="ob-modal">
                <div class="ob-modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="ob-modal-close">
                        <span class="material-icons-round" translate="no">close</span>
                    </button>
                </div>
                <div class="ob-modal-body ob-shortcuts-modal">
                    ${shortcutsHTML}
                </div>
            </div>
        `;

		document.body.appendChild(modal);

		// Activate modal
		requestAnimationFrame(() => {
			modal.classList.add("active");
		});

		// Close handlers
		modal.querySelector(".ob-modal-close").addEventListener("click", () => {
			modal.classList.remove("active");
			setTimeout(() => modal.remove(), 200);
		});

		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				modal.classList.remove("active");
				setTimeout(() => modal.remove(), 200);
			}
		});
	}

	groupShortcutsByCategory() {
		const categories = {};

		this.shortcuts.forEach(({ description, category }, key) => {
			if (!categories[category]) {
				categories[category] = [];
			}
			categories[category].push({ key, description });
		});

		return categories;
	}

	formatKey(key) {
		// for this i asked help of copilot. WELP
		return key
			.replace(/ctrl/g, "⌃")
			.replace(/cmd/g, "⌘")
			.replace(/alt/g, "⌥")
			.replace(/shift/g, "⇧")
			.replace(/\+/g, " + ")
			.toUpperCase();
	}

	// Enable/disable shortcuts
	enable() {
		this.isEnabled = true;
	}

	disable() {
		this.isEnabled = false;
	}

	// Remove shortcut
	unregisterShortcut(key) {
		this.shortcuts.delete(key);
	}

	// Get all shortcuts
	getShortcuts() {
		return Array.from(this.shortcuts.entries());
	}

	// Quick Switcher Implementation
	createQuickSwitcherModal() {
		// Remove existing modal if any
		const existing = document.querySelector(".ob-quick-switcher");
		if (existing) {
			existing.remove();
		}

		// Get all files from sidebar
		const files = [];
		document.querySelectorAll(".ob-tree-list li").forEach((li) => {
			const textNodes = Array.from(li.childNodes).filter(
				(node) => node.nodeType === 3
			);
			const fileName = textNodes
				.map((n) => n.textContent.trim())
				.join("")
				.trim();
			if (fileName) {
				const icon = li.querySelector(".material-icons-round");
				files.push({
					name: fileName,
					icon: icon ? icon.textContent : "description",
					element: li,
				});
			}
		});

		if (files.length === 0) {
			window.feedbackManager?.showSuccess("No files to switch to");
			return;
		}

		const modal = document.createElement("div");
		modal.className = "ob-quick-switcher";
		modal.innerHTML = `
            <input type="text" class="ob-quick-switcher-input" placeholder="Type to search files..." autocomplete="off">
            <div class="ob-quick-switcher-results">
                ${files
					.map(
						(file, index) => `
                    <div class="ob-quick-switcher-item ${
						index === 0 ? "selected" : ""
					}" data-file="${file.name}">
                        <span class="material-icons-round ob-quick-switcher-item-icon">${
							file.icon
						}</span>
                        <span class="ob-quick-switcher-item-name">${
							file.name
						}</span>
                    </div>
                `
					)
					.join("")}
            </div>
        `;

		document.body.appendChild(modal);

		// Show modal
		requestAnimationFrame(() => {
			modal.classList.add("show");
		});

		const input = modal.querySelector(".ob-quick-switcher-input");
		const results = modal.querySelector(".ob-quick-switcher-results");
		let selectedIndex = 0;

		// Focus input
		input.focus();

		// Handle input
		input.addEventListener("input", (e) => {
			const query = e.target.value.toLowerCase();
			const items = results.querySelectorAll(".ob-quick-switcher-item");
			let visibleItems = [];

			items.forEach((item) => {
				const name = item.dataset.file.toLowerCase();
				if (name.includes(query)) {
					item.style.display = "flex";
					visibleItems.push(item);
				} else {
					item.style.display = "none";
				}
			});

			// Reset selection
			items.forEach((item) => item.classList.remove("selected"));
			selectedIndex = 0;
			if (visibleItems[0]) {
				visibleItems[0].classList.add("selected");
			}
		});

		// Handle keyboard navigation
		input.addEventListener("keydown", (e) => {
			const visibleItems = Array.from(
				results.querySelectorAll(
					'.ob-quick-switcher-item:not([style*="display: none"])'
				)
			);

			if (e.key === "ArrowDown") {
				e.preventDefault();
				selectedIndex = Math.min(
					selectedIndex + 1,
					visibleItems.length - 1
				);
				updateSelection();
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				updateSelection();
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (visibleItems[selectedIndex]) {
					openFile(visibleItems[selectedIndex].dataset.file);
				}
			} else if (e.key === "Escape") {
				closeModal();
			}
		});

		function updateSelection() {
			const visibleItems = Array.from(
				results.querySelectorAll(
					'.ob-quick-switcher-item:not([style*="display: none"])'
				)
			);
			visibleItems.forEach((item, index) => {
				item.classList.toggle("selected", index === selectedIndex);
			});
		}

		function openFile(fileName) {
			// Find and click the file in sidebar
			const fileElements = document.querySelectorAll(".ob-tree-list li");
			fileElements.forEach((el) => {
				const textNodes = Array.from(el.childNodes).filter(
					(node) => node.nodeType === 3
				);
				const name = textNodes
					.map((n) => n.textContent.trim())
					.join("")
					.trim();
				if (name === fileName) {
					el.click();
					closeModal();
				}
			});
		}

		function closeModal() {
			modal.classList.remove("show");
			setTimeout(() => {
				if (modal.parentNode) {
					modal.remove();
				}
			}, 200);
		}

		// Click item handlers
		results.addEventListener("click", (e) => {
			const item = e.target.closest(".ob-quick-switcher-item");
			if (item) {
				openFile(item.dataset.file);
			}
		});

		// Close on outside click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModal();
			}
		});
	}

	// Global Search Implementation
	createGlobalSearchModal() {
		// Remove existing modal if any
		const existing = document.querySelector(".ob-global-search");
		if (existing) {
			existing.remove();
		}

		// Get all files and their content
		const searchResults = [];
		document.querySelectorAll(".ob-tree-list li").forEach((li) => {
			const textNodes = Array.from(li.childNodes).filter(
				(node) => node.nodeType === 3
			);
			const fileName = textNodes
				.map((n) => n.textContent.trim())
				.join("")
				.trim();
			if (fileName) {
				const content =
					localStorage.getItem("ob-file-" + fileName) || "";
				const icon = li.querySelector(".material-icons-round");
				searchResults.push({
					name: fileName,
					content: content,
					icon: icon ? icon.textContent : "description",
					element: li,
				});
			}
		});

		if (searchResults.length === 0) {
			window.feedbackManager?.showSuccess("No files to search");
			return;
		}

		const modal = document.createElement("div");
		modal.className = "ob-global-search";
		modal.innerHTML = `
            <div class="ob-global-search-header">
                <span class="material-icons-round" translate="no">search</span>
                <input type="text" class="ob-global-search-input" placeholder="Search across all files..." autocomplete="off">
                <button class="ob-global-search-close">
                    <span class="material-icons-round" translate="no">close</span>
                </button>
            </div>
            <div class="ob-global-search-results">
                <div class="ob-global-search-empty">Type to search across all your files...</div>
            </div>
        `;

		document.body.appendChild(modal);

		// Show modal
		requestAnimationFrame(() => {
			modal.classList.add("show");
		});

		const input = modal.querySelector(".ob-global-search-input");
		const results = modal.querySelector(".ob-global-search-results");
		const closeBtn = modal.querySelector(".ob-global-search-close");
		let selectedIndex = 0;

		// Focus input
		input.focus();

		// Handle input
		input.addEventListener("input", (e) => {
			const query = e.target.value.trim();

			if (query.length < 2) {
				results.innerHTML =
					'<div class="ob-global-search-empty">Type at least 2 characters to search...</div>';
				return;
			}

			const matches = this.searchInFiles(searchResults, query);

			if (matches.length === 0) {
				results.innerHTML =
					'<div class="ob-global-search-empty">No results found</div>';
				return;
			}

			results.innerHTML = matches
				.map(
					(match, index) => `
                <div class="ob-global-search-item ${
					index === 0 ? "selected" : ""
				}" data-file="${match.fileName}">
                    <div class="ob-global-search-item-header">
                        <span class="material-icons-round" translate="no">${
							match.icon
						}</span>
                        <span class="ob-global-search-item-name">${
							match.fileName
						}</span>
                        <span class="ob-global-search-item-count">${
							match.matches
						} matches</span>
                    </div>
                    <div class="ob-global-search-item-snippets">
                        ${match.snippets
							.map(
								(snippet) => `
                            <div class="ob-global-search-snippet">
                                ${this.highlightMatches(snippet, query)}
                            </div>
                        `
							)
							.join("")}
                    </div>
                </div>
            `
				)
				.join("");

			selectedIndex = 0;
		});

		// Handle keyboard navigation
		input.addEventListener("keydown", (e) => {
			const items = results.querySelectorAll(".ob-global-search-item");

			if (e.key === "ArrowDown") {
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
				updateSelection();
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				updateSelection();
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (items[selectedIndex]) {
					openFile(items[selectedIndex].dataset.file);
				}
			} else if (e.key === "Escape") {
				closeModal();
			}
		});

		function updateSelection() {
			const items = results.querySelectorAll(".ob-global-search-item");
			items.forEach((item, index) => {
				item.classList.toggle("selected", index === selectedIndex);
			});
		}

		function openFile(fileName) {
			// Find and click the file in sidebar
			const fileElements = document.querySelectorAll(".ob-tree-list li");
			fileElements.forEach((el) => {
				const textNodes = Array.from(el.childNodes).filter(
					(node) => node.nodeType === 3
				);
				const name = textNodes
					.map((n) => n.textContent.trim())
					.join("")
					.trim();
				if (name === fileName) {
					el.click();
					closeModal();
				}
			});
		}

		function closeModal() {
			modal.classList.remove("show");
			setTimeout(() => {
				if (modal.parentNode) {
					modal.remove();
				}
			}, 200);
		}

		// Click handlers
		closeBtn.addEventListener("click", closeModal);

		results.addEventListener("click", (e) => {
			const item = e.target.closest(".ob-global-search-item");
			if (item) {
				openFile(item.dataset.file);
			}
		});

		// Close on outside click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModal();
			}
		});
	}

	searchInFiles(files, query) {
		const results = [];
		const queryLower = query.toLowerCase();

		files.forEach((file) => {
			const content = file.content.toLowerCase();
			const originalContent = file.content;

			if (content.includes(queryLower)) {
				const snippets = [];
				let matches = 0;

				// Find all matches and create snippets
				const lines = originalContent.split("\n");
				lines.forEach((line, lineIndex) => {
					if (line.toLowerCase().includes(queryLower)) {
						matches++;
						// Create snippet with context
						const start = Math.max(0, lineIndex - 1);
						const end = Math.min(lines.length - 1, lineIndex + 1);
						const snippet = lines.slice(start, end + 1).join("\n");
						snippets.push(snippet);
					}
				});

				if (matches > 0) {
					results.push({
						fileName: file.name,
						icon: file.icon,
						matches: matches,
						snippets: snippets.slice(0, 3), // Show max 3 snippets
					});
				}
			}
		});

		return results.sort((a, b) => b.matches - a.matches);
	}

	highlightMatches(text, query) {
		const regex = new RegExp(`(${query})`, "gi");
		return text.replace(regex, "<mark>$1</mark>");
	}

	// Command Palette
	createCommandPaletteModal() {
		// Remove existing modal if any
		const existing = document.querySelector(".ob-command-palette");
		if (existing) {
			existing.remove();
		}

		// Define all available commands
		const commands = this.getAvailableCommands();

		const modal = document.createElement("div");
		modal.className = "ob-command-palette";
		modal.innerHTML = `
			<div class="ob-command-palette-header">
				<span class="material-icons-round" translate="no">terminal</span>
				<input type="text" class="ob-command-palette-input" placeholder="Type a command..." autocomplete="off">
				<button class="ob-command-palette-close">
					<span class="material-icons-round" translate="no">close</span>
				</button>
			</div>
			<div class="ob-command-palette-results">
				${this.renderCommands(commands)}
			</div>
		`;

		document.body.appendChild(modal);

		// Show modal
		requestAnimationFrame(() => {
			modal.classList.add("show");
		});

		const input = modal.querySelector(".ob-command-palette-input");
		const results = modal.querySelector(".ob-command-palette-results");
		const closeBtn = modal.querySelector(".ob-command-palette-close");
		let selectedIndex = 0;

		// Focus input
		input.focus();

		// Handle input
		input.addEventListener("input", (e) => {
			const query = e.target.value.trim().toLowerCase();

			if (query.length === 0) {
				results.innerHTML = this.renderCommands(commands);
				selectedIndex = 0;
				return;
			}

			const filteredCommands = commands.filter(
				(cmd) =>
					cmd.name.toLowerCase().includes(query) ||
					cmd.description.toLowerCase().includes(query) ||
					cmd.category.toLowerCase().includes(query) ||
					(cmd.keywords &&
						cmd.keywords.some((keyword) =>
							keyword.toLowerCase().includes(query)
						))
			);

			results.innerHTML = this.renderCommands(filteredCommands, query);
			selectedIndex = 0;
		});

		// Handle keyboard navigation
		input.addEventListener("keydown", (e) => {
			const items = results.querySelectorAll(".ob-command-palette-item");

			if (e.key === "ArrowDown") {
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
				this.updateCommandSelection(items, selectedIndex);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				this.updateCommandSelection(items, selectedIndex);
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (items[selectedIndex]) {
					const commandId = items[selectedIndex].dataset.commandId;
					this.executeCommand(commandId);
					this.closeCommandPalette(modal);
				}
			} else if (e.key === "Escape") {
				this.closeCommandPalette(modal);
			}
		});

		// Click handlers
		closeBtn.addEventListener("click", () =>
			this.closeCommandPalette(modal)
		);

		results.addEventListener("click", (e) => {
			const item = e.target.closest(".ob-command-palette-item");
			if (item) {
				const commandId = item.dataset.commandId;
				this.executeCommand(commandId);
				this.closeCommandPalette(modal);
			}
		});

		// Close on outside click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeCommandPalette(modal);
			}
		});

		// Set initial selection
		const firstItem = results.querySelector(".ob-command-palette-item");
		if (firstItem) {
			firstItem.classList.add("selected");
		}
	}

	getAvailableCommands() {
		return [
			// File operations
			{
				id: "new-file",
				name: "New Episode",
				description: "Create a new episode file",
				icon: "note_add",
				category: "File",
				keywords: ["create", "add"],
				action: () => this.createNewFile(),
			},
			{
				id: "new-season",
				name: "New Season",
				description: "Create a new season folder",
				icon: "create_new_folder",
				category: "File",
				keywords: ["folder", "create"],
				action: () => this.createNewSeason(),
			},
			{
				id: "save-file",
				name: "Save File",
				description: "Save the current file",
				icon: "save",
				category: "File",
				keywords: ["save"],
				action: () => this.saveCurrentFile(),
			},
			{
				id: "quick-switcher",
				name: "Quick File Switcher",
				description: "Quickly switch between files",
				icon: "swap_horiz",
				category: "File",
				keywords: ["switch", "open", "find"],
				action: () => this.showQuickSwitcher(),
			},

			// Navigation
			{
				id: "global-search",
				name: "Global Search",
				description: "Search across all files",
				icon: "search",
				category: "Search",
				keywords: ["find", "search"],
				action: () => this.showGlobalSearch(),
			},
			{
				id: "file-search",
				name: "Search in File",
				description: "Search within current file",
				icon: "find_in_page",
				category: "Search",
				keywords: ["find"],
				action: () => this.showSearch(),
			},

			// Tabs
			{
				id: "close-tab",
				name: "Close Tab",
				description: "Close the current tab",
				icon: "close",
				category: "Tabs",
				keywords: ["close"],
				action: () => this.closeCurrentTab(),
			},
			{
				id: "next-tab",
				name: "Next Tab",
				description: "Switch to next tab",
				icon: "navigate_next",
				category: "Tabs",
				keywords: ["next"],
				action: () => this.nextTab(),
			},
			{
				id: "previous-tab",
				name: "Previous Tab",
				description: "Switch to previous tab",
				icon: "navigate_before",
				category: "Tabs",
				keywords: ["prev"],
				action: () => this.previousTab(),
			},
			{
				id: "close-all-tabs",
				name: "Close All Tabs",
				description: "Close all open tabs",
				icon: "close_fullscreen",
				category: "Tabs",
				keywords: ["close"],
				action: () => this.closeAllTabs(),
			},

			// View
			{
				id: "toggle-focus",
				name: "Toggle Focus Mode",
				description: "Enter distraction-free writing mode",
				icon: "center_focus_strong",
				category: "View",
				keywords: ["focus", "zen"],
				action: () => this.toggleFocusMode(),
			},
			{
				id: "toggle-fullscreen",
				name: "Toggle Fullscreen",
				description: "Enter or exit fullscreen mode",
				icon: "fullscreen",
				category: "View",
				keywords: ["full"],
				action: () => this.toggleFullscreen(),
			},
			{
				id: "toggle-sidebar",
				name: "Toggle Sidebar",
				description: "Show or hide the sidebar",
				icon: "menu",
				category: "View",
				keywords: ["sidebar", "hide"],
				action: () => this.toggleSidebar(),
			},

			// Settings & Tools
			{
				id: "open-settings",
				name: "Open Settings",
				description: "Open application settings",
				icon: "settings",
				category: "Settings",
				keywords: ["config", "preferences"],
				action: () => this.openSettings(),
			},
			{
				id: "show-shortcuts",
				name: "Keyboard Shortcuts",
				description: "View all keyboard shortcuts",
				icon: "keyboard",
				category: "Help",
				keywords: ["help", "shortcuts"],
				action: () => this.showKeyboardShortcuts(),
			},
			{
				id: "show-changelog",
				name: "Show Changelog",
				description: "View recent updates and changes",
				icon: "history",
				category: "Help",
				keywords: ["updates", "news"],
				action: () => this.showChangelog(),
			},

			// Import/Export
			{
				id: "import-workspace",
				name: "Import Workspace",
				description: "Import a complete workspace",
				icon: "upload",
				category: "Import/Export",
				keywords: ["import", "load"],
				action: () => this.importWorkspace(),
			},
			{
				id: "export-workspace",
				name: "Export Workspace",
				description: "Export complete workspace",
				icon: "download",
				category: "Import/Export",
				keywords: ["export", "backup"],
				action: () => this.exportWorkspace(),
			},
			{
				id: "export-files",
				name: "Export Files Only",
				description: "Export files without settings",
				icon: "file_download",
				category: "Import/Export",
				keywords: ["export"],
				action: () => this.exportFiles(),
			},

			// Components
			{
				id: "add-actor",
				name: "Add Actor",
				description: "Add a new character/actor",
				icon: "person_add",
				category: "Components",
				keywords: ["character", "person"],
				action: () => this.addComponent("actor"),
			},
			{
				id: "add-location",
				name: "Add Location",
				description: "Add a new location",
				icon: "location_on",
				category: "Components",
				keywords: ["place", "setting"],
				action: () => this.addComponent("location"),
			},
			{
				id: "add-item",
				name: "Add Item",
				description: "Add a new item/prop",
				icon: "category",
				category: "Components",
				keywords: ["prop", "object"],
				action: () => this.addComponent("item"),
			},
			{
				id: "add-note",
				name: "Add Note",
				description: "Add a new note",
				icon: "notes",
				category: "Components",
				keywords: ["note", "memo"],
				action: () => this.addComponent("note"),
			},

			// Series Management
			{
				id: "new-series",
				name: "New Series",
				description: "Create a new series project",
				icon: "library_add",
				category: "Series",
				keywords: ["project"],
				action: () => this.createNewSeries(),
			},
			{
				id: "series-settings",
				name: "Series Settings",
				description: "Edit current series settings",
				icon: "tune",
				category: "Series",
				keywords: ["config"],
				action: () => this.openSeriesSettings(),
			},

			// Workspace
			{
				id: "clear-storage",
				name: "Clear Storage",
				description: "Clear all application data",
				icon: "clear_all",
				category: "Workspace",
				keywords: ["reset", "clear"],
				action: () => this.clearStorage(),
			},
			{
				id: "check-storage",
				name: "Storage Info",
				description: "View storage usage information",
				icon: "storage",
				category: "Workspace",
				keywords: ["space", "usage"],
				action: () => this.showStorageInfo(),
			},
		];
	}

	renderCommands(commands, query = "") {
		if (commands.length === 0) {
			return '<div class="ob-command-palette-empty">No commands found</div>';
		}

		// Group commands by category
		const grouped = {};
		commands.forEach((cmd) => {
			if (!grouped[cmd.category]) {
				grouped[cmd.category] = [];
			}
			grouped[cmd.category].push(cmd);
		});

		let html = "";
		Object.entries(grouped).forEach(([category, cmds]) => {
			html += `
				<div class="ob-command-palette-category">
					<div class="ob-command-palette-category-title">${category}</div>
					${cmds
						.map(
							(cmd) => `
						<div class="ob-command-palette-item" data-command-id="${cmd.id}">
							<span class="material-icons-round ob-command-palette-item-icon" translate="no">${
								cmd.icon
							}</span>
							<div class="ob-command-palette-item-content">
								<div class="ob-command-palette-item-name">${this.highlightQuery(
									cmd.name,
									query
								)}</div>
								<div class="ob-command-palette-item-desc">${this.highlightQuery(
									cmd.description,
									query
								)}</div>
							</div>
						</div>
					`
						)
						.join("")}
				</div>
			`;
		});

		return html;
	}

	highlightQuery(text, query) {
		if (!query) return text;
		const regex = new RegExp(`(${query})`, "gi");
		return text.replace(regex, "<mark>$1</mark>");
	}

	updateCommandSelection(items, selectedIndex) {
		items.forEach((item, index) => {
			item.classList.toggle("selected", index === selectedIndex);
		});

		// Scroll selected item into view
		if (items[selectedIndex]) {
			items[selectedIndex].scrollIntoView({ block: "nearest" });
		}
	}

	executeCommand(commandId) {
		const commands = this.getAvailableCommands();
		const command = commands.find((cmd) => cmd.id === commandId);

		if (command && command.action) {
			try {
				command.action();
				window.feedbackManager?.showSuccess(
					`Executed: ${command.name}`
				);
			} catch (error) {
				console.error("Command execution error:", error);
				window.feedbackManager?.showError(
					`Failed to execute: ${command.name}`
				);
			}
		}
	}

	closeCommandPalette(modal) {
		modal.classList.remove("show");
		setTimeout(() => {
			if (modal.parentNode) {
				modal.remove();
			}
		}, 200);
	}

	// Command action implementations
	createNewSeason() {
		const seasonBtn = document.querySelector(".ob-action-season");
		if (seasonBtn) {
			seasonBtn.click();
		}
	}

	closeAllTabs() {
		if (window.closeAllTabs) {
			window.closeAllTabs();
		}
	}

	toggleSidebar() {
		const toggleBtn = document.querySelector(".ob-header-menu-btn");
		if (toggleBtn) {
			toggleBtn.click();
		}
	}

	showChangelog() {
		const changelogBtn = document.querySelector(
			'.ob-header-controls button[title="changelog"]'
		);
		if (changelogBtn) {
			changelogBtn.click();
		}
	}

	importWorkspace() {
		const importBtn = document.querySelector(
			'.ob-header-controls button[title="Import"]'
		);
		if (importBtn) {
			importBtn.click();
		}
	}

	exportWorkspace() {
		if (window.exportWorkspace) {
			window.exportWorkspace();
		}
	}

	exportFiles() {
		if (window.exportFiles) {
			window.exportFiles();
		}
	}

	addComponent(type) {
		// Try to find components section and add component
		const componentsSection = document.querySelector(".ob-special-section");
		if (componentsSection && window.mobileNavigation) {
			// Use mobile navigation's add component method
			window.mobileNavigation.addComponent(componentsSection, type);
		}
	}

	createNewSeries() {
		const seriesAddBtn = document.querySelector(".ob-series-add-btn");
		if (seriesAddBtn) {
			seriesAddBtn.click();
		}
	}

	openSeriesSettings() {
		// Try to find active series and open its settings
		const activeSeries = document.querySelector(".ob-series-tile.active");
		if (activeSeries) {
			// Right click to open context menu (desktop)
			const event = new MouseEvent("contextmenu", { bubbles: true });
			activeSeries.dispatchEvent(event);
		}
	}

	clearStorage() {
		if (
			confirm(
				"Are you sure you want to clear all application data? This cannot be undone."
			)
		) {
			localStorage.clear();
			location.reload();
		}
	}

	showStorageInfo() {
		const usage = this.calculateStorageUsage();
		const message = `Storage Usage:\n- Total items: ${usage.itemCount}\n- Estimated size: ${usage.sizeKB}KB\n- Available quota: ${usage.quotaMB}MB`;
		alert(message);
	}

	calculateStorageUsage() {
		let totalSize = 0;
		let itemCount = 0;

		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				totalSize += localStorage[key].length;
				itemCount++;
			}
		}

		const sizeKB = Math.round(totalSize / 1024);
		const quotaMB =
			navigator.storage && navigator.storage.estimate
				? "Unknown"
				: "5-10";

		return { sizeKB, itemCount, quotaMB };
	}
}

const keyboardManager = new KeyboardManager();
export { KeyboardManager, keyboardManager };
