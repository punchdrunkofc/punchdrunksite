// ==================================================================
//  cursor-drift.js — после 10 сек бездействия фальшивый курсор
//  медленно плывёт к кнопке SPIN
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const IDLE_MS       = 10000;     // 10 секунд бездействия
  const DRIFT_DURATION = 3500;     // за сколько мс доплыть до кнопки
  const EPSILON       = 2;         // пиксельный порог «доплыли»

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

  // ---------- СОЗДАНИЕ ФАЛЬШИВОГО КУРСОРА ----------
  function createFakeCursor() {
    fakeEl = document.createElement("div");
    fakeEl.id = "fake-cursor";
    fakeEl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 2 L3 18 L7 14 L10 21 L13 20 L10 13 L16 13 Z"
              fill="#a020f0" stroke="#d8a8ff" stroke-width="1"
              style="filter: drop-shadow(0 0 6px #a020f0);"/>
      </svg>
    `;
    fakeEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 99999;
      transform: translate3d(${realX}px, ${realY}px, 0);
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
    // прячем у всех элементов — но не у input, чтобы игрок мог печатать
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
  function updateFakeCursor(x, y) {
    if (!fakeEl) return;
    fakeEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  // ---------- ОТСЛЕЖИВАНИЕ РЕАЛЬНОГО КУРСОРА ----------
  document.addEventListener("mousemove", (e) => {
    // если игрок двигает мышь — прерываем дрейф
    if (drifting) {
      stopDrift();
    }
    realX = e.clientX;
    realY = e.clientY;

    // если настоящий курсор виден — синхронизируем фальшивый
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

    // цель — центр кнопки
    const rect = spinBtn.getBoundingClientRect();
    driftToX = rect.left + rect.width / 2 - 12;   // -12 — поправка на «жало» курсора
    driftToY = rect.top + rect.height / 2 - 6;

    driftFromX = realX;
    driftFromY = realY;

    drifting = true;
    driftStart = performance.now();

    // показать фальшивый курсор
    if (!fakeEl) createFakeCursor();
    hideRealCursor();
    updateFakeCursor(realX, realY);
    fakeEl.style.opacity = "1";

    // лёгкое свечение кнопки при начале дрейфа
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

    // easeInOutCubic — плавно ускоряется, плавно тормозит
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // лёгкое покачивание по перпендикуляру — как будто курсор «плывёт»
    const dx = driftToX - driftFromX;
    const dy = driftToY - driftFromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;
    const sway = Math.sin(elapsed * 0.008) * 8 * (1 - t);

    const x = driftFromX + dx * ease + perpX * sway;
    const y = driftFromY + dy * ease + perpY * sway;

    realX = x;
    realY = y;
    updateFakeCursor(x, y);

    // когда доплыли — активируем кнопку
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

    // лёгкая вибрация кнопки — «нажми»
    spinBtn.style.transition = "transform 0.15s";
    spinBtn.style.transform = "translate(-50%, -50%) scale(1.05)";
    setTimeout(() => {
      spinBtn.style.transform = "";
      spinBtn.style.boxShadow = "";
    }, 200);

    // шёпот в терминале
    if (typeof window.log === "function") {
      window.log("press it.", "whisper");
    }

    // короткий звук
    playDriftEndSound();

    // фальшивый курсор плавно растворяется, настоящий возвращается
    setTimeout(() => {
      if (fakeEl) fakeEl.style.opacity = "0";
      showRealCursor();
    }, 800);

    // сброс таймера — если игрок снова бездействует, дрейф повторится
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

  // экспорт для отладки
  window._startCursorDrift = startDrift;
  window._stopCursorDrift  = stopDrift;
})();
