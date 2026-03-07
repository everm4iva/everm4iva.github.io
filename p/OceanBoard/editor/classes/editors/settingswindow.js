/* === Settings Window Handler === */

let settingsWindow = null;

export function openSettingsWindow() {
	// Check if settings window is already open
	if (settingsWindow && !settingsWindow.closed) {
		settingsWindow.focus();
		console.log('[Settings Window] Focused existing window');
		return;
	}

	// Window size and position
	const width = 800;
	const height = 700;
	const left = (screen.width - width) / 2;
	const top = (screen.height - height) / 2;

	// Open new window
	settingsWindow = window.open(
		'./iframes/settings.html',
		'OceanBoard Settings',
		`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
	);

	if (settingsWindow) {
		console.log('[Settings Window] Opened settings window');
	} else {
		alert('Failed to open settings window. Please check if pop-ups are blocked.');
		console.error('[Settings Window] Failed to open - pop-up blocked?');
	}
}

export function closeSettingsWindow() {
	if (settingsWindow && !settingsWindow.closed) {
		settingsWindow.close();
		settingsWindow = null;
		console.log('[Settings Window] Closed settings window');
	}
}
