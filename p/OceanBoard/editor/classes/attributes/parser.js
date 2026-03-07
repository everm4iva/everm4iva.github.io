/* === Attribute Parser System === */

import { 
	parseFileId, 
	registerFileId, 
	validateFileId, 
	isFileIdUnique,
	parseAttributeKeys,
	registerAttributeKey 
} from './validation.js';

// Current file being edited
let currentFileName = null;
let currentFileId = null;

/* ===### Initialize Parser for File ###=== */
export function initializeParserForFile(fileName, content) {
	currentFileName = fileName;

	// Check if this is a special file (has file type prefix)
	const isSpecialFile = /^\[(C|O|SC|A|AT|EP)\]/.test(fileName);
	
	if (isSpecialFile && fileName.includes('[AT]')) {
		// This is an attribute file - parse keys
		parseAndRegisterAttributeKeys(fileName, content);
	} else if (isSpecialFile && !fileName.includes('[AT]')) {
		// This is a special file - parse file-id
		parseAndRegisterFileId(fileName, content);
	}
	
	console.log('[Parser] Initialized for file:', fileName);
}

/* ===### Parse and Register File ID ###=== */
function parseAndRegisterFileId(fileName, content) {
	const fileId = parseFileId(content);
	
	if (fileId) {
		// Validate format
		const validation = validateFileId(fileId);
		if (!validation.valid) {
			console.warn('[Parser] Invalid file-id format:', validation.error);
			showFileIdError(validation.error);
			return;
		}
		
		// Check uniqueness
		const uniqueness = isFileIdUnique(fileId, fileName);
		if (!uniqueness.unique) {
			console.warn('[Parser] Duplicate file-id detected:', fileId, 'in', uniqueness.conflictFile);
			showFileIdConflict(fileId, uniqueness.conflictFile);
			return;
		}
		
		// Register it
		registerFileId(fileId, fileName);
		currentFileId = fileId;
		console.log('[Parser] File-ID registered:', fileId, 'for', fileName);
	} else {
		console.log('[Parser] No file-id found in special file:', fileName);
		currentFileId = null;
	}
}

/* ===### Parse and Register Attribute Keys ###=== */
function parseAndRegisterAttributeKeys(fileName, content) {
	const keys = parseAttributeKeys(content);
	
	// Clear old keys for this file
	// (validation.js will handle this when we set new keys)
	
	// Register all keys
	for (const key of keys) {
		registerAttributeKey(fileName, key);
	}
	
	console.log('[Parser] Registered', keys.size, 'attribute keys for', fileName);
}

/* ===### Show File-ID Error ###=== */
function showFileIdError(errorMessage) {
	// Show error in editor (we'll make this prettier later)
	const editorContainer = document.querySelector('.ob-editor-container');
	if (!editorContainer) return;
	
	const errorBanner = document.createElement('div');
	errorBanner.className = 'ob-file-id-error';
	errorBanner.innerHTML = `
		<span class="material-icons-round" translate="no">error</span>
		<span>File-ID Error: ${errorMessage}</span>
		<button class="ob-error-dismiss" onclick="this.parentElement.remove()">
			<span class="material-icons-round" translate="no">close</span>
		</button>
	`;
	
	editorContainer.prepend(errorBanner);
	
	// Auto-dismiss after 5 seconds
	setTimeout(() => {
		errorBanner.remove();
	}, 5000);
}

/* ===### Show File-ID Conflict ###=== */
function showFileIdConflict(fileId, conflictFile) {
	const editorContainer = document.querySelector('.ob-editor-container');
	if (!editorContainer) return;
	
	const errorBanner = document.createElement('div');
	errorBanner.className = 'ob-file-id-error';
	errorBanner.innerHTML = `
		<span class="material-icons-round" translate="no">warning</span>
		<span>File-ID "${fileId}" is already used by "${conflictFile}". Please choose a different ID.</span>
		<button class="ob-error-dismiss" onclick="this.parentElement.remove()">
			<span class="material-icons-round" translate="no">close</span>
		</button>
	`;
	
	editorContainer.prepend(errorBanner);
	
	// Auto-dismiss after 8 seconds
	setTimeout(() => {
		errorBanner.remove();
	}, 8000);
}

/* ===### Get Current File ID ###=== */
export function getCurrentFileId() {
	return currentFileId;
}

/* ===### Get Current File Name ###=== */
export function getCurrentFileName() {
	return currentFileName;
}

/* ===### Parse Mentions in Content ###=== */
export function parseMentions(content) {
	const mentions = [];
	
	// Pattern for @component.file-id
	const directMentionRegex = /@([a-z]+)\.([a-zA-Z0-9]+)/g;
	
	// Pattern for component.file-id (needs confirmation)
	const naturalMentionRegex = /(?<!@)([a-z]+)\.([a-zA-Z0-9]+)/g;

	// Find all direct mentions (@component.file-id)
	let match;
	while ((match = directMentionRegex.exec(content)) !== null) {
		mentions.push({
			type: 'direct',
			full: match[0],
			component: match[1],
			fileId: match[2],
			index: match.index
		});
	}
	
	// Find all natural mentions (component.file-id)
	while ((match = naturalMentionRegex.exec(content)) !== null) {
		// Skip if it's part of a direct mention or looks like a file extension
		const prevChar = content[match.index - 1];
		if (prevChar === '@') continue;
		
		// Skip common false positives (e.g., "file.txt", "v1.0")
		if (match[2].length <= 3 && /^(txt|md|js|css|html|png|jpg|gif)$/i.test(match[2])) {
			continue;
		}
		
		mentions.push({
			type: 'natural',
			full: match[0],
			component: match[1],
			fileId: match[2],
			index: match.index
		});
	}
	
	console.log('[Parser] Found', mentions.length, 'mentions in content');
	return mentions;
}

/* ===### Parse Attribute File Content ###=== */
export function parseAttributeFile(content) {
	const attributes = new Map();
	const lines = content.split('\n');
	
	// Skip first line if it's a file-id declaration
	let startLine = 0;
	if (lines[0] && lines[0].trim().startsWith('$ file-id')) {
		startLine = 1;
	}
	
	// Parse each line: key = component.file-id:line
	const attributeRegex = /^([a-zA-Z0-9_-]+)\s*=\s*([a-z]+)\.([a-zA-Z0-9]+)(?::(\d+))?$/;
	
	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i].trim();
		
		// Skip empty lines and comments
		if (line.length === 0 || line.startsWith('#')) continue;
		
		const match = line.match(attributeRegex);
		if (match) {
			const [, key, component, fileId, lineNum] = match;
			attributes.set(key, {
				component,
				fileId,
				line: lineNum ? parseInt(lineNum) : null,
				originalLine: i + 1 // Store line number for reference
			});
		}
	}
	
	console.log('[Parser] Parsed', attributes.size, 'attributes from file');
	return attributes;
}

/* ===### Cleanup Parser ###=== */
export function cleanupParser() {
	currentFileName = null;
	currentFileId = null;
	console.log('[Parser] Parser cleaned up');
}
