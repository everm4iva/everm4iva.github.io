function openModal(modalId, imageSrc, caption) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
            
    modal.classList.add('show');
    modalImg.src = imageSrc;
    modalCaption.textContent = caption;
            
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
            
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Close modal with Escape key and open image in new tab with Space
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('imageModal');
    const isModalOpen = modal.classList.contains('show');
            
    if (event.key === 'Escape' && isModalOpen) {
        closeModal();
    }
            
    // Fun feature: Space key opens image in new tab!
    if (event.key === ' ' && isModalOpen) {
    event.preventDefault(); // Prevent page scroll
    const modalImg = document.getElementById('modalImage');
    const imageSrc = modalImg.src;
                
    // Open image in new tab
    window.open(imageSrc, '_blank');
                
    // Optional: Add a subtle visual feedback
    const modalContent = document.querySelector('.modal-content');
    modalContent.style.transform = 'scale(0.98)';
        setTimeout(() => {
            modalContent.style.transform = 'scale(1)';
        }, 100);
    }
});