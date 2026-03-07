/* === Settings Applier - Live Updates === */

export function initializeSettingsListener() {
	window.addEventListener('message', (event) => {
		if (event.data.type === 'oceanboard-setting') {
			applySetting(event.data.setting, event.data.value);
		}
	});
	
	// Apply settings on initial load
	applyAllSettings();
	console.log('[Settings Applier] Initialized');
}

function applyAllSettings() {
	const fontSize = localStorage.getItem('ob-setting-fontsize') || '14';
	const lineHeight = localStorage.getItem('ob-setting-lineheight') || '1.6';
	const wordWrap = localStorage.getItem('ob-setting-wordwrap') !== 'false';
	const smoothScroll = localStorage.getItem('ob-setting-smoothscroll') !== 'false';
	
	applySetting('fontsize', fontSize);
	applySetting('lineheight', lineHeight);
	applySetting('wordwrap', wordWrap);
	applySetting('smoothscroll', smoothScroll);
}

function applySetting(setting, value) {
	switch(setting) {
		case 'autosave':
			updateAutosaveInterval(value);
			break;
		case 'fontsize':
			updateFontSize(value);
			break;
		case 'lineheight':
			updateLineHeight(value);
			break;
		case 'linenumbers':
			updateLineNumbers(value);
			break;
		case 'wordwrap':
			updateWordWrap(value);
			break;
		case 'smoothscroll':
			updateSmoothScroll(value);
			break;
	}
}

function updateAutosaveInterval(seconds) {
	console.log('[Settings] Auto-save interval updated to', seconds, 'seconds');
}

function updateFontSize(size) {
	const editors = document.querySelectorAll('.ob-md-input, .ob-md-preview');
	editors.forEach(editor => {
		editor.style.fontSize = size + 'px';
	});

	document.documentElement.style.setProperty('--editor-font-size', size + 'px');
	console.log('[Settings] Font size updated to', size + 'px');
}

function updateLineHeight(height) {
	const editors = document.querySelectorAll('.ob-md-input, .ob-md-preview');
	editors.forEach(editor => {
		editor.style.lineHeight = height;
	});

	document.documentElement.style.setProperty('--editor-line-height', height);
	console.log('[Settings] Line height updated to', height);
}

function updateLineNumbers(enabled) {
	const wrappers = document.querySelectorAll('.ob-md-input-wrapper');
	wrappers.forEach(wrapper => {
		const lineNumbers = wrapper.querySelector('.ob-md-line-numbers');
		const textarea = wrapper.querySelector('.ob-md-input');
		
		if (lineNumbers && textarea) {
			if (enabled === true || enabled === 'true') {
				const lines = textarea.value.split('\n').length;
				let numbersHtml = '';
				for (let i = 1; i <= lines; i++) {
					numbersHtml += `<div>${i}</div>`;
				}
				lineNumbers.innerHTML = numbersHtml;
				lineNumbers.style.display = 'block';
				textarea.style.paddingLeft = '3.5rem';
			} else {
				lineNumbers.style.display = 'none';
				textarea.style.paddingLeft = '20px';
			}
		}
	});
	console.log('[Settings] Line numbers', enabled ? 'enabled' : 'disabled');
}

function updateWordWrap(enabled) {
	const editors = document.querySelectorAll('.ob-md-input');
	editors.forEach(editor => {
		if (enabled === true || enabled === 'true') {
			editor.style.whiteSpace = 'pre-wrap';
			editor.style.overflowX = 'hidden';
		} else {
			editor.style.whiteSpace = 'pre';
			editor.style.overflowX = 'auto';
		}
	});
	console.log('[Settings] Word wrap', enabled ? 'enabled' : 'disabled');
}

function updateSmoothScroll(enabled) {
	const root = document.documentElement;
	if (enabled === true || enabled === 'true') {
		root.style.scrollBehavior = 'smooth';
	} else {
		root.style.scrollBehavior = 'auto';
	}
	console.log('[Settings] Smooth scroll', enabled ? 'enabled' : 'disabled');
}

export { applyAllSettings, applySetting };
