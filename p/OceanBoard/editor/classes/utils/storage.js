/**
 * OceanBoard Storage Compression Utility
 * Uses LZ-string compression to optimize localStorage usage
 */

class StorageCompression {
	constructor() {
		this.compressionEnabled = true;
		this.compressionThreshold = 1000; // Compress strings longer than 1KB
		this.stats = {
			originalSize: 0,
			compressedSize: 0,
			savings: 0,
		};
		this.init();
	}

	init() {
		// Check if LZString is available
		if (typeof LZString === "undefined") {
			console.warn(
				"[Storage] LZString not available, compression disabled"
			);
			this.compressionEnabled = false;
		}

		// Load existing stats
		this.loadStats();
	}

	// Set item with automatic compression
	setItem(key, value) {
		try {
			const stringValue =
				typeof value === "string" ? value : JSON.stringify(value);
			const originalSize = new Blob([stringValue]).size;

			let finalValue = stringValue;
			let isCompressed = false;

			if (this.shouldCompress(stringValue)) {
				const compressed = this.compress(stringValue);
				if (compressed && compressed.length < stringValue.length) {
					finalValue = compressed;
					isCompressed = true;
				}
			}

			const finalSize = new Blob([finalValue]).size;

			// Store with compression flag
			const storageValue = isCompressed
				? JSON.stringify({ compressed: true, data: finalValue })
				: JSON.stringify({ compressed: false, data: stringValue });

			localStorage.setItem(key, storageValue);

			// Update stats
			this.updateStats(originalSize, finalSize, isCompressed);

			return true;
		} catch (error) {
			console.error("[Storage] Failed to set item:", key, error);
			throw new Error(`Storage error: ${error.message}`);
		}
	}

	// Get item with automatic decompression
	getItem(key) {
		try {
			const stored = localStorage.getItem(key);
			if (stored === null) return null;

			let parsed;
			try {
				parsed = JSON.parse(stored);
			} catch {
				// Treat as uncompressed string
				return stored;
			}

			if (
				typeof parsed === "object" &&
				parsed.hasOwnProperty("compressed")
			) {
				if (parsed.compressed) {
					return this.decompress(parsed.data);
				} else {
					return parsed.data;
				}
			} else {
				// Treat as regular JSON
				return parsed;
			}
		} catch (error) {
			console.error("[Storage] Failed to get item:", key, error);
			throw new Error(`Storage error: ${error.message}`);
		}
	}

	// Remove item
	removeItem(key) {
		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error("[Storage] Failed to remove item:", key, error);
			throw new Error(`Storage error: ${error.message}`);
		}
	}

	// Clear all items
	clear() {
		try {
			localStorage.clear();
			this.resetStats();
			return true;
		} catch (error) {
			console.error("[Storage] Failed to clear storage:", error);
			throw new Error(`Storage error: ${error.message}`);
		}
	}

	// Check if we should compress this string
	shouldCompress(value) {
		if (!this.compressionEnabled) return false;
		if (typeof value !== "string") return false;
		return value.length > this.compressionThreshold;
	}

	// Compress string
	compress(value) {
		if (!this.compressionEnabled || typeof LZString === "undefined") {
			return value;
		}

		try {
			return LZString.compressToUTF16(value);
		} catch (error) {
			console.warn("[Storage] Compression failed:", error);
			return value;
		}
	}

	// Decompress string
	decompress(value) {
		if (!this.compressionEnabled || typeof LZString === "undefined") {
			return value;
		}

		try {
			const decompressed = LZString.decompressFromUTF16(value);
			return decompressed !== null ? decompressed : value;
		} catch (error) {
			console.warn("[Storage] Decompression failed:", error);
			return value;
		}
	}

	// Update compression statistics
	updateStats(originalSize, finalSize, wasCompressed) {
		this.stats.originalSize += originalSize;
		this.stats.compressedSize += finalSize;

		if (wasCompressed) {
			this.stats.savings =
				this.stats.originalSize - this.stats.compressedSize;
		}

		this.saveStats();
	}

	// Save stats to localStorage (uncompressed)
	saveStats() {
		try {
			localStorage.setItem(
				"ob-compression-stats",
				JSON.stringify(this.stats)
			);
		} catch (error) {
			console.warn("[Storage] Could not save compression stats:", error);
		}
	}

	// Load stats from localStorage
	loadStats() {
		try {
			const saved = localStorage.getItem("ob-compression-stats");
			if (saved) {
				this.stats = { ...this.stats, ...JSON.parse(saved) };
			}
		} catch (error) {
			console.warn("[Storage] Could not load compression stats:", error);
		}
	}

	// Reset statistics
	resetStats() {
		this.stats = {
			originalSize: 0,
			compressedSize: 0,
			savings: 0,
		};
		this.saveStats();
	}

	// Get compression statistics
	getStats() {
		const totalOriginal = this.stats.originalSize;
		const totalCompressed = this.stats.compressedSize;
		const savings = this.stats.savings;

		return {
			originalSize: this.formatBytes(totalOriginal),
			compressedSize: this.formatBytes(totalCompressed),
			savings: this.formatBytes(savings),
			compressionRatio:
				totalOriginal > 0
					? `${Math.round((savings / totalOriginal) * 100)}%`
					: "0%",
			enabled: this.compressionEnabled,
		};
	}

	// Format bytes for display
	formatBytes(bytes) {
		if (bytes === 0) return "0 B";

		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	// Get storage usage information
	getStorageInfo() {
		let totalUsed = 0;
		let itemCount = 0;

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const value = localStorage.getItem(key);
			if (value) {
				totalUsed += new Blob([value]).size;
				itemCount++;
			}
		}

		// Estimate available space (5MB regular limit by what i know)
		const estimatedLimit = 5 * 1024 * 1024;
		const remaining = estimatedLimit - totalUsed;

		return {
			used: this.formatBytes(totalUsed),
			remaining: this.formatBytes(Math.max(0, remaining)),
			itemCount,
			usagePercent: Math.round((totalUsed / estimatedLimit) * 100),
		};
	}

	// Test compression on a sample string
	testCompression(sampleText) {
		if (!this.compressionEnabled) {
			return {
				error: "Compression not available",
			};
		}

		const originalSize = new Blob([sampleText]).size;
		const compressed = this.compress(sampleText);
		const compressedSize = new Blob([compressed]).size;
		const savings = originalSize - compressedSize;

		return {
			originalSize: this.formatBytes(originalSize),
			compressedSize: this.formatBytes(compressedSize),
			savings: this.formatBytes(savings),
			ratio:
				originalSize > 0
					? `${Math.round((savings / originalSize) * 100)}%`
					: "0%",
			worthwhile: savings > 0,
		};
	}

	// Enable/disable compression
	setCompressionEnabled(enabled) {
		this.compressionEnabled = enabled && typeof LZString !== "undefined";
		console.log(
			"[Storage] Compression",
			this.compressionEnabled ? "enabled" : "disabled"
		);
	}

	// Set compression threshold
	setCompressionThreshold(bytes) {
		this.compressionThreshold = Math.max(0, bytes);
		console.log(
			"[Storage] Compression threshold set to",
			this.formatBytes(this.compressionThreshold)
		);
	}
}

const storageCompression = new StorageCompression();
export { StorageCompression, storageCompression };
