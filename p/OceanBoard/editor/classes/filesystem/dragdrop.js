/* === Drag & Drop System for OceanBoard === */

import { saveWorkspace } from './storage.js';

export function initializeDragDrop() {
	const treeItems = document.querySelectorAll('.ob-tree-list li');
	const seasons = document.querySelectorAll('.ob-tree-section');
	
	treeItems.forEach(item => {
		item.draggable = true;
		
		item.addEventListener('dragstart', handleDragStart);
		item.addEventListener('dragend', handleDragEnd);
		item.addEventListener('dragover', handleDragOver);
		item.addEventListener('drop', handleDrop);
		item.addEventListener('dragleave', handleDragLeave);
	});
	
	seasons.forEach(season => {
		const title = season.querySelector('.ob-tree-title');
		if (title && !title.classList.contains('ob-special-title')) {
			title.draggable = true;
			title.addEventListener('dragstart', (e) => handleSeasonDragStart.call(season, e));
			season.addEventListener('dragend', handleSeasonDragEnd);
			season.addEventListener('dragover', handleSeasonDragOver);
			season.addEventListener('drop', handleSeasonDrop);
			season.addEventListener('dragleave', handleSeasonDragLeave);
		}
	});
	
	console.log('[Drag & Drop] Initialized for', treeItems.length, 'items and', seasons.length, 'seasons');
}

let draggedElement = null;
let draggedSeason = null;

function handleDragStart(e) {
	draggedElement = this;
	this.classList.add('dragging');
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
	this.classList.remove('dragging');
	document.querySelectorAll('.ob-tree-list li').forEach(item => {
		item.classList.remove('drag-over');
	});
}

function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	e.dataTransfer.dropEffect = 'move';
	
	if (draggedElement !== this) {
		this.classList.add('drag-over');
	}
	
	return false;
}

function handleDrop(e) {
	if (e.stopPropagation) {
		e.stopPropagation();
	}
	
	if (draggedElement !== this) {
		const parent = this.parentNode;
		const draggedIndex = Array.from(parent.children).indexOf(draggedElement);
		const targetIndex = Array.from(parent.children).indexOf(this);
		
		if (draggedIndex < targetIndex) {
			parent.insertBefore(draggedElement, this.nextSibling);
		} else {
			parent.insertBefore(draggedElement, this);
		}
		
		saveWorkspace();
		console.log('[Drag & Drop] Reordered items and saved');
	}
	
	this.classList.remove('drag-over');
	return false;
}

function handleDragLeave(e) {
	this.classList.remove('drag-over');
}

export function addDragDropToElement(element) {
	element.draggable = true;
	element.addEventListener('dragstart', handleDragStart);
	element.addEventListener('dragend', handleDragEnd);
	element.addEventListener('dragover', handleDragOver);
	element.addEventListener('drop', handleDrop);
	element.addEventListener('dragleave', handleDragLeave);
}

function handleSeasonDragStart(e) {
	draggedSeason = this;
	this.classList.add('dragging');
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.innerHTML);
	console.log('[Drag & Drop] Started dragging season');
}

function handleSeasonDragEnd(e) {
	this.classList.remove('dragging');
	document.querySelectorAll('.ob-tree-section').forEach(section => {
		section.classList.remove('drag-over');
	});
	draggedSeason = null;
}

function handleSeasonDragOver(e) {
	if (!draggedSeason) return;
	
	if (e.preventDefault) {
		e.preventDefault();
	}
	e.dataTransfer.dropEffect = 'move';
	
	if (draggedSeason !== this) {
		this.classList.add('drag-over');
	}
	
	return false;
}

function handleSeasonDrop(e) {
	if (!draggedSeason) return;
	
	if (e.stopPropagation) {
		e.stopPropagation();
	}
	
	if (draggedSeason !== this) {
		const parent = this.parentNode;
		const draggedIndex = Array.from(parent.children).indexOf(draggedSeason);
		const targetIndex = Array.from(parent.children).indexOf(this);
		
		if (draggedIndex < targetIndex) {
			parent.insertBefore(draggedSeason, this.nextSibling);
		} else {
			parent.insertBefore(draggedSeason, this);
		}
		
		saveWorkspace();
		console.log('[Drag & Drop] Reordered seasons and saved');
	}
	
	this.classList.remove('drag-over');
	return false;
}

function handleSeasonDragLeave(e) {
	this.classList.remove('drag-over');
}
