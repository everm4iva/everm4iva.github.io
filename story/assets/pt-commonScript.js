// ------ Page Marker Update ------ //

const floatingDiv = document.getElementById('pageNumElement');
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            floatingDiv.textContent = `Página: ${sectionId}`;
        }
    });
}, {
    threshold: 0.5,
});

sections.forEach(section => observer.observe(section));

window.addEventListener('scroll', () => {
    const scrollBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;

    if (scrollBottom) {
        floatingDiv.textContent = 'Página final';
    } else {
        const currentSection = Array.from(sections).reverse().find(section => {
            const rect = section.getBoundingClientRect();
            return rect.top <= window.innerHeight && rect.bottom >= 0;
        });
        
        if (currentSection) {
            const sectionId = currentSection.getAttribute('id');
            floatingDiv.textContent = `Página: ${sectionId}`;
        }
    }
});
