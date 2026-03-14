const tem = document.getElementById("terminal");

function atct(pt, pti) {
  return new Promise(resolve => {
    setTimeout(function () {
      tem.textContent += pt + "\n";
      tem.scrollTop = tem.scrollHeight;
      resolve();
    }, pti);
  });
}

async function al() {
  await atct("---{+!: RainOs :!+}---", 10);
  await atct("some info:", 20);
  await atct("running on a web version of rain-os", 200);
  await atct("cerebelium v.40k | MemoryMage v.34k", 50);
  await atct("{{Cerebelium NEEDS TO BE UPDATED TO 2.0!}}", 50);
  await atct("min.RAM:5b | max.RAM: 1.5gb ", 50);
  await atct("sys.build: RainOs (html/web)| build.id: #0.2 ", 50);
  await atct("memorymage stopped plugin version display ", 50);
  await atct("---", 500);
  await atct("user-plugins found!", 500);
  await atct("- webShell (card)", 40);
  await atct("-----", 500);
  await atct("core plugins found!", 3000);
  await atct("- cerebelium.rsys", 500);
  await atct("- EOC (card).rsys", 2600);
  await atct("- smoothboot-1-9.rsys | fastboot.rsys", 50);
  await atct("-----", 500);
  sd();
  await atct("[EOC !info] compiling, please wait", 10);
  await atct("[EOC !state] running on a website, cheking dependences...", 5000);
  await atct("[EOC !error] NEED LUNIAN.WEB TO RUN IN WEBSITE", 50);
  await atct("[EOC !state] eoc is now optimizing", 20);
  await atct("loading system assets", 20);
  await atct("loading users | loading state | connecting to server", 2000);
  sd();
  await atct("this cache is heavy, deleting or marking unused files... ", 7000);
  await atct("[-*-*-*-*-*SYSTEM CRASHED-*-*-*-*-*]", 6000);
  await atct("why:", 10);
  await atct("cause 1: corrupted or invalid file", 10);
  await atct("cause 2: system executable not found", 10);
  await atct("-", 10);
  await atct("most accurate: cause 2", 10);
  sd();
  await atct("-", 10);
  await atct("what to do?:", 10);
  await atct("for cause 1: find, delete the corrupted/invalid file and test again", 10);
  await atct("for cause 2: put system executable (in the right version) in the main folder", 10);
  await atct("-", 10);
  await atct("end of crash", 10);
  await atct("[-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*]", 10);
  sd(); sd(); sd(); sd();
}

al();

function sd() {
  window.scrollBy(0, 50);
}



