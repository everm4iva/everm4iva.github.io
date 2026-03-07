/* === OceanBoard Version Configuration === */

// Current version of OceanBoard
export const OCEANBOARD_VERSION = "0.0.5";

// Mini-Changelog for this version
export const VERSION_CHANGELOG = {
	"0.0.5": {
		title: "Oh Memory, Oh Mobile, Oh commands, Oh my!",
		date: "November 11, 2025",
		changes: [
			"Added translation support",
			"Improved memory/cache system",
			"Added command palette (Ctrl+K)",
			"Added keyboard shortcuts.",
			"Improved mobile support (FINNALLY)",
			"Fixed errors and polished UI",
		],
	},
};

// Get changelog for specific version
export function getChangelogForVersion(version) {
	return VERSION_CHANGELOG[version] || null;
}

// Check if user has seen version update
export function hasSeenVersion(version) {
	const seenVersion = localStorage.getItem("ob-seen-version");
	// If no version stored, they haven't seen any version yet
	if (!seenVersion) {
		return false;
	}
	// Return true only if stored version matches current version
	return seenVersion === version;
}

// Mark version as seen
export function markVersionAsSeen(version) {
	localStorage.setItem("ob-seen-version", version);
	console.log("[Version] Marked version as seen:", version);
}

// Check if update modal is disabled
export function isUpdateModalDisabled() {
	return localStorage.getItem("ob-disable-update-modal") === "true";
}

// Disable update modal
export function disableUpdateModal() {
	localStorage.setItem("ob-disable-update-modal", "true");
}

// Enable update modal (for settings)
export function enableUpdateModal() {
	localStorage.removeItem("ob-disable-update-modal");
}
