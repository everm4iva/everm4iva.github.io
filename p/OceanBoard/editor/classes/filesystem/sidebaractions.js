/* === Sidebar Actions for OceanBoard === */

import {
	addDragDropToElement,
	initializeDragDrop,
} from "../filesystem/dragdrop.js";
import { saveWorkspace } from "./storage.js";
import { attachFileClickHandlers } from "../index.js";

export function initializeSidebarActions() {
	const newEpisodeBtn = document.querySelector(".ob-action-episode");
	const newSeasonBtn = document.querySelector(".ob-action-season");

	if (newEpisodeBtn) {
		newEpisodeBtn.addEventListener("click", createNewEpisode);
	}

	if (newSeasonBtn) {
		newSeasonBtn.addEventListener("click", createNewSeason);
	}

	// Only initialize the special section title (pre-existing in HTML)
	initializeSpecialSectionCollapse();

	console.log("[Sidebar Actions] Initialized");
}

function initializeSpecialSectionCollapse() {
	const specialTitle = document.querySelector(".ob-special-title");
	if (specialTitle) {
		specialTitle.addEventListener("click", function (e) {
			this.classList.toggle("collapsed");
			this.parentElement.classList.toggle("collapsed");
			saveWorkspace();
		});
	}
}

function initializeCollapsibleSeasons() {
	document.querySelectorAll(".ob-tree-title").forEach((title) => {
		title.addEventListener("click", function (e) {
			const isSpecialTitle = this.classList.contains("ob-special-title");

			if (isSpecialTitle) {
				this.classList.toggle("collapsed");
				this.parentElement.classList.toggle("collapsed");
				saveWorkspace();
			} else {
				this.classList.toggle("collapsed");
				this.parentElement.classList.toggle("collapsed");
				saveWorkspace();
			}
		});
	});
}

function createNewEpisode() {
	const activeSection = document.querySelector(".ob-tree-section");
	if (!activeSection) {
		console.log("[Sidebar Actions] No active season found");
		return;
	}

	const list = activeSection.querySelector(".ob-tree-list");
	if (!list) return;

	const episodeCount = list.children.length + 1;
	const episodeName = `[EP${episodeCount}] - New Episode`;

	const newEpisode = document.createElement("li");
	newEpisode.innerHTML = `<span class="material-icons-round" translate="no">description</span> ${episodeName}`;
	newEpisode.setAttribute("data-context-menu", "file-item");
	newEpisode.setAttribute("data-file-id", `episode-${Date.now()}`);

	addDragDropToElement(newEpisode);

	newEpisode.addEventListener("click", function (e) {
		if (e.button === 0) {
			console.log("[Sidebar Actions] Opening episode:", episodeName);
		}
	});

	list.appendChild(newEpisode);

	attachFileClickHandlers();
	saveWorkspace();
	console.log("[Sidebar Actions] Created new episode:", episodeName);
}

function createNewSeason() {
	const treeContainer = document.querySelector(".ob-tree");
	if (!treeContainer) return;

	const seasonCount =
		treeContainer.querySelectorAll(".ob-tree-section").length + 1;
	const seasonName = `[S${seasonCount}] - New Season`;

	const newSection = document.createElement("div");
	newSection.className = "ob-tree-section";
	newSection.innerHTML = `
		<div class="ob-tree-title" data-context-menu="folder-item">${seasonName}</div>
		<ul class="ob-tree-list">
			<li data-context-menu="file-item" data-file-id="episode-${Date.now()}"><span class="material-icons-round" translate="no">description</span> [EP1] - First Episode</li>
		</ul>
	`;

	const title = newSection.querySelector(".ob-tree-title");
	title.addEventListener("click", function () {
		this.classList.toggle("collapsed");
		this.parentElement.classList.toggle("collapsed");
	});

	const firstEpisode = newSection.querySelector("li");
	addDragDropToElement(firstEpisode);

	firstEpisode.addEventListener("click", function () {
		console.log("[Sidebar Actions] Opening episode");
	});

	treeContainer.appendChild(newSection);

	attachFileClickHandlers();
	initializeDragDrop();
	saveWorkspace();
	console.log("[Sidebar Actions] Created new season:", seasonName);
}
