// sidebar bits to fill with project info
const rightPanel = document.getElementById("p-right");
const preview = rightPanel.querySelector(".preview");
const iconEl = preview.querySelector(".icon-container img");
const titleEl = preview.querySelector(".title");
const mininfoEl = preview.querySelector(".mininfo");
const descriptionEl = preview.querySelector(".description p");
const languagesEl = preview.querySelector(".languages");
const linksBody = preview.querySelector(".body");
const linksEl = preview.querySelector(".body ul");
const noLinksEl = preview.querySelector(".no-links");

// project info, loaded once and reused for every click
const statesPromise = fetch("./states.json").then((response) => response.json());

// clicker: opens the sidebar for one project
async function openproject(project) {
  const states = await statesPromise;
  const info = states[project];

  if (!info) {
    return;
  }

  rightPanel.classList.remove("empty");
  fillPreview(info);
  boingPreview();
}

// boing: restarts the little pop animation
function boingPreview() {
  preview.classList.remove("boing");
  preview.getBoundingClientRect(); // force a reflow so the pop can replay
  preview.classList.add("boing");
}

// formatter: fills every sidebar element
function fillPreview(info) {
  iconEl.src = info["icon-src"];
  iconEl.alt = info.title;

  titleEl.textContent = info.title;
  titleEl.className = "title " + info.state;

  mininfoEl.textContent = info.mininfo;
  descriptionEl.textContent = info.description;

  fillLanguages(info.languages);
  fillLinks(info.urls);
}

// language badges: show only the ones the project uses
function fillLanguages(languages) {
  const hasLanguages = Object.values(languages).some(Boolean);

  languagesEl.style.display = hasLanguages ? "" : "none";

  Object.entries(languages).forEach(([name, enabled]) => {
    const item = languagesEl.querySelector(".item." + name);

    if (!item) {
      return;
    }

    item.style.display = enabled ? "" : "none";
  });
}

// links: one list item per url
function fillLinks(urls) {
  const entries = Object.entries(urls || {});
  const hasLinks = entries.length > 0;

  linksBody.style.display = hasLinks ? "" : "none";
  noLinksEl.style.display = hasLinks ? "none" : "flex";

  const items = entries.map(([name, url]) => {
    const item = document.createElement("li");
    const label = document.createElement("b");
    const link = document.createElement("a");

    label.textContent = name + ":";
    link.textContent = url;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";

    item.append(label, " ", link);
    return item;
  });

  linksEl.replaceChildren(...items);
}
