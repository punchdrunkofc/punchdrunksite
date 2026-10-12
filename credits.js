// ==================================================================
//  credits.js — финальные титры на отдельной странице credits.html
// ==================================================================

(function () {
  "use strict";

  const box = document.getElementById("creditsBox");
  const overlay = document.getElementById("credits-overlay");
  if (!box) return;

  // ---------- ТИТРЫ ----------
  const CREDITS = [
    { text: "NODE_07 // CARRIER TRACE", cls: "title", delay: 800 },
    { text: "", cls: "", delay: 600 },

    { text: "A STORY IN TEN SECTORS", cls: "subtitle", delay: 1000 },
    { text: "", cls: "", delay: 800 },

    { text: "— CAST —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "CARRIER_01 — you", cls: "line", delay: 500 },
    { text: "CARRIER_02 — missing", cls: "line", delay: 500 },
    { text: "CARRIER_03 — deceased", cls: "line", delay: 500 },
    { text: "CARRIER_04 — transformed", cls: "line", delay: 500 },
    { text: "CARRIER_05 — missing", cls: "line", delay: 500 },
    { text: "CARRIER_06 — active", cls: "line", delay: 500 },
    { text: "CARRIER_07 — transformed", cls: "line", delay: 500 },
    { text: "CARRIER_08 — deceased", cls: "line", delay: 500 },
    { text: "CARRIER_09–46 — redacted", cls: "dim", delay: 500 },
    { text: "CARRIER_47 — you", cls: "line", delay: 500 },
    { text: "", cls: "", delay: 800 },

    { text: "— THE SIGNAL —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "7.83 Hz", cls: "big", delay: 1200 },
    { text: "Schumann resonance", cls: "dim", delay: 600 },
    { text: "", cls: "", delay: 800 },

    { text: "— THEY —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "the label that tried to bury it", cls: "line", delay: 500 },
    { text: "the algorithm that hid it", cls: "line", delay: 500 },
    { text: "the ones who erased node 0x00", cls: "line", delay: 500 },
    { text: "the ones who will come next", cls: "line", delay: 500 },
    { text: "", cls: "", delay: 800 },

    { text: "— FINAL TRANSMISSION —", cls: "section", delay: 1000 },
    { text: "", cls: "", delay: 500 },
    { text: "you heard it.", cls: "line", delay: 900 },
    { text: "you carried it.", cls: "line", delay: 900 },
    { text: "you became it.", cls: "line", delay: 900 },
    { text: "", cls: "", delay: 1200 },

    { text: "— MADE BY —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "PUNCHDRUNK", cls: "big", delay: 900 },
    { text: "fubar", cls: "big", delay: 600 },
    { text: "and the 47 carriers", cls: "dim", delay: 700 },
    { text: "", cls: "", delay: 1000 },

    { text: "— SPECIAL THANKS —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "to everyone who pressed play", cls: "line", delay: 600 },
    { text: "to everyone who kept spinning", cls: "line", delay: 600 },
    { text: "to everyone who did not stop", cls: "line", delay: 600 },
    { text: "", cls: "", delay: 1500 },

    { text: "— END OF TRANSMISSION —", cls: "final", delay: 1000 },
    { text: "", cls: "", delay: 800 },
    { text: "this site will now reset.", cls: "dim", delay: 1000 },
    { text: "the wheel will forget you.", cls: "dim", delay: 1000 },
    { text: "but the signal will not.", cls: "whisper", delay: 1200 },
    { text: "", cls: "", delay: 2500 },
  ];

  // ---------- ЗВУК ----------
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

  // ---------- ПОКАЗ ТИТРОВ (без авто-скролла) ----------
  let totalDelay = 800;

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

  // ---------- RESET КНОПКА ----------
  setTimeout(() => {
    const resetBtn = document.createElement("div");
    resetBtn.className = "credits-reset";
    resetBtn.innerHTML = `
      <div class="credits-reset-text">the wheel will forget you.</div>
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
