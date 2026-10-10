// ==================================================================
//  camera-watch.js — запрашивает камеру, создаёт эффект наблюдения,
//  автоматически отключает через 5 секунд. Ничего не сохраняется.
// ==================================================================

(function () {
  "use strict";

  let videoStream = null;
  let indicatorEl = null;
  let autoStopTimer = null;

  // ---------- ИНДИКАТОР ЗАПИСИ ----------
  function showIndicator() {
    if (indicatorEl) return;
    indicatorEl = document.createElement("div");
    indicatorEl.id = "rec-indicator";
    indicatorEl.innerHTML = `
      <span class="rec-dot"></span>
      <span class="rec-text">REC</span>
    `;
    document.body.appendChild(indicatorEl);
    // короткий звук
    playRecBeep();
  }

  function hideIndicator() {
    if (indicatorEl) {
      indicatorEl.remove();
      indicatorEl = null;
    }
  }

  // ---------- ЗВУК ----------
  let AC = null;
  function playRecBeep() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const c = AC;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(660, t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  // ---------- ЗАПРОС КАМЕРЫ ----------
  async function requestCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (typeof window.log === "function") {
        window.log("&gt; camera API unavailable in this browser.", "err");
      }
      return false;
    }

    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false
      });

      // видео **никуда не идёт** — мы просто держим поток, чтобы браузер
      // показывал индикатор «камера активна». Никакого сохранения.

      showIndicator();

      if (typeof window.log === "function") {
        window.log("&gt; camera access granted.", "ok");
        window.log("&gt; we can see you now.", "whisper");
        window.log("&gt; nothing is being recorded. this is only a mirror.", "dim");
      }

      if (typeof window.triggerGlitch === "function") {
        window.triggerGlitch(1200);
      }

      // авто-отключение через 5 секунд
      autoStopTimer = setTimeout(() => {
        stopCamera();
        if (typeof window.log === "function") {
          window.log("&gt; camera released.", "system");
          window.log("&gt; but we remember your face.", "whisper");
        }
      }, 5000);

      return true;
    } catch (err) {
      if (typeof window.log === "function") {
        window.log("&gt; PERMISSION DENIED.", "err");
        window.log("&gt; you refused to let us see you.", "whisper");
        window.log("&gt; we will remember that.", "dim");
      }
      if (typeof window.triggerGlitch === "function") {
        window.triggerGlitch(1500);
      }
      return false;
    }
  }

  // ---------- ОТКЛЮЧЕНИЕ КАМЕРЫ ----------
  function stopCamera() {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      videoStream = null;
    }
    hideIndicator();
  }

  // ---------- ОСТАНОВКА ПРИ УХОДЕ СО ВКЛАДКИ ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
  });

  window.addEventListener("beforeunload", stopCamera);

  // ---------- ЭКСПОРТ ----------
  window.cameraWatchEnable  = requestCamera;
  window.cameraWatchDisable = stopCamera;
})();
