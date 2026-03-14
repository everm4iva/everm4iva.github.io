function toggleTheme() {
    const html = document.documentElement;
    const text = document.getElementById('ThemeSwitchText');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        text.textContent = 'Dark Mode';
    } else {
        html.setAttribute('data-theme', 'dark');
        text.textContent = 'Light Mode';
    }
}

toggleTheme();
toggleTheme();