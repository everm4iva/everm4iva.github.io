function CreditsOpen() {
    document.getElementById("Credits").style.display = "unset";
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
}

function CreditsClose() {
    document.getElementById("Credits").style.display = "none";
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
}