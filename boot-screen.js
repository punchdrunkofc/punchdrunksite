// ==================================================================
//  boot-screen.js — booting overlay + privacy warning
//  Shows once per session. Can be skipped after consent.
// ==================================================================

(function () {
  "use strict";

  // ---------- НЕ ПОКАЗЫВАТЬ ПОВТОРНО, ЕСЛИ УЖЕ СОГЛАСИЛСЯ ----------
  if (sessionStorage.getItem("boot_done") === "true") {
    return;
  }

  // ---------- СОЗДАНИЕ ЭКРАНА ----------
  const screen = document.createElement("div");
  screen.id = "boot-screen";
  screen.innerHTML = `
    <div class="boot-box">
      <div class="boot-header">
        <span>NODE_07 :: BOOT SEQUENCE</span>
        <span class="boot-status" id="bootStatus">INITIALIZING</span>
      </div>

      <div class="boot-log" id="bootLog"></div>

      <div class="boot-privacy" id="bootPrivacy" style="display:none;">
        <div class="privacy-title">⚠ NOTICE</div>
        <div class="privacy-text">
          This site may request access to:
          <ul>
            <li>your <strong>microphone</strong> — for audio-reactive background</li>
            <li>your <strong>camera</strong> — for the "watch" command</li>
            <li>your <strong>IP address</strong> — for atmospheric display only</li>
          </ul>
          <strong>Nothing is recorded. Nothing is stored. Nothing leaves your device.</strong>
          All data stays in your browser. You can deny any request at any time.
        </div>
        <div class="privacy-buttons">
          <button class="boot-btn deny" id="bootDeny">DENY ALL</button>
          <button class="boot-btn allow" id="bootAllow">ENTER</button>
        </div>
        <div class="privacy-hint">
          You can close this tab at any time. We cannot stop you.
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(screen);

  // ---------- БЛОКИРУЕМ СКРОЛЛ ПОКА ЭКРАН АКТИВЕН ----------
  document.body.style.overflow = "hidden";

  // ---------- ПРОКРУТКА СТРОК ЗАГРУЗКИ ----------
  const logEl = document.getElementById("bootLog");
  const statusEl = document.getElementById("bootStatus");

  const BOOT_LINES = [
    { text: "> initializing kernel...",          delay: 200 },
    { text: "> loading node 0x07...",            delay: 400 },
    { text: "> verifying signal integrity...",   delay: 400 },
    { text: "> establishing connection...",      delay: 500 },
    { text: "> handshake: OK",                   delay: 300 },
    { text: "> decrypting node data...",         delay: 500 },
    { text: "> WARNING: unknown observers",      delay: 400, cls: "warn" },
    { text: "> you are not the first",           delay: 400, cls: "whisper" },
    { text: "> loading terminal...",             delay: 400 },
    { text: "> boot complete.",                  delay: 400 }
  ];

  let totalDelay = 0;
  BOOT_LINES.forEach(line => {
    totalDelay += line.delay;
    setTimeout(() => {
      const p = document.createElement("p");
      p.className = "boot-line " + (line.cls || "");
      p.textContent = line.text;
      logEl.appendChild(p);
      logEl.scrollTop = logEl.scrollHeight;
    }, totalDelay);
  });

  // после всех строк — показываем предупреждение
  setTimeout(() => {
    statusEl.textContent = "AWAITING CONSENT";
    statusEl.classList.add("pending");
    document.getElementById("bootPrivacy").style.display = "block";

    // фокус на кнопку ENTER для удобства
    const allowBtn = document.getElementById("bootAllow");
    if (allowBtn) allowBtn.focus();
  }, totalDelay + 400);

  // ---------- ЗВУК ----------
  let AC = null;
  function beep(freq, dur) {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const c = AC;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.04, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / 1000);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur / 1000 + 0.02);
    } catch (e) {}
  }

  // ---------- ОБРАБОТЧИКИ КНОПОК ----------
  function closeScreen(allow) {
    beep(allow ? 880 : 220, 150);

    // сохраняем согласие на сессию
    sessionStorage.setItem("boot_done", "true");
    if (!allow) {
      sessionStorage.setItem("boot_denied", "true");
    }

    // плавное закрытие
    screen.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    screen.style.opacity = "0";
    screen.style.transform = "scale(1.05)";

    setTimeout(() => {
      screen.remove();
      document.body.style.overflow = "";

      // сообщение в терминале после закрытия
      if (typeof window.log === "function") {
        if (allow) {
          window.log("&gt; consent recorded. welcome to node 0x07.", "system");
        } else {
          window.log("&gt; consent denied. entering in restricted mode.", "warn");
          window.log("&gt; microphone and camera will remain off.", "dim");
        }
      }
    }, 650);
  }

  document.getElementById("bootAllow").addEventListener("click", () => closeScreen(true));
  document.getElementById("bootDeny").addEventListener("click", () => closeScreen(false));

  // Enter = ENTER button
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Enter") {
      const privacyVisible = document.getElementById("bootPrivacy") &&
                             document.getElementById("bootPrivacy").style.display !== "none";
      if (privacyVisible) {
        e.preventDefault();
        closeScreen(true);
        document.removeEventListener("keydown", handler);
      }
    }
  });

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._resetBootScreen = () => {
    sessionStorage.removeItem("boot_done");
    sessionStorage.removeItem("boot_denied");
    location.reload();
  };
})();
