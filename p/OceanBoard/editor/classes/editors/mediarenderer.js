/* === Markdown Renderer for OceanBoard === */

import { getMedia, getMediaIdFromMention } from '../filesystem/mediasystem.js';

// Preprocess markdown to convert $mentions to media links
export function preprocessMediaMentions(markdown) {
	// Find all $filename patterns, including optional sizing: $filename{width:500px}
	return markdown.replace(/\$([a-zA-Z0-9-_.]+)(\{[^}]+\})?/g, (match, filename, sizing) => {
		const mention = `$${filename}`; // Just the mention part
		const mediaId = getMediaIdFromMention(mention);
		
		if (!mediaId) {
			// Not a valid media mention, leave as is
			return match;
		}
		
		const media = getMedia(mediaId);
		if (!media) {
			return match;
		}
		
		// Parse sizing if present
		let sizeStyle = '';
		if (sizing) {
			// Extract width from {width:500px} or {width:50%}
			const widthMatch = sizing.match(/width:([0-9]+(?:px|%))/);
			if (widthMatch) {
				sizeStyle = ` style="width:${widthMatch[1]}"`;
			}
		}
		
		// Convert to markdown based on media type
		const cleanName = filename;
		if (media.type === 'image') {
			return `![${cleanName}](media:${mediaId}${sizeStyle})`;
		} else if (media.type === 'video') {
			return `[${cleanName}](media:${mediaId}${sizeStyle})`;
		} else if (media.type === 'audio') {
			return `[${cleanName}](media:${mediaId}${sizeStyle})`;
		}
		
		return match;
	});
}

// Custom renderer for media links
export function setupCustomRenderer() {
	if (!window.marked) {
		console.error('[Renderer] marked.js not loaded');
		return;
	}
	
	const renderer = new marked.Renderer();
	
	// Override image rendering
	const originalImage = renderer.image.bind(renderer);
	renderer.image = function(href, title, text) {
		// Ensure href is a string
		const hrefStr = typeof href === 'string' ? href : (href?.href || '');
		
		// Check if it's a media: link
		if (hrefStr.startsWith('media:')) {
			// Extract mediaId and optional style
			const parts = hrefStr.replace('media:', '').split(' style=');
			const mediaId = parts[0];
			const inlineStyle = parts[1] ? parts[1].replace(/"/g, '') : '';
			return renderMediaImage(mediaId, text, title, inlineStyle);
		}
		
		// Default image rendering
		return originalImage(href, title, text);
	};
	
	// Override link rendering (for video/audio)
	const originalLink = renderer.link.bind(renderer);
	renderer.link = function(href, title, text) {
		// Ensure href is a string
		const hrefStr = typeof href === 'string' ? href : (href?.href || '');
		
		// Check if it's a media: link
		if (hrefStr.startsWith('media:')) {
			const parts = hrefStr.replace('media:', '').split(' style=');
			const mediaId = parts[0];
			const inlineStyle = parts[1] ? parts[1].replace(/"/g, '') : '';
			return renderMediaLink(mediaId, text, title, inlineStyle);
		}
		
		// Default link rendering
		return originalLink(href, title, text);
	};
	
	// Set the custom renderer
	marked.setOptions({ renderer });
	
	console.log('[Renderer] Custom media renderer initialized');
}

// Render media image
function renderMediaImage(mediaId, alt, title, inlineStyle = '') {
	const media = getMedia(mediaId);
	
	if (!media) {
		return `<span class="ob-media-missing" title="Media not found">${alt || 'Missing Image'}</span>`;
	}
	
	if (media.type !== 'image') {
		return `<span class="ob-media-error" title="Not an image">${alt || media.name} (not an image)</span>`;
	}
	
	// Parse properties from title (e.g., "width=500px;height=300px")
	const props = parseMediaProperties(title);
	
	let style = buildStyleString(props);
	
	// Add inline style from mention sizing
	if (inlineStyle) {
		style = style ? `${style};${inlineStyle}` : inlineStyle;
	}
	
	const titleAttr = title && !title.includes('=') ? `title="${escapeHtml(title)}"` : '';
	
	return `<img 
		src="${media.data}" 
		alt="${escapeHtml(alt || media.name)}" 
		${titleAttr}
		${style ? `style="${style}"` : ''}
		class="ob-media-content ob-media-image"
		data-media-id="${mediaId}"
	/>`;
}

// Render media link (video/audio)
function renderMediaLink(mediaId, text, title, inlineStyle = '') {
	const media = getMedia(mediaId);
	
	if (!media) {
		return `<span class="ob-media-missing" title="Media not found">${text || 'Missing Media'}</span>`;
	}
	
	// Parse properties
	const props = parseMediaProperties(title);
	
	if (media.type === 'video') {
		return renderVideoPlayer(media, text, props, inlineStyle);
	} else if (media.type === 'audio') {
		return renderAudioPlayer(media, text, props, inlineStyle);
	}
	
	// Fallback for unknown types
	return `<span class="ob-media-error">${text || media.name}</span>`;
}

// Render video player
function renderVideoPlayer(media, text, props, inlineStyle = '') {
	let style = buildStyleString(props);
	if (inlineStyle) {
		style = style ? `${style};${inlineStyle}` : inlineStyle;
	}
	
	return `<div class="ob-media-container ob-media-video-container" data-media-id="${media.id}">
		<video 
			controls 
			${style ? `style="${style}"` : ''}
			class="ob-media-content ob-media-video"
			preload="metadata"
		>
			<source src="${media.data}" type="${media.mimeType}">
			Your browser does not support the video tag.
		</video>
		<div class="ob-media-caption">${escapeHtml(text || media.name)}</div>
	</div>`;
}

// Render audio player
function renderAudioPlayer(media, text, props, inlineStyle = '') {
	let style = buildStyleString(props);
	if (inlineStyle) {
		style = style ? `${style};${inlineStyle}` : inlineStyle;
	}
	
	return `<div class="ob-media-container ob-media-audio-container" data-media-id="${media.id}">
		<audio 
			controls 
			${style ? `style="${style}"` : ''}
			class="ob-media-content ob-media-audio"
			preload="metadata"
		>
			<source src="${media.data}" type="${media.mimeType}">
			Your browser does not support the audio tag.
		</audio>
		<div class="ob-media-caption">${escapeHtml(text || media.name)}</div>
	</div>`;
}

// Parse media properties from title string
// Format: "width=500px;height=300px;align=center"
function parseMediaProperties(title) {
	const props = {};
	
	if (!title || !title.includes('=')) {
		return props;
	}
	
	const pairs = title.split(';');
	pairs.forEach(pair => {
		const [key, value] = pair.split('=').map(s => s.trim());
		if (key && value) {
			props[key.toLowerCase()] = value;
		}
	});
	
	return props;
}

// Build CSS style string from properties
function buildStyleString(props) {
	const styles = [];
	
	if (props.width) {
		styles.push(`width: ${props.width}`);
	}
	if (props.height) {
		styles.push(`height: ${props.height}`);
	}
	if (props.maxwidth) {
		styles.push(`max-width: ${props.maxwidth}`);
	}
	if (props.align) {
		if (props.align === 'center') {
			styles.push('margin: 0 auto', 'display: block');
		} else if (props.align === 'left') {
			styles.push('float: left', 'margin-right: 16px');
		} else if (props.align === 'right') {
			styles.push('float: right', 'margin-left: 16px');
		}
	}
	
	return styles.join('; ');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Export media properties format helper
export function formatMediaProperties(props) {
	return Object.entries(props)
		.map(([key, value]) => `${key}=${value}`)
		.join(';');
}
