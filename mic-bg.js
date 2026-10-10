// ==================================================================
//  mic-bg.js — floating ARG words reacting to microphone volume
//  Микрофон запрашивается автоматически при первом клике.
// ==================================================================

(function () {
  "use strict";

  // ---------- СЛОВА ----------
  const WORDS = [
    "WE HEAR YOU",
    "DON'T STOP",
    "SIGNAL",
    "7",
    "BEHIND YOU",
    "LISTEN",
    "WE SEE YOU",
    "STAY",
    "DON'T LOOK",
    "IT'S HERE",
    "CLOSER",
    "TOO LATE",
    "HELP",
    "STILL HERE",
    "WHY DID YOU STOP",
    "0x07",
    "NODE_07",
    "SIGNAL_LOST",
    "DO NOT TURN",
    "THE WHEEL KNOWS",
    "SEVENTH",
    "YOU ARE NOT ALONE",
    "REC",
    "TRANSMITTING",
    "COMING",
    "WAKE UP",
    "BEHIND",
    "9999",
    "ERROR",
    "SIGNAL DETECTED"
  ];

  // ---------- НАСТРОЙКИ ----------
  const WORD_COUNT = 30;
  const BASE_FONT_SIZE = 22;
  const MAX_FONT_SIZE = 90;
  const BASE_OPACITY = 0.05;
  const MAX_OPACITY = 0.45;
  const BASE_SPEED = 0.15;
  const MAX_SPEED = 1.8;

  // ---------- КОНТЕЙНЕР ----------
  const container = document.createElement("div");
  container.id = "mic-bg";
  document.body.appendChild(container);

  // ---------- СОСТОЯНИЕ ----------
  let audioCtx = null;
  let analyser = null;
  let freqData = null;
  let running = false;
  let micStream = null;
  let currentVolume = 0;
  let activated = false;

  // ---------- СОЗДАНИЕ СЛОВ ----------
  const words = [];
  for (let i = 0; i < WORD_COUNT; i++) {
    const el = document.createElement("span");
    el.className = "mic-word";
    el.textContent = WORDS[Math.floor(Math.random() * WORDS.length)];
    container.appendChild(el);

    words.push({
      el,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * BASE_SPEED,
      vy: (Math.random() - 0.5) * BASE_SPEED,
      fontSize: BASE_FONT_SIZE + Math.random() * 20,
      phase: Math.random() * Math.PI * 2
    });
  }

  // ---------- АНИМАЦИЯ ----------
  function tick() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    let targetVolume = 0;
    if (running && analyser) {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      targetVolume = Math.min(1, sum / (freqData.length * 120));
    }
    currentVolume += (targetVolume - currentVolume) * 0.15;

    if (running) {
      container.classList.add("active");
    }

    container.style.opacity = running ? (0.35 + currentVolume * 0.65) : 0;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const speedMult = 1 + currentVolume * (MAX_SPEED / BASE_SPEED - 1);

      w.phase += 0.005 + currentVolume * 0.02;
      const sway = Math.sin(w.phase) * 0.3;

      w.x += (w.vx + sway) * speedMult;
      w.y += (w.vy + Math.cos(w.phase) * 0.3) * speedMult;

      if (w.x < -100) w.x = W + 50;
      if (w.x > W + 100) w.x = -50;
      if (w.y < -50) w.y = H + 30;
      if (w.y > H + 50) w.y = -30;

      const size = w.fontSize + currentVolume * (MAX_FONT_SIZE - BASE_FONT_SIZE);
      const opacity = BASE_OPACITY + currentVolume * (MAX_OPACITY - BASE_OPACITY);
      const blur = currentVolume * 2.5;

      w.el.style.transform =
        "translate(" + w.x + "px," + w.y + "px) scale(" +
        (1 + currentVolume * 0.4) + ")";
      w.el.style.fontSize = size + "px";
      w.el.style.opacity = opacity;
      w.el.style.filter = "blur(" + blur.toFixed(2) + "px)";

      const brightness = 40 + currentVolume * 60;
      w.el.style.color = "hsl(275, 80%, " + brightness + "%)";
    }

    requestAnimationFrame(tick);
  }
  tick();

  // ---------- АВТОАКТИВАЦИЯ ПРИ ПЕРВОМ КЛИКЕ ----------
  function activate() {
    if (activated) return;
    activated = true;

    document.removeEventListener("click", activate);
    document.removeEventListener("keydown", activate);
    document.removeEventListener("touchstart", activate);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("mic-bg: getUserMedia not supported");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        micStream = stream;

        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") audioCtx.resume();

        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        freqData = new Uint8Array(analyser.frequencyBinCount);
        running = true;
        window._micBgRunning = true;

        if (typeof log === "function") {
          log("&gt; microphone connected.", "system");
          log("&gt; the walls are listening.", "whisper");
        }
        if (typeof triggerGlitch === "function") {
          triggerGlitch(1000);
        }
      })
      .catch((err) => {
        console.warn("mic-bg: permission denied", err);
        if (typeof log === "function") {
          log("&gt; microphone unavailable.", "dim");
        }
      });
  }

  document.addEventListener("click", activate);
  document.addEventListener("keydown", activate);
  document.addEventListener("touchstart", activate);

  // ---------- ЭКСПОРТ ----------
  window.micBgEnable = () => { activate(); return Promise.resolve(true); };
  window.micBgDisable = () => {
    running = false;
    container.classList.remove("active");
    window._micBgRunning = false;
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (audioCtx && audioCtx.state === "running") audioCtx.suspend();
    analyser = null;
    freqData = null;
  };
})();
