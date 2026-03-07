/* === OceanBoard Media System === */

// Media types
const MEDIA_TYPES = {
	IMAGE: 'image',
	VIDEO: 'video',
	AUDIO: 'audio'
};

// Position context menu within viewport bounds
function positionContextMenu(menu, x, y) {
	// First set position to get dimensions
	menu.style.left = x + 'px';
	menu.style.top = y + 'px';
	
	// Get menu dimensions after it's in DOM
	const menuRect = menu.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	
	let finalX = x;
	let finalY = y;
	
	// Adjust horizontal position if overflowing right
	if (menuRect.right > viewportWidth) {
		finalX = x - menuRect.width;
		// Verify if it doesn't go off the left side
		if (finalX < 0) finalX = 10;
	}
	
	// Adjust vertical position if overflowing bottom
	if (menuRect.bottom > viewportHeight) {
		finalY = y - menuRect.height;
		// Verify if it doesn't go off the top
		if (finalY < 0) finalY = 10;
	}
	
	menu.style.left = finalX + 'px';
	menu.style.top = finalY + 'px';
}

// Get media type from file extension
function getMediaType(fileName) {
	const ext = fileName.split('.').pop().toLowerCase();
	
	const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
	const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
	const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
	
	if (imageExts.includes(ext)) return MEDIA_TYPES.IMAGE;
	if (videoExts.includes(ext)) return MEDIA_TYPES.VIDEO;
	if (audioExts.includes(ext)) return MEDIA_TYPES.AUDIO;
	
	return null;
}

// Generate unique media ID
function generateMediaId() {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 9);
	return `media-${timestamp}-${random}`;
}

// Save media to localStorage
export function saveMedia(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		
		reader.onload = () => {
			const mediaId = generateMediaId();
			const mediaType = getMediaType(file.name);
			
			if (!mediaType) {
				reject(new Error('Unsupported file type'));
				return;
			}
			
			const mediaData = {
				id: mediaId,
				name: file.name,
				type: mediaType,
				mimeType: file.type,
				size: file.size,
				data: reader.result, // Base64 data URL
				uploadedAt: new Date().toISOString()
			};
			
			// Save to localStorage
			localStorage.setItem(`ob-media-${mediaId}`, JSON.stringify(mediaData));
			
			// Update media list
			updateMediaList(mediaId);

			// Re-render media section
			renderMediaSection();
			
			console.log('[Media] Saved:', mediaId, file.name);
			resolve(mediaData);
		};
		
		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};
		
		reader.readAsDataURL(file);
	});
}

// Update media list in localStorage
function updateMediaList(mediaId) {
	const mediaList = getMediaList();
	if (!mediaList.includes(mediaId)) {
		mediaList.push(mediaId);
		localStorage.setItem('ob-media-list', JSON.stringify(mediaList));
	}
}

// Get all media IDs
export function getMediaList() {
	const stored = localStorage.getItem('ob-media-list');
	return stored ? JSON.parse(stored) : [];
}

// Get media data by ID
export function getMedia(mediaId) {
	const stored = localStorage.getItem(`ob-media-${mediaId}`);
	return stored ? JSON.parse(stored) : null;
}

// Delete media
export function deleteMedia(mediaId) {
	localStorage.removeItem(`ob-media-${mediaId}`);
	
	// Remove from list
	const mediaList = getMediaList();
	const index = mediaList.indexOf(mediaId);
	if (index > -1) {
		mediaList.splice(index, 1);
		localStorage.setItem('ob-media-list', JSON.stringify(mediaList));
	}
	
	console.log('[Media] Deleted:', mediaId);
	renderMediaSection();
}

// Rename media
export function renameMedia(mediaId, newName) {
	const media = getMedia(mediaId);
	if (media) {
		media.name = newName;
		localStorage.setItem(`ob-media-${mediaId}`, JSON.stringify(media));
		console.log('[Media] Renamed:', mediaId, newName);
		renderMediaSection();
	}
}

// Duplicate media
export function duplicateMedia(mediaId) {
	const media = getMedia(mediaId);
	if (media) {
		const newId = generateMediaId();
		const newMedia = {
			...media,
			id: newId,
			name: media.name.replace(/(\.[^.]+)$/, ' (copy)$1'),
			uploadedAt: new Date().toISOString()
		};
		
		localStorage.setItem(`ob-media-${newId}`, JSON.stringify(newMedia));
		updateMediaList(newId);
		
		console.log('[Media] Duplicated:', mediaId, '→', newId);
		renderMediaSection();
	}
}

// Export single media file
function exportSingleMedia(mediaId) {
	const media = getMedia(mediaId);
	if (!media) return;
	
	// For images: download as image file
	// For videos/audio: download as media file
	const a = document.createElement('a');
	a.href = media.data;
	a.download = media.name;
	a.click();
	
	console.log('[Media] Exported:', media.name);
}

// Render media section in sidebar
export function renderMediaSection() {
	const mediaList = document.querySelector('.ob-media-list');
	if (!mediaList) return;
	
	const mediaIds = getMediaList();
	
	if (mediaIds.length === 0) {
		mediaList.innerHTML = '<div class="ob-media-empty">No media uploaded yet</div>';
		return;
	}
	
	mediaList.innerHTML = '';
	
	mediaIds.forEach(mediaId => {
		const media = getMedia(mediaId);
		if (!media) return;
		
		const item = document.createElement('div');
		item.className = 'ob-media-item';
		item.dataset.mediaId = mediaId;
		item.title = media.name;
		
		// Create preview based on type
		if (media.type === MEDIA_TYPES.IMAGE) {
			const img = document.createElement('img');
			img.className = 'ob-media-item-preview';
			img.src = media.data;
			img.alt = media.name;
			item.appendChild(img);
		} else {
			const icon = document.createElement('span');
			icon.className = 'material-icons-round ob-media-item-icon';
			icon.textContent = media.type === MEDIA_TYPES.VIDEO ? 'movie' : 'audiotrack';
			item.appendChild(icon);
		}
		
		// Add name label
		const nameLabel = document.createElement('div');
		nameLabel.className = 'ob-media-item-name';
		nameLabel.textContent = media.name;
		item.appendChild(nameLabel);
		
		// Click to insert
		item.addEventListener('click', () => insertMediaIntoEditor(mediaId));
		
		// Right-click for context menu
		item.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			e.stopPropagation();
			showMediaContextMenu(e, mediaId);
		});
		
		mediaList.appendChild(item);
	});
}

// Insert media into active editor
function insertMediaIntoEditor(mediaId) {
	const media = getMedia(mediaId);
	if (!media) return;
	
	const textarea = document.querySelector('.ob-md-input');
	if (!textarea) {
		console.warn('[Media] No active editor found');
		return;
	}
	
	// Generate mention-style syntax: $filename
	// This will be highlighted in the editor and rendered as media in preview
	const cleanName = media.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_.]/g, '');
	const mention = `$${cleanName}`;
	
	// Store mapping of mention to mediaId
	storeMentionMapping(mention, mediaId);
	
	// Insert at cursor position
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const before = textarea.value.substring(0, start);
	const after = textarea.value.substring(end);
	
	textarea.value = before + mention + after;
	textarea.selectionStart = textarea.selectionEnd = start + mention.length;
	
	// Trigger input event to update preview
	textarea.dispatchEvent(new Event('input'));
	textarea.focus();
	
	console.log('[Media] Inserted mention:', mention, '→', mediaId);
}

// Store mention to media ID mapping
function storeMentionMapping(mention, mediaId) {
	const mappings = JSON.parse(localStorage.getItem('ob-media-mentions') || '{}');
	mappings[mention] = mediaId;
	localStorage.setItem('ob-media-mentions', JSON.stringify(mappings));
}

// Get media ID from mention
export function getMediaIdFromMention(mention) {
	const mappings = JSON.parse(localStorage.getItem('ob-media-mentions') || '{}');
	return mappings[mention] || null;
}

// Show context menu for media
function showMediaContextMenu(event, mediaId) {
	// Remove existing context menu
	const existing = document.querySelector('.ob-media-context-menu');
	if (existing) existing.remove();

	const media = getMedia(mediaId);
	if (!media) return;
	
	const menu = document.createElement('div');
	menu.className = 'ob-context-menu ob-media-context-menu';

	const options = [
		{ icon: 'drive_file_rename_outline', label: 'Rename', action: () => promptRenameMedia(mediaId) },
		{ icon: 'download', label: 'Export', action: () => exportSingleMedia(mediaId) },
		{ icon: 'content_copy', label: 'Duplicate', action: () => duplicateMedia(mediaId) },
		{ icon: 'delete', label: 'Delete', action: () => promptDeleteMedia(mediaId) }
	];
	
	options.forEach(opt => {
		const item = document.createElement('div');
		item.className = 'ob-context-menu-item';
		item.innerHTML = `<span class="material-icons-round" translate="no">${opt.icon}</span>${opt.label}`;
		item.onclick = () => {
			opt.action();
			menu.remove();
		};
		menu.appendChild(item);
	});
	
	document.body.appendChild(menu);
	
	// Position menu with viewport bounds checking
	positionContextMenu(menu, event.clientX, event.clientY);
	
	// Prevent menu clicks from closing the menu
	menu.addEventListener('click', (e) => {
		e.stopPropagation();
	});
	
	// Close on click outside
	setTimeout(() => {
		const closeMenu = (e) => {
			if (!menu.contains(e.target)) {
				menu.remove();
				document.removeEventListener('click', closeMenu);
			}
		};
		document.addEventListener('click', closeMenu);
	}, 10);
}

// Prompt to rename media
function promptRenameMedia(mediaId) {
	const media = getMedia(mediaId);
	if (!media) return;
	
	const newName = prompt('Rename media:', media.name);
	if (newName && newName.trim()) {
		renameMedia(mediaId, newName.trim());
	}
}

// Prompt to delete media
function promptDeleteMedia(mediaId) {
	const media = getMedia(mediaId);
	if (!media) return;
	
	if (confirm(`Delete "${media.name}"?`)) {
		deleteMedia(mediaId);
	}
}

// Show context menu for media section
function showMediaSectionContextMenu(event) {
	// Remove existing context menu
	const existing = document.querySelector('.ob-media-section-context-menu');
	if (existing) existing.remove();
	
	const menu = document.createElement('div');
	menu.className = 'ob-context-menu ob-media-section-context-menu';
	
	const options = [
		{ icon: 'upload_file', label: 'Add Files', action: () => triggerMediaUpload() },
		{ icon: 'download', label: 'Export All Files', action: () => exportAllMediaFiles() },
		{ icon: 'delete_sweep', label: 'Delete All Files', action: () => deleteAllMediaFiles() }
	];
	
	options.forEach(opt => {
		const item = document.createElement('div');
		item.className = 'ob-context-menu-item';
		item.innerHTML = `<span class="material-icons-round" translate="no">${opt.icon}</span>${opt.label}`;
		item.onclick = () => {
			opt.action();
			menu.remove();
		};
		menu.appendChild(item);
	});
	
	document.body.appendChild(menu);
	
	// Position menu with viewport bounds checking
	positionContextMenu(menu, event.clientX, event.clientY);
	
	// Prevent menu clicks from closing the menu
	menu.addEventListener('click', (e) => {
		e.stopPropagation();
	});
	
	// Close on click outside
	setTimeout(() => {
		const closeMenu = (e) => {
			if (!menu.contains(e.target)) {
				menu.remove();
				document.removeEventListener('click', closeMenu);
			}
		};
		document.addEventListener('click', closeMenu);
	}, 10);
}

// Trigger media upload
function triggerMediaUpload() {
	const input = document.createElement('input');
	input.type = 'file';
	input.multiple = true;
	input.accept = 'image/*,video/*,audio/*';
	
	input.onchange = async (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;
		
		for (const file of files) {
			try {
				await saveMedia(file);
			} catch (error) {
				console.error('[Media] Failed to upload:', file.name, error);
			}
		}
	};
	
	input.click();
}

// Export all media files
function exportAllMediaFiles() {
	const mediaData = exportAllMedia();
	const mediaIds = Object.keys(mediaData);
	
	if (mediaIds.length === 0) {
		alert('No media files to export');
		return;
	}
	
	const blob = new Blob([JSON.stringify(mediaData, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `OceanBoard-Media-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);
	
	console.log('[Media] Exported', mediaIds.length, 'media files');
}

// Delete all media files
function deleteAllMediaFiles() {
	const mediaIds = getMediaList();
	
	if (mediaIds.length === 0) {
		alert('No media files to delete');
		return;
	}
	
	if (confirm(`Delete all ${mediaIds.length} media file(s)?`)) {
		mediaIds.forEach(id => deleteMedia(id));
		localStorage.removeItem('ob-media-list');
		renderMediaSection();
		console.log('[Media] Deleted all media files');
	}
}

// Initialize media section
export function initializeMediaSection() {
	const mediaTitle = document.querySelector('.ob-media-title');
	const mediaSection = document.querySelector('.ob-media-section');
	
	if (mediaTitle) {
		// Left-click to toggle collapse
		mediaTitle.addEventListener('click', () => {
			mediaSection.classList.toggle('collapsed');
			
			// Save collapsed state
			localStorage.setItem('ob-media-collapsed', mediaSection.classList.contains('collapsed'));
		});
		
		// Right-click for context menu
		mediaSection.addEventListener('contextmenu', (e) => {
			// Only show menu if clicking on the section itself or title, not on media items
			if (!e.target.closest('.ob-media-item')) {
				e.preventDefault();
				e.stopPropagation();
				showMediaSectionContextMenu(e);
			}
		}, true); // Use capture phase to handle event before global handler
		
		// Restore collapsed state
		const collapsed = localStorage.getItem('ob-media-collapsed') === 'true';
		if (collapsed) {
			mediaSection.classList.add('collapsed');
		}
	}
	
	renderMediaSection();
	console.log('[Media] System initialized');
}

// Export all media (for .ocean export)
export function exportAllMedia() {
	const mediaIds = getMediaList();
	const mediaData = {};
	
	mediaIds.forEach(id => {
		const media = getMedia(id);
		if (media) {
			mediaData[id] = media;
		}
	});
	
	return mediaData;
}

// Import media (from .ocean import)
export function importMedia(mediaData) {
	Object.entries(mediaData).forEach(([id, media]) => {
		localStorage.setItem(`ob-media-${id}`, JSON.stringify(media));
		updateMediaList(id);
	});
	
	renderMediaSection();
	console.log('[Media] Imported', Object.keys(mediaData).length, 'media files');
}

// Expose functions to window for cross-module access
if (typeof window !== 'undefined') {
	window.mediasystem = {
		getMedia,
		getMediaIdFromMention,
		positionContextMenu
	};
}
