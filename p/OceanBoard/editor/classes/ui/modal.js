/* === Modal Dialog System for OceanBoard === */

let currentModal = null;

/* ===### Show Choice Modal ###=== */
export function showChoiceModal(title, options, callback) {
	hideModal();
	
	const modal = document.createElement('div');
	modal.className = 'ob-modal-overlay';
	
	const optionsHTML = options.map((option, index) => `
		<button class="ob-modal-option" data-value="${option.value}">
			<span class="ob-modal-option-number">${index + 1}</span>
			<div class="ob-modal-option-content">
				<span class="ob-modal-option-title">${option.title}</span>
				<span class="ob-modal-option-desc">${option.description}</span>
			</div>
		</button>
	`).join('');
	
	modal.innerHTML = `
		<div class="ob-modal ob-animate-scale-in">
			<div class="ob-modal-header">
				<h3>${title}</h3>
				<button class="ob-modal-close" title="Close">
					<span class="material-icons-round" translate="no">close</span>
				</button>
			</div>
			<div class="ob-modal-body">
				${optionsHTML}
			</div>
			<div class="ob-modal-footer">
				<button class="ob-modal-cancel">Cancel</button>
			</div>
		</div>
	`;
	
	document.body.appendChild(modal);
	currentModal = modal;
	
	// Add event listeners
	const closeBtn = modal.querySelector('.ob-modal-close');
	const cancelBtn = modal.querySelector('.ob-modal-cancel');
	const optionButtons = modal.querySelectorAll('.ob-modal-option');
	
	closeBtn.addEventListener('click', () => {
		hideModal();
		callback(null);
	});
	
	cancelBtn.addEventListener('click', () => {
		hideModal();
		callback(null);
	});
	
	optionButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const value = btn.dataset.value;
			hideModal();
			callback(value);
		});
	});
	
	// Close on overlay click
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			hideModal();
			callback(null);
		}
	});
	
	// Keyboard support (1-9 for options, Esc to cancel)
	const handleKeyPress = (e) => {
		if (e.key === 'Escape') {
			hideModal();
			callback(null);
			document.removeEventListener('keydown', handleKeyPress);
		} else if (e.key >= '1' && e.key <= '9') {
			const index = parseInt(e.key) - 1;
			if (index < options.length) {
				hideModal();
				callback(options[index].value);
				document.removeEventListener('keydown', handleKeyPress);
			}
		}
	};
	
	document.addEventListener('keydown', handleKeyPress);
	
	console.log('[Modal] Choice modal shown with', options.length, 'options');
}

/* ===### Show Confirmation Modal ###=== */
export function showConfirmModal(title, message, callback) {
	hideModal();
	
	const modal = document.createElement('div');
	modal.className = 'ob-modal-overlay';
	
	modal.innerHTML = `
		<div class="ob-modal ob-modal-small ob-animate-scale-in">
			<div class="ob-modal-header">
				<h3>${title}</h3>
			</div>
			<div class="ob-modal-body">
				<p>${message}</p>
			</div>
			<div class="ob-modal-footer">
				<button class="ob-modal-cancel">Cancel</button>
				<button class="ob-modal-confirm">OK</button>
			</div>
		</div>
	`;
	
	document.body.appendChild(modal);
	currentModal = modal;
	
	const cancelBtn = modal.querySelector('.ob-modal-cancel');
	const confirmBtn = modal.querySelector('.ob-modal-confirm');
	
	cancelBtn.addEventListener('click', () => {
		hideModal();
		callback(false);
	});
	
	confirmBtn.addEventListener('click', () => {
		hideModal();
		callback(true);
	});
	
	// Close on overlay click
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			hideModal();
			callback(false);
		}
	});
	
	// Keyboard support
	const handleKeyPress = (e) => {
		if (e.key === 'Escape') {
			hideModal();
			callback(false);
			document.removeEventListener('keydown', handleKeyPress);
		} else if (e.key === 'Enter') {
			hideModal();
			callback(true);
			document.removeEventListener('keydown', handleKeyPress);
		}
	};
	
	document.addEventListener('keydown', handleKeyPress);
	
	console.log('[Modal] Confirmation modal shown');
}

/* ===### Hide Modal ###=== */
export function hideModal() {
	if (currentModal) {
		currentModal.remove();
		currentModal = null;
		console.log('[Modal] Modal hidden');
	}
}
