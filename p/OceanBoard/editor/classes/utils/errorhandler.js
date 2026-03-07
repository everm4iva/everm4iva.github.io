/**
 * OceanBoard Error Handler
 * Centralized error management system for better UX and debugging
 */

class OceanBoardError extends Error {
	constructor(message, type = "general", context = {}) {
		super(message);
		this.name = "OceanBoardError";
		this.type = type;
		this.context = context;
		this.timestamp = new Date().toISOString();
	}
}

class ErrorHandler {
	constructor() {
		this.errors = [];
		this.maxErrors = 100; // Keep last 100 errors
		this.listeners = [];
		this.setupGlobalHandlers();
	}

	setupGlobalHandlers() {
		// Catch unhandled JavaScript errors
		window.addEventListener("error", (event) => {
			this.logError(
				new OceanBoardError(event.message, "javascript", {
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					stack: event.error?.stack,
				})
			);
		});

		// Catch "unhandled promise rejections" - wild
		window.addEventListener("unhandledrejection", (event) => {
			this.logError(
				new OceanBoardError(
					`Unhandled Promise Rejection: ${event.reason}`,
					"promise",
					{ reason: event.reason }
				)
			);
		});
	}

	logError(error, showToUser = true) {
		console.error("[OceanBoard Error]", error);

		// Add to error log
		this.errors.push({
			...error,
			id: Date.now() + Math.random(),
			userAgent: navigator.userAgent,
			url: window.location.href,
		});

		// Keep only recent errors
		if (this.errors.length > this.maxErrors) {
			this.errors = this.errors.slice(-this.maxErrors);
		}

		this.listeners.forEach((callback) => callback(error));

		// Show error message - :O
		if (showToUser) {
			this.showErrorToUser(error);
		}

		// Store in localStorage for debugging
		try {
			localStorage.setItem(
				"ob-error-log",
				JSON.stringify(this.errors.slice(-10))
			);
		} catch (e) {
			console.warn("Could not save error log to localStorage");
		}
	}

	showErrorToUser(error) {
		const userMessage = this.getUserFriendlyMessage(error);

		// Create error notification
		const notification = document.createElement("div");
		notification.className = "ob-error-notification";
		notification.innerHTML = `
            <div class="ob-error-content">
                <span class="material-icons-round ob-error-icon" translate="no">warning</span>
                <div class="ob-error-text">
                    <div class="ob-error-title">Something went wrong</div>
                    <div class="ob-error-message">${userMessage}</div>
                </div>
                <button class="ob-error-close" title="Close">
                    <span class="material-icons-round" translate="no">close</span>
                </button>
            </div>
        `;

		document.body.appendChild(notification);

		// Auto-remove after 5 seconds
		setTimeout(() => {
			if (notification.parentNode) {
				notification.remove();
			}
		}, 5000);

		notification
			.querySelector(".ob-error-close")
			.addEventListener("click", () => {
				notification.remove();
			});

		// Animate 🎈
		requestAnimationFrame(() => {
			notification.classList.add("show");
		});
	}

	getUserFriendlyMessage(error) {
		const messageMap = {
			storage: "Unable to save your work. Your storage might be full.",
			network: "Network connection issue. Please check your internet.",
			file: "There was a problem with the file operation.",
			import: "Could not import the file. Please check the file format.",
			export: "Export failed. Please try again.",
			javascript:
				"A technical error occurred. The app will continue working.",
			promise: "An operation failed unexpectedly.",
			general: "An unexpected error occurred.",
		};

		return messageMap[error.type] || messageMap.general;
	}

	// Wrapper for async operations
	async safeAsync(operation, context = {}, fallback = null) {
		try {
			return await operation();
		} catch (error) {
			this.logError(
				new OceanBoardError(error.message, context.type || "async", {
					...context,
					originalError: error,
				})
			);
			return fallback;
		}
	}

	// Wrapper for sync operations
	safe(operation, context = {}, fallback = null) {
		try {
			return operation();
		} catch (error) {
			this.logError(
				new OceanBoardError(error.message, context.type || "sync", {
					...context,
					originalError: error,
				})
			);
			return fallback;
		}
	}

	// Get error stats
	getErrorStats() {
		const stats = {
			total: this.errors.length,
			byType: {},
			recent: this.errors.slice(-5),
		};

		this.errors.forEach((error) => {
			stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
		});

		return stats;
	}

	// Clear error log
	clearErrors() {
		this.errors = [];
		localStorage.removeItem("ob-error-log");
	}

	// Add error listener
	onError(callback) {
		this.listeners.push(callback);
	}

	// Remove error listener
	removeErrorListener(callback) {
		const index = this.listeners.indexOf(callback);
		if (index > -1) {
			this.listeners.splice(index, 1);
		}
	}
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export class and instance
export { ErrorHandler, OceanBoardError, errorHandler };
