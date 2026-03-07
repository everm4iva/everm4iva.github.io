
const targetDate = new Date('2024-07-27T00:00:00').getTime(); // Data inicial ajustada
const countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = now - targetDate;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').innerHTML = String(days).padStart(2, '0');
    document.getElementById('hours').innerHTML = String(hours).padStart(2, '0');
    document.getElementById('minutes').innerHTML = String(minutes).padStart(2, '0');
    document.getElementById('seconds').innerHTML = String(seconds).padStart(2, '0');

    document.getElementById('message').textContent = 'coding version 3.6.1   (51% complete)';
    document.getElementById('message').style.opacity = '1';
}, 500);