/* === Storage Manager with Quota Handling === */

// Check available storage space
export function checkStorageQuota() {
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		return navigator.storage.estimate().then(estimate => {
			const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
			const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
			const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);
			
			console.log(`[Storage] Using ${usedMB} MB of ${quotaMB} MB (${percentUsed}%)`);
			
			return {
				used: estimate.usage,
				quota: estimate.quota,
				percentUsed: parseFloat(percentUsed),
				usedMB: parseFloat(usedMB),
				quotaMB: parseFloat(quotaMB)
			};
		});
	}
	
	// Fallback: estimate based on current usage
	let totalSize = 0;
	for (let key in localStorage) {
		if (localStorage.hasOwnProperty(key)) {
			totalSize += localStorage[key].length + key.length;
		}
	}
	
	const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
	console.log(`[Storage] Estimated usage: ${usedMB} MB`);
	
	return Promise.resolve({
		used: totalSize,
		quota: 10 * 1024 * 1024, // Assume 10MB limit - 🤓☝ according to my calculations, the localstorage limit storage in browsers is about 10MB.
		percentUsed: (totalSize / (10 * 1024 * 1024)) * 100,
		usedMB: parseFloat(usedMB),
		quotaMB: 10
	});
}

// Safe setItem with quota handling
export function safeSetItem(key, value) {
	try {
		localStorage.setItem(key, value);
		return { success: true };
	} catch (e) {
		if (e.name === 'QuotaExceededError') {
			console.error('[Storage] Quota exceeded!');
			return { success: false, error: 'quota', exception: e };
		} else {
			console.error('[Storage] Failed to save:', e);
			return { success: false, error: 'unknown', exception: e };
		}
	}
}

// Get storage usage breakdown by category
export function getStorageBreakdown() {
	const categories = {
		files: 0,
		media: 0,
		workspace: 0,
		series: 0,
		settings: 0,
		other: 0
	};
	
	for (let key in localStorage) {
		if (!localStorage.hasOwnProperty(key)) continue;
		
		const size = localStorage[key].length + key.length;
		
		if (key.startsWith('ob-file-')) {
			categories.files += size;
		} else if (key.startsWith('ob-media-')) {
			categories.media += size;
		} else if (key.startsWith('ob-workspace-')) {
			categories.workspace += size;
		} else if (key.startsWith('ob-series-')) {
			categories.series += size;
		} else if (key.startsWith('ob-setting-')) {
			categories.settings += size;
		} else {
			categories.other += size;
		}
	}
	
	// Convert to MB
	Object.keys(categories).forEach(key => {
		categories[key] = (categories[key] / (1024 * 1024)).toFixed(2);
	});
	
	return categories;
}

// Show storage warning modal
export function showStorageWarning(percentUsed, onCleanup) {
	const modal = document.createElement('div');
	modal.className = 'ob-modal-overlay';
	modal.style.zIndex = '10000';
	
	const breakdown = getStorageBreakdown();
	
	modal.innerHTML = `
		<div class="ob-modal">
			<div class="ob-modal-header">
				<span class="material-icons-round" style="color: #ff8080;" translate="no">warning</span>
				<h2>Storage Almost Full</h2>
			</div>
			<div class="ob-modal-body">
				<p style="margin-bottom: 16px;">
					You're using <strong>${percentUsed.toFixed(1)}%</strong> of available storage. 
					${
						percentUsed >= 95
							? "You need to free up space immediately!"
							: "Consider cleaning up to avoid issues."
					}
				</p>
				<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
					<h3 style="margin: 0 0 12px 0; font-size: 1rem;">Storage Breakdown:</h3>
					<div style="display: grid; gap: 8px; font-family: monospace; font-size: 0.9rem;">
						<div style="display: flex; justify-content: space-between;">
							<span>Files:</span><span>${breakdown.files} MB</span>
						</div>
						<div style="display: flex; justify-content: space-between;">
							<span>Media:</span><span>${breakdown.media} MB</span>
						</div>
						<div style="display: flex; justify-content: space-between;">
							<span>Workspace:</span><span>${breakdown.workspace} MB</span>
						</div>
						<div style="display: flex; justify-content: space-between;">
							<span>Series:</span><span>${breakdown.series} MB</span>
						</div>
						<div style="display: flex; justify-content: space-between;">
							<span>Settings:</span><span>${breakdown.settings} MB</span>
						</div>
					</div>
				</div>
				<h3 style="margin: 16px 0 8px 0; font-size: 1rem;">Recommended Actions:</h3>
				<ul style="margin: 0; padding-left: 24px; line-height: 1.8;">
					<li>Export and delete old files you don't need</li>
					<li>Delete unused media files (images, videos)</li>
					<li>Export your workspace as a backup before cleaning</li>
					<li>Consider using smaller media files (compress images)</li>
				</ul>
			</div>
			<div class="ob-modal-footer">
				<button class="ob-modal-btn ob-modal-btn-secondary" id="exportBackup">
					<span class="material-icons-round" translate="no">download</span>
					Export Backup First
				</button>
				<button class="ob-modal-btn ob-modal-btn-secondary" id="manageStorage">
					<span class="material-icons-round" translate="no">cleaning_services</span>
					Manage Storage
				</button>
				<button class="ob-modal-btn ob-modal-btn-primary" id="closeWarning">
					OK, I'll Clean Up
				</button>
			</div>
		</div>
	`;
	
	document.body.appendChild(modal);
	
	// Event listeners
	document.getElementById('closeWarning').onclick = () => {
		modal.remove();
	};
	
	document.getElementById('exportBackup').onclick = () => {
		modal.remove();
		// Trigger export
		if (window.exportWorkspace) {
			window.exportWorkspace();
		}
	};
	
	document.getElementById('manageStorage').onclick = () => {
		modal.remove();
		if (onCleanup) onCleanup();
	};
}

// Handle quota exceeded error - "TA CRITICO!!"
export function handleQuotaExceeded(operation = 'save') {
	checkStorageQuota().then(quota => {
		const modal = document.createElement('div');
		modal.className = 'ob-modal-overlay';
		modal.style.zIndex = '10000';
		
		const breakdown = getStorageBreakdown();
		
		modal.innerHTML = `
			<div class="ob-modal">
				<div class="ob-modal-header" style="background: #ff5050;">
					<span class="material-icons-round" translate="no">error</span>
					<h2>Storage Full - Cannot ${operation}</h2>
				</div>
				<div class="ob-modal-body">
					<p style="margin-bottom: 16px; color: #ff8080; font-weight: 600;">
						You've reached the storage limit! This operation cannot be completed.
					</p>
					<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
						<h3 style="margin: 0 0 12px 0; font-size: 1rem;">Storage Usage:</h3>
						<div style="display: grid; gap: 8px; font-family: monospace; font-size: 0.9rem;">
							<div style="display: flex; justify-content: space-between;">
								<span>Files:</span><span>${breakdown.files} MB</span>
							</div>
							<div style="display: flex; justify-content: space-between;">
								<span>Media:</span><span style="color: ${
									parseFloat(breakdown.media) > 3
										? "#ff8080"
										: "inherit"
								}">${breakdown.media} MB</span>
							</div>
							<div style="display: flex; justify-content: space-between;">
								<span>Workspace:</span><span>${breakdown.workspace} MB</span>
							</div>
						</div>
					</div>
					<h3 style="margin: 16px 0 8px 0; font-size: 1rem; color: #ff8080;">Immediate Actions Required:</h3>
					<ol style="margin: 0; padding-left: 24px; line-height: 1.8;">
						<li><strong>Export your workspace</strong> as a backup (.ocean file)</li>
						<li><strong>Delete large media files</strong> (right-click → Delete)</li>
						<li><strong>Remove old/duplicate files</strong> you don't need</li>
						<li><strong>Clear browser cache</strong> if needed</li>
					</ol>
				</div>
				<div class="ob-modal-footer">
					<button class="ob-modal-btn ob-modal-btn-primary" id="exportNow" style="background: #ff80aa;">
						<span class="material-icons-round" translate="no">download</span>
						Export Workspace Now
					</button>
					<button class="ob-modal-btn ob-modal-btn-secondary" id="closeError">
						I Understand
					</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		document.getElementById('closeError').onclick = () => {
			modal.remove();
		};
		
		document.getElementById('exportNow').onclick = () => {
			modal.remove();
			// Import and call export function
			import('./importexport.js').then(module => {
				module.exportWorkspace();
			});
		};
	});
}

// Monitor storage and warn when approaching limit
export function monitorStorage() {
	checkStorageQuota().then(quota => {
		if (quota.percentUsed >= 95) {
			handleQuotaExceeded('continue');
		} else if (quota.percentUsed >= 80) {
			showStorageWarning(quota.percentUsed);
		}
	});
}

// Initialize storage monitoring
export function initStorageMonitoring() {
	// Check on load
	checkStorageQuota().then(quota => {
		if (quota.percentUsed >= 80) {
			console.warn(`[Storage] Warning: ${quota.percentUsed}% used`);
		}
	});
	
	// Check periodically (every 5 minutes)
	setInterval(() => {
		checkStorageQuota().then(quota => {
			if (quota.percentUsed >= 90) {
				console.warn(`[Storage] Critical: ${quota.percentUsed}% used`);
			}
		});
	}, 5 * 60 * 1000);
}
