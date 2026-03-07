function OpenVersionSearch() {
    document.getElementById("VersionSelection").style.display = "unset";
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
}

function CloseVersionSearch() {
    document.getElementById("VersionSelection").style.display = "none";
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
}