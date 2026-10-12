// ==================================================================
//  credits.js — финальные титры
//  Если игрок дошёл до финала (loop_completed) — на главной
//  показываются титры вместо колеса.
// ==================================================================

(function () {
  "use strict";

  // ---------- ПРОВЕРКА ФИНАЛА ----------
  if (localStorage.getItem("loop_completed") !== "true") return;
  // Если игрок уже посмотрел титры — не показываем повторно
  if (localStorage.getItem("credits_seen") === "true") return;

  // ---------- ПОДГОТОВКА ----------
  // Скрываем всё содержимое главной
  document.body.style.overflow = "hidden";

  // ---------- ТИТРЫ ----------
  const CREDITS = [
    { text: "NODE_07 // CARRIER TRACE", cls: "title", delay: 500 },
    { text: "", cls: "", delay: 300 },
    { text: "A STORY IN TEN SECTORS", cls: "subtitle", delay: 600 },
    { text: "", cls: "", delay: 400 },
    { text: "", cls: "", delay: 300 },

    { text: "— CAST —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "CARRIER_01 — you", cls: "line", delay: 400 },
    { text: "CARRIER_02 — missing", cls: "line", delay: 400 },
    { text: "CARRIER_03 — deceased", cls: "line", delay: 400 },
    { text: "CARRIER_04 — transformed", cls: "line", delay: 400 },
    { text: "CARRIER_05 — missing", cls: "line", delay: 400 },
    { text: "CARRIER_06 — active", cls: "line", delay: 400 },
    { text: "CARRIER_07 — transformed", cls: "line", delay: 400 },
    { text: "CARRIER_08 — deceased", cls: "line", delay: 400 },
    { text: "CARRIER_09–46 — redacted", cls: "dim", delay: 400 },
    { text: "CARRIER_47 — you", cls: "line", delay: 400 },
    { text: "", cls: "", delay: 500 },

    { text: "— THE SIGNAL —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "7.83 Hz", cls: "big", delay: 800 },
    { text: "Schumann resonance", cls: "dim", delay: 400 },
    { text: "", cls: "", delay: 500 },

    { text: "— THEY —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "the label that tried to bury it", cls: "line", delay: 400 },
    { text: "the algorithm that hid it", cls: "line", delay: 400 },
    { text: "the ones who erased node 0x00", cls: "line", delay: 400 },
    { text: "", cls: "", delay: 500 },

    { text: "— THE WHEEL —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "KICK · SNARE · BASS · SIREN", cls: "line", delay: 500 },
    { text: "BREAKBEAT · GLITCH · ACID · TOTAL", cls: "line", delay: 500 },
    { text: "eight ways of breaking", cls: "dim", delay: 400 },
    { text: "", cls: "", delay: 500 },

    { text: "— THE OTHERS —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "the visitors", cls: "line", delay: 400 },
    { text: "the carriers", cls: "line", delay: 400 },
    { text: "the ones who came before", cls: "line", delay: 400 },
    { text: "the ones who will come after", cls: "line", delay: 400 },
    { text: "", cls: "", delay: 600 },

    { text: "— FINAL TRANSMISSION —", cls: "section", delay: 600 },
    { text: "", cls: "", delay: 300 },
    { text: "you heard it.", cls: "line", delay: 700 },
    { text: "you carried it.", cls: "line", delay: 700 },
    { text: "you became it.", cls: "line", delay: 700 },
    { text: "", cls: "", delay: 800 },

       { text: "— MADE BY —", cls: "section", delay: 800 },
    { text: "", cls: "", delay: 400 },
    { text: "PUNCHDRUNK", cls: "big", delay: 900 },
    { text: "FUBAR", cls: "big", delay: 600 },
    { text: "and the 47 carriers", cls: "dim", delay: 700 },
    { text: "", cls: "", delay: 1000 },
    { text: "— SPECIAL THANKS —", cls: "section", delay: 500 },
    { text: "", cls: "", delay: 200 },
    { text: "to everyone who pressed play", cls: "line", delay: 400 },
    { text: "to everyone who kept spinning", cls: "line", delay: 400 },
    { text: "to everyone who did not stop", cls: "line", delay: 400 },
    { text: "", cls: "", delay: 1000 },

    { text: "— END OF TRANSMISSION —", cls: "final", delay: 800 },
    { text: "", cls: "", delay: 600 },
    { text: "this site will now reset.", cls: "dim", delay: 800 },
    { text: "the wheel will forget you.", cls: "dim", delay: 800 },
    { text: "but the signal will not.", cls: "whisper", delay: 1000 },
    { text: "", cls: "", delay: 2000 },
  ];

  // ---------- СОЗДАНИЕ ОВЕРЛЕЯ ----------
  const overlay = document.createElement("div");
  overlay.id = "credits-overlay";

  const box = document.createElement("div");
  box.className = "credits-box";
  box.id = "creditsBox";

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // ---------- ЗВУК (тихий гул 7.83 Hz) ----------
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

      // плавно поднимаем
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

      // АВТО-СКРОЛЛ УБРАН — игрок сам решает, когда скроллить
    }, totalDelay);
  });

  // ---------- ПОСЛЕ ТИТРОВ — RESET КНОПКА ----------
  setTimeout(() => {
    // кнопка возврата
    const resetBtn = document.createElement("div");
    resetBtn.className = "credits-reset";
    resetBtn.innerHTML = `
      <div class="credits-reset-text">the wheel will forget you.</div>
      <button class="credits-reset-btn" id="creditsResetBtn">RETURN TO THE BEGINNING</button>
      <div class="credits-reset-hint">warning: this will erase all progress</div>
    `;
    box.appendChild(resetBtn);
    overlay.scrollTop = overlay.scrollHeight;

    // обработчик кнопки
    setTimeout(() => {
      const btn = document.getElementById("creditsResetBtn");
      if (!btn) return;
      btn.addEventListener("click", () => {
        // останавливаем звук
        stopAmbient();

        // показываем финальный чёрный экран на секунду
        overlay.classList.add("fade-out");

        setTimeout(() => {
          // сбрасываем ВСЕ флаги — сайт начинается заново
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "index.html";
        }, 1500);
      });
    }, 100);
  }, totalDelay + 1500);

  // ---------- ЗАПУСК ЗВУКА ПРИ ПЕРВОМ КЛИКЕ ----------
  document.addEventListener("click", function onFirstClick() {
    document.removeEventListener("click", onFirstClick);
    startAmbient();
  });
  // если уже кликали — запускаем сразу
  setTimeout(startAmbient, 500);

  // ---------- ОТМЕТКА «ТИТРЫ ПРОСМОТРЕНЫ» ----------
  setTimeout(() => {
    localStorage.setItem("credits_seen", "true");
  }, totalDelay + 3000);

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._creditsReset = () => {
    localStorage.removeItem("credits_seen");
    location.reload();
  };
})();
