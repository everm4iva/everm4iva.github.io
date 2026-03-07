function OpenVersionSearch() {
    document.getElementById("vs").style.display = "unset";
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
}

function CloseVersionSearch() {
    document.getElementById("vs").style.display = "none";
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
}