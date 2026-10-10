// ==================================================================
//  intro.js — CARRIER TRACE intro
//  Diagnostic panel. Confirms you are already a carrier.
//  Text changes based on player's progress in localStorage.
// ==================================================================

(function () {
  "use strict";

  // ---------- ЧТЕНИЕ ДАННЫХ ИГРОКА ----------
  function getPlayerData() {
    const d = {};
    d.visits   = parseInt(localStorage.getItem("intro_visits") || "0", 10) + 1;
    d.spins    = parseInt(localStorage.getItem("spins") || "0", 10);
    d.jackpots = parseInt(localStorage.getItem("jackpots") || "0", 10);
    d.ciphers  = parseInt(localStorage.getItem("cipher_count") || "0", 10);
    d.copies   = parseInt(localStorage.getItem("copy_trap_count") || "0", 10);
    d.manifest = localStorage.getItem("manifest_reader") === "true";
    d.enemy    = parseInt(localStorage.getItem("enemy_visits") || "0", 10);
    d.chat     = localStorage.getItem("visited_chat") === "true";
    d.notfound = localStorage.getItem("visited_404") === "true";
    d.camera   = localStorage.getItem("used_camera") === "true";
    d.mic      = localStorage.getItem("used_mic") === "true";
    d.dbltotal = localStorage.getItem("overload") === "true";
    d.signal   = localStorage.getItem("signal_found") === "true";
    d.heardTrack = localStorage.getItem("heard_track") === "true";
    d.oldVisit = localStorage.getItem("last_visit_time") || null;
    d.daysAway = 0; d.hoursAway = 0; d.minutesAway = 0;

    if (d.oldVisit) {
      const diff = Date.now() - parseInt(d.oldVisit, 10);
      d.daysAway = Math.floor(diff / 86400000);
      d.hoursAway = Math.floor(diff / 3600000);
      d.minutesAway = Math.floor(diff / 60000);
    }

    localStorage.setItem("intro_visits", d.visits.toString());
    localStorage.setItem("last_visit_time", Date.now().toString());
    return d;
  }

  // ---------- СБОРКА ТЕКСТА ----------
  function buildIntro(d) {
    const lines = [];

    // -------- ТРАССИРОВКА --------
    lines.push({ text: "&gt; tracing carrier origin...", cls: "system" });
    lines.push({ text: "&gt; node 0x07 reached.", cls: "dim" });
    lines.push({ text: "&gt; carrier signature: <span class='ok'>CONFIRMED</span>", cls: "" });

    if (d.visits === 1) {
      lines.push({ text: "&gt; new carrier detected.", cls: "err" });
      lines.push({ text: "&gt; you have already been exposed.", cls: "whisper" });
    } else if (d.visits < 5) {
      lines.push({ text: "&gt; you came back.", cls: "system" });
      lines.push({ text: "&gt; the signal is getting stronger.", cls: "whisper" });
    } else if (d.visits < 20) {
      lines.push({ text: "&gt; " + d.visits + " exposures logged.", cls: "dim" });
      lines.push({ text: "&gt; the signal is rewriting you.", cls: "err" });
    } else {
      lines.push({ text: "&gt; " + d.visits + " exposures. critical.", cls: "err" });
      lines.push({ text: "&gt; you are no longer distinguishable from the signal.", cls: "whisper" });
    }

    // -------- ОТСУТСТВИЕ --------
    if (d.daysAway >= 1) {
      lines.push({ text: "&gt; offline for " + d.daysAway + " day" + (d.daysAway === 1 ? "" : "s") + ".", cls: "dim" });
      lines.push({ text: "&gt; the signal continued without you.", cls: "whisper" });
    } else if (d.hoursAway >= 1) {
      lines.push({ text: "&gt; offline for " + d.hoursAway + " hour" + (d.hoursAway === 1 ? "" : "s") + ".", cls: "dim" });
    } else if (d.minutesAway >= 5) {
      lines.push({ text: "&gt; offline for " + d.minutesAway + " minutes.", cls: "dim" });
    }

    // -------- СПИНЫ = ЭКСПОЗИЦИИ --------
    if (d.spins === 0) {
      lines.push({ text: "&gt; signal exposures: 0.", cls: "" });
      lines.push({ text: "&gt; the wheel is waiting. press spin.", cls: "whisper" });
    } else if (d.spins < 5) {
      lines.push({ text: "&gt; signal exposures: " + d.spins + ".", cls: "" });
      lines.push({ text: "&gt; you are beginning to hear it.", cls: "whisper" });
    } else if (d.spins < 20) {
      lines.push({ text: "&gt; signal exposures: " + d.spins + ".", cls: "dim" });
      lines.push({ text: "&gt; pattern emerging.", cls: "dim" });
    } else if (d.spins < 100) {
      lines.push({ text: "&gt; signal exposures: " + d.spins + ".", cls: "dim" });
      lines.push({ text: "&gt; the signal knows your rhythm.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; signal exposures: " + d.spins + ".", cls: "err" });
      lines.push({ text: "&gt; beyond safe threshold. you cannot stop now.", cls: "whisper" });
    }

    // -------- КОПИРОВАНИЕ = ВЫНОС --------
    if (d.copies === 0) {
      lines.push({ text: "&gt; extraction attempts: 0.", cls: "dim" });
      lines.push({ text: "&gt; unusual. most try.", cls: "whisper" });
    } else if (d.copies < 3) {
      lines.push({ text: "&gt; extraction attempts: " + d.copies + ".", cls: "dim" });
      lines.push({ text: "&gt; the signal refuses to leave.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; extraction attempts: " + d.copies + ".", cls: "err" });
      lines.push({ text: "&gt; it copied itself into you instead.", cls: "whisper" });
    }

    // -------- МАНИФЕСТ --------
    if (d.manifest && d.enemy > 0) {
      lines.push({ text: "&gt; you read both sides.", cls: "dim" });
      lines.push({ text: "&gt; neither mentions the frequency.", cls: "whisper" });
    } else if (d.manifest) {
      lines.push({ text: "&gt; you read the recovery document.", cls: "dim" });
      lines.push({ text: "&gt; it does not describe what the signal does.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; recovery document: unread.", cls: "dim" });
    }

    // -------- ШИФРЫ --------
    if (d.ciphers === 0) {
      lines.push({ text: "&gt; decoded fragments: 0.", cls: "dim" });
    } else if (d.ciphers < 3) {
      lines.push({ text: "&gt; decoded fragments: " + d.ciphers + ".", cls: "dim" });
    } else if (d.ciphers < 7) {
      lines.push({ text: "&gt; decoded fragments: " + d.ciphers + ".", cls: "" });
      lines.push({ text: "&gt; the signal is becoming readable.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; decoded fragments: " + d.ciphers + ".", cls: "ok" });
      lines.push({ text: "&gt; you are decoding yourself.", cls: "err" });
    }

    // -------- ЧАТ --------
    if (!d.chat) {
      lines.push({ text: "&gt; channel: not entered.", cls: "dim" });
      lines.push({ text: "&gt; other carriers are waiting.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; channel: contacted.", cls: "dim" });
      lines.push({ text: "&gt; they are showing symptoms too.", cls: "whisper" });
    }

    // -------- КАМЕРА / МИКРОФОН --------
    if (d.mic) {
      lines.push({ text: "&gt; audio signature captured.", cls: "err" });
      lines.push({ text: "&gt; the signal knows your voice.", cls: "whisper" });
    }
    if (d.camera) {
      lines.push({ text: "&gt; visual signature captured.", cls: "err" });
      lines.push({ text: "&gt; the signal knows your face.", cls: "whisper" });
    }

    // -------- ТРЕК ПРОСЛУШАН --------
    if (d.heardTrack) {
      lines.push({ text: "&gt; you have played the source file.", cls: "err" });
      lines.push({ text: "&gt; the signal is now inside you.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; source file: not played.", cls: "dim" });
      lines.push({ text: "&gt; you have not heard Break Down yet.", cls: "whisper" });
    }

    // -------- SIGNAL --------
    if (d.signal) {
      lines.push({ text: "&gt; you found the frequency.", cls: "ok" });
      lines.push({ text: "&gt; the infection is complete.", cls: "err" });
    }

    // -------- 404 --------
    if (d.notfound) {
      lines.push({ text: "&gt; escape attempt: logged.", cls: "dim" });
      lines.push({ text: "&gt; the node returned you. as it always does.", cls: "whisper" });
    }

    // -------- DOUBLE TOTAL --------
    if (d.dbltotal) {
      lines.push({ text: "&gt; total coherence achieved once.", cls: "ok" });
      lines.push({ text: "&gt; the signal recognized you.", cls: "whisper" });
    }

    // -------- СТАТУС --------
    lines.push({ text: "&nbsp;", cls: "" });

    if (d.visits === 1 && d.spins === 0 && !d.heardTrack) {
      lines.push({ text: "&gt; status: newly exposed.", cls: "err" });
      lines.push({ text: "&gt; the signal is still calibrating.", cls: "whisper" });
    } else if (d.spins > 100 && d.ciphers >= 7 && d.heardTrack) {
      lines.push({ text: "&gt; status: full carrier.", cls: "ok" });
      lines.push({ text: "&gt; you are the signal now.", cls: "err" });
    } else if (d.heardTrack && d.manifest && d.chat) {
      lines.push({ text: "&gt; status: symptomatic.", cls: "err" });
      lines.push({ text: "&gt; the others can see it in you.", cls: "whisper" });
    } else if (d.spins > 50) {
      lines.push({ text: "&gt; status: advancing.", cls: "dim" });
      lines.push({ text: "&gt; continue.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; status: listening.", cls: "dim" });
      lines.push({ text: "&gt; keep spinning. the signal grows.", cls: "whisper" });
    }

    lines.push({ text: "&nbsp;", cls: "" });
    lines.push({ text: "&gt; entering node 0x07.", cls: "system" });

    return lines;
  }

  // ---------- ПОКАЗ ПАНЕЛИ ----------
  function showIntro() {
    if (sessionStorage.getItem("intro_done") === "true") return;
    sessionStorage.setItem("intro_done", "true");

    const d = getPlayerData();
    const lines = buildIntro(d);

    const panel = document.createElement("div");
    panel.id = "intro-panel";
    panel.innerHTML = `
      <div class="intro-box">
        <div class="intro-header">
          <span>NODE_07 :: CARRIER TRACE</span>
          <span class="intro-skip" id="introSkip">[ SKIP ]</span>
        </div>
        <div class="intro-body" id="introBody"></div>
      </div>
    `;
    document.body.appendChild(panel);
    document.body.style.overflow = "hidden";

    const body = document.getElementById("introBody");
    let delay = 300;

    lines.forEach((line) => {
      setTimeout(() => {
        const p = document.createElement("p");
        p.className = "intro-line " + (line.cls || "");
        p.innerHTML = line.text;
        body.appendChild(p);
      }, delay);
      delay += 340;
    });

    let closed = false;
    function closeIntro() {
      if (closed) return;
      closed = true;
      panel.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      panel.style.opacity = "0";
      panel.style.transform = "scale(1.05)";
      setTimeout(() => {
        if (panel.parentNode) panel.remove();
        document.body.style.overflow = "";
        if (typeof window.log === "function") {
          window.log("&gt; trace complete. proceed.", "dim");
        }
      }, 650);
    }

    setTimeout(closeIntro, delay + 6000);

    document.getElementById("introSkip").addEventListener("click", (e) => {
      e.stopPropagation();
      closeIntro();
    });
    panel.addEventListener("click", closeIntro);
  }

  // ---------- ЗАПУСК ПОСЛЕ BOOT-SCREEN ----------
  function waitForBootScreenGone(cb) {
    const boot = document.getElementById("boot-screen");
    if (!boot) { setTimeout(cb, 300); return; }
    const checker = setInterval(() => {
      if (!document.getElementById("boot-screen")) {
        clearInterval(checker);
        setTimeout(cb, 500);
      }
    }, 200);
  }

  function startIntro() { waitForBootScreenGone(showIntro); }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    startIntro();
  } else {
    document.addEventListener("DOMContentLoaded", startIntro);
  }

  window._showIntro = showIntro;
})();
