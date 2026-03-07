   const targetDate = new Date("January 1, 2027 00:00:00").getTime();
    let previousSeconds = -1;

    const interval = setInterval(() => {
        const currentDate = new Date().getTime();
        const difference = targetDate - currentDate;

        const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));  
        const remainingTime = difference - months * (1000 * 60 * 60 * 24 * 30.44);
        const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        const countdownElement = document.getElementById("countdown");
        
        // Add glitch effect when seconds change
        if (seconds !== previousSeconds) {
            countdownElement.classList.add('changing');
            setTimeout(() => {
                countdownElement.classList.remove('changing');
            }, 500);
            previousSeconds = seconds;
        }
        
        countdownElement.innerHTML = `
            <span>${months.toString().padStart(2, '0')}</span>M
            <span>${days.toString().padStart(2, '0')}</span>d
            <span>${hours.toString().padStart(2, '0')}</span>h
            <span>${minutes.toString().padStart(2, '0')}</span>m
        `;

        if (difference < 0) {
            clearInterval(interval);
            document.getElementById("countdown").innerHTML = "00:00:00";
            document.body.classList.add('celebration');

            const userLang = navigator.language;
                if (userLang.startsWith('pt')) {
                    document.getElementById('gma').innerHTML = 'Bem-vindo(a) a <span class="bracketed">2027</span>!';
                } else {
                    document.getElementById('gma').innerHTML = 'Welcome to <span class="bracketed">2027</span>!';
                }

            // Create celebration particles
            createCelebrationParticles();
        }
    }, 1000);


    window.onload = function() {
        const userLang = navigator.language;
            if (userLang.startsWith('pt')) {
                document.getElementById('gma').innerHTML = 'Contagem para <span class="bracketed">2027</span>!';
            } else {
                document.getElementById('gma').innerHTML = 'Countdown to <span class="bracketed">2027</span>!';
            }
        // Initialize particles
        createParticles();
    };

    // Particle system
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 8000);
        }, 500);
    }

    function createCelebrationParticles() {
        const particlesContainer = document.getElementById('particles');
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
                particle.style.animation = `particleFloat ${Math.random() * 2 + 1}s ease-out`;
                particlesContainer.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }, i * 100);
        }
    }


    // Add click effect
    document.addEventListener('click', (e) => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.position = 'fixed';
                particle.style.left = e.clientX + (Math.random() - 0.5) * 50 + 'px';
                particle.style.top = e.clientY + (Math.random() - 0.5) * 50 + 'px';
                particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
                particle.style.animation = `particleFloat 2s ease-out`;
                particle.style.zIndex = '999';
                particle.style.pointerEvents = 'none';
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2000);
            }, i * 50);
        }
    });