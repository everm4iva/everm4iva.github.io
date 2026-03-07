/* === Storage System for OceanBoard === */

import { addDragDropToElement } from './dragdrop.js';
import { safeSetItem, handleQuotaExceeded } from './storagemanager.js';

export function saveWorkspace(seriesId = null) {
	const activeSeriesId = seriesId || localStorage.getItem('ob-active-series') || 'default';
	
	const workspace = {
		seasons: [],
		specialFiles: [],
		files: {},
		order: []
	};
	
	document.querySelectorAll('.ob-tree-section').forEach((section, index) => {
		const titleElement = section.querySelector('.ob-tree-title');
		const seasonTitle = Array.from(titleElement.childNodes)
			.filter(node => node.nodeType === 3)
			.map(node => node.textContent.trim())
			.join(' ') || titleElement.textContent.trim();
		const episodes = [];
		
		section.querySelectorAll('.ob-tree-list li').forEach(item => {
			const icon = item.querySelector('.material-icons-round');
			const textNodes = Array.from(item.childNodes).filter(node => node.nodeType === 3);
			const episodeName = textNodes.map(n => n.textContent.trim()).join('').trim();

			if (episodeName) {
				episodes.push({
					name: episodeName,
					icon: icon ? icon.textContent : 'description'
				});
				
				const content = localStorage.getItem('ob-file-' + episodeName);
				if (content) {
					workspace.files[episodeName] = content;
				}
			}
		});
		
		workspace.seasons.push({
			name: seasonTitle,
			episodes: episodes,
			collapsed: section.classList.contains('collapsed')
		});
	});
	
	const specialSection = document.querySelector('.ob-special-section');
	if (specialSection) {
		specialSection.querySelectorAll('.ob-tree-list li').forEach(item => {
			const icon = item.querySelector('.material-icons-round');
			const textNodes = Array.from(item.childNodes).filter(node => node.nodeType === 3);
			const fileName = textNodes.map(n => n.textContent.trim()).join('').trim();
			
			if (fileName) {
				workspace.specialFiles.push({
					name: fileName,
					icon: icon ? icon.textContent : 'label'
				});
				
				const content = localStorage.getItem('ob-file-' + fileName);
				if (content) {
					workspace.files[fileName] = content;
				}
			}
		});
		
		workspace.specialCollapsed = specialSection.classList.contains('collapsed');
	}
	
	localStorage.setItem('ob-workspace-' + activeSeriesId, JSON.stringify(workspace));
	console.log('[Storage] Workspace saved for series:', activeSeriesId, 'with', workspace.seasons.length, 'seasons and', workspace.specialFiles.length, 'special files');
}

export function loadWorkspace(seriesId = null) {
	const activeSeriesId = seriesId || localStorage.getItem('ob-active-series') || 'default';
	const data = localStorage.getItem('ob-workspace-' + activeSeriesId);
	if (!data) {
		console.log('[Storage] No saved workspace found for series:', activeSeriesId);
		return null;
	}
	
	const workspace = JSON.parse(data);
	console.log('[Storage] Workspace loaded for series:', activeSeriesId, 'with', workspace.seasons.length, 'seasons');
	return workspace;
}

export function restoreWorkspace(seriesId = null) {
	const workspace = loadWorkspace(seriesId);
	if (!workspace) return false;
	
	const treeContainer = document.querySelector('.ob-tree');
	if (!treeContainer) return false;
	
	treeContainer.innerHTML = '';
	
	workspace.seasons.forEach(season => {
		const section = document.createElement('div');
		section.className = 'ob-tree-section';
		if (season.collapsed) {
			section.classList.add('collapsed');
		}
		
		const title = document.createElement('div');
		title.className = 'ob-tree-title';
		if (season.collapsed) {
			title.classList.add('collapsed');
		}
		title.textContent = season.name;
		
		title.addEventListener('click', function() {
			this.classList.toggle('collapsed');
			this.parentElement.classList.toggle('collapsed');
			saveWorkspace();
		});
		
		const list = document.createElement('ul');
		list.className = 'ob-tree-list';
		
		season.episodes.forEach(episode => {
			const episodeName = typeof episode === 'string' ? episode : episode.name;
			const episodeIcon = typeof episode === 'string' ? 'description' : episode.icon;
			
			const item = document.createElement('li');
			item.innerHTML = `<span class="material-icons-round" translate="no">${episodeIcon}</span> ${episodeName}`;
			addDragDropToElement(item);
			list.appendChild(item);
		});
		
		section.appendChild(title);
		section.appendChild(list);
		treeContainer.appendChild(section);
	});
	
	if (workspace.specialFiles && workspace.specialFiles.length > 0) {
		const specialSection = document.querySelector('.ob-special-section');
		if (specialSection) {
			const specialList = specialSection.querySelector('.ob-tree-list');
			specialList.innerHTML = '';
			
			workspace.specialFiles.forEach(file => {
				const item = document.createElement('li');
				item.innerHTML = `<span class="material-icons-round" translate="no">${file.icon}</span> ${file.name}`;
				addDragDropToElement(item);
				specialList.appendChild(item);
			});
			
			if (workspace.specialCollapsed) {
				specialSection.classList.add('collapsed');
				specialSection.querySelector('.ob-tree-title').classList.add('collapsed');
			}
		}
	}
	
	console.log('[Storage] Workspace restored successfully');
	return true;
}

export function saveFileContent(fileName, content) {
	const result = safeSetItem('ob-file-' + fileName, content);
	if (!result.success) {
		handleQuotaExceeded('save file');
		return false;
	}
	saveWorkspace();
	return true;
}

export function loadFileContent(fileName) {
	const stored = localStorage.getItem('ob-file-' + fileName);
	if (stored) return stored;
	
	// Random inspiring phrases for new files
	const phrases = [
		"Write content here...",
		"Just a word...",
		"What happens next?",
		"Let your imagination flow...",
		"The blank page is yours to conquer...",
		"Once upon a time...",
		"Begining soon...",
		"Empty, probably...",
		"This is where the magic happens...",
		"Silence screams...",
		"The adventure starts here...",
		"Funny... I forgot what is the default phrase...",
		"Create something beautiful...",
		"Your voice matters. Write it down...",
		"Dreams become reality through words...",
		"Start writing. Edit later...",
		"Tell the story only you can tell...",
		"What if...?",
		"Flow whatever is there...",
		"Let the words dance across the page..."
	];
	
	const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
	return `# ${fileName}\n\n${randomPhrase}`;
}

export function deleteFile(fileName) {
	localStorage.removeItem('ob-file-' + fileName);
	saveWorkspace();
	console.log('[Storage] Deleted file:', fileName);
}

export function renameFile(oldName, newName) {
	const content = localStorage.getItem('ob-file-' + oldName);
	if (content) {
		const result = safeSetItem('ob-file-' + newName, content);
		if (!result.success) {
			handleQuotaExceeded('rename file');
			return false;
		}
		localStorage.removeItem('ob-file-' + oldName);
	}
	saveWorkspace();
	console.log('[Storage] Renamed file from', oldName, 'to', newName);
	return true;
}

export function autoSave() {
	saveWorkspace();
}

setInterval(autoSave, 15000);
console.log('[Storage] Auto-save enabled (15s interval)');
