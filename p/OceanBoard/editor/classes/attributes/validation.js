/* === File ID & Attribute Validation System === */

// Store all file-ids and their corresponding file names
let fileIdRegistry = new Map(); // file-id -> fileName
let attributeKeysRegistry = new Map(); // attributeFileName -> Set of keys

/* ===### Validate File ID ###=== */
export function validateFileId(fileId) {
	// Check length
	if (!fileId || fileId.length === 0) {
		return { valid: false, error: 'File ID cannot be empty' };
	}
	
	if (fileId.length > 24) {
		return { valid: false, error: 'File ID must be 24 characters or less' };
	}
	
	// Check alphanumeric only (no spaces, dots, symbols)
	const alphanumericRegex = /^[a-zA-Z0-9]+$/;
	if (!alphanumericRegex.test(fileId)) {
		return { valid: false, error: 'File ID can only contain letters and numbers (no spaces, dots, or symbols)' };
	}
	
	return { valid: true };
}

/* ===### Check File ID Uniqueness ###=== */
export function isFileIdUnique(fileId, currentFileName) {
	// Check if file-id already exists
	if (fileIdRegistry.has(fileId)) {
		const existingFile = fileIdRegistry.get(fileId);
		// Allow if it's the same file (editing existing)
		if (existingFile !== currentFileName) {
			return { unique: false, conflictFile: existingFile };
		}
	}
	return { unique: true };
}

/* ===### Register File ID ###=== */
export function registerFileId(fileId, fileName) {
	// Remove old file-id for this file if it exists
	for (const [id, file] of fileIdRegistry.entries()) {
		if (file === fileName) {
			fileIdRegistry.delete(id);
			break;
		}
	}
	
	fileIdRegistry.set(fileId, fileName);
	console.log('[Validation] Registered file-id:', fileId, 'for file:', fileName);
}

/* ===### Unregister File ID ###=== */
export function unregisterFileId(fileName) {
	for (const [id, file] of fileIdRegistry.entries()) {
		if (file === fileName) {
			fileIdRegistry.delete(id);
			console.log('[Validation] Unregistered file-id for file:', fileName);
			break;
		}
	}
}

/* ===### Parse File ID from Content ###=== */
export function parseFileId(content) {
	// Check if first line matches: $ file-id = "value"
	const lines = content.split('\n');
	if (lines.length === 0) return null;
	
	const firstLine = lines[0].trim();
	const fileIdRegex = /^\$\s*file-id\s*=\s*"([^"]+)"\s*$/;
	const match = firstLine.match(fileIdRegex);
	
	if (match && match[1]) {
		return match[1];
	}
	
	return null;
}

/* ===### Check Attribute Key Uniqueness ###=== */
export function isAttributeKeyUnique(attributeFileName, key) {
	if (!attributeKeysRegistry.has(attributeFileName)) {
		return { unique: true };
	}
	
	const keys = attributeKeysRegistry.get(attributeFileName);
	if (keys.has(key)) {
		return { unique: false, message: `Key "${key}" already exists in this attribute file` };
	}
	
	return { unique: true };
}

/* ===### Register Attribute Key ###=== */
export function registerAttributeKey(attributeFileName, key) {
	if (!attributeKeysRegistry.has(attributeFileName)) {
		attributeKeysRegistry.set(attributeFileName, new Set());
	}
	
	attributeKeysRegistry.get(attributeFileName).add(key);
	console.log('[Validation] Registered attribute key:', key, 'in file:', attributeFileName);
}

/* ===### Unregister Attribute Key ###=== */
export function unregisterAttributeKey(attributeFileName, key) {
	if (attributeKeysRegistry.has(attributeFileName)) {
		attributeKeysRegistry.get(attributeFileName).delete(key);
		console.log('[Validation] Unregistered attribute key:', key, 'from file:', attributeFileName);
	}
}

/* ===### Parse All Attribute Keys from Content ###=== */
export function parseAttributeKeys(content) {
	const keys = new Set();
	const lines = content.split('\n');
	
	// Match lines like: key = component.file-id:line
	const keyRegex = /^([a-zA-Z0-9_-]+)\s*=\s*.+$/;
	
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0 || trimmed.startsWith('#')) continue; // Skip empty lines and comments
		
		const match = trimmed.match(keyRegex);
		if (match && match[1]) {
			keys.add(match[1]);
		}
	}
	
	return keys;
}

/* ===### Rebuild Registry from All Files ###=== */
export function rebuildRegistries() {
	fileIdRegistry.clear();
	attributeKeysRegistry.clear();
	
	// Get all files from localStorage
	const allFiles = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith('ob-file-')) {
			const fileName = key.replace('ob-file-', '');
			const content = localStorage.getItem(key);
			allFiles.push({ fileName, content });
		}
	}
	
	// Process each file
	for (const { fileName, content } of allFiles) {
		// Check if it's a special file with file-id
		const fileId = parseFileId(content);
		if (fileId) {
			registerFileId(fileId, fileName);
		}
		
		// Check if it's an attribute file (contains key = value lines)
		if (fileName.includes('[AT]')) {
			const keys = parseAttributeKeys(content);
			attributeKeysRegistry.set(fileName, keys);
		}
	}
	
	console.log('[Validation] Registries rebuilt:', fileIdRegistry.size, 'file-ids,', attributeKeysRegistry.size, 'attribute files');
}

/* ===### Get File Name by File ID ###=== */
export function getFileNameByFileId(fileId) {
	return fileIdRegistry.get(fileId) || null;
}

/* ===### Get File ID by File Name ###=== */
export function getFileIdByFileName(fileName) {
	for (const [id, file] of fileIdRegistry.entries()) {
		if (file === fileName) {
			return id;
		}
	}
	return null;
}

/* ===### Get All File IDs ###=== */
export function getAllFileIds() {
	return Array.from(fileIdRegistry.keys());
}

/* ===### Get All Attribute Files ###=== */
export function getAllAttributeFiles() {
	return Array.from(attributeKeysRegistry.keys());
}

/* ===### Validate Attribute Reference ###=== */
export function validateAttributeReference(reference) {
	// Format: component.file-id or component.file-id:line
	const parts = reference.split('.');
	if (parts.length !== 2) {
		return { valid: false, error: 'Invalid format. Expected: component.file-id' };
	}
	
	const [component, rest] = parts;
	const fileIdPart = rest.split(':')[0];
	
	// Check if file-id exists
	if (!fileIdRegistry.has(fileIdPart)) {
		return { valid: false, error: `File with ID "${fileIdPart}" does not exist` };
	}
	
	return { valid: true, component, fileId: fileIdPart };
}

/* ===### Initialize Validation System ###=== */
export function initializeValidationSystem() {
	rebuildRegistries();
	console.log('[Validation] Validation system initialized');
}
