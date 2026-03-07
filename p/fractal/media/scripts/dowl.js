let selectedOS = null;
let selectedFormat = null;

const downloadBtn = document.getElementById("download-btn");
const downloadPopup = document.getElementById("download-popup");
const downloadActionBtn = document.getElementById("download-action-btn");

// Open popup
downloadBtn.addEventListener("click", function (e) {
  e.preventDefault();
  openDownloadPopup();
});

function openDownloadPopup() {
  // Hide portable option by default until Windows is selected
  const portableCard = document.querySelector(".portable-option");
  if (portableCard) portableCard.style.display = "none";
  downloadPopup.classList.add("active");
}

function closeDownloadPopup() {
  downloadPopup.classList.remove("active");
  resetSelection();
}

function resetSelection() {
  selectedOS = null;
  selectedFormat = null;
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("selected");
  });
  // Hide portable option when resetting
  const portableCard = document.querySelector(".portable-option");
  if (portableCard) portableCard.style.display = "none";
  downloadActionBtn.disabled = true;
}

function selectOS(os) {
  selectedOS = os;
  // Show/hide portable option depending on OS
  const portableCard = document.querySelector(".portable-option");
  if (portableCard) {
    if (selectedOS === "windows") {
      portableCard.style.display = "";
    } else {
      portableCard.style.display = "none";
      // if portable was selected, reset selectedFormat
      if (selectedFormat === "portable") {
        selectedFormat = null;
      }
    }
  }
  updateSelection();
}

function selectFormat(format) {
  selectedFormat = format;
  updateSelection();
}

function updateSelection() {
  document
    .querySelectorAll(".options-row")[0]
    .querySelectorAll(".option-card")
    .forEach((card, index) => {
      const osValues = ["windows", "mac", "linux"];
      if (osValues[index] === selectedOS) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

  document
    .querySelectorAll(".options-row")[1]
    .querySelectorAll(".option-card")
    .forEach((card) => {
      const format = card.getAttribute("data-format");
      if (format === selectedFormat) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

  downloadActionBtn.disabled = !(selectedOS && selectedFormat);
}

downloadActionBtn.addEventListener("click", function () {
  if (selectedOS && selectedFormat) {
    const downloadURL = constructDownloadURL(selectedOS, selectedFormat);

    // Log the selection for debugging
    console.log(`Downloading for ${selectedOS} - ${selectedFormat}`);
    console.log(`URL: ${downloadURL}`);

    // Trigger download or redirect
    if (downloadURL) {
      window.location.href = downloadURL;
    }
    setTimeout(closeDownloadPopup, 500);
  }
});

function constructDownloadURL(os, format) {
  const baseURL =
    "https://github.com/everm4iva/fractal/releases/download/0.8.1";

  // Map selections to file names or URLs
  const fileMap = {
    "windows-executable": `${baseURL}/FRACTAL-0.8.1-Setup.exe`,
    "windows-portable": `${baseURL}/FRACTAL-0.8.1-Portable.exe`,
    "windows-code": `https://github.com/everm4iva/fractal/archive/refs/tags/0.8.1.zip`,
    "mac-executable": `${baseURL}/FRACTAL-0.8.1-arm64.dmg`,
    "mac-code": `https://github.com/everm4iva/fractal/archive/refs/tags/0.8.1.zip`,
    "linux-executable": `${baseURL}/FRACTAL-0.8.1.AppImage`,
    "linux-code": `https://github.com/everm4iva/fractal/archive/refs/tags/0.8.1.zip`,
  };

  return fileMap[`${os}-${format}`] || null;
}

// Close popup when clicking outside
downloadPopup.addEventListener("click", function (e) {
  if (e.target === downloadPopup) {
    closeDownloadPopup();
  }
});
