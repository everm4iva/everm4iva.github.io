/**
 * OceanBoard Feedback System
 * Ui feedback, notifications, and loading states
 */

class FeedbackManager {
	constructor() {
		this.notifications = [];
		this.loadingStates = new Map();
		this.autosaveIndicator = null;
		this.progressBar = null;
		this.init();
	}

	init() {
		this.createAutosaveIndicator();
		this.createProgressBar();
	}

	// Auto-save indicator
	createAutosaveIndicator() {
		this.autosaveIndicator = document.createElement("div");
		this.autosaveIndicator.className = "ob-autosave-indicator";
		document.body.appendChild(this.autosaveIndicator);
	}

	showSaving(message = "Saving...") {
		if (!this.autosaveIndicator) return;

		this.autosaveIndicator.textContent = message;
		this.autosaveIndicator.className = "ob-autosave-indicator saving show";
	}

	showSaved(message = "Saved") {
		if (!this.autosaveIndicator) return;

		this.autosaveIndicator.textContent = message;
		this.autosaveIndicator.className = "ob-autosave-indicator saved show";

		setTimeout(() => {
			this.hideAutosave();
		}, 2000);
	}

	showSaveError(message = "Save failed") {
		if (!this.autosaveIndicator) return;

		this.autosaveIndicator.textContent = message;
		this.autosaveIndicator.className = "ob-autosave-indicator error show";

		setTimeout(() => {
			this.hideAutosave();
		}, 3000);
	}

	hideAutosave() {
		if (!this.autosaveIndicator) return;
		this.autosaveIndicator.classList.remove("show");
	}

	// Success notifications
	showSuccess(message, duration = 3000) {
		const notification = document.createElement("div");
		notification.className = "ob-success-notification";
		notification.innerHTML = `
            <div class="ob-success-content">
                <span class="material-icons-round ob-success-icon">check_circle</span>
                <div class="ob-success-message">${message}</div>
            </div>
        `;

		document.body.appendChild(notification);
		this.notifications.push(notification);

		// Show animation
		requestAnimationFrame(() => {
			notification.classList.add("show");
		});

		// Auto-remove
		setTimeout(() => {
			this.removeNotification(notification);
		}, duration);

		return notification;
	}

	// Loading states
	setLoading(element, isLoading = true) {
		if (!element) return;

		if (isLoading) {
			element.classList.add("ob-loading");
			element.setAttribute("aria-busy", "true");
			this.loadingStates.set(element, true);
		} else {
			element.classList.remove("ob-loading");
			element.removeAttribute("aria-busy");
			this.loadingStates.delete(element);
		}
	}

	// Progress bar
	createProgressBar() {
		this.progressBar = document.createElement("div");
		this.progressBar.className = "ob-progress-bar";
		this.progressBar.innerHTML = '<div class="ob-progress-fill"></div>';
		this.progressBar.style.display = "none";
		document.body.appendChild(this.progressBar);
	}

	showProgress(progress = 0) {
		if (!this.progressBar) return;

		this.progressBar.style.display = "block";
		const fill = this.progressBar.querySelector(".ob-progress-fill");
		if (fill) {
			fill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
		}
	}

	hideProgress() {
		if (!this.progressBar) return;
		this.progressBar.style.display = "none";
	}

	// feedback for async operations
	async withFeedback(operation, options = {}) {
		const {
			loadingElement = null,
			loadingMessage = "Loading...",
			successMessage = null,
			errorMessage = "Operation failed",
			showProgress = false,
		} = options;

		try {
			// Show loading state
			if (loadingElement) {
				this.setLoading(loadingElement, true);
			}

			if (showProgress) {
				this.showProgress(0);
			}

			// Execute sth
			const result = await operation((progress) => {
				if (showProgress) {
					this.showProgress(progress);
				}
			});

			// Show success
			if (successMessage) {
				this.showSuccess(successMessage);
			}

			return result;
		} catch (error) {
			// Show error (handled by error handler)
			console.error("Operation failed:", error);
			throw error;
		} finally {
			// Clean up
			if (loadingElement) {
				this.setLoading(loadingElement, false);
			}

			if (showProgress) {
				this.hideProgress();
			}
		}
	}

	// Remove notification
	removeNotification(notification) {
		const index = this.notifications.indexOf(notification);
		if (index > -1) {
			this.notifications.splice(index, 1);
		}

		if (notification.parentNode) {
			notification.style.transform = "translateX(120%)";
			setTimeout(() => {
				if (notification.parentNode) {
					notification.remove();
				}
			}, 300);
		}
	}

	// Clear all notifications
	clearNotifications() {
		this.notifications.forEach((notification) => {
			this.removeNotification(notification);
		});
	}

	// Cleanup
	destroy() {
		this.clearNotifications();

		if (this.autosaveIndicator && this.autosaveIndicator.parentNode) {
			this.autosaveIndicator.remove();
		}

		if (this.progressBar && this.progressBar.parentNode) {
			this.progressBar.remove();
		}

		this.loadingStates.clear();
	}
}

const feedbackManager = new FeedbackManager();
export { FeedbackManager, feedbackManager };
