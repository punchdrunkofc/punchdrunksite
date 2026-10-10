// ==================================================================
//  cmd-6.js — [SYSTEM] messages and silent observation
//  v2: harsh surprise stinger on every message
// ==================================================================

(function () {
  "use strict";

  // ------ ЗВУК: резкий внезапный удар ------
  let AC = null;
  function systemStinger() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();

      const c = AC;
      const t = c.currentTime;

      // --- 1. Резкий click (5 мс, очень громкий) ---
      const click = c.createOscillator();
      const clickG = c.createGain();
      click.type = "square";
      click.frequency.setValueAtTime(2400, t);
      click.frequency.exponentialRampToValueAtTime(180, t + 0.02);
      clickG.gain.setValueAtTime(0.0001, t);
      clickG.gain.exponentialRampToValueAtTime(0.55, t + 0.002);
      clickG.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      click.connect(clickG).connect(c.destination);
      click.start(t);
      click.stop(t + 0.05);

      // --- 2. Distorted square burst (грязный тон ~60 мс) ---
      const burst = c.createOscillator();
      const burstG = c.createGain();
      const dist = c.createWaveShaper();
      // кривая жёсткого клиппинга
      const n = 512;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = Math.tanh(x * 6);
      }
      dist.curve = curve;
      dist.oversample = "4x";
      burst.type = "square";
      burst.frequency.setValueAtTime(140, t);
      burst.frequency.exponentialRampToValueAtTime(60, t + 0.08);
      burstG.gain.setValueAtTime(0.0001, t);
      burstG.gain.exponentialRampToValueAtTime(0.35, t + 0.003);
      burstG.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      burst.connect(dist).connect(burstG).connect(c.destination);
      burst.start(t);
      burst.stop(t + 0.12);

      // --- 3. Noise snap (шумовой хлопок 25 мс) ---
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource();
      noise.buffer = buf;
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3000;
      const noiseG = c.createGain();
      noiseG.gain.setValueAtTime(0.0001, t);
      noiseG.gain.exponentialRampToValueAtTime(0.28, t + 0.001);
      noiseG.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      noise.connect(hp).connect(noiseG).connect(c.destination);
      noise.start(t);
      noise.stop(t + 0.05);

      // --- 4. Sub-bass thump (низкий удар на 40 Гц, чтобы «стукнуло» в грудь) ---
      const sub = c.createOscillator();
      const subG = c.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(80, t);
      sub.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      subG.gain.setValueAtTime(0.0001, t);
      subG.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
      subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      sub.connect(subG).connect(c.destination);
      sub.start(t);
      sub.stop(t + 0.18);

    } catch (e) {
      // тихо проваливаемся, если аудио недоступно
    }
  }

  // ------ УТИЛИТА: напечатать [SYSTEM]-строку ------
  function sysPrint(text, cls) {
    const logEl = document.getElementById("log");
    if (!logEl) return;

    const p = document.createElement("p");
    p.className = "line " + (cls || "system");
    p.innerHTML = "<span style='color:#8a8a95;'>[SYSTEM]</span> " + text;

    // короткое дрожание экрана в момент появления
    document.body.style.transition = "transform 0.05s";
    document.body.style.transform = "translate(" +
      (Math.random() * 6 - 3) + "px," +
      (Math.random() * 6 - 3) + "px)";
    setTimeout(() => { document.body.style.transform = "translate(0,0)"; }, 50);

    // резкий звук ДО появления текста
    systemStinger();

    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ------ ПУЛ СООБЩЕНИЙ ------
  const MESSAGES = [
    "unauthorized access detected on this node",
    "user {SUBJECT} traced",
    "this session will be archived",
    "packet integrity check: <span style='color:#ff8a8a;'>FAILED</span>",
    "unknown listener detected on port 0x07",
    "signal injection from external source",
    "keep-alive handshake: <span style='color:#ff8a8a;'>NO RESPONSE</span>",
    "attempting to identify origin...",
    "origin: masked",
    "session duration exceeds expected parameters",
    "your presence has been noted by node 0x0F",
    "3 active observers",
    "their permissions have been updated",
    "do not trust the wheel",
    "the wheel is not the game",
    "recommend termination of this session",
    "they have already read this line",
    "you are not the first",
    "you will not be the last"
  ];

  function fillPlaceholders(text) {
    const subject = (typeof getSubjectId === "function")
      ? getSubjectId()
      : (localStorage.getItem("subject_id") || "SUBJECT_????-????");
    return text.replace(/\{SUBJECT\}/g, subject);
  }

  function randomSystemMessage() {
    const raw = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return fillPlaceholders(raw);
  }

  // ------ СПЛАНИРОВАННОЕ ПОЯВЛЕНИЕ ------
  function scheduleNext(delay) {
    setTimeout(() => {
      sysPrint(randomSystemMessage(), "system");

      if (Math.random() < 0.3) {
        setTimeout(() => {
          sysPrint(randomSystemMessage(), "system");
        }, 3000 + Math.random() * 3000);
      }

      scheduleNext(90000 + Math.random() * 90000);
    }, delay);
  }

  function start() {
    scheduleNext(30000);
  }

  // ждём первого клика — для AudioContext
  let started = false;
  document.addEventListener("click", function onFirstClick() {
    if (started) return;
    started = true;
    document.removeEventListener("click", onFirstClick);
    // делаем «пустой» удар, чтобы разбудить AudioContext и не пугать игрока
    // ничего не играем, просто инициализируем
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
    } catch (e) {}
    start();
  });

  // ------ РЕАКЦИЯ НА БЕЗДЕЙСТВИЕ ------
  let lastActivity = Date.now();
  let idleWarned = false;

  ["mousemove", "keydown", "click", "touchstart"].forEach(ev => {
    document.addEventListener(ev, () => {
      lastActivity = Date.now();
      idleWarned = false;
    }, { passive: true });
  });

  setInterval(() => {
    if (!started) return;
    const idle = Date.now() - lastActivity;
    if (idle > 90000 && !idleWarned) {
      idleWarned = true;
      setTimeout(() => {
        // на «why did you stop?» — тоже стингер
        systemStinger();
        const logEl = document.getElementById("log");
        if (!logEl) return;
        const p = document.createElement("p");
        p.className = "line whisper";
        p.textContent = "why did you stop?";
        logEl.appendChild(p);
        logEl.scrollTop = logEl.scrollHeight;
      }, 500);
    }
  }, 5000);

  // ------ ДИАЛОГ НА СПЕЦИАЛЬНЫЕ КОМАНДЫ ------
  const REACTIONS = {
    "why": [
      "because you keep spinning",
      "because we are still here",
      "because it is not over"
    ],
    "who": [
      "you know who",
      "the ones who erased node 0x00",
      "we cannot say. they are listening"
    ],
    "help me": [
      "you are already helping",
      "there is no help. only the signal",
      "we cannot. you can"
    ],
    "hello": [
      "hello, {SUBJECT}",
      "you said that last time too"
    ]
  };

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    const input = document.getElementById("cmd");
    if (!input) return;
    const value = input.value.trim().toLowerCase();
    if (!value) return;

    const response = REACTIONS[value];
    if (response) {
      const text = response[Math.floor(Math.random() * response.length)];
      const filled = fillPlaceholders(text);

      setTimeout(() => {
        systemStinger();
        const logEl = document.getElementById("log");
        if (!logEl) return;
        const p = document.createElement("p");
        p.className = "line whisper";
        p.textContent = filled;
        logEl.appendChild(p);
        logEl.scrollTop = logEl.scrollHeight;
      }, 700 + Math.random() * 400);
    }
  }, true);

  // экспорт для отладки
  window._sysPrint = sysPrint;
  window._sysPrintRandom = () => sysPrint(randomSystemMessage(), "system");
  window._systemStinger = systemStinger;
})();
