/* === Documentation Interactive Behavior === */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function(e) {
		e.preventDefault();
		const targetId = this.getAttribute('href').substring(1);
		const targetElement = document.getElementById(targetId);
		
		if (targetElement) {
			const navHeight = 64;
			const targetPosition = targetElement.offsetTop - navHeight - 20;
			
			window.scrollTo({
				top: targetPosition,
				behavior: 'smooth'
			});
			
			// Update active link
			updateActiveLink(this);
		}
	});
});

function updateActiveLink(clickedLink) {
	document.querySelectorAll('.ob-docs-sidebar-link').forEach(link => {
		link.classList.remove('active');
	});
	clickedLink.classList.add('active');
}

const sections = document.querySelectorAll('.ob-docs-section');
const sidebarLinks = document.querySelectorAll('.ob-docs-sidebar-link');

const observerOptions = {
	root: null,
	rootMargin: '-80px 0px -80% 0px',
	threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const id = entry.target.getAttribute('id');
			sidebarLinks.forEach(link => {
				link.classList.remove('active');
				if (link.getAttribute('href') === `#${id}`) {
					link.classList.add('active');
				}
			});
		}
	});
}, observerOptions);

sections.forEach(section => {
	sectionObserver.observe(section);
});

document.querySelectorAll('.ob-docs-code pre').forEach(pre => {
	const copyBtn = document.createElement('button');
	copyBtn.className = 'ob-docs-copy-btn';
	copyBtn.innerHTML = '<span class="material-icons-round" translate="no">content_copy</span>';
	copyBtn.title = 'Copy code';
	
	copyBtn.addEventListener('click', () => {
		const code = pre.querySelector('code').textContent;
		navigator.clipboard.writeText(code).then(() => {
			copyBtn.innerHTML = '<span class="material-icons-round" translate="no">check</span>';
			setTimeout(() => {
				copyBtn.innerHTML = '<span class="material-icons-round" translate="no">content_copy</span>';
			}, 2000);
		});
	});
	
	pre.style.position = 'relative';
	pre.appendChild(copyBtn);
});

const style = document.createElement('style');
style.textContent = `
	.ob-docs-copy-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		padding: 8px;
		background: rgba(255, 128, 170, 0.2);
		border: 1px solid rgba(255, 128, 170, 0.3);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	
	.ob-docs-copy-btn:hover {
		background: rgba(255, 128, 170, 0.3);
		border-color: rgba(255, 128, 170, 0.5);
	}
	
	.ob-docs-copy-btn .material-icons-round {
		font-size: 18px;
		color: #ff80aa;
	}
`;
document.head.appendChild(style);
