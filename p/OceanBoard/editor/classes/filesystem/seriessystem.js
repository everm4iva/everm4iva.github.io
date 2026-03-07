/* === Series Management System === */

import { saveWorkspace, loadWorkspace, restoreWorkspace } from "./storage.js";
import { initializeDragDrop } from "./dragdrop.js";
import { attachFileClickHandlers, closeAllTabs } from "../index.js";
import { ParticleSystem } from "../forStyles/particles.js";

let currentSeriesId = null;
let seriesContextMenu = null;
let particleSystem = null;

export function initializeSeriesSystem() {
	restoreAllSeries();
	ensureDefaultSeriesMetadata();
	loadAllSeriesCovers();
	loadActiveSeries();
	attachSeriesTileListeners();
	createSeriesContextMenu();

	const addBtn = document.querySelector(".ob-series-add-btn");
	if (addBtn) {
		addBtn.addEventListener("click", createNewSeries);
	}

	console.log("[Series System] Initialized");
}

function restoreAllSeries() {
	const seriesList = JSON.parse(
		localStorage.getItem("ob-series-list") || "[]"
	);
	const tilesContainer = document.querySelector(".ob-series-tiles");

	if (seriesList.length > 0) {
		// Restore all saved series
		seriesList.forEach((seriesId) => {
			const metadata = loadSeriesMetadata(seriesId);
			if (metadata) {
				createSeriesTile(metadata);
			}
		});

		console.log(
			"[Series System] Restored",
			seriesList.length,
			"series from localStorage"
		);
	} else {
		// No series - show empty state
		tilesContainer.innerHTML = "";
		showEmptyState();
		console.log("[Series System] No series found - showing empty state");
	}
}

function showEmptyState() {
	const titleElement = document.querySelector(".ob-project-title-static");
	if (titleElement) {
		titleElement.textContent = "OceanBoard";
	}

	// ALWAYS show sidebar bar (series tiles strip with + button)
	const sidebarBar = document.querySelector(".ob-sidebar-bar");
	if (sidebarBar) {
		sidebarBar.style.display = "flex";
	}

	// Hide sidebar content (files/seasons explorer) when workspace is empty
	const sidebarContent = document.querySelector(".ob-sidebar-content");
	if (sidebarContent) {
		sidebarContent.style.display = "none";
	}

	// Clear workspace
	const treeContainer = document.querySelector(".ob-tree");
	const specialList = document.querySelector(
		".ob-special-section .ob-tree-list"
	);

	if (treeContainer) treeContainer.innerHTML = "";
	if (specialList) specialList.innerHTML = "";

	// Show welcome message in content area
	const contentSection = document.querySelector(".ob-content");
	if (contentSection) {
		// Make content section relative for particles
		contentSection.style.position = "relative";

		contentSection.innerHTML = `
			<div class="ob-welcome ob-empty-state ob-animate-fade-in">
				<h1 class="ob-animate-bounce-in"><span class="ob-logo-text">Welcome to OceanBoard</span></h1>
				<p class="ob-animate-slide-left ob-animate-stagger-1">Your creative workspace for creative work!</p>
				
				<div class="ob-welcome-buttons ob-animate-slide-right ob-animate-stagger-2">
					<a href="../" target="_blank" class="ob-welcome-btn ob-animate-stagger-3">
						<span class="material-icons-round" translate="no">language</span>
						<span>Website</span>
					</a>
					<a href="../changelog" target="_blank" class="ob-welcome-btn ob-animate-stagger-4">
						<span class="material-icons-round" translate="no">history</span>
						<span>Changelog</span>
					</a>
					<a href="../docs" target="_blank" class="ob-welcome-btn ob-animate-stagger-5">
						<span class="material-icons-round" translate="no">book</span>
						<span>Documentation</span>
					</a>
				</div>
				
				<p class="ob-welcome-hint ob-animate-fade-in" style="animation-delay: 0.6s;">
					Click the <span class="material-icons-round" translate="no" style="font-size: 1em; vertical-align: middle;">add</span> button on the left to create your first series
				</p>
			</div>
		`;

		// Initialize particle system
		if (particleSystem) {
			particleSystem.destroy();
		}
		particleSystem = new ParticleSystem(contentSection);
		particleSystem.init();
		particleSystem.start();

		console.log("[Series System] Empty state with particles active");
	}
}

function createSeriesTile(metadata) {
	const tilesContainer = document.querySelector(".ob-series-tiles");
	const newTile = document.createElement("div");
	newTile.className = "ob-series-tile ob-animate-bounce-in";
	newTile.dataset.seriesId = metadata.id;
	newTile.dataset.contextMenu = "series-item";
	newTile.title = metadata.name;

	// Create inner content
	const tileContent = document.createElement("div");
	tileContent.className = "ob-series-tile-content";
	tileContent.textContent = metadata.initials;
	newTile.appendChild(tileContent);

	// Apply custom color
	if (metadata.color && metadata.color !== "#E43967") {
		newTile.style.backgroundColor = metadata.color;
	}

	// Apply cover image
	if (metadata.coverImage) {
		newTile.style.backgroundImage = `url(${metadata.coverImage})`;
		newTile.style.backgroundSize = "cover";
		newTile.style.backgroundPosition = "center";
		newTile.classList.add("has-cover");
	}

	// Attach click listener
	newTile.addEventListener("click", handleSeriesClick);

	tilesContainer.appendChild(newTile);
	return newTile;
}

function ensureDefaultSeriesMetadata() {
	// Create metadata for existing tiles if they don't have it
	document.querySelectorAll(".ob-series-tile").forEach((tile) => {
		const seriesId = tile.dataset.seriesId;
		let metadata = loadSeriesMetadata(seriesId);

		if (!metadata) {
			const content = tile.querySelector(".ob-series-tile-content");
			const initials = content ? content.textContent : tile.textContent;
			const name = tile.title || initials;

			metadata = {
				id: seriesId,
				name: name,
				initials: initials.trim(),
				color: "#E43967",
				coverImage: null,
				createdAt: Date.now(),
			};

			saveSeriesMetadata(seriesId, metadata);
			console.log("[Series System] Created default metadata for:", name);
		}
	});
}

function loadAllSeriesCovers() {
	document.querySelectorAll(".ob-series-tile").forEach((tile) => {
		const seriesId = tile.dataset.seriesId;
		const metadata = loadSeriesMetadata(seriesId);

		if (metadata) {
			// Apply custom color
			if (metadata.color && metadata.color !== "#E43967") {
				tile.style.backgroundColor = metadata.color;
			}

			// Apply cover image
			if (metadata.coverImage) {
				tile.style.backgroundImage = `url(${metadata.coverImage})`;
				tile.style.backgroundSize = "cover";
				tile.style.backgroundPosition = "center";
				tile.classList.add("has-cover");
			}

			// Wrap text in content div if not already
			if (!tile.querySelector(".ob-series-tile-content")) {
				const text = tile.textContent;
				tile.textContent = "";
				const content = document.createElement("div");
				content.className = "ob-series-tile-content";
				content.textContent = text;
				tile.appendChild(content);
			}
		}
	});
}

function loadActiveSeries() {
	const seriesList = JSON.parse(
		localStorage.getItem("ob-series-list") || "[]"
	);

	// Don't load anything if there are no series
	if (seriesList.length === 0) {
		console.log(
			"[Series System] No series available - staying in empty state"
		);
		return;
	}

	const savedSeriesId = localStorage.getItem("ob-active-series");
	const firstTile = document.querySelector(".ob-series-tile");

	if (savedSeriesId) {
		currentSeriesId = savedSeriesId;
		const tile = document.querySelector(
			`[data-series-id="${savedSeriesId}"]`
		);
		if (tile) {
			setActiveSeries(tile);
		} else if (firstTile) {
			setActiveSeries(firstTile);
		}
	} else if (firstTile) {
		setActiveSeries(firstTile);
	}
}

function attachSeriesTileListeners() {
	document.querySelectorAll(".ob-series-tile").forEach((tile) => {
		tile.addEventListener("click", handleSeriesClick);
	});
}

function handleSeriesClick(e) {
	if (e.button === 0) {
		setActiveSeries(this);
	}
}

function setActiveSeries(tile) {
	const seriesId = tile.dataset.seriesId;
	const seriesName = tile.getAttribute("title");

	// Update active state
	document
		.querySelectorAll(".ob-series-tile")
		.forEach((t) => t.classList.remove("active"));
	tile.classList.add("active");

	// Save current series workspace before switching
	if (currentSeriesId && currentSeriesId !== seriesId) {
		saveWorkspace(currentSeriesId);
	}

	currentSeriesId = seriesId;
	localStorage.setItem("ob-active-series", seriesId);

	// Update title
	const titleElement = document.querySelector(".ob-project-title-static");
	if (titleElement) {
		titleElement.textContent = seriesName;
	}

	// Load series workspace
	loadSeriesWorkspace(seriesId);

	console.log("[Series System] Switched to:", seriesName);
}

function loadSeriesWorkspace(seriesId) {
	// Stop particles when loading a series
	if (particleSystem) {
		particleSystem.destroy();
		particleSystem = null;
	}

	// Show sidebar bar (series tiles) when loading a series
	const sidebarBar = document.querySelector(".ob-sidebar-bar");
	if (sidebarBar) {
		sidebarBar.style.display = "flex";
	}

	// Show sidebar content (files/seasons) when loading a series
	const sidebarContent = document.querySelector(".ob-sidebar-content");
	if (sidebarContent) {
		sidebarContent.style.display = "flex";
	}

	// Clear current workspace
	const treeContainer = document.querySelector(".ob-tree");
	const specialList = document.querySelector(
		".ob-special-section .ob-tree-list"
	);

	if (treeContainer) treeContainer.innerHTML = "";
	if (specialList) specialList.innerHTML = "";

	// Load series-specific workspace
	restoreWorkspace(seriesId);
	initializeDragDrop();
	attachFileClickHandlers();
}

function createNewSeries() {
	const seriesName = prompt("Enter series name:", "New Series");
	if (!seriesName) return;

	const seriesId = "series-" + Date.now();
	const initials = getSeriesInitials(seriesName);

	// Save series metadata
	const seriesData = {
		id: seriesId,
		name: seriesName,
		initials: initials,
		color: "#E43967",
		coverImage: null,
		createdAt: Date.now(),
	};

	saveSeriesMetadata(seriesId, seriesData);

	// Create series tile (already has click listener)
	const newTile = createSeriesTile(seriesData);

	// Switch to new series (will show sidebar automatically)
	setActiveSeries(newTile);

	console.log("[Series System] Created new series:", seriesName);
}

function getSeriesInitials(name) {
	const words = name.trim().split(/\s+/);
	if (words.length === 1) {
		return name.substring(0, 2).toUpperCase();
	}
	return (words[0][0] + words[1][0]).toUpperCase();
}

function saveSeriesMetadata(seriesId, data) {
	localStorage.setItem("ob-series-meta-" + seriesId, JSON.stringify(data));

	// Update series list
	const seriesList = JSON.parse(
		localStorage.getItem("ob-series-list") || "[]"
	);
	if (!seriesList.includes(seriesId)) {
		seriesList.push(seriesId);
		localStorage.setItem("ob-series-list", JSON.stringify(seriesList));
	}
}

function loadSeriesMetadata(seriesId) {
	const data = localStorage.getItem("ob-series-meta-" + seriesId);
	return data ? JSON.parse(data) : null;
}

function createSeriesContextMenu() {
	seriesContextMenu = document.createElement("div");
	seriesContextMenu.className = "ob-series-context-menu";
	seriesContextMenu.innerHTML = `
		<div class="ob-context-item" data-action="rename">
			<span class="material-icons-round" translate="no">edit</span>
			<span>Rename</span>
		</div>
		<div class="ob-context-item" data-action="color">
			<span class="material-icons-round" translate="no">palette</span>
			<span>Change Color</span>
		</div>
		<div class="ob-context-item" data-action="cover">
			<span class="material-icons-round" translate="no">image</span>
			<span>Change Cover</span>
		</div>
		<div class="ob-context-item" data-action="remove-cover">
			<span class="material-icons-round" translate="no">hide_image</span>
			<span>Remove Cover</span>
		</div>
		<div class="ob-context-divider"></div>
		<div class="ob-context-item ob-context-danger" data-action="delete">
			<span class="material-icons-round" translate="no">delete</span>
			<span>Delete Series</span>
		</div>
	`;
	document.body.appendChild(seriesContextMenu);

	seriesContextMenu.addEventListener("click", handleSeriesContextAction);

	document.addEventListener("click", () => {
		hideSeriesContextMenu();
	});

	// Attach context menu to series tiles
	document.addEventListener("contextmenu", (e) => {
		const tile = e.target.closest(".ob-series-tile");
		if (tile) {
			e.preventDefault();
			showSeriesContextMenu(e.pageX, e.pageY, tile);
		}
	});
}

let contextTargetTile = null;

function showSeriesContextMenu(x, y, tile) {
	hideSeriesContextMenu();
	contextTargetTile = tile;

	seriesContextMenu.style.left = x + "px";
	seriesContextMenu.style.top = y + "px";
	seriesContextMenu.classList.add("visible");

	const rect = seriesContextMenu.getBoundingClientRect();
	if (rect.right > window.innerWidth) {
		seriesContextMenu.style.left = x - rect.width + "px";
	}
	if (rect.bottom > window.innerHeight) {
		seriesContextMenu.style.top = y - rect.height + "px";
	}
}

function hideSeriesContextMenu() {
	if (seriesContextMenu) {
		seriesContextMenu.classList.remove("visible");
		contextTargetTile = null;
	}
}

function handleSeriesContextAction(e) {
	const item = e.target.closest(".ob-context-item");
	if (!item || !contextTargetTile) return;

	const action = item.dataset.action;
	const seriesId = contextTargetTile.dataset.seriesId;
	const metadata = loadSeriesMetadata(seriesId);

	switch (action) {
		case "rename":
			handleSeriesRename(contextTargetTile, seriesId, metadata);
			break;
		case "color":
			handleSeriesColorChange(contextTargetTile, seriesId, metadata);
			break;
		case "cover":
			handleSeriesCoverChange(contextTargetTile, seriesId, metadata);
			break;
		case "remove-cover":
			handleSeriesRemoveCover(contextTargetTile, seriesId, metadata);
			break;
		case "delete":
			handleSeriesDelete(contextTargetTile, seriesId);
			break;
	}

	hideSeriesContextMenu();
}

function handleSeriesRename(tile, seriesId, metadata) {
	const newName = prompt("Rename series:", metadata.name);
	if (!newName || newName === metadata.name) return;

	const newInitials = getSeriesInitials(newName);

	metadata.name = newName;
	metadata.initials = newInitials;
	saveSeriesMetadata(seriesId, metadata);

	tile.title = newName;

	// Update content
	const content = tile.querySelector(".ob-series-tile-content");
	if (content) {
		content.textContent = newInitials;
	} else {
		tile.textContent = newInitials;
	}

	if (tile.classList.contains("active")) {
		document.querySelector(".ob-project-title-static").textContent =
			newName;
	}

	console.log("[Series System] Renamed series to:", newName);
}

function handleSeriesColorChange(tile, seriesId, metadata) {
	const newColor = prompt("Enter color (hex):", metadata.color || "#E43967");
	if (!newColor || newColor === metadata.color) return;

	metadata.color = newColor;
	saveSeriesMetadata(seriesId, metadata);

	tile.style.backgroundColor = newColor;

	console.log("[Series System] Changed series color to:", newColor);
}

function handleSeriesCoverChange(tile, seriesId, metadata) {
	// Verify if metadata exists
	if (!metadata) {
		metadata = {
			id: seriesId,
			name: tile.title || "Series",
			initials:
				tile.querySelector(".ob-series-tile-content")?.textContent ||
				"S",
			color: "#E43967",
			coverImage: null,
			createdAt: Date.now(),
		};
	}

	// Create file input
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";

	input.onchange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Check file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			alert("Image is too large! Please choose an image under 2MB.");
			return;
		}

		// Read file as base64
		const reader = new FileReader();
		reader.onload = (event) => {
			const base64Image = event.target.result;

			// Save cover image
			metadata.coverImage = base64Image;
			saveSeriesMetadata(seriesId, metadata);

			// Update tile with cover
			tile.style.backgroundImage = `url(${base64Image})`;
			tile.style.backgroundSize = "cover";
			tile.style.backgroundPosition = "center";
			tile.classList.add("has-cover");

			console.log("[Series System] Cover image set for:", metadata.name);
		};

		reader.readAsDataURL(file);
	};

	input.click();
}

function handleSeriesRemoveCover(tile, seriesId, metadata) {
	metadata.coverImage = null;
	saveSeriesMetadata(seriesId, metadata);

	tile.style.backgroundImage = "";
	tile.classList.remove("has-cover");

	console.log("[Series System] Removed cover image from:", metadata.name);
}

function handleSeriesDelete(tile, seriesId) {
	const metadata = loadSeriesMetadata(seriesId);

	if (confirm(`Delete series "${metadata.name}" and all its content?`)) {
		if (confirm("This cannot be undone! Are you sure?")) {
			// Close all open tabs
			closeAllTabs();

			// Remove from series list
			const seriesList = JSON.parse(
				localStorage.getItem("ob-series-list") || "[]"
			);
			const newList = seriesList.filter((id) => id !== seriesId);
			localStorage.setItem("ob-series-list", JSON.stringify(newList));

			// Remove metadata
			localStorage.removeItem("ob-series-meta-" + seriesId);

			// Remove workspace data
			localStorage.removeItem("ob-workspace-" + seriesId);

			// Remove all files
			const workspaceData = JSON.parse(
				localStorage.getItem("ob-workspace-" + seriesId) || "{}"
			);
			if (workspaceData.seasons) {
				workspaceData.seasons.forEach((season) => {
					season.episodes.forEach((episode) => {
						localStorage.removeItem("ob-file-" + episode.name);
					});
				});
			}

			// Remove tile
			tile.remove();

			// Check if there are any series left
			const firstTile = document.querySelector(".ob-series-tile");
			if (firstTile) {
				// Switch to another series
				setActiveSeries(firstTile);
			} else {
				// No series left - show empty state
				currentSeriesId = null;
				localStorage.removeItem("ob-active-series");
				showEmptyState();
			}

			console.log("[Series System] Deleted series:", metadata.name);
		}
	}
}

export { currentSeriesId, setActiveSeries };
