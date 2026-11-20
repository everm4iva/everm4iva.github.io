// bits for the mobile sheet: backdrop, close button, escape key

const panel = document.getElementById("p-right");
const backdrop = document.querySelector(".sheet-backdrop");
const closeButton = document.querySelector(".sheet-close");

const isSheetOpen = () => !panel.classList.contains("empty");

let wasOpen = isSheetOpen();

function syncSheet() {
  const open = isSheetOpen();
  backdrop.classList.toggle("show", open);

  if (open && !wasOpen && window.matchMedia("(max-width: 768px)").matches) {
    closeButton.focus({ preventScroll: true });
  }

  wasOpen = open;
}

function closeSheet() {
  panel.classList.add("empty");
  syncSheet();
}

closeButton.addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isSheetOpen()) closeSheet();
});

new MutationObserver(syncSheet).observe(panel, {
  attributes: true,
  attributeFilter: ["class"],
});

syncSheet();
