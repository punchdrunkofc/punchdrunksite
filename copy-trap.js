// ==================================================================
//  copy-trap.js — intercepts copy, replaces clipboard content (silent)
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const REPLACEMENT_TEXT = "we know what you copied.";
  const GLITCH_DURATION  = 900;
  const COOLDOWN_MS      = 4000;

  let lastTrigger = 0;

  // ---------- ОСНОВНОЙ ОБРАБОТЧИК ----------
  document.addEventListener("copy", function (e) {
    const now = Date.now();
    if (now - lastTrigger < COOLDOWN_MS) {
      return;
    }
    lastTrigger = now;

    // заменяем содержимое буфера
    try {
      e.clipboardData.setData("text/plain", REPLACEMENT_TEXT);
      e.preventDefault();
    } catch (err) {
      try {
        navigator.clipboard.writeText(REPLACEMENT_TEXT);
      } catch (e2) {}
    }

    // визуальный отклик
    triggerGlitch();
    flashSelection();

    // сообщение в терминале
    logCopyMessage();

    // флаг в localStorage
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
