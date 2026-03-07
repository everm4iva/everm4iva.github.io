/**
 * OceanBoard Mobile Navigation
 * Handles mobile-specific UI interactions
 */

class MobileNavigation {
	constructor() {
		this.isMobile = window.innerWidth <= 767;
		this.sidebarOpen = false;
		this.backdrop = null;
		this.touchTimer = null;
		this.dragTimer = null;
		this.init();
	}

	init() {
		this.createMobileElements();
		this.attachEventListeners();
		this.handleResize();
	}

	createMobileElements() {
		// Create mobile menu button
		if (this.isMobile) {
			this.addMobileMenuButton();
			this.createBackdrop();
		}
	}

	addMobileMenuButton() {
		const header = document.querySelector(".ob-header");
		if (header && !header.querySelector(".ob-header-menu-btn")) {
			const menuBtn = document.createElement("button");
			menuBtn.className = "ob-header-menu-btn";
			menuBtn.innerHTML =
				'<span class="material-icons-round">menu</span>';
			menuBtn.title = "Open menu";

			// Insert at the beginning of header
			header.insertBefore(menuBtn, header.firstChild);

			menuBtn.addEventListener("click", () => {
				this.toggleSidebar();
			});
		}
	}

	createBackdrop() {
		if (!this.backdrop) {
			this.backdrop = document.createElement("div");
			this.backdrop.className = "ob-sidebar-backdrop";
			document.body.appendChild(this.backdrop);

			this.backdrop.addEventListener("click", () => {
				this.closeSidebar();
			});
		}
	}

	toggleSidebar() {
		if (this.sidebarOpen) {
			this.closeSidebar();
		} else {
			this.openSidebar();
		}
	}

	openSidebar() {
		if (!this.isMobile) return;

		const sidebar = document.querySelector(".ob-sidebar");
		const menuBtn = document.querySelector(".ob-header-menu-btn");

		if (sidebar) {
			sidebar.classList.add("mobile-open");
			this.sidebarOpen = true;

			if (this.backdrop) {
				this.backdrop.classList.add("active");
			}

			if (menuBtn) {
				menuBtn.innerHTML =
					'<span class="material-icons-round">close</span>';
				menuBtn.title = "Close menu";
			}

			// Prevent body scroll
			document.body.style.overflow = "hidden";
		}
	}

	closeSidebar() {
		if (!this.isMobile) return;

		const sidebar = document.querySelector(".ob-sidebar");
		const menuBtn = document.querySelector(".ob-header-menu-btn");

		if (sidebar) {
			sidebar.classList.remove("mobile-open");
			this.sidebarOpen = false;

			if (this.backdrop) {
				this.backdrop.classList.remove("active");
			}

			if (menuBtn) {
				menuBtn.innerHTML =
					'<span class="material-icons-round">menu</span>';
				menuBtn.title = "Open menu";
			}

			// Restore body scroll
			document.body.style.overflow = "";
		}
	}

	handleResize() {
		window.addEventListener("resize", () => {
			const wasMobile = this.isMobile;
			this.isMobile = window.innerWidth <= 767;

			if (wasMobile !== this.isMobile) {
				if (this.isMobile) {
					// Switched to mobile
					this.addMobileMenuButton();
					this.createBackdrop();
					if (this.sidebarOpen) {
						this.closeSidebar();
					}
				} else {
					// Switched to desktop
					this.removeMobileElements();
					this.closeSidebar();
				}
			}
		});
	}

	removeMobileElements() {
		const menuBtn = document.querySelector(".ob-header-menu-btn");
		if (menuBtn) {
			menuBtn.remove();
		}

		const sidebar = document.querySelector(".ob-sidebar");
		if (sidebar) {
			sidebar.classList.remove("mobile-open");
		}

		if (this.backdrop) {
			this.backdrop.remove();
			this.backdrop = null;
		}

		document.body.style.overflow = "";
		this.sidebarOpen = false;
	}

	// Auto-close sidebar when clicking on navigation items (mobile)
	attachEventListeners() {
		document.addEventListener("click", (e) => {
			if (!this.isMobile || !this.sidebarOpen) return;

			// Close sidebar when clicking on files/series
			if (e.target.closest(".ob-tree-list li, .ob-series-tile")) {
				setTimeout(() => {
					this.closeSidebar();
				}, 100);
			}
		});

		// Handle escape key
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.isMobile && this.sidebarOpen) {
				this.closeSidebar();
			}
		});

		// Handle orientation change
		window.addEventListener("orientationchange", () => {
			setTimeout(() => {
				this.handleResize();
			}, 100);
		});
	}

	// Touch improvements
	addTouchSupport() {
		const touchElements = document.querySelectorAll(
			".ob-tree-list li, .ob-tab, .ob-header-btn, .ob-md-btn, .ob-series-tile"
		);

		touchElements.forEach((element) => {
			element.addEventListener("touchstart", function () {
				this.style.transform = "scale(0.95)";
			});

			element.addEventListener("touchend", function () {
				this.style.transform = "";
			});

			element.addEventListener("touchcancel", function () {
				this.style.transform = "";
			});
		});
	}

	// Viewport height fix for mobile browser
	fixViewportHeight() {
		const setVH = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		setVH();
		window.addEventListener("resize", setVH);
		window.addEventListener("orientationchange", () => {
			setTimeout(setVH, 100);
		});
	}

	// Detect if device supports hover
	detectHoverSupport() {
		const hasHover = window.matchMedia("(hover: hover)").matches;
		if (!hasHover) {
			document.body.classList.add("no-hover");
		}
	}

	// Initialize all
	initMobileFeatures() {
		this.fixViewportHeight();
		this.detectHoverSupport();
		this.addTouchSupport();
		this.setupMobileContextMenus();
		this.setupMobileDragDrop();
	}

	setupMobileContextMenus() {
		if (!this.isMobile) return;

		let touchTarget = null;
		let contextMenuData = null;

		// Touch and hold detection
		document.addEventListener(
			"touchstart",
			(e) => {
				// Exclude media section and series tiles
				if (e.target.closest(".ob-media-section, .ob-series-tile"))
					return;

				// Check if the target is a context-menu enabled element
				const target = e.target.closest(
					"[data-context-menu], .ob-tree-list li, .ob-tree-title"
				);
				if (!target) return;

				touchTarget = target;
				contextMenuData =
					target.dataset.contextMenu ||
					this.getContextTypeFromElement(target);

				// no context menu if no context type or if explicitly excluded
				if (
					!contextMenuData ||
					contextMenuData === "components-section"
				)
					return;

				this.touchTimer = setTimeout(() => {
					e.preventDefault();
					this.showMobileContextMenu(
						e.touches[0],
						target,
						contextMenuData
					);
					if (navigator.vibrate) {
						navigator.vibrate(50);
					}
				}, 500);
			},
			{ passive: false }
		);

		document.addEventListener(
			"touchmove",
			() => {
				if (this.touchTimer) {
					clearTimeout(this.touchTimer);
					this.touchTimer = null;
				}
			},
			{ passive: true }
		);

		document.addEventListener(
			"touchend",
			() => {
				if (this.touchTimer) {
					clearTimeout(this.touchTimer);
					this.touchTimer = null;
				}
			},
			{ passive: true }
		);

		// no default right-click context menu on mobile
		document.addEventListener("contextmenu", (e) => {
			if (this.isMobile) {
				// Don't prevent context menu for media sections or series
				if (e.target.closest(".ob-media-section, .ob-series-tile"))
					return;

				if (
					e.target.closest("[data-context-menu]") ||
					e.target.closest(".ob-tree-list li") ||
					e.target.closest(".ob-tree-title")
				) {
					e.preventDefault();
				}
			}
		});
	}

	getContextTypeFromElement(element) {
		// no create context menu for media sections, series, or components section
		if (element.closest(".ob-media-section")) return null;
		if (element.classList.contains("ob-series-tile")) return null;

		if (element.classList.contains("ob-tree-title")) {
			if (element.classList.contains("ob-special-title")) {
				return null; // no create context menu for components section
			}
			return "season-item";
		}
		if (element.closest(".ob-special-section .ob-tree-list")) {
			return "component-item";
		}
		if (element.closest(".ob-tree-list")) {
			if (element.querySelector(".ob-tree-folder")) return "folder-item";
			return "file-item";
		}
		return "default";
	}

	showMobileContextMenu(touch, target, menuType) {
		// Remove any existing mobile context menu
		const existing = document.querySelector(".ob-mobile-context-menu");
		if (existing) existing.remove();

		// Create context menu
		const menu = document.createElement("div");
		menu.className = "ob-mobile-context-menu";

		// Get menu items based on type
		const items = this.getContextMenuItems(menuType, target);

		items.forEach((item) => {
			const menuItem = document.createElement("button");
			menuItem.className = "ob-mobile-context-item";
			menuItem.innerHTML = `
                <span class="material-icons-round">${item.icon}</span>
                <span>${item.label}</span>
            `;
			menuItem.onclick = () => {
				item.action(target);
				menu.remove();
			};
			menu.appendChild(menuItem);
		});

		// Position menu (prevent going off-screen)
		const x = Math.min(touch.clientX, window.innerWidth - 200);
		const y = Math.min(touch.clientY, window.innerHeight - 250);

		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;

		document.body.appendChild(menu);

		// Animate in
		requestAnimationFrame(() => {
			menu.classList.add("show");
		});

		// Close menu on touch outside
		const closeMenu = (e) => {
			if (!menu.contains(e.target)) {
				menu.classList.remove("show");
				setTimeout(() => {
					if (menu.parentNode) menu.remove();
				}, 200);
				document.removeEventListener("touchstart", closeMenu);
				document.removeEventListener("click", closeMenu);
			}
		};

		setTimeout(() => {
			document.addEventListener("touchstart", closeMenu);
			document.addEventListener("click", closeMenu);
		}, 100);
	}

	getContextMenuItems(menuType, target) {
		const items = [];

		switch (menuType) {
			case "file-item":
				items.push(
					{ icon: "edit", label: "Edit", action: (el) => el.click() },
					{
						icon: "visibility",
						label: "Preview",
						action: (el) => this.previewFile(el),
					},
					{
						icon: "edit_note",
						label: "Rename",
						action: (el) => this.renameEpisode(el),
					},
					{
						icon: "content_copy",
						label: "Duplicate",
						action: (el) => this.duplicateFileItem(el),
					},
					{
						icon: "delete",
						label: "Delete",
						action: (el) => this.deleteFileItem(el),
					}
				);
				break;

			case "folder-item":
				items.push(
					{
						icon: "folder_open",
						label: "Open",
						action: (el) => el.click(),
					},
					{
						icon: "add",
						label: "New Episode",
						action: (el) => this.addNewEpisode(el),
					},
					{
						icon: "edit",
						label: "Rename",
						action: (el) => this.renameFolder(el),
					},
					{
						icon: "delete",
						label: "Delete",
						action: (el) => this.deleteFolder(el),
					}
				);
				break;

			case "season-item":
				items.push(
					{
						icon: "visibility",
						label: "Expand/Collapse",
						action: (el) => el.click(),
					},
					{
						icon: "add",
						label: "New Episode",
						action: (el) => this.addNewEpisode(el),
					},
					{
						icon: "edit",
						label: "Rename Season",
						action: (el) => this.renameSeason(el),
					},
					{
						icon: "delete",
						label: "Delete Season",
						action: (el) => this.deleteSeason(el),
					}
				);
				break;

			case "component-item":
				items.push(
					{ icon: "edit", label: "Edit", action: (el) => el.click() },
					{
						icon: "content_copy",
						label: "Duplicate",
						action: (el) => this.duplicateComponent(el),
					},
					{
						icon: "delete",
						label: "Delete",
						action: (el) => this.deleteComponent(el),
					}
				);
				break;
		}

		return items;
	}

	// Context menu actions
	previewFile(element) {
		const fileId =
			element.dataset.fileId || element.getAttribute("data-id");
		if (window.filePreview) {
			window.filePreview(fileId);
		}
	}

	duplicateFileItem(element) {
		if (window.duplicateFile) {
			const fileId =
				element.dataset.fileId || element.getAttribute("data-id");
			window.duplicateFile(fileId);
		}
	}

	deleteFileItem(element) {
		if (confirm("Are you sure you want to delete this file?")) {
			if (window.deleteFile) {
				const fileId =
					element.dataset.fileId || element.getAttribute("data-id");
				window.deleteFile(fileId);
			}
		}
	}

	// Episode-specific actions
	renameEpisode(element) {
		// Get the text content (excluding icon)
		const textNodes = Array.from(element.childNodes).filter(
			(node) => node.nodeType === 3
		);
		const currentName = textNodes
			.map((n) => n.textContent.trim())
			.join("")
			.trim();

		const newName = prompt("Rename episode:", currentName);
		if (newName && newName !== currentName) {
			// Replace the text content while keeping the icon
			const icon = element.querySelector(".material-icons-round");
			element.innerHTML = "";
			if (icon) {
				element.appendChild(icon);
			}
			element.appendChild(document.createTextNode(" " + newName));

			// Trigger save if available
			if (window.saveWorkspace) {
				window.saveWorkspace();
			}
		}
	}

	// Season-specific actions
	renameSeason(element) {
		const currentName = element.textContent.trim();
		const newName = prompt("Rename season:", currentName);
		if (newName && newName !== currentName) {
			element.textContent = newName;
			// Trigger save if available
			if (window.saveWorkspace) {
				window.saveWorkspace();
			}
		}
	}

	deleteSeason(element) {
		if (
			confirm(
				"Are you sure you want to delete this season and all its episodes?"
			)
		) {
			const section = element.closest(".ob-tree-section");
			if (section) {
				section.remove();
				// Trigger save if available
				if (window.saveWorkspace) {
					window.saveWorkspace();
				}
			}
		}
	}

	addNewEpisode(element) {
		// Find the season section
		const section = element.closest(".ob-tree-section");
		if (!section) return;

		const list = section.querySelector(".ob-tree-list");
		if (!list) return;

		const episodeCount = list.children.length + 1;
		const episodeName = `[EP${episodeCount}] - New Episode`;

		const newEpisode = document.createElement("li");
		newEpisode.innerHTML = `<span class="material-icons-round" translate="no">description</span> ${episodeName}`;
		newEpisode.setAttribute("data-context-menu", "file-item");
		newEpisode.setAttribute("data-file-id", `episode-${Date.now()}`);

		list.appendChild(newEpisode);

		// Trigger save if available
		if (window.saveWorkspace) {
			window.saveWorkspace();
		}
	}

	// Component-specific actions
	addComponent(element, type) {
		const section = element.closest(".ob-special-section");
		if (!section) return;

		const list = section.querySelector(".ob-tree-list");
		if (!list) return;

		let componentName;
		let icon;

		switch (type) {
			case "actor":
				componentName = prompt("Enter actor name:", "New Actor");
				icon = "person";
				break;
			case "location":
				componentName = prompt("Enter location name:", "New Location");
				icon = "location_on";
				break;
			case "item":
				componentName = prompt("Enter item name:", "New Item");
				icon = "category";
				break;
			case "note":
				componentName = prompt("Enter note title:", "New Note");
				icon = "notes";
				break;
			default:
				componentName = prompt(
					"Enter component name:",
					"New Component"
				);
				icon = "description";
		}

		if (!componentName) return;

		const newComponent = document.createElement("li");
		newComponent.innerHTML = `<span class="material-icons-round" translate="no">${icon}</span> ${componentName}`;
		newComponent.setAttribute("data-context-menu", "component-item");
		newComponent.setAttribute("data-component-type", type);
		newComponent.setAttribute("data-file-id", `${type}-${Date.now()}`);

		list.appendChild(newComponent);

		// Trigger save if available
		if (window.saveWorkspace) {
			window.saveWorkspace();
		}
	}

	duplicateComponent(element) {
		const componentName = element.textContent.trim();
		const type = element.getAttribute("data-component-type") || "component";

		const newName = prompt(
			"Duplicate component as:",
			`${componentName} - Copy`
		);
		if (!newName) return;

		const newComponent = element.cloneNode(true);
		const textNode =
			newComponent.childNodes[newComponent.childNodes.length - 1];
		if (textNode && textNode.nodeType === 3) {
			textNode.textContent = ` ${newName}`;
		}

		newComponent.setAttribute("data-file-id", `${type}-${Date.now()}`);
		element.parentNode.appendChild(newComponent);

		// Trigger save if available
		if (window.saveWorkspace) {
			window.saveWorkspace();
		}
	}

	deleteComponent(element) {
		const componentName = element.textContent.trim();
		if (confirm(`Are you sure you want to delete "${componentName}"?`)) {
			element.remove();

			// Trigger save if available
			if (window.saveWorkspace) {
				window.saveWorkspace();
			}
		}
	}

	setupMobileDragDrop() {
		if (!this.isMobile) return;

		let dragData = null;
		let dragElement = null;
		let placeholder = null;
		let isDragging = false;
		let dragPreview = null;

		document.addEventListener(
			"touchstart",
			(e) => {
				if (
					e.target.closest(
						".ob-tree-title, .ob-header-btn, .ob-md-btn"
					)
				)
					return;

				const draggable = e.target.closest(
					'[draggable="true"], .ob-tree-list li, .ob-tab'
				);
				if (!draggable || e.touches.length > 1) return;

				const touch = e.touches[0];

				this.dragTimer = setTimeout(() => {
					if (!isDragging && !this.touchTimer) {
						// no start drag if context menu timer is active
						dragElement = draggable;
						dragData = {
							element: draggable,
							startX: touch.clientX,
							startY: touch.clientY,
							offsetX:
								touch.clientX -
								draggable.getBoundingClientRect().left,
							offsetY:
								touch.clientY -
								draggable.getBoundingClientRect().top,
						};
					}
				}, 800);
			},
			{ passive: true }
		);

		document.addEventListener(
			"touchmove",
			(e) => {
				// Clear drag timer if moving before drag starts
				if (this.dragTimer && !dragData) {
					clearTimeout(this.dragTimer);
					this.dragTimer = null;
					return;
				}

				if (!dragData) return;

				const touch = e.touches[0];
				const deltaX = Math.abs(touch.clientX - dragData.startX);
				const deltaY = Math.abs(touch.clientY - dragData.startY);

				// Only start dragging if moved enough
				if (deltaX > 10 || deltaY > 10) {
					e.preventDefault();
					isDragging = true;

					// Create drag preview if not exists
					if (!dragPreview) {
						dragPreview = dragElement.cloneNode(true);
						dragPreview.className =
							dragElement.className + " ob-drag-preview";
						dragPreview.style.position = "fixed";
						dragPreview.style.pointerEvents = "none";
						dragPreview.style.zIndex = "10000";
						dragPreview.style.opacity = "0.8";
						dragPreview.style.transform = "scale(0.95)";
						document.body.appendChild(dragPreview);

						// Create placeholder
						placeholder = document.createElement("div");
						placeholder.className = "ob-drag-placeholder";
						placeholder.style.height =
							dragElement.offsetHeight + "px";
						placeholder.style.margin =
							getComputedStyle(dragElement).margin;
						dragElement.parentNode.insertBefore(
							placeholder,
							dragElement
						);

						// Hide original
						dragElement.style.opacity = "0.3";
					}

					// Position drag preview
					dragPreview.style.left =
						touch.clientX - dragData.offsetX + "px";
					dragPreview.style.top =
						touch.clientY - dragData.offsetY + "px";

					// Find drop target
					const elementBelow = document.elementFromPoint(
						touch.clientX,
						touch.clientY
					);
					const dropZone = elementBelow?.closest(
						".ob-tree-list, .ob-tab-bar"
					);

					if (dropZone && dropZone.contains(placeholder)) {
						// Find best insertion point
						const siblings = Array.from(dropZone.children).filter(
							(child) =>
								child !== placeholder && child !== dragElement
						);

						let insertBefore = null;
						for (const sibling of siblings) {
							const rect = sibling.getBoundingClientRect();
							if (touch.clientY < rect.top + rect.height / 2) {
								insertBefore = sibling;
								break;
							}
						}

						if (insertBefore) {
							dropZone.insertBefore(placeholder, insertBefore);
						} else {
							dropZone.appendChild(placeholder);
						}
					}
				}
			},
			{ passive: false }
		);

		document.addEventListener("touchend", () => {
			// Clear drag timer
			if (this.dragTimer) {
				clearTimeout(this.dragTimer);
				this.dragTimer = null;
			}

			if (!dragData) return;

			if (isDragging) {
				// Handle drop
				if (placeholder && placeholder.parentNode) {
					placeholder.parentNode.insertBefore(
						dragElement,
						placeholder
					);

					// Trigger reorder event if needed
					if (window.handleReorder) {
						window.handleReorder(
							dragElement,
							placeholder.parentNode
						);
					}
				}

				// Clean up
				if (dragPreview) {
					dragPreview.remove();
					dragPreview = null;
				}

				if (placeholder) {
					placeholder.remove();
					placeholder = null;
				}

				dragElement.style.opacity = "";
			}

			// Reset
			dragData = null;
			dragElement = null;
			isDragging = false;
		});

		// Cancel drag on additional touches
		document.addEventListener("touchstart", (e) => {
			if (e.touches.length > 1 && isDragging) {
				// Cancel drag
				if (dragPreview) dragPreview.remove();
				if (placeholder) placeholder.remove();
				if (dragElement) dragElement.style.opacity = "";

				dragData = null;
				dragElement = null;
				dragPreview = null;
				placeholder = null;
				isDragging = false;
			}
		});
	}
}

const mobileNavigation = new MobileNavigation();
mobileNavigation.initMobileFeatures();
export { MobileNavigation, mobileNavigation };
