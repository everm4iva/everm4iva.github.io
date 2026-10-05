function openModal(modalId, imageSrc, caption) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
            
    modal.classList.add('show');
    modalImg.src = imageSrc;
    modalCaption.textContent = caption;
            
    // prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
            
    // restore body scroll :P
    document.body.style.overflow = 'auto';
}

// close modal with "ESC" and open image in new tab (with " ")
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('imageModal');
    const isModalOpen = modal.classList.contains('show');

    if (event.key === 'Escape' && isModalOpen) {
        closeModal();
    }

    // space key opens image in new tab!
    if (event.key === ' ' && isModalOpen) {
    event.preventDefault(); // prevent page scroll
    const modalImg = document.getElementById('modalImage');
    const imageSrc = modalImg.src;
                
    // open image in new tab
    window.open(imageSrc, '_blank');

    // optional: add a subtle visual feedback :eyes:
    const modalContent = document.querySelector('.modal-content');
    modalContent.style.transform = 'scale(0.98)';
        setTimeout(() => {
            modalContent.style.transform = 'scale(1)';
        }, 100);
    }
});