// === OceanBoard Tab System: Enhanced ===

import { ParticleSystem } from '../forStyles/particles.js';

let particleSystem = null;

export class TabSystem {
	constructor(tabContainer, contentSection, files) {
		this.tabContainer = tabContainer;
		this.contentSection = contentSection;
		this.files = files; // Array of file objects {id, name, ...}
		this.openTabs = [];
		this.activeTabId = null;
	}

	openTab(fileId) {
		// Stop particles when opening a tab
		if (particleSystem) {
			particleSystem.destroy();
			particleSystem = null;
		}
		
		// Remove active from all tabs
		this.tabContainer.querySelectorAll('.ob-tab').forEach(tab => tab.classList.remove('active'));
		// Add active to clicked tab
		const tab = this.tabContainer.querySelector(`.ob-tab[data-id="${fileId}"]`);
		if (tab) tab.classList.add('active');
		this.activeTabId = fileId;
		// Show file content (placeholder)
		const file = this.files.find(f => f.id === fileId);
		if (this.contentSection && file) {
			this.contentSection.innerHTML = `<div class='ob-file-content'>Opened: ${file.name}</div>`;
		}
	}

	addTab(file) {
		// Prevent duplicate tabs
		if (this.openTabs.includes(file.id)) {
			this.openTab(file.id);
			return;
		}
		this.openTabs.push(file.id);
		const tab = document.createElement('div');
		tab.className = 'ob-tab';
		tab.dataset.id = file.id;
		tab.innerHTML = `<span class="ob-tab-title">${file.name}</span><span class="ob-tab-close material-icons-round" translate="no" title="Close">close</span>`;
		tab.querySelector('.ob-tab-title').onclick = () => this.openTab(file.id);
		tab.querySelector('.ob-tab-close').onclick = (e) => {
			e.stopPropagation();
			this.closeTab(file.id);
		};
		this.tabContainer.appendChild(tab);
		this.openTab(file.id);
	}

    closeTab(fileId) {
        // Remove tab from openTabs
        this.openTabs = this.openTabs.filter(id => id !== fileId);
        // Remove tab element
        const tab = this.tabContainer.querySelector(`.ob-tab[data-id="${fileId}"]`);
        if (tab) tab.remove();
        // If closed tab was active, switch to last tab or show welcome
        if (this.activeTabId === fileId) {
            this.activeTabId = null;
            if (this.openTabs.length > 0) {
                this.openTab(this.openTabs[this.openTabs.length - 1]);
            } else {
                this.showWelcome();
            }
        }
    }

    showWelcome() {
        if (this.contentSection) {
			this.contentSection.style.position = 'relative';
			
            this.contentSection.innerHTML = `
                <div class="ob-welcome ob-animate-fade-in">
                    <h1 class="ob-animate-bounce-in"><span class="ob-logo-text">OceanBoard</span></h1>
					<p class="ob-animate-slide-left ob-animate-stagger-1">Your creative workspace awaits...</p>
                </div>
            `;
			
			// Initialize particle system
			if (particleSystem) {
				particleSystem.destroy();
			}
			particleSystem = new ParticleSystem(this.contentSection);
			particleSystem.init();
			particleSystem.start();
			
			console.log('[Tab System] Welcome screen with particles active');
        }
    }	// Optionally, restore tabs from array of fileIds
	restoreTabs(fileIds) {
		fileIds.forEach(id => {
			const file = this.files.find(f => f.id === id);
			if (file) this.addTab(file);
		});
	}
}