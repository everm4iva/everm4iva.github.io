/* === Media Properties Modal === */

export function showMediaPropertiesModal(mediaId, currentProps = {}) {
	// Remove existing modal
	const existing = document.querySelector('.ob-media-props-modal');
	if (existing) existing.remove();
	
	const overlay = document.createElement('div');
	overlay.className = 'ob-modal-overlay ob-media-props-modal';
	
	const modal = document.createElement('div');
	modal.className = 'ob-modal';
	
	modal.innerHTML = `
		<div class="ob-modal-header">
			<h2>Media Properties</h2>
			<button class="ob-modal-close">
				<span class="material-icons-round" translate="no">close</span>
			</button>
		</div>
		<div class="ob-modal-body">
			<div class="ob-media-props-form">
				<div class="ob-form-group">
					<label for="media-width">Width</label>
					<input 
						type="text" 
						id="media-width" 
						placeholder="e.g., 500px, 80%, auto" 
						value="${currentProps.width || ""}"
					>
					<small>Use px, %, or auto</small>
				</div>
				
				<div class="ob-form-group">
					<label for="media-height">Height</label>
					<input 
						type="text" 
						id="media-height" 
						placeholder="e.g., 300px, auto" 
						value="${currentProps.height || ""}"
					>
					<small>Use px or auto (optional)</small>
				</div>
				
				<div class="ob-form-group">
					<label for="media-maxwidth">Max Width</label>
					<input 
						type="text" 
						id="media-maxwidth" 
						placeholder="e.g., 800px, 100%" 
						value="${currentProps.maxwidth || ""}"
					>
					<small>Maximum width constraint</small>
				</div>
				
				<div class="ob-form-group">
					<label for="media-align">Alignment</label>
					<select id="media-align">
						<option value="" ${!currentProps.align ? "selected" : ""}>Default</option>
						<option value="left" ${
							currentProps.align === "left" ? "selected" : ""
						}>Left (float)</option>
						<option value="center" ${
							currentProps.align === "center" ? "selected" : ""
						}>Center</option>
						<option value="right" ${
							currentProps.align === "right" ? "selected" : ""
						}>Right (float)</option>
					</select>
					<small>How the media should be aligned</small>
				</div>
			</div>
		</div>
		<div class="ob-modal-footer">
			<button class="ob-btn ob-btn-secondary" id="media-props-cancel">Cancel</button>
			<button class="ob-btn ob-btn-primary" id="media-props-apply">Apply</button>
		</div>
	`;
	
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
	
	// Event handlers
	modal.querySelector('.ob-modal-close').onclick = () => overlay.remove();
	modal.querySelector('#media-props-cancel').onclick = () => overlay.remove();
	
	modal.querySelector('#media-props-apply').onclick = () => {
		const props = {
			width: document.getElementById('media-width').value.trim(),
			height: document.getElementById('media-height').value.trim(),
			maxwidth: document.getElementById('media-maxwidth').value.trim(),
			align: document.getElementById('media-align').value
		};
		
		// Remove empty properties
		Object.keys(props).forEach(key => {
			if (!props[key]) delete props[key];
		});
		
		applyMediaProperties(mediaId, props);
		overlay.remove();
	};
	
	// Focus first input
	setTimeout(() => document.getElementById('media-width').focus(), 100);
}

// Apply properties to media in editor
function applyMediaProperties(mediaId, props) {
	const textarea = document.querySelector('.ob-md-input');
	if (!textarea) return;
	
	const content = textarea.value;
	
	// Format properties string
	const propsString = Object.entries(props)
		.map(([key, value]) => `${key}=${value}`)
		.join(';');
	
	// Find and replace the media reference
	// Pattern: ![alt](media:id) or ![alt](media:id "old props")
	const patterns = [
		// Image with existing props
		new RegExp(`(!\\[[^\\]]*\\]\\(media:${mediaId}\\s+"[^"]*")\\)`, 'g'),
		// Image without props
		new RegExp(`(!\\[[^\\]]*\\]\\(media:${mediaId})\\)`, 'g'),
		// Link with existing props
		new RegExp(`(\\[[^\\]]*\\]\\(media:${mediaId}\\s+"[^"]*")\\)`, 'g'),
		// Link without props
		new RegExp(`(\\[[^\\]]*\\]\\(media:${mediaId})\\)`, 'g')
	];
	
	let newContent = content;
	let replaced = false;
	
	for (const pattern of patterns) {
		if (pattern.test(newContent)) {
			newContent = newContent.replace(pattern, (match, capture) => {
				replaced = true;
				// Remove old props if they exist
				const withoutOldProps = capture.replace(/\s+"[^"]*"/, '');
				// Add new props
				return `${withoutOldProps} "${propsString}")`;
			});
			
			if (replaced) break;
		}
	}
	
	if (replaced) {
		textarea.value = newContent;
		textarea.dispatchEvent(new Event('input'));
		console.log('[Media Props] Applied properties to', mediaId, props);
	} else {
		console.warn('[Media Props] Could not find media reference:', mediaId);
		alert('Could not find media in current file');
	}
}

// Parse properties from markdown
export function parsePropertiesFromMarkdown(markdown) {
	// Extract properties from: ![alt](media:id "width=500px;height=300px")
	const match = markdown.match(/["']([^"']+)["'](?=\))/);
	if (!match) return {};
	
	const propsString = match[1];
	const props = {};
	
	propsString.split(';').forEach(pair => {
		const [key, value] = pair.split('=').map(s => s.trim());
		if (key && value) {
			props[key.toLowerCase()] = value;
		}
	});
	
	return props;
}

// Detect media references in editor and add context menu
export function setupMediaContextMenu() {
	document.addEventListener('contextmenu', (e) => {
		const textarea = document.querySelector('.ob-md-input');
		if (!textarea || e.target !== textarea) return;
		
		// Get word at cursor
		const pos = textarea.selectionStart;
		const text = textarea.value;
		
		// Find the line containing the cursor
		const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
		const lineEnd = text.indexOf('\n', pos);
		const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
		
		// Check if line contains media reference
		const mediaMatch = line.match(/media:(media-\d+-[a-z0-9]+)/);
		if (!mediaMatch) return;
		
		const mediaId = mediaMatch[1];
		
		// Get current properties from the line
		const currentProps = parsePropertiesFromMarkdown(line);
		
		e.preventDefault();
		showMediaContextMenuAtCursor(e, mediaId, currentProps);
	});
}

function showMediaContextMenuAtCursor(event, mediaId, currentProps) {
	// Remove existing context menu
	const existing = document.querySelector('.ob-media-context-menu');
	if (existing) existing.remove();
	
	const menu = document.createElement('div');
	menu.className = 'ob-context-menu ob-media-context-menu';
	menu.style.left = event.clientX + 'px';
	menu.style.top = event.clientY + 'px';
	
	const item = document.createElement('div');
	item.className = 'ob-context-menu-item';
	item.innerHTML = `<span class="material-icons-round" translate="no">settings</span>Media Properties`;
	item.onclick = () => {
		showMediaPropertiesModal(mediaId, currentProps);
		menu.remove();
	};
	menu.appendChild(item);
	
	document.body.appendChild(menu);
	
	// Close on click outside
	setTimeout(() => {
		document.addEventListener('click', function closeMenu() {
			menu.remove();
			document.removeEventListener('click', closeMenu);
		});
	}, 0);
}
