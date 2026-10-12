// ==================================================================
//  credits.js — финальные титры (минимальные)
// ==================================================================

(function () {
  "use strict";

  const box = document.getElementById("creditsBox");
  const overlay = document.getElementById("credits-overlay");
  if (!box) return;

  // ---------- ТИТРЫ ----------
  const CREDITS = [
    { text: "", cls: "", delay: 1500 },
    { text: "", cls: "", delay: 500 },

    { text: "NODE_07", cls: "title", delay: 1500 },
    { text: "CARRIER TRACE", cls: "subtitle", delay: 1200 },

    { text: "", cls: "", delay: 1500 },

    { text: "made by", cls: "small", delay: 1000 },
    { text: "punchdrunk × fubar", cls: "author", delay: 1500 },

    { text: "", cls: "", delay: 3000 },
  ];

  // ---------- ЗВУК 7.83 Hz ----------
  let AC = null;
  let osc = null;
  let gain = null;

  function startAmbient() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();

      osc = AC.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 7.83;

      gain = AC.createGain();
      gain.gain.value = 0.0001;

      const lp = AC.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 40;

      osc.connect(lp).connect(gain).connect(AC.destination);
      osc.start();
      gain.gain.linearRampToValueAtTime(0.04, AC.currentTime + 3);
    } catch (e) {
      console.warn("credits: audio failed", e);
    }
  }

  function stopAmbient() {
    if (gain && AC) {
      gain.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 2);
    }
    setTimeout(() => {
      if (osc) { try { osc.stop(); } catch (e) {} osc = null; }
    }, 2200);
  }

  // ---------- ПОКАЗ ТИТРОВ ----------
  let totalDelay = 500;

  CREDITS.forEach((line) => {
    totalDelay += line.delay;
    setTimeout(() => {
      if (line.text === "") {
        const br = document.createElement("div");
        br.className = "credits-space";
        box.appendChild(br);
        return;
      }

      const p = document.createElement("p");
      p.className = "credits-line " + (line.cls || "");
      p.textContent = line.text;
      box.appendChild(p);
    }, totalDelay);
  });

  // ---------- КНОПКА RESET ----------
  setTimeout(() => {
    const resetBtn = document.createElement("div");
    resetBtn.className = "credits-reset";
    resetBtn.innerHTML = `
      <button class="credits-reset-btn" id="creditsResetBtn">RETURN TO THE BEGINNING</button>
      <div class="credits-reset-hint">warning: this will erase all progress</div>
    `;
    box.appendChild(resetBtn);

    setTimeout(() => {
      const btn = document.getElementById("creditsResetBtn");
      if (!btn) return;
      btn.addEventListener("click", () => {
        stopAmbient();
        overlay.style.transition = "opacity 1.5s";
        overlay.style.opacity = "0";

        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "index.html";
        }, 1500);
      });
    }, 100);
  }, totalDelay + 2000);

  // ---------- АУДИО ----------
  document.addEventListener("click", function onFirstClick() {
    document.removeEventListener("click", onFirstClick);
    startAmbient();
  });
  setTimeout(startAmbient, 500);

  // ---------- ОТМЕТКА ----------
  localStorage.setItem("credits_seen", "true");

  // ---------- ОТЛАДКА ----------
  window._creditsReset = () => {
    localStorage.removeItem("credits_seen");
    location.reload();
  };
})();
