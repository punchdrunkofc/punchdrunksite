// ==================================================================
//  intro.js — INFECTION intro
//  Signal tracing. Confirmed carriers. You are one of them.
// ==================================================================

(function () {
  "use strict";

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

  function buildIntro(d) {
    const lines = [];

    // -------- ТРАССИРОВКА СИГНАЛА --------
    lines.push({ text: "&gt; tracing signal origin...", cls: "system" });
    lines.push({ text: "&gt; node 0x07 identified.", cls: "dim" });
    lines.push({ text: "&gt; carrier signature: <span class='ok'>DETECTED</span>", cls: "" });

    if (d.visits === 1) {
      lines.push({ text: "&gt; new carrier.", cls: "err" });
      lines.push({ text: "&gt; you have been exposed to the signal.", cls: "whisper" });
    } else if (d.visits < 5) {
      lines.push({ text: "&gt; you came back.", cls: "system" });
      lines.push({ text: "&gt; the signal is stronger now.", cls: "whisper" });
    } else if (d.visits < 20) {
      lines.push({ text: "&gt; " + d.visits + " exposures detected.", cls: "dim" });
      lines.push({ text: "&gt; the signal is rewriting you.", cls: "err" });
    } else {
      lines.push({ text: "&gt; " + d.visits + " exposures. critical level.", cls: "err" });
      lines.push({ text: "&gt; you are no longer distinguishable from the signal.", cls: "whisper" });
    }

    // -------- ВРЕМЯ ОТСУТСТВИЯ --------
    if (d.daysAway >= 1) {
      lines.push({ text: "&gt; you were offline for " + d.daysAway + " day" + (d.daysAway === 1 ? "" : "s") + ".", cls: "dim" });
      lines.push({ text: "&gt; the signal continued without you.", cls: "whisper" });
    } else if (d.hoursAway >= 1) {
      lines.push({ text: "&gt; offline for " + d.hoursAway + " hour" + (d.hoursAway === 1 ? "" : "s") + ".", cls: "dim" });
    } else if (d.minutesAway >= 5) {
      lines.push({ text: "&gt; offline for " + d.minutesAway + " minutes.", cls: "dim" });
    }

    // -------- СПИНЫ = ЭКСПОЗИЦИИ --------
    if (d.spins === 0) {
      lines.push({ text: "&gt; you have not triggered the signal yet.", cls: "" });
      lines.push({ text: "&gt; the wheel is waiting.", cls: "whisper" });
    } else if (d.spins < 5) {
      lines.push({ text: "&gt; " + d.spins + " signal exposure" + (d.spins === 1 ? "" : "s") + ".", cls: "" });
      lines.push({ text: "&gt; you are beginning to hear it.", cls: "whisper" });
    } else if (d.spins < 20) {
      lines.push({ text: "&gt; " + d.spins + " exposures. pattern emerging.", cls: "dim" });
    } else if (d.spins < 100) {
      lines.push({ text: "&gt; " + d.spins + " exposures. the signal knows your rhythm.", cls: "dim" });
    } else {
      lines.push({ text: "&gt; " + d.spins + " exposures. beyond safe threshold.", cls: "err" });
      lines.push({ text: "&gt; you cannot stop listening now.", cls: "whisper" });
    }

    // -------- КОПИРОВАНИЕ = ПОПЫТКА ВЫНЕСТИ СИГНАЛ --------
    if (d.copies === 0) {
      lines.push({ text: "&gt; you have not tried to extract the signal.", cls: "dim" });
      lines.push({ text: "&gt; that is unusual. most try.", cls: "whisper" });
    } else if (d.copies < 3) {
      lines.push({ text: "&gt; extraction attempts: " + d.copies + ".", cls: "dim" });
      lines.push({ text: "&gt; the signal refuses to leave.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; extraction attempts: " + d.copies + ".", cls: "err" });
      lines.push({ text: "&gt; it copied itself into you instead.", cls: "whisper" });
    }

    // -------- МАНИФЕСТ --------
    if (d.manifest && d.enemy > 0) {
      lines.push({ text: "&gt; you have read both versions of the story.", cls: "dim" });
      lines.push({ text: "&gt; neither mentions the frequency.", cls: "whisper" });
    } else if (d.manifest) {
      lines.push({ text: "&gt; you read the recovery document.", cls: "dim" });
      lines.push({ text: "&gt; it does not mention what the signal does.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; you have not read the recovery document.", cls: "dim" });
    }

    // -------- ШИФРЫ --------
    if (d.ciphers === 0) {
      lines.push({ text: "&gt; no decoded fragments yet.", cls: "dim" });
    } else if (d.ciphers < 3) {
      lines.push({ text: "&gt; " + d.ciphers + " fragment" + (d.ciphers === 1 ? "" : "s") + " decoded.", cls: "dim" });
    } else if (d.ciphers < 7) {
      lines.push({ text: "&gt; " + d.ciphers + " fragments decoded.", cls: "" });
      lines.push({ text: "&gt; the signal is becoming readable.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; " + d.ciphers + " fragments decoded.", cls: "ok" });
      lines.push({ text: "&gt; you are decoding yourself.", cls: "err" });
    }

    // -------- ЧАТ --------
    if (!d.chat) {
      lines.push({ text: "&gt; you have not contacted other carriers.", cls: "dim" });
      lines.push({ text: "&gt; they are waiting in the channel.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; you contacted other carriers.", cls: "dim" });
      lines.push({ text: "&gt; they are showing symptoms too.", cls: "whisper" });
    }

    // -------- КАМЕРА / МИКРОФОН = СИМПТОМЫ --------
    if (d.mic) {
      lines.push({ text: "&gt; you let us hear you.", cls: "err" });
      lines.push({ text: "&gt; the signal now knows your voice.", cls: "whisper" });
    }
    if (d.camera) {
      lines.push({ text: "&gt; you let us see you.", cls: "err" });
      lines.push({ text: "&gt; the signal now knows your face.", cls: "whisper" });
    }

    // -------- 404 = ПРОВАЛ --------
    if (d.notfound) {
      lines.push({ text: "&gt; you tried to leave the network once.", cls: "dim" });
      lines.push({ text: "&gt; the node returned you. as it always does.", cls: "whisper" });
    }

    // -------- DOUBLE TOTAL --------
    if (d.dbltotal) {
      lines.push({ text: "&gt; you reached full coherence once.", cls: "ok" });
      lines.push({ text: "&gt; the signal recognized you.", cls: "whisper" });
    }

    // -------- СИГНАЛ НАЙДЕН --------
    if (d.signal) {
      lines.push({ text: "&gt; you found the frequency.", cls: "ok" });
      lines.push({ text: "&gt; the infection is complete.", cls: "err" });
    }

    // -------- СТАТУС --------
    lines.push({ text: "&nbsp;", cls: "" });

    if (d.visits === 1 && d.spins === 0) {
      lines.push({ text: "&gt; status: newly exposed.", cls: "err" });
      lines.push({ text: "&gt; the signal is still calibrating.", cls: "whisper" });
    } else if (d.spins > 100 && d.ciphers >= 7) {
      lines.push({ text: "&gt; status: full carrier.", cls: "ok" });
      lines.push({ text: "&gt; you are the signal now.", cls: "err" });
    } else if (d.manifest && d.chat && d.copies > 0) {
      lines.push({ text: "&gt; status: symptomatic.", cls: "err" });
      lines.push({ text: "&gt; the others can see it in you.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; status: listening.", cls: "dim" });
      lines.push({ text: "&gt; keep spinning. the signal grows.", cls: "whisper" });
    }

    lines.push({ text: "&nbsp;", cls: "" });
    lines.push({ text: "&gt; entering node 0x07.", cls: "system" });

    return lines;
  }

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
