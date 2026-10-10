// ==================================================================
//  cmd-4.js — terminal commands
// ==================================================================

const cmds = {
  help: () => {
    log("available commands:", "system");
    log("&nbsp;&nbsp;help &mdash; this list");
    log("&nbsp;&nbsp;spin &mdash; new random sound");
    log("&nbsp;&nbsp;play [kick|snare|bass|siren|breakbeat|glitch|acid|total]");
    log("&nbsp;&nbsp;whoami &mdash; who you are");
    log("&nbsp;&nbsp;status &mdash; session report");
    log("&nbsp;&nbsp;system &mdash; server info");
    log("&nbsp;&nbsp;cipher &mdash; receive encrypted message");
    log("&nbsp;&nbsp;decode [word] &mdash; decrypt using cipher");
    log("&nbsp;&nbsp;watch &mdash; open camera. we want to see you.");
    log("&nbsp;&nbsp;unwatch &mdash; close camera.");
    log("&nbsp;&nbsp;clear &mdash; clear log");
    log("&nbsp;&nbsp;void &mdash; ???");
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ""; },
  whoami: () => {
    log("you are " + getSubjectId() + ".", "system");
    log("but that is not your real name, is it?", "whisper");
  },

  // ---------- СТАТУС ----------
  status: () => {
    const totalSpins = parseInt(localStorage.getItem("spins") || "0", 10);
    const jackpots   = parseInt(localStorage.getItem("jackpots") || "0", 10);
    const cipherSolved = parseInt(localStorage.getItem("cipher_count") || "0", 10);
    const overload   = localStorage.getItem("overload") === "true";
    const initiated  = localStorage.getItem("initiated") === "true";
    const cipherFlag = localStorage.getItem("cipher_solved") === "true";

    log("// SESSION REPORT // " + getSubjectId(), "system");
    log("&nbsp;&nbsp;spins this life: " + totalSpins);
    log("&nbsp;&nbsp;jackpots hit: " + jackpots);
    log("&nbsp;&nbsp;ciphers solved: " + cipherSolved);
    log("&nbsp;&nbsp;initiated: " + (initiated ? "<span class='ok'>YES</span>" : "<span class='err'>NO</span>"));
    log("&nbsp;&nbsp;overload reached: " + (overload ? "<span class='ok'>YES</span>" : "<span class='err'>NO</span>"));
    log("&nbsp;&nbsp;cipher flag: " + (cipherFlag ? "<span class='ok'>UNLOCKED</span>" : "<span class='err'>LOCKED</span>"));

    const since = parseInt(localStorage.getItem("first_visit") || "0", 10);
    if (!since) {
      localStorage.setItem("first_visit", Date.now().toString());
      log("&nbsp;&nbsp;time in system: just arrived");
    } else {
      const mins = Math.floor((Date.now() - since) / 60000);
      log("&nbsp;&nbsp;time in system: " + mins + " minutes");
    }

    let rating = "passive";
    if (totalSpins > 50)  rating = "persistent";
    if (totalSpins > 100) rating = "obsessed";
    if (totalSpins > 300) rating = "part of the signal";

    log("");
    log("// observer rating: " + rating, "dim");

    if (rating === "part of the signal") {
      log("// you have been here too long. we like that.", "whisper");
    }
  },

  // ---------- СИСТЕМА ----------
  system: () => {
    log("NODE_07 :: SYSTEM REPORT", "system");
    log("&nbsp;&nbsp;hostname: seventh.node.local");
    log("&nbsp;&nbsp;uptime: 7 days, 7 hours, 7 minutes");
    log("&nbsp;&nbsp;kernel: darkcore 0x07.13.37");
    log("&nbsp;&nbsp;cpu: 8 x UNKNOWN @ 3.03 GHz");
    log("&nbsp;&nbsp;memory: 1337 MB / 8192 MB");
    log("&nbsp;&nbsp;disk: /dev/void 666 GB (100% full)");
    log("&nbsp;&nbsp;network: unstable");
    log("&nbsp;&nbsp;last ping: 3 ms ago");
    log("&nbsp;&nbsp;connected users: <span class='err'>unknown</span>");
    log("&nbsp;&nbsp;watching you: yes");
    log("&nbsp;&nbsp;signal: <span class='ok'>RECEIVED</span>");
    log("");
    log("// some services are hidden. do not ask.", "dim");
  },

  // ---------- ШИФР ----------
  cipher: () => {
    const ciphers = [
      { encoded: "Z3JhbmQ=", method: "base64", hint: "base64", answer: "grand" },
      { encoded: "0x7369676E616C", method: "hex", hint: "hex to ascii", answer: "signal" },
      { encoded: "70756E6368", method: "hex", hint: "hex to ascii", answer: "punch" },
      { encoded: "d2hlZWw=", method: "base64", hint: "base64", answer: "wheel" },
      { encoded: "6e 6f 64 65", method: "hex", hint: "hex to ascii", answer: "node" }
    ];
    const picked = ciphers[Math.floor(Math.random() * ciphers.length)];

    log("&gt; receiving encrypted transmission...", "system");
    setTimeout(() => {
      log("&nbsp;&nbsp;&nbsp;" + picked.encoded, "");
      log("&nbsp;method: " + picked.method, "dim");
      log("&nbsp;hint: " + picked.hint, "dim");
      log("&nbsp;use: decode [word]", "dim");
      window._currentCipherAnswer = picked.answer.toLowerCase();
    }, 800);
  },

  // ---------- КАМЕРА ----------
  watch: () => {
    log("...", "dim");
    log("requesting camera access from this device...", "system");

    setTimeout(() => {
      log("&gt; note: nothing is recorded. nothing leaves your device.", "dim");
      log("&gt; permission prompt incoming.", "system");
    }, 600);

    if (typeof window.cameraWatchEnable !== "function") {
      setTimeout(() => {
        log("&gt; ERROR: camera module not loaded.", "err");
      }, 900);
      return;
    }

    window.cameraWatchEnable();
  },

  unwatch: () => {
    if (typeof window.cameraWatchDisable === "function") {
      window.cameraWatchDisable();
      log("&gt; camera released.", "system");
    } else {
      log("&gt; nothing to release.", "err");
    }
  },

  // ---------- VOID ----------
  void: () => {
    log("...", "dim");
    log("searching for node 0x00...", "system");
    setTimeout(() => {
      log("&gt; ERROR: NODE NOT FOUND", "err");
      triggerGlitch(1200);
      setTimeout(() => {
        window.location.href = "void.html";
      }, 1200);
    }, 900);
  }
};

// ---------- DECODE ----------
function handleDecode(raw) {
  const parts = raw.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) {
    log("usage: decode [word]", "err");
    return;
  }
  const guess = parts.slice(1).join(" ").trim();

  if (!window._currentCipherAnswer) {
    log("no active cipher. try: cipher", "err");
    return;
  }

  if (guess === window._currentCipherAnswer) {
    log("&gt; CORRECT.", "ok");
    log("&gt; you are one of us now.", "whisper");
    triggerGlitch(1200);

    localStorage.setItem("cipher_solved", "true");

    let solved = parseInt(localStorage.getItem("cipher_count") || "0", 10) + 1;
    localStorage.setItem("cipher_count", solved);

    if (solved === 3) {
      setTimeout(() => {
        log("&gt; three correct. the node recognizes you.", "ok");
        log("&gt; new door unlocked: node2.html", "ok");
        triggerGlitch(2000);
      }, 800);
    } else if (solved === 7) {
      setTimeout(() => {
        log("&gt; SEVEN.", "err");
        log("&gt; you have been waiting for this. we have been waiting for you.", "whisper");
        log("&gt; flag: c1ph3r_m4st3r_0x07", "ok");
        triggerGlitch(2500);
      }, 800);
    }

    window._currentCipherAnswer = null;
  } else {
    log("&gt; incorrect. try again.", "err");
  }
}

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log("&gt; " + raw, "user");

  if (c.startsWith("decode ")) {
    handleDecode(raw);
    return;
  }

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
