const sidepanel = 'sidepanel';
const tools = document.getElementById('tools');
const right = document.querySelectorAll('.right');
const left = document.querySelectorAll('.left');

document.addEventListener("DOMContentLoaded", () => {
    // Initialize sidepanel
    if (!localStorage.getItem(sidepanel)) {
        localStorage.setItem(sidepanel, "true");
        showpanel();
    }

    if (localStorage.getItem(sidepanel) === "true") {
        showpanel();
    } else {
        hidepanel();
    }
});

tools.addEventListener("click", () => {
    if (localStorage.getItem(sidepanel) === "true") {
        hidepanel();
    } else {
        showpanel();
    }
});

function showpanel() {
    localStorage.setItem(sidepanel, "true");
    right.forEach(el => {
        el.style.width = '';
    });
    left.forEach(el => {
        el.style.width = '';
    });
  tools.textContent = 'hide panel';
}

function hidepanel() {
    localStorage.setItem(sidepanel, "false");
    right.forEach(el => {
        el.style.width = '0%';
    });
    left.forEach(el => {
        el.style.width = '100%';
    });
    tools.textContent = 'show panel';
}
