if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("./sw.js")
			.then((registration) => {
				console.log(
					"[PWA] Service Worker registered successfully:",
					registration.scope
				);

				// Check for updates
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							if (
								confirm(
									"A new version of OceanBoard is available. Reload to update?"
								)
							) {
								window.location.reload();
							}
						}
					});
				});
			})
			.catch((error) => {
				console.log("[PWA] Service Worker registration failed:", error);
			});
	});
}

// Handle PWA install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
	console.log("[PWA] Install prompt available");
	e.preventDefault();
	deferredPrompt = e;

	// Show custom install button
	// showInstallButton();
});

// Handle PWA install
window.addEventListener("appinstalled", (evt) => {
	console.log("[PWA] App installed successfully");
	// Hide install button if shown
	// hideInstallButton();
});
