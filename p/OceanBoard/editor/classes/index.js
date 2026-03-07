import { createMarkdownEditor } from "./editors/markdowneditor.js";
import { getFileIcon, getFileColor } from "./files/filetypes.js";
import { initializeDragDrop } from "./filesystem/dragdrop.js";
import { initializeSidebarActions } from "./filesystem/sidebaractions.js";
import {
	saveFileContent,
	loadFileContent,
	restoreWorkspace,
} from "./filesystem/storage.js";
import { initializeContextMenu } from "./filesystem/contextmenu.js";
import { openSettingsWindow } from "./editors/settingswindow.js";
import { initializeSettingsListener } from "./editors/settingsapplier.js";
import { initializeSeriesSystem } from "./filesystem/seriessystem.js";
import {
	exportWorkspace,
	exportFiles,
	importZip,
	importSingleFile,
} from "./filesystem/importexport.js";
import { showChoiceModal, showConfirmModal } from "./ui/modal.js";
import { initializeParserForFile } from "./attributes/parser.js";
import { checkForUpdates, showUpdateModalForced } from './ui/updatenotification.js';
import { initializeMediaSection, saveMedia } from "./filesystem/mediasystem.js";
import { setupCustomRenderer } from "./editors/mediarenderer.js";
import { setupMediaContextMenu } from "./ui/mediaproperties.js";
import {
	initStorageMonitoring,
	checkStorageQuota,
} from "./filesystem/storagemanager.js";
import { errorHandler } from "./utils/errorhandler.js";
import { feedbackManager } from "./utils/feedback.js";
import { keyboardManager } from "./utils/keyboard.js";
import { wordCounter } from "./utils/wordcounter.js";
import { storageCompression } from "./utils/storage.js";
import { mobileNavigation } from "./utils/mobile.js";
import { mobileIntegration } from "./utils/mobile-integration.js";

/* ===### File Editor basic ###=== */
function getFileIdFromElement(el) {
	// Extract only text nodes, excluding icon elements
	const textNodes = Array.from(el.childNodes).filter(
		(node) => node.nodeType === 3
	);
	return textNodes
		.map((n) => n.textContent.trim())
		.join("")
		.trim();
}

function openFileEditor(fileId) {
	const contentSection = document.querySelector(".ob-content");
	if (contentSection) {
		const content = loadFileContent(fileId);
		createMarkdownEditor(contentSection, content);

		// Verify if file is saved to localStorage (in case it's a new file)
		saveFileContent(fileId, content);

		// Initialize parser to validate file-id and attributes
		initializeParserForFile(fileId, content);

		// Save on input
		const textarea = contentSection.querySelector(".ob-md-input");
		if (textarea) {
			let saveTimeout;
			textarea.addEventListener("input", () => {
				const newContent = textarea.value;

				// Show saving indicator
				feedbackManager.showSaving();

				// Debounce saving
				clearTimeout(saveTimeout);
				saveTimeout = setTimeout(() => {
					errorHandler.safe(
						() => {
							saveFileContent(fileId, newContent);
							feedbackManager.showSaved();
							// Re-validate on content change
							initializeParserForFile(fileId, newContent);
						},
						{ type: "storage" },
						() => {
							feedbackManager.showSaveError();
						}
					);
				}, 500);
			});
		}
	}
}

const tabBar = document.querySelector(".ob-tabs");
let openTabs = [];

// Horizontal scrolling with mouse wheel - FIREEE
if (tabBar) {
	tabBar.addEventListener(
		"wheel",
		(e) => {
			if (e.deltaY !== 0) {
				e.preventDefault();
				tabBar.scrollLeft += e.deltaY;
			}
		},
		{ passive: false }
	);
}

function renderTabs(activeFileId) {
	if (!tabBar) return;
	tabBar.innerHTML = "";
	openTabs.forEach((fileId) => {
		const tab = document.createElement("div");
		tab.className = "ob-tab" + (fileId === activeFileId ? " active" : "");
		tab.dataset.id = fileId;

		const icon = document.createElement("span");
		icon.innerHTML = `<span class="material-icons-round ob-tab-icon" translate="no" title="File icon">${getFileIcon(
			fileId
		)}</span>`;
		icon.style.color = getFileColor(fileId);

		const title = document.createElement("span");
		title.className = "ob-tab-title";
		title.textContent = fileId;

		const closeBtn = document.createElement("span");
		closeBtn.innerHTML = `<span class="material-icons-round ob-tab-close" translate="no" title="Close tab">close</span>`;
		closeBtn.onclick = (e) => {
			e.stopPropagation();
			closeTab(fileId);
		};

		tab.appendChild(icon);
		tab.appendChild(title);
		tab.appendChild(closeBtn);
		tab.onclick = () => switchTab(fileId);
		tabBar.appendChild(tab);
	});
}

function openTab(fileId) {
	if (!openTabs.includes(fileId)) {
		openTabs.push(fileId);
	}
	renderTabs(fileId);
	switchTab(fileId);
}

function switchTab(fileId) {
	renderTabs(fileId);
	openFileEditor(fileId);
	document.querySelectorAll(".ob-tree-list li").forEach((el) => {
		el.classList.toggle("active", getFileIdFromElement(el) === fileId);
	});
}

function closeTab(fileId) {
	const idx = openTabs.indexOf(fileId);
	if (idx !== -1) {
		openTabs.splice(idx, 1);

		// If no tabs left, show welcome screen
		if (openTabs.length === 0) {
			tabBar.innerHTML = "";
			const contentSection = document.querySelector(".ob-content");
			if (contentSection) {
				contentSection.innerHTML = `
					<div class="ob-welcome">
						<h1><span class="ob-logo-text">OceanBoard</span></h1>
					</div>
				`;
			}
			// Clear sidebar highlights
			document.querySelectorAll(".ob-tree-list li").forEach((el) => {
				el.classList.remove("active");
			});
			return;
		}

		// If closing active tab, switch to previous or next
		const wasActive =
			document.querySelector(".ob-tab.active")?.dataset.id === fileId;
		if (wasActive) {
			const nextId = openTabs[idx] || openTabs[idx - 1];
			if (nextId) {
				switchTab(nextId);
			}
		} else {
			renderTabs(
				document.querySelector(".ob-tab.active")?.dataset.id ||
					openTabs[0]
			);
		}
	}
}

// Click handlers to all sidebar file elements
function attachFileClickHandlers() {
	document.querySelectorAll(".ob-tree-list li").forEach((fileEl) => {
		fileEl.removeEventListener("click", handleFileClick);
		fileEl.addEventListener("click", handleFileClick);
	});
}

function handleFileClick(e) {
	if (e.button === 0) {
		openTab(getFileIdFromElement(this));
	}
}

// Settings button handler
const settingsBtn = document.querySelector(
	'.ob-sidebar-actions button[title="Settings"]'
);
if (settingsBtn) {
	settingsBtn.addEventListener("click", openSettingsWindow);
	console.log("[OceanBoard - Main] Settings button connected");
}

// Import media files function
function importMediaFiles() {
	const input = document.createElement("input");
	input.type = "file";
	input.multiple = true;
	input.accept = "image/*,video/*,audio/*";

	input.onchange = async (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;

		console.log("[Media Import] Uploading", files.length, "files");

		let successCount = 0;
		let errorCount = 0;

		for (const file of files) {
			try {
				await saveMedia(file);
				successCount++;
			} catch (error) {
				console.error(
					"[Media Import] Failed to upload:",
					file.name,
					error
				);
				errorCount++;
			}
		}

		const message = `Uploaded ${successCount} file(s)${
			errorCount > 0 ? `, ${errorCount} failed` : ""
		}`;
		alert(message);
	};

	input.click();
}

// Header buttons
const headerSettingsBtn = document.querySelector(
	'.ob-header-controls button[title="Settings"]'
);
const headerImportBtn = document.querySelector(
	'.ob-header-controls button[title="Import"]'
);
const headerExportBtn = document.querySelector(
	'.ob-header-controls button[title="Export"]'
);
const headerChangelogBtn = document.querySelector(
	'.ob-header-controls button[title="changelog"]'
);
const headerCommandPaletteBtn = document.getElementById('headerCommandPaletteBtn');

if (headerSettingsBtn) {
	headerSettingsBtn.addEventListener("click", openSettingsWindow);
	console.log("[OceanBoard - Main] Header Settings button connected");
}

if (headerImportBtn) {
	headerImportBtn.addEventListener("click", () => {
		showChoiceModal(
			"What would you like to import?",
			[
				{
					value: "workspace",
					title: "Full Workspace",
					description:
						"Replace everything with imported workspace (includes settings)",
				},
				{
					value: "file",
					title: "Single File",
					description: "Add one file to current series",
				},
				{
					value: "season",
					title: "Season (Multiple Files)",
					description: "Add multiple files to current series",
				},
				{
					value: "media",
					title: "Media Files",
					description: "Upload images, videos, or audio files",
				},
			],
			(choice) => {
				if (choice === "workspace") {
					importZip();
				} else if (choice === "file" || choice === "season") {
					importSingleFile();
				} else if (choice === "media") {
					importMediaFiles();
				}
			}
		);
	});
	console.log("[OceanBoard - Main] Header Import button connected");
}

if (headerExportBtn) {
	headerExportBtn.addEventListener("click", () => {
		showChoiceModal(
			"What would you like to export?",
			[
				{
					value: "workspace",
					title: "Full Workspace",
					description:
						"Export everything (all series, files, and settings)",
				},
				{
					value: "files",
					title: "Files Only",
					description:
						"Export all series and files (without settings)",
				},
			],
			(choice) => {
				if (choice === "workspace") {
					exportWorkspace();
				} else if (choice === "files") {
					exportFiles();
				}
			}
		);
	});
	console.log("[OceanBoard - Main] Header Export button connected");
}

if (headerChangelogBtn) {
	headerChangelogBtn.addEventListener("click", () => {
		showUpdateModalForced();
	});
	console.log("[OceanBoard - Main] Header Changelog button connected");
}

if (headerCommandPaletteBtn) {
	headerCommandPaletteBtn.addEventListener("click", () => {
		keyboardManager.showCommandPalette();
	});
	console.log("[OceanBoard - Main] Header Command Palette button connected");
}

/* ===### Tab & Sections ###=== */
export function closeAllTabs() {
	openTabs = [];
	tabBar.innerHTML = "";

	// Show welcome screen
	const contentSection = document.querySelector(".ob-content");
	if (contentSection) {
		contentSection.innerHTML = `
			<div class="ob-welcome">
				<h1><span class="ob-logo-text">OceanBoard</span></h1>
			</div>
		`;
	}

	// Clear sidebar highlights
	document.querySelectorAll(".ob-tree-list li").forEach((el) => {
		el.classList.remove("active");
	});

	console.log("[Tab System] All tabs closed");
}

/* ===### Rename Tab (when file renamed) ###=== */
export function renameTab(oldName, newName) {
	// Update in openTabs
	const idx = openTabs.indexOf(oldName);
	if (idx !== -1) {
		openTabs[idx] = newName;
	}

	// Close old tab and open new one if it was open
	if (idx !== -1) {
		const wasActive =
			document.querySelector(".ob-tab.active")?.dataset.id === oldName;
		// Remove old tab from DOM
		const oldTab = tabBar.querySelector(`.ob-tab[data-id="${oldName}"]`);
		if (oldTab) {
			oldTab.remove();
		}

		// Re-render all tabs with new name
		renderTabs(newName);

		// If it was active, switch to the renamed tab
		if (wasActive) {
			switchTab(newName);
		}
	}
	console.log("[Tab System] Renamed tab:", oldName, "→", newName);
}

/* ===### Call Systems ###=== */
setupCustomRenderer();
initializeMediaSection();
setupMediaContextMenu();
initStorageMonitoring();
checkForUpdates();
checkStorageQuota();
initializeSeriesSystem();
restoreWorkspace();
initializeDragDrop();
initializeSidebarActions();
initializeContextMenu();
attachFileClickHandlers();
initializeSettingsListener();

console.log("[OceanBoard - Main] All systems loaded!");
export { attachFileClickHandlers };
