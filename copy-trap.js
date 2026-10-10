// ==================================================================
//  copy-trap.js — intercepts copy, replaces clipboard content
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const REPLACEMENT_TEXT = "we know what you copied.";
  const GLITCH_DURATION  = 900;      // мс
  const COOLDOWN_MS      = 4000;     // не чаще раза в 4 секунды

  let lastTrigger = 0;

  // ---------- ОСНОВНОЙ ОБРАБОТЧИК ----------
  document.addEventListener("copy", function (e) {
    const now = Date.now();
    if (now - lastTrigger < COOLDOWN_MS) {
      // чтобы игрок не мог «заспамить» — не трогаем буфер слишком часто
      return;
    }
    lastTrigger = now;

    // заменяем содержимое буфера
    try {
      e.clipboardData.setData("text/plain", REPLACEMENT_TEXT);
      e.preventDefault();
    } catch (err) {
      // fallback: если clipboardData недоступен
      try {
        navigator.clipboard.writeText(REPLACEMENT_TEXT);
      } catch (e2) {}
    }

    // ---------- ВИЗУАЛЬНЫЙ ОТКЛИК ----------
    triggerGlitch();
    flashSelection();

    // ---------- ЗВУК ----------
    playCopySound();

    // ---------- СООБЩЕНИЕ В ТЕРМИНАЛЕ ----------
    logCopyMessage();

    // ---------- ФЛАГ ----------
    try {
      localStorage.setItem("copy_trap_triggered", "true");
      let count = parseInt(localStorage.getItem("copy_trap_count") || "0", 10) + 1;
      localStorage.setItem("copy_trap_count", count.toString());
    } catch (e) {}
  });

  // ---------- GLITCH ----------
  function triggerGlitch() {
    if (typeof window.triggerGlitch === "function") {
      window.triggerGlitch(GLITCH_DURATION);
      return;
    }
    // fallback, если triggerGlitch из cmd-1.js недоступен
    const o = document.getElementById("glitch-overlay");
    if (!o) return;
    o.classList.add("active");
    setTimeout(() => o.classList.remove("active"), GLITCH_DURATION);
  }

  // ---------- ПОДСВЕТКА ВЫДЕЛЕННОГО ----------
  function flashSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.left = rect.left + "px";
    flash.style.top = rect.top + "px";
    flash.style.width = rect.width + "px";
    flash.style.height = rect.height + "px";
    flash.style.background = "rgba(160, 32, 240, 0.55)";
    flash.style.boxShadow = "0 0 25px rgba(160, 32, 240, 0.9)";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "300";
    flash.style.borderRadius = "2px";
    flash.style.transition = "opacity 0.6s";
    flash.style.mixBlendMode = "screen";

    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = "0"; }, 120);
    setTimeout(() => { flash.remove(); }, 900);
  }

  // ---------- ЗВУК ----------
  let AC = null;
  function playCopySound() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();

      const c = AC;
      const t = c.currentTime;

      // резкий «snap» — высокий короткий
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2000, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.12);

      // низкий «thump»
      const sub = c.createOscillator();
      const subG = c.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(90, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      subG.gain.setValueAtTime(0.0001, t);
      subG.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
      subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      sub.connect(subG).connect(c.destination);
      sub.start(t);
      sub.stop(t + 0.18);
    } catch (e) {}
  }

  // ---------- СООБЩЕНИЕ В ТЕРМИНАЛЕ ----------
  function logCopyMessage() {
    if (typeof window.log !== "function") return;
    setTimeout(() => {
      window.log("we know what you copied.", "whisper");
    }, 400);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._copyTrapCount = () =>
    parseInt(localStorage.getItem("copy_trap_count") || "0", 10);
})();
