/* === Context Menu System for OceanBoard === */

import { deleteFile, renameFile, saveWorkspace } from './storage.js';
import { addDragDropToElement, initializeDragDrop } from './dragdrop.js';
import { attachFileClickHandlers, closeAllTabs, renameTab } from '../index.js';
import { exportSingleFile, exportSeason, importSingleFile } from './importexport.js';
import { safeSetItem, handleQuotaExceeded } from './storagemanager.js';

let contextMenu = null;
let targetElement = null;
let closeMenuHandler = null;

export function initializeContextMenu() {
	createContextMenuElement();
	attachContextMenuListeners();
	disableDefaultContextMenu();
	console.log('[Context Menu] Initialized');
}

function disableDefaultContextMenu() {
	document.addEventListener('contextmenu', (e) => {
		// Don't prevent default on media section - it has its own context menu
		const mediaSection = e.target.closest('.ob-media-section');
		if (!mediaSection) {
			e.preventDefault();
		}
	}, false);
}

function createContextMenuElement() {
	contextMenu = document.createElement('div');
	contextMenu.className = 'ob-context-menu';
	contextMenu.innerHTML = `
		<div class="ob-context-item" data-action="rename">
			<span class="material-icons-round" translate="no">edit</span>
			<span>Rename</span>
		</div>
		<div class="ob-context-item" data-action="duplicate">
			<span class="material-icons-round" translate="no">content_copy</span>
			<span>Duplicate</span>
		</div>
		<div class="ob-context-divider"></div>
		<div class="ob-context-item" data-action="export-file">
			<span class="material-icons-round" translate="no">download</span>
			<span>Export File</span>
		</div>
		<div class="ob-context-item" data-action="export-season">
			<span class="material-icons-round" translate="no">folder_zip</span>
			<span>Export Season</span>
		</div>
		<div class="ob-context-item" data-action="import-file">
			<span class="material-icons-round" translate="no">upload</span>
			<span>Import File</span>
		</div>
		<div class="ob-context-divider"></div>
		<div class="ob-context-item" data-action="add-episode">
			<span class="material-icons-round" translate="no">note_add</span>
			<span>Add Episode</span>
		</div>
		<div class="ob-context-item" data-action="add-season">
			<span class="material-icons-round" translate="no">create_new_folder</span>
			<span>Add Season</span>
		</div>
		<div class="ob-context-divider special-only"></div>
		<div class="ob-context-item special-only" data-action="add-character">
			<span class="material-icons-round" translate="no">person</span>
			<span>Add Character</span>
		</div>
		<div class="ob-context-item special-only" data-action="add-object">
			<span class="material-icons-round" translate="no">category</span>
			<span>Add Object</span>
		</div>
		<div class="ob-context-item special-only" data-action="add-scene">
			<span class="material-icons-round" translate="no">landscape</span>
			<span>Add Scene</span>
		</div>
		<div class="ob-context-item special-only" data-action="add-action">
			<span class="material-icons-round" translate="no">event</span>
			<span>Add Action</span>
		</div>
		<div class="ob-context-item special-only" data-action="add-attribute">
			<span class="material-icons-round" translate="no">label</span>
			<span>Add Attribute</span>
		</div>
		<div class="ob-context-divider"></div>
		<div class="ob-context-item ob-context-danger" data-action="delete">
			<span class="material-icons-round" translate="no">delete</span>
			<span>Delete</span>
		</div>
	`;
	document.body.appendChild(contextMenu);
	
	contextMenu.addEventListener('click', (e) => {
		e.stopPropagation();
		handleContextMenuAction(e);
	});
}

function attachContextMenuListeners() {
	document.addEventListener('contextmenu', (e) => {
		const treeItem = e.target.closest('.ob-tree-list li');
		const seasonTitle = e.target.closest('.ob-tree-title');
		const specialSection = e.target.closest('.ob-special-section');
		const specialTitle = specialSection?.querySelector('.ob-tree-title');
		
		// Allow right-click on the special section title itself
		if (specialTitle && e.target === specialTitle) {
			e.preventDefault();
			targetElement = specialTitle;
			showContextMenu(e.pageX, e.pageY, true, true);
			return;
		}
		
		if (treeItem || seasonTitle) {
			e.preventDefault();
			const isSpecial = !!specialSection;
			targetElement = treeItem || seasonTitle;
			showContextMenu(e.pageX, e.pageY, !!seasonTitle, isSpecial);
		}
	});
}

function showContextMenu(x, y, isSeason, isSpecial) {
	hideContextMenu();
	
	const addEpisodeItem = contextMenu.querySelector('[data-action="add-episode"]');
	const addSeasonItem = contextMenu.querySelector('[data-action="add-season"]');
	const duplicateItem = contextMenu.querySelector('[data-action="duplicate"]');
	const deleteItem = contextMenu.querySelector('[data-action="delete"]');
	const renameItem = contextMenu.querySelector('[data-action="rename"]');
	const exportFileItem = contextMenu.querySelector('[data-action="export-file"]');
	const exportSeasonItem = contextMenu.querySelector('[data-action="export-season"]');
	const importFileItem = contextMenu.querySelector('[data-action="import-file"]');
	const specialItems = contextMenu.querySelectorAll('.special-only');
	
	specialItems.forEach(item => item.style.display = 'none');
	
	if (isSpecial && isSeason) {
		// Right-clicked on "Attributes" title - show only special file creation options
		addEpisodeItem.style.display = 'none';
		addSeasonItem.style.display = 'none';
		duplicateItem.style.display = 'none';
		deleteItem.style.display = 'none';
		renameItem.style.display = 'none';
		exportFileItem.style.display = 'none';
		exportSeasonItem.style.display = 'none';
		importFileItem.style.display = 'flex';
		specialItems.forEach(item => item.style.display = 'flex');
	} else if (isSpecial) {
		// Right-clicked on a special file - show all special options
		addEpisodeItem.style.display = 'none';
		addSeasonItem.style.display = 'none';
		duplicateItem.style.display = 'flex';
		deleteItem.style.display = 'flex';
		renameItem.style.display = 'flex';
		exportFileItem.style.display = 'flex';
		exportSeasonItem.style.display = 'none';
		importFileItem.style.display = 'flex';
		specialItems.forEach(item => item.style.display = 'flex');
	} else if (isSeason) {
		// Right-clicked on a regular season title
		addEpisodeItem.style.display = 'flex';
		addSeasonItem.style.display = 'flex';
		duplicateItem.style.display = 'none';
		deleteItem.style.display = 'flex';
		renameItem.style.display = 'flex';
		exportFileItem.style.display = 'none';
		exportSeasonItem.style.display = 'flex';
		importFileItem.style.display = 'flex';
	} else {
		// Right-clicked on a regular episode
		addEpisodeItem.style.display = 'none';
		addSeasonItem.style.display = 'flex';
		duplicateItem.style.display = 'flex';
		deleteItem.style.display = 'flex';
		renameItem.style.display = 'flex';
		exportFileItem.style.display = 'flex';
		exportSeasonItem.style.display = 'none';
		importFileItem.style.display = 'flex';
	}
	
	contextMenu.style.left = x + 'px';
	contextMenu.style.top = y + 'px';
	contextMenu.classList.add('visible');
	
	const rect = contextMenu.getBoundingClientRect();
	if (rect.right > window.innerWidth) {
		contextMenu.style.left = (x - rect.width) + 'px';
	}
	if (rect.bottom > window.innerHeight) {
		contextMenu.style.top = (y - rect.height) + 'px';
	}
	
	// Add click-outside listener when menu is shown
	setTimeout(() => {
		closeMenuHandler = (e) => {
			// Don't close if clicking on a tree title (to allow collapse/expand)
			if (!contextMenu.contains(e.target) && !e.target.closest('.ob-tree-title')) {
				hideContextMenu();
			} else if (e.target.closest('.ob-tree-title')) {
				// If clicking a tree title, close the menu
				hideContextMenu();
			}
		};
		document.addEventListener('click', closeMenuHandler);
	}, 10);
}

function hideContextMenu() {
	if (contextMenu) {
		contextMenu.classList.remove('visible');
		// Remove the click-outside listener
		if (closeMenuHandler) {
			document.removeEventListener('click', closeMenuHandler);
			closeMenuHandler = null;
		}
	}
}

function handleContextMenuAction(e) {
	const item = e.target.closest('.ob-context-item');
	if (!item || !targetElement) return;
	
	const action = item.dataset.action;
	
	switch(action) {
		case 'rename':
			handleRename();
			break;
		case 'duplicate':
			handleDuplicate();
			break;
		case 'export-file':
			handleExportFile();
			break;
		case 'export-season':
			handleExportSeason();
			break;
		case 'import-file':
			handleImportFile();
			break;
		case 'add-episode':
			handleAddEpisode();
			break;
		case 'add-season':
			handleAddSeason();
			break;
		case 'add-character':
			handleAddSpecialFile('character');
			break;
		case 'add-object':
			handleAddSpecialFile('object');
			break;
		case 'add-scene':
			handleAddSpecialFile('scene');
			break;
		case 'add-action':
			handleAddSpecialFile('action');
			break;
		case 'add-attribute':
			handleAddSpecialFile('attribute');
			break;
		case 'delete':
			handleDelete();
			break;
	}
	
	hideContextMenu();
}

function handleRename() {
	const isSeason = targetElement.classList.contains('ob-tree-title');
	const isSpecialFile = targetElement.closest('.ob-special-section') !== null;
	
	// Extract only text nodes, excluding icon elements
	const textNodes = Array.from(targetElement.childNodes).filter(node => node.nodeType === 3);
	const currentName = textNodes.map(n => n.textContent.trim()).join('').trim();
	
	const maxLength = 50;
	let newName = prompt(isSeason ? 'Rename season (max 50 chars):' : 'Rename file (max 50 chars):', currentName);
	
	if (newName && newName !== currentName) {
		// Trim to max length
		if (newName.length > maxLength) {
			newName = newName.substring(0, maxLength);
			alert(`Name was trimmed to ${maxLength} characters.`);
		}
		
		if (isSeason) {
			const textNode = Array.from(targetElement.childNodes).find(node => node.nodeType === 3);
			if (textNode) {
				textNode.textContent = newName;
			}
		} else {
			const icon = targetElement.querySelector('.material-icons-round');
			const textNodes = Array.from(targetElement.childNodes).filter(node => node.nodeType === 3);
			if (textNodes.length > 0) {
				textNodes[textNodes.length - 1].textContent = ' ' + newName;
			} else {
				targetElement.innerHTML = '';
				targetElement.appendChild(icon);
				targetElement.appendChild(document.createTextNode(' ' + newName));
			}
			renameFile(currentName, newName);
			
			// Update tab if file has an open tab
			renameTab(currentName, newName);
		}
		saveWorkspace();
		console.log('[Context Menu] Renamed:', currentName, 'to', newName);
	}
}

function handleDuplicate() {
	// Extract only text nodes, excluding icon elements
	const textNodes = Array.from(targetElement.childNodes).filter(node => node.nodeType === 3);
	const fileName = textNodes.map(n => n.textContent.trim()).join('').trim();
	
	let newName = fileName + ' (Copy)';
	const maxLength = 50;
	
	// Trim if too long
	if (newName.length > maxLength) {
		newName = fileName.substring(0, maxLength - 7) + ' (Copy)';
	}
	
	const content = localStorage.getItem('ob-file-' + fileName);
	if (content) {
		const result = safeSetItem('ob-file-' + newName, content);
		if (!result.success) {
			handleQuotaExceeded('duplicate file');
			return;
		}
	}
	
	const newItem = targetElement.cloneNode(true);
	const newTextNodes = Array.from(newItem.childNodes).filter(node => node.nodeType === 3);
	if (newTextNodes.length > 0) {
		newTextNodes[newTextNodes.length - 1].textContent = ' ' + newName;
	}
	addDragDropToElement(newItem);
	
	targetElement.parentNode.insertBefore(newItem, targetElement.nextSibling);
	attachFileClickHandlers();
	saveWorkspace();
	console.log('[Context Menu] Duplicated:', fileName);
}

function handleAddEpisode() {
	const section = targetElement.closest('.ob-tree-section');
	const list = section.querySelector('.ob-tree-list');
	const episodeCount = list.children.length + 1;
	const episodeName = `[EP${episodeCount}] - New Episode`;
	
	const newEpisode = document.createElement('li');
	newEpisode.innerHTML = `<span class="material-icons-round" translate="no">description</span> ${episodeName}`;
	addDragDropToElement(newEpisode);
	list.appendChild(newEpisode);
	attachFileClickHandlers();
	saveWorkspace();
	console.log('[Context Menu] Added episode:', episodeName);
}

function handleAddSeason() {
	const treeContainer = document.querySelector('.ob-tree');
	const seasonCount = treeContainer.querySelectorAll('.ob-tree-section').length + 1;
	const seasonName = `[S${seasonCount}] - New Season`;
	
	const newSection = document.createElement('div');
	newSection.className = 'ob-tree-section';
	newSection.innerHTML = `
		<div class="ob-tree-title">${seasonName}</div>
		<ul class="ob-tree-list">
			<li><span class="material-icons-round" translate="no">description</span> [EP1] - First Episode</li>
		</ul>
	`;
	
	const title = newSection.querySelector('.ob-tree-title');
	title.addEventListener('click', function() {
		this.classList.toggle('collapsed');
		this.parentElement.classList.toggle('collapsed');
	});
	
	const firstEpisode = newSection.querySelector('li');
	addDragDropToElement(firstEpisode);
	
	treeContainer.appendChild(newSection);
	attachFileClickHandlers();
	initializeDragDrop();
	saveWorkspace();
	console.log('[Context Menu] Added season:', seasonName);
}

function handleAddSpecialFile(type) {
	const specialSection = document.querySelector('.ob-special-section');
	const list = specialSection.querySelector('.ob-tree-list');
	
	const fileConfig = {
		character: { icon: 'person', prefix: '[C]', name: 'New Character', template: 'character' },
		object: { icon: 'category', prefix: '[O]', name: 'New Object', template: 'object' },
		scene: { icon: 'landscape', prefix: '[SC]', name: 'New Scene', template: 'scene' },
		action: { icon: 'event', prefix: '[A]', name: 'New Action', template: 'action' },
		attribute: { icon: 'label', prefix: '[AT]', name: 'New Attribute', template: 'attribute' }
	};
	
	const config = fileConfig[type];
	const fileName = `${config.prefix} - ${config.name}`;
	
	// Generate auto file-id (lowercase, no spaces/symbols)
	const fileCount = list.children.length + 1;
	const autoId = `${config.template}${fileCount}`;
	
	// Create initial content with file-id template
	const initialContent = `$ file-id = "${autoId}"\n\n`;
	
	// Save the initial content
	localStorage.setItem(`ob-file-${fileName}`, initialContent);
	
	const newFile = document.createElement('li');
	newFile.innerHTML = `<span class="material-icons-round" translate="no">${config.icon}</span> ${fileName}`;
	addDragDropToElement(newFile);
	list.appendChild(newFile);
	attachFileClickHandlers();
	saveWorkspace();
	console.log('[Context Menu] Added', type, 'file:', fileName, 'with file-id:', autoId);
}

function handleDelete() {
	const isSeason = targetElement.classList.contains('ob-tree-title');
	const isSpecialSection = targetElement.closest('.ob-special-section') !== null;
	const name = targetElement.textContent.trim();
	
	if (isSpecialSection && isSeason) {
		alert('Cannot delete the special section!');
		return;
	}
	
	const confirmMsg = isSeason 
		? `Delete season "${name}" and all its episodes?`
		: `Delete file "${name}"?`;
	
	if (confirm(confirmMsg)) {
		if (isSeason) {
			const section = targetElement.closest('.ob-tree-section');
			section.querySelectorAll('.ob-tree-list li').forEach(item => {
				const episodeName = item.textContent.trim();
				deleteFile(episodeName);
			});
			section.remove();
		} else {
			deleteFile(name);
			targetElement.remove();
		}
		saveWorkspace();
		console.log('[Context Menu] Deleted:', name);
	}
}

function handleExportFile() {
	const textNodes = Array.from(targetElement.childNodes).filter(node => node.nodeType === 3);
	const fileName = textNodes.map(n => n.textContent.trim()).join('').trim();
	exportSingleFile(fileName);
	console.log('[Context Menu] Exporting file:', fileName);
}

function handleExportSeason() {
	const isSeason = targetElement.classList.contains('ob-tree-title');
	if (!isSeason) return;
	
	const seasonName = targetElement.textContent.trim();
	const section = targetElement.closest('.ob-tree-section');
	const files = Array.from(section.querySelectorAll('.ob-tree-list li')).map(item => {
		const textNodes = Array.from(item.childNodes).filter(node => node.nodeType === 3);
		return textNodes.map(n => n.textContent.trim()).join('').trim();
	});
	
	exportSeason(seasonName, files);
	console.log('[Context Menu] Exporting season:', seasonName, 'with', files.length, 'files');
}

function handleImportFile() {
	importSingleFile();
	console.log('[Context Menu] Importing file...');
}
