// ==================================================================
//  cursor-drift.js — после 30 сек бездействия фальшивый курсор
//  медленно плывёт к кнопке SPIN. Курсор — белое перекрестие.
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const IDLE_MS        = 30000;    // 30 секунд бездействия
  const DRIFT_DURATION = 3500;     // за сколько мс доплыть до кнопки
  const EPSILON        = 2;        // пиксельный порог «доплыли»

  // ---------- СОСТОЯНИЕ ----------
  let realX = window.innerWidth / 2;
  let realY = window.innerHeight / 2;
  let idleTimer = null;
  let drifting = false;
  let driftStart = 0;
  let driftFromX = 0, driftFromY = 0;
  let driftToX = 0, driftToY = 0;
  let fakeEl = null;

  // ---------- ПРОВЕРКА: ТОЛЬКО ДЕСКТОП ----------
  function isTouchDevice() {
    return ("ontouchstart" in window) ||
           (navigator.maxTouchPoints > 0);
  }
  if (isTouchDevice()) return;

  // ---------- СОЗДАНИЕ ФАЛЬШИВОГО КУРСОРА (БЕЛОЕ ПЕРЕКРЕСТИЕ) ----------
  function createFakeCursor() {
    fakeEl = document.createElement("div");
    fakeEl.id = "fake-cursor";
    fakeEl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="2"  x2="12" y2="22" stroke="white" stroke-width="2"/>
        <line x1="2"  y1="12" x2="22" y2="12" stroke="white" stroke-width="2"/>
      </svg>
    `;
    fakeEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 99999;
      transform: translate3d(${realX - 12}px, ${realY - 12}px, 0);
      transition: opacity 0.3s;
      opacity: 0;
      will-change: transform;
    `;
    document.body.appendChild(fakeEl);
  }

  // ---------- ПРЯТАЕМ НАСТОЯЩИЙ КУРСОР ----------
  function hideRealCursor() {
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    const style = document.createElement("style");
    style.id = "hide-cursor-style";
    style.textContent = `*:not(input):not(textarea) { cursor: none !important; }`;
    document.head.appendChild(style);
  }

  function showRealCursor() {
    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
    const s = document.getElementById("hide-cursor-style");
    if (s) s.remove();
  }

  // ---------- ОБНОВЛЕНИЕ ФАЛЬШИВОГО ----------
  // сдвиг на −12, −12 — центр перекрестия совпадает с точкой
  function updateFakeCursor(x, y) {
    if (!fakeEl) return;
    fakeEl.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
  }

  // ---------- ОТСЛЕЖИВАНИЕ РЕАЛЬНОГО КУРСОРА ----------
  document.addEventListener("mousemove", (e) => {
    if (drifting) {
      stopDrift();
    }
    realX = e.clientX;
    realY = e.clientY;

    if (!drifting && fakeEl && fakeEl.style.opacity === "1") {
      updateFakeCursor(realX, realY);
    }

    resetIdleTimer();
  }, { passive: true });

  document.addEventListener("mousedown", () => {
    if (drifting) stopDrift();
    resetIdleTimer();
  });

  document.addEventListener("keydown", () => {
    if (drifting) stopDrift();
    resetIdleTimer();
  });

  document.addEventListener("wheel", () => {
    if (drifting) stopDrift();
    resetIdleTimer();
  }, { passive: true });

  // ---------- ТАЙМЕР БЕЗДЕЙСТВИЯ ----------
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(startDrift, IDLE_MS);
  }

  // ---------- НАЧАЛО ДРЕЙФА ----------
  function startDrift() {
    const spinBtn = document.getElementById("spin-btn");
    if (!spinBtn) return;
    if (drifting) return;

    // цель — точный центр кнопки SPIN
    const rect = spinBtn.getBoundingClientRect();
    driftToX = rect.left + rect.width / 2;
    driftToY = rect.top + rect.height / 2;

    driftFromX = realX;
    driftFromY = realY;

    drifting = true;
    driftStart = performance.now();

    if (!fakeEl) createFakeCursor();
    hideRealCursor();
    updateFakeCursor(realX, realY);
    fakeEl.style.opacity = "1";

    spinBtn.style.transition = "box-shadow 0.5s";
    spinBtn.style.boxShadow =
      "0 0 30px rgba(160, 32, 240, 0.9), inset 0 0 30px rgba(160, 32, 240, 0.5)";

    requestAnimationFrame(driftTick);
  }

  // ---------- АНИМАЦИЯ ДРЕЙФА ----------
  function driftTick(now) {
    if (!drifting) return;

    const elapsed = now - driftStart;
    const t = Math.min(1, elapsed / DRIFT_DURATION);

    // easeInOutCubic
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // покачивание по перпендикуляру — «плывёт»
    const dx = driftToX - driftFromX;
    const dy = driftToY - driftFromY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const sway = Math.sin(elapsed * 0.008) * 8 * (1 - t);

    const x = driftFromX + dx * ease + perpX * sway;
    const y = driftFromY + dy * ease + perpY * sway;

    realX = x;
    realY = y;
    updateFakeCursor(x, y);

    if (t >= 1 && Math.abs(x - driftToX) < EPSILON && Math.abs(y - driftToY) < EPSILON) {
      finishDrift();
      return;
    }

    requestAnimationFrame(driftTick);
  }

  // ---------- ЗАВЕРШЕНИЕ ----------
  function finishDrift() {
    drifting = false;

    const spinBtn = document.getElementById("spin-btn");
    if (!spinBtn) return;

    spinBtn.style.transition = "transform 0.15s";
    spinBtn.style.transform = "translate(-50%, -50%) scale(1.05)";
    setTimeout(() => {
      spinBtn.style.transform = "";
      spinBtn.style.boxShadow = "";
    }, 200);

    if (typeof window.log === "function") {
      window.log("press it.", "whisper");
    }

    playDriftEndSound();

    setTimeout(() => {
      if (fakeEl) fakeEl.style.opacity = "0";
      showRealCursor();
    }, 800);

    resetIdleTimer();
  }

  // ---------- ПРЕРЫВАНИЕ ДРЕЙФА ----------
  function stopDrift() {
    drifting = false;
    if (fakeEl) fakeEl.style.opacity = "0";
    showRealCursor();

    const spinBtn = document.getElementById("spin-btn");
    if (spinBtn) spinBtn.style.boxShadow = "";
  }

  // ---------- ЗВУК ----------
  let AC = null;
  function playDriftEndSound() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const c = AC;
      const t = c.currentTime;

      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  // ---------- СТАРТ ----------
  resetIdleTimer();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._startCursorDrift = startDrift;
  window._stopCursorDrift  = stopDrift;
})();
