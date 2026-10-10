const cmds = {
  help: () => {
    log("available commands:", "system");
    log("&nbsp;&nbsp;help &mdash; this list");
    log("&nbsp;&nbsp;spin &mdash; new random sound");
    log("&nbsp;&nbsp;play [kick|snare|bass|siren|breakbeat|glitch|acid|total]");
    log("&nbsp;&nbsp;whoami &mdash; who you are");
    log("&nbsp;&nbsp;clear &mdash; clear log");
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ""; },
  whoami: () => {
    log("you are " + getSubjectId() + ".", "system");
    log("but that is not your real name, is it?", "whisper");
  }
};

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log("&gt; " + raw, "user");

  if (cmds[c]) { cmds[c](); return; }

  if (c.startsWith("play ")) {
    const name = c.slice(5).trim().toUpperCase();
    const s = SECTORS.find(x => x.label === name);
    if (s) {
      try { s.gen(); } catch (e) {}
      log("playing: " + s.label, "ok");
    } else {
      log("unknown sound: " + name, "err");
    }
    return;
  }

  if (c === "7") {
    log("...", "dim");
    log("you found the seventh node.", "");
    log("the wheel was never the game.", "whisper");
    triggerGlitch(1500);
    return;
  }

  log("unknown command: " + raw + ' (try "help")', "err");
}

document.getElementById("cmd").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const v = e.target.value;
    e.target.value = "";
    handleCmd(v);
  }
});

document.body.addEventListener("click", () => {
  document.getElementById("cmd").focus();
}, { passive: true });
window.handleCmd = handleCmd;
window.cmds = cmds;
