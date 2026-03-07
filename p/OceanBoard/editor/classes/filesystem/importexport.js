/* ===### Import/Export System ###=== */
/* === Note: Handles workspace and files export/import with JSZip === */

import { saveWorkspace, loadWorkspace, restoreWorkspace } from './storage.js';
import { exportAllMedia, importMedia } from './mediasystem.js';

let JSZip = null;

// Load JSZip library dynamically
async function loadJSZip() {
	if (JSZip) return JSZip;
	
	try {
		const script = document.createElement('script');
		script.src = './libs/jszip.js';
		document.head.appendChild(script);

		await new Promise((resolve, reject) => {
			script.onload = resolve;
			script.onerror = reject;
		});
		
		JSZip = window.JSZip;
		console.log('[Import/Export] JSZip library loaded successfully');
		return JSZip;
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to load JSZip:', error);
		throw error;
	}
}

/* ===### Export Workspace (Full) ###=== */
/* === Note: Includes version, settings, all series, all files === */
export async function exportWorkspace() {
	try {
		const zip = new (await loadJSZip())();
		
		// Get OceanBoard version
		const version = '0.0.3'; // Update this with your actual version
		
		// Create workspace metadata
		const workspaceData = {
			version: version,
			exportDate: new Date().toISOString(),
			type: 'workspace'
		};
		
		// Add metadata
		zip.file('oceanboard.json', JSON.stringify(workspaceData, null, 2));
		
		// Collect all settings
		const settings = {};
		
		// Get existing settings from localStorage
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('ob-setting-')) {
				settings[key] = localStorage.getItem(key);
			}
		}
		
		// Add default settings if not present
		const defaultSettings = {
			'ob-setting-autosave': '15',
			'ob-setting-fontsize': '14',
			'ob-setting-lineheight': '1.6',
			'ob-setting-linenumbers': 'false',
			'ob-setting-wordwrap': 'true',
			'ob-setting-smoothscroll': 'true'
		};
		
		// Merge defaults with existing
		for (const [key, value] of Object.entries(defaultSettings)) {
			if (!settings[key]) {
				settings[key] = value;
			}
		}
		
		console.log('[Import/Export] Settings found:', Object.keys(settings).length, 'items');
		console.log('[Import/Export] Settings keys:', Object.keys(settings));
		zip.file('settings.json', JSON.stringify(settings, null, 2));
		
		// Collect all series metadata
		const seriesListStr = localStorage.getItem('ob-series-list');
		const seriesList = seriesListStr ? JSON.parse(seriesListStr) : [];
		
		const seriesFolder = zip.folder('series');
		const allSeriesData = [];
		
		for (const seriesId of seriesList) {
			const metadataKey = `ob-series-meta-${seriesId}`;
			const workspaceKey = `ob-workspace-${seriesId}`;
			
			const metadata = localStorage.getItem(metadataKey);
			const workspace = localStorage.getItem(workspaceKey);
			
			if (metadata && workspace) {
				const seriesData = {
					id: seriesId,
					metadata: JSON.parse(metadata),
					workspace: JSON.parse(workspace)
				};
				allSeriesData.push(seriesData);
				
				// Save each series as a separate file
				seriesFolder.file(`${seriesId}.json`, JSON.stringify(seriesData, null, 2));
			}
		}
		
		// Collect all file contents
		const filesFolder = zip.folder('files');
		const allFiles = {};
		
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key.startsWith('ob-file-')) {
				const fileId = key.replace('ob-file-', '');
				allFiles[fileId] = localStorage.getItem(key);
				filesFolder.file(`${fileId}.txt`, localStorage.getItem(key));
			}
		}
		
		// Collect all media files
		const mediaData = exportAllMedia();
		const mediaCount = Object.keys(mediaData).length;
		if (mediaCount > 0) {
			zip.file('media.json', JSON.stringify(mediaData, null, 2));
			console.log('[Import/Export] Included', mediaCount, 'media files');
		}
		
		// Store active series
		const activeSeries = localStorage.getItem('ob-active-series');
		if (activeSeries) {
			zip.file('active-series.txt', activeSeries);
		}
		
		// Generate ZIP file
		const blob = await zip.generateAsync({ type: 'blob' });
		
		// Create download
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
		const filename = `OceanBoard-Workspace-${timestamp}.zip`;
		downloadBlob(blob, filename);
		
		console.log('[Import/Export] Workspace exported successfully:', filename);
		return true;
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to export workspace:', error);
		alert('Failed to export workspace. Check console for details.');
		return false;
	}
}

/* ===### Export Files Only ###=== */
/* === Note: Only includes basic version and all files, no settings === */
export async function exportFiles() {
	try {
		const zip = new (await loadJSZip())();
		
		// Basic version info
		const filesData = {
			version: '0.0.3',
			exportDate: new Date().toISOString(),
			type: 'files'
		};
		
		zip.file('oceanboard.json', JSON.stringify(filesData, null, 2));
		
		// Collect all series and workspaces (but not settings)
		const seriesListStr = localStorage.getItem('ob-series-list');
		const seriesList = seriesListStr ? JSON.parse(seriesListStr) : [];
		
		const seriesFolder = zip.folder('series');
		
		for (const seriesId of seriesList) {
			const metadataKey = `ob-series-meta-${seriesId}`;
			const workspaceKey = `ob-workspace-${seriesId}`;
			
			const metadata = localStorage.getItem(metadataKey);
			const workspace = localStorage.getItem(workspaceKey);
			
			if (metadata && workspace) {
				const seriesData = {
					id: seriesId,
					metadata: JSON.parse(metadata),
					workspace: JSON.parse(workspace)
				};
				seriesFolder.file(`${seriesId}.json`, JSON.stringify(seriesData, null, 2));
			}
		}
		
		// Collect all file contents
		const filesFolder = zip.folder('files');
		
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key.startsWith('ob-file-')) {
				const fileId = key.replace('ob-file-', '');
				filesFolder.file(`${fileId}.txt`, localStorage.getItem(key));
			}
		}
		
		// Collect all media files
		const mediaData = exportAllMedia();
		const mediaCount = Object.keys(mediaData).length;
		if (mediaCount > 0) {
			zip.file('media.json', JSON.stringify(mediaData, null, 2));
			console.log('[Import/Export] Included', mediaCount, 'media files');
		}
		
		// Generate ZIP file
		const blob = await zip.generateAsync({ type: 'blob' });
		
		// Create download
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
		const filename = `OceanBoard-Files-${timestamp}.zip`;
		downloadBlob(blob, filename);
		
		console.log('[Import/Export] Files exported successfully:', filename);
		return true;
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to export files:', error);
		alert('Failed to export files. Check console for details.');
		return false;
	}
}

/* ===### Import Workspace/Files ###=== */
/* === Note: Handles both workspace and files imports === */
export async function importZip() {
	try {
		// Create file input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.zip';
		
		input.onchange = async (e) => {
			const file = e.target.files[0];
			if (!file) return;
			
			try {
				const zip = new (await loadJSZip())();
				const contents = await zip.loadAsync(file);
				
				// Read metadata to determine type
				const metadataFile = contents.files['oceanboard.json'];
				if (!metadataFile) {
					alert('Invalid OceanBoard export file!');
					return;
				}
				
				const metadataStr = await metadataFile.async('string');
				const metadata = JSON.parse(metadataStr);
				
				console.log('[Import/Export] Importing:', metadata.type, 'Version:', metadata.version);
				
				// Import based on type
				if (metadata.type === 'workspace') {
					await importWorkspace(contents);
				} else if (metadata.type === 'files') {
					await importFilesOnly(contents);
				} else {
					alert('Unknown export type!');
					return;
				}
				
				// Reload page to show imported data
				alert('Import successful! The page will now reload.');
				window.location.reload();
				
			} catch (error) {
				console.error('[Import/Export - ERROR] Failed to import:', error);
				alert('Failed to import file. Make sure it\'s a valid OceanBoard export.');
			}
		};
		
		input.click();
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to create import dialog:', error);
		alert('Failed to open import dialog.');
	}
}

/* ===### Import Full Workspace ###=== */
async function importWorkspace(zip) {
	// Import settings
	const settingsFile = zip.files['settings.json'];
	if (settingsFile) {
		const settingsStr = await settingsFile.async('string');
		const settings = JSON.parse(settingsStr);
		
		for (const [key, value] of Object.entries(settings)) {
			localStorage.setItem(key, value);
		}
		console.log('[Import/Export] Settings imported');
	}
	
	// Import series
	await importSeriesData(zip);
	
	// Import files
	await importFileContents(zip);
	
	// Import media
	await importMediaData(zip);
	
	// Import active series
	const activeSeriesFile = zip.files['active-series.txt'];
	if (activeSeriesFile) {
		const activeSeries = await activeSeriesFile.async('string');
		localStorage.setItem('ob-active-series', activeSeries);
		console.log('[Import/Export] Active series restored:', activeSeries);
	}
}

/* ===### Import Files Only ###=== */
async function importFilesOnly(zip) {
	// Import series (without touching settings)
	await importSeriesData(zip);
	
	// Import files
	await importFileContents(zip);
	
	// Import media
	await importMediaData(zip);
}

/* ===### Import Series Data ###=== */
async function importSeriesData(zip) {
	const seriesFolder = zip.folder('series');
	if (!seriesFolder) return;
	
	const seriesList = [];
	
	for (const [path, file] of Object.entries(zip.files)) {
		if (path.startsWith('series/') && path.endsWith('.json') && !file.dir) {
			const seriesStr = await file.async('string');
			const seriesData = JSON.parse(seriesStr);
			
			// Store series metadata
			localStorage.setItem(`ob-series-meta-${seriesData.id}`, JSON.stringify(seriesData.metadata));
			
			// Store series workspace
			localStorage.setItem(`ob-workspace-${seriesData.id}`, JSON.stringify(seriesData.workspace));
			
			seriesList.push(seriesData.id);
			console.log('[Import/Export] Series imported:', seriesData.metadata.name);
		}
	}
	
	// Update series list
	if (seriesList.length > 0) {
		localStorage.setItem('ob-series-list', JSON.stringify(seriesList));
		console.log('[Import/Export] Total series imported:', seriesList.length);
	}
}

/* ===### Import File Contents ###=== */
async function importFileContents(zip) {
	const filesFolder = zip.folder('files');
	if (!filesFolder) return;
	
	let fileCount = 0;
	
	for (const [path, file] of Object.entries(zip.files)) {
		if (path.startsWith('files/') && path.endsWith('.txt') && !file.dir) {
			const fileId = path.replace('files/', '').replace('.txt', '');
			const content = await file.async('string');
			
			localStorage.setItem(`ob-file-${fileId}`, content);
			fileCount++;
		}
	}
	
	console.log('[Import/Export] Total files imported:', fileCount);
}

/* ===### Import Media Data ###=== */
async function importMediaData(zip) {
	const mediaFile = zip.files['media.json'];
	if (!mediaFile) {
		console.log('[Import/Export] No media files in import');
		return;
	}
	
	const mediaStr = await mediaFile.async('string');
	const mediaData = JSON.parse(mediaStr);
	
	importMedia(mediaData);
	console.log('[Import/Export] Media imported');
}

/* ===### Helper: Download Blob ###=== */
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/* ===### Export Single File ###=== */
export async function exportSingleFile(fileName) {
	try {
		const zip = new (await loadJSZip())();
		
		// Create file metadata
		const fileData = {
			version: '0.0.3',
			exportDate: new Date().toISOString(),
			type: 'single-file',
			fileName: fileName
		};
		
		zip.file('oceanboard.json', JSON.stringify(fileData, null, 2));
		
		// Get file content
		const content = localStorage.getItem(`ob-file-${fileName}`);
		if (content !== null) {
			zip.file('content.txt', content);
		} else {
			zip.file('content.txt', '');
		}
		
		// Generate ZIP
		const blob = await zip.generateAsync({ type: 'blob' });
		
		// Create download with sanitized filename
		const safeFileName = fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
		const zipFilename = `OceanBoard-File-${safeFileName}-${timestamp}.zip`;
		downloadBlob(blob, zipFilename);
		
		console.log('[Import/Export] Single file exported:', fileName);
		return true;
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to export file:', error);
		alert('Failed to export file. Check console for details.');
		return false;
	}
}

/* ===### Export Season ###=== */
export async function exportSeason(seasonName, fileNames) {
	try {
		const zip = new (await loadJSZip())();
		
		// Create season metadata
		const seasonData = {
			version: '0.0.3',
			exportDate: new Date().toISOString(),
			type: 'season',
			seasonName: seasonName,
			fileCount: fileNames.length
		};
		
		zip.file('oceanboard.json', JSON.stringify(seasonData, null, 2));
		
		// Create files list
		zip.file('files.json', JSON.stringify(fileNames, null, 2));
		
		// Add each file's content
		const filesFolder = zip.folder('files');
		for (const fileName of fileNames) {
			const content = localStorage.getItem(`ob-file-${fileName}`);
			if (content !== null) {
				// Sanitize filename for safe storage
				const safeFileName = fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
				filesFolder.file(`${safeFileName}.txt`, content);
				// Also store original name mapping
				filesFolder.file(`${safeFileName}.name`, fileName);
			}
		}
		
		// Generate ZIP
		const blob = await zip.generateAsync({ type: 'blob' });
		
		// Create download with sanitized filename
		const safeSeason = seasonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
		const zipFilename = `OceanBoard-Season-${safeSeason}-${timestamp}.zip`;
		downloadBlob(blob, zipFilename);
		
		console.log('[Import/Export] Season exported:', seasonName, 'with', fileNames.length, 'files');
		return true;
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to export season:', error);
		alert('Failed to export season. Check console for details.');
		return false;
	}
}

/* ===### Import Single File ###=== */
export async function importSingleFile() {
	try {
		// Create file input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.zip';
		
		input.onchange = async (e) => {
			const file = e.target.files[0];
			if (!file) return;
			
			try {
				const zip = new (await loadJSZip())();
				const contents = await zip.loadAsync(file);
				
				// Read metadata
				const metadataFile = contents.files['oceanboard.json'];
				if (!metadataFile) {
					alert('Invalid OceanBoard export file!');
					return;
				}
				
				const metadataStr = await metadataFile.async('string');
				const metadata = JSON.parse(metadataStr);
				
				console.log('[Import/Export] Importing:', metadata.type);
				
				if (metadata.type === 'single-file') {
					// Read content
					const contentFile = contents.files['content.txt'];
					if (!contentFile) {
						alert('File content not found in export!');
						return;
					}
					
					const content = await contentFile.async('string');
					const fileName = metadata.fileName || 'Imported File';
					
					// Check if file already exists
					let finalFileName = fileName;
					let counter = 1;
					while (localStorage.getItem(`ob-file-${finalFileName}`) !== null) {
						finalFileName = `${fileName} (${counter})`;
						counter++;
					}
					
					// Save file
					localStorage.setItem(`ob-file-${finalFileName}`, content);
					
					alert(`File imported as: ${finalFileName}\n\nPlease refresh the page to see it.`);
					console.log('[Import/Export] Single file imported:', finalFileName);
					
				} else if (metadata.type === 'season') {
					// Read files list
					const filesListFile = contents.files['files.json'];
					if (!filesListFile) {
						alert('Season files list not found!');
						return;
					}
					
					const filesListStr = await filesListFile.async('string');
					const originalFileNames = JSON.parse(filesListStr);
					
					let importedCount = 0;
					
					// Import each file
					for (const [path, file] of Object.entries(contents.files)) {
						if (path.startsWith('files/') && path.endsWith('.txt') && !file.dir) {
							const safeName = path.replace('files/', '').replace('.txt', '');
							const content = await file.async('string');
							
							// Try to get original name
							const nameFile = contents.files[`files/${safeName}.name`];
							let fileName = safeName;
							if (nameFile) {
								fileName = await nameFile.async('string');
							}
							
							// Check if file already exists
							let finalFileName = fileName;
							let counter = 1;
							while (localStorage.getItem(`ob-file-${finalFileName}`) !== null) {
								finalFileName = `${fileName} (${counter})`;
								counter++;
							}
							
							// Save file
							localStorage.setItem(`ob-file-${finalFileName}`, content);
							importedCount++;
						}
					}
					
					alert(`Season imported with ${importedCount} files!\n\nPlease refresh the page to see them.`);
					console.log('[Import/Export] Season imported with', importedCount, 'files');
					
				} else {
					alert('This import type is not supported here. Use the main import button for full workspace imports.');
					return;
				}
				
			} catch (error) {
				console.error('[Import/Export - ERROR] Failed to import:', error);
				alert('Failed to import file. Make sure it\'s a valid OceanBoard export.');
			}
		};
		
		input.click();
		
	} catch (error) {
		console.error('[Import/Export - ERROR] Failed to create import dialog:', error);
		alert('Failed to open import dialog.');
	}
}
