// --{Star effect}

document.addEventListener("DOMContentLoaded", () => {
    const sky = document.getElementById('sky');
    const nfs = 186;

    for (let i = 0; i < nfs; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 3;
        const delay = Math.random() * 5;
        
        star.style.left = `${x}vw`;
        star.style.top = `${y}vh`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${delay}s`;
        
        sky.appendChild(star);
    }
});

// --{planets}

document.addEventListener("DOMContentLoaded", () => {
    const plan = document.getElementById('planets');
    const psl = 7;

    for (let i = 0; i < psl; i++) {
        const planet = document.createElement('div');
        planet.className = 'planet';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 5;

        planet.style.left = `${x}vw`;
        planet.style.top = `${y}vh`;
        planet.style.width = `${size}px`;
        planet.style.height = `${size}px`;

        plan.appendChild(planet);
    }
});


// --{Fireworks effect}

function cf() {
    const ff = document.getElementById('fireframe');

    const firework = document.createElement('div');
    firework.className = 'firework';

    const xPos = Math.random() * window.innerWidth;
    const height = -(Math.random() * 800 + 100); 

    firework.style.left = `${xPos}px`;
    firework.style.setProperty('--height', `${height}px`);

    ff.appendChild(firework);

    setTimeout(() => {
        firework.remove();
        createExplosion(xPos, window.innerHeight + height);
    }, 2500);
}

function createExplosion(x, y) {
    const colors = ['red', 'yellow', 'blue', 'green', 'purple', 'orange'];
    const ff = document.getElementById('firework-container');
    const numberOfParticles = 20;

    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * 360;
        const distance = Math.random() * 150 + 50;
        const xOffset = Math.cos(angle) * distance;
        const yOffset = Math.sin(angle) * distance;

        particle.style.setProperty('--x', `${xOffset}px`);
        particle.style.setProperty('--y', `${yOffset}px`);

        ff.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 7000);
    }
}


cf();