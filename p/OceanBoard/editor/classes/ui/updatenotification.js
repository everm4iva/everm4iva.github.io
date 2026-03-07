/* === Update Notification System === */

import {
	OCEANBOARD_VERSION,
	getChangelogForVersion,
	hasSeenVersion,
	markVersionAsSeen,
	isUpdateModalDisabled,
} from "../config/version.js";

/* ===### Show Update Modal ###=== */
export function showUpdateModal() {
	console.log("[Update] Checking for updates...");
	console.log("[Update] Current version:", OCEANBOARD_VERSION);
	console.log(
		"[Update] Stored version:",
		localStorage.getItem("ob-seen-version")
	);

	// Check if modal is disabled globally
	if (isUpdateModalDisabled()) {
		console.log("[Update] Update modal is disabled by user setting");
		return;
	}

	// Check if user has already seen this version
	if (hasSeenVersion(OCEANBOARD_VERSION)) {
		console.log(
			"[Update] User has already seen version",
			OCEANBOARD_VERSION
		);
		return;
	}

	console.log(
		"[Update] Showing update modal for version",
		OCEANBOARD_VERSION
	);

	showUpdateModalForced();
}

/* ===### Show Update Modal (Force Show) ###=== */
export function showUpdateModalForced() {
	console.log(
		"[Update] Force showing update modal for version",
		OCEANBOARD_VERSION
	);

	// Get changelog
	const changelog = getChangelogForVersion(OCEANBOARD_VERSION);
	if (!changelog) {
		console.warn(
			"[Update] No changelog found for version",
			OCEANBOARD_VERSION
		);
		return;
	}

	// Create modal
	const modal = document.createElement("div");
	modal.className = "ob-update-modal-overlay";
	modal.innerHTML = `
		<div class="ob-update-modal">
			<div class="ob-update-modal-header">
				<span class="material-icons-round ob-update-icon" translate="no">celebration</span>
				<div>
					<h2 class="ob-update-title">Updated to v${OCEANBOARD_VERSION}</h2>
					<p class="ob-update-subtitle">${changelog.title}</p>
				</div>
			</div>
			
			<div class="ob-update-modal-body">
				<p class="ob-update-date">${changelog.date}</p>
				<h3 class="ob-update-changes-title">What's New:</h3>
				<ul class="ob-update-changes-list">
					${changelog.changes.map((change) => `<li>${change}</li>`).join("")}
				</ul>
			</div>
			
			<div class="ob-update-modal-footer">
				<button class="ob-update-btn secondary" id="ob-update-changelog">
					<span class="material-icons-round" translate="no">article</span>
					See Changelog
				</button>
				<button class="ob-update-btn primary" id="ob-update-okay">
					<span class="material-icons-round" translate="no">check</span>
					Okay
				</button>
			</div>
		</div>
	`;

	document.body.appendChild(modal);

	// Animate in
	setTimeout(() => {
		modal.classList.add("active");
	}, 10);

	// Button handlers
	const changelogBtn = modal.querySelector("#ob-update-changelog");
	const okayBtn = modal.querySelector("#ob-update-okay");

	changelogBtn.addEventListener("click", () => {
		// Open changelog (you can link to a changelog page or show in modal)
		window.open("../changelog/", "_blank");
		markVersionAsSeen(OCEANBOARD_VERSION);
		closeModal(modal);
		console.log("[Update] Opened changelog");
	});

	okayBtn.addEventListener("click", () => {
		markVersionAsSeen(OCEANBOARD_VERSION);
		closeModal(modal);
		console.log("[Update] Version marked as seen:", OCEANBOARD_VERSION);
	});

	// Close on overlay click
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			markVersionAsSeen(OCEANBOARD_VERSION);
			closeModal(modal);
		}
	});
}

/* ===### Close Modal ###=== */
function closeModal(modal) {
	modal.classList.remove("active");
	setTimeout(() => {
		modal.remove();
	}, 300);
}

/* ===### Check for Updates on Load ###=== */
export function checkForUpdates() {
	// Wait a bit after page load
	setTimeout(() => {
		showUpdateModal();
	}, 1000);
}
