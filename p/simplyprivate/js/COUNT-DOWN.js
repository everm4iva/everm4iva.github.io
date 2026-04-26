const targetDate = new Date('2024-07-25T15:00:00').getTime();
const countdownInterval = setInterval(() => {
const now = new Date().getTime();
const distance = targetDate - now;

const days = Math.floor(distance / (1000 * 60 * 60 * 24));
const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((distance % (1000 * 60)) / 1000);

document.getElementById('days').innerHTML = String(days).padStart(2, '0');
document.getElementById('hours').innerHTML = String(hours).padStart(2, '0');
document.getElementById('minutes').innerHTML = String(minutes).padStart(2, '0');
document.getElementById('seconds').innerHTML = String(seconds).padStart(2, '0');
document.getElementById('message').textContent = 'SimplyPrivate 3.6 release';
document.getElementById('message').style.opacity = '1';
    if (distance < 0) {
        clearInterval(countdownInterval);
        document.getElementById('days').innerHTML = '00';
        document.getElementById('hours').innerHTML = '00';
        document.getElementById('minutes').innerHTML = '00';
        document.getElementById('seconds').innerHTML = '00';
        const message = document.getElementById('message');
        message.innerHTML = '✨ Version 3.6 is now avaliable! ✨';
        message.style.opacity = 1;
    }
}, 500);