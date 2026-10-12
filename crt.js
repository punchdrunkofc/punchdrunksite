// ==================================================================
//  crt.js — CRT/terminal effect: fisheye, scanlines, chromatic
//  aberration, flicker. Applies to the whole page (or just terminal).
// ==================================================================

(function () {
  "use strict";

  // ---------- СОЗДАНИЕ ОВЕРЛЕЯ ----------
  // Отдельный fixed-слой поверх всего сайта, который создаёт
  // эффект CRT-экрана.

  const crt = document.createElement("div");
  crt.id = "crt-overlay";
  crt.innerHTML = `
    <div class="crt-scanlines"></div>
    <div class="crt-flicker"></div>
    <div class="crt-rgb"></div>
    <div class="crt-vignette"></div>
    <div class="crt-glass"></div>
  `;
  document.body.appendChild(crt);

  // ---------- АНИМАЦИЯ ДРОЖАНИЯ (случайный сдвиг) ----------
  const flickerEl = crt.querySelector(".crt-flicker");
  setInterval(() => {
    if (Math.random() < 0.08) {
      // редкие вспышки — приглушение
      flickerEl.style.opacity = (0.08 + Math.random() * 0.1).toFixed(3);
      setTimeout(() => {
        flickerEl.style.opacity = "0";
      }, 60 + Math.random() * 60);
    }
  }, 220);

  // ---------- ЛЁГКОЕ "ПОКАЧИВАНИЕ" КАРТИНКИ ----------
  const stage = document.querySelector(".stage");
  if (stage) {
    let offsetY = 0;
    setInterval(() => {
      offsetY = Math.sin(Date.now() / 900) * 0.6;
      stage.style.transform = "translateY(" + offsetY.toFixed(2) + "px)";
    }, 50);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._disableCRT = () => {
    crt.remove();
  };
})();
