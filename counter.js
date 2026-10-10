// ==================================================================
//  counter.js — visitor counter via abacus.jasoncameron.dev
// ==================================================================

(function () {
  "use strict";

  const NAMESPACE = "punchdrunkofc";
  const KEY = "node07_visitors";
  const API = "https://abacus.jasoncameron.dev";

  // ---------- СОЗДАНИЕ ЭЛЕМЕНТА В HUD ----------
  function createCounterElement() {
    const el = document.createElement("span");
    el.id = "visitor-counter";
    el.innerHTML = `
      <span class="counter-label">VISITORS:</span>
      <span class="counter-value" id="counterValue">...</span>
    `;

    const hudRight = document.querySelector(".hud-right");
    if (hudRight) {
      // вставляем после счётчика SPINS, перед часами
      const clockEl = document.getElementById("clock");
      if (clockEl) {
        // ищем разделитель "|" перед часами
        const sepBeforeClock = clockEl.previousElementSibling;
        if (sepBeforeClock && sepBeforeClock.classList.contains("sep")) {
          hudRight.insertBefore(el, sepBeforeClock);
          hudRight.insertBefore(document.createTextNode(""), sepBeforeClock);
        } else {
          hudRight.insertBefore(el, clockEl);
        }
      } else {
        hudRight.appendChild(el);
      }

      // добавляем разделитель после counter
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "|";
      el.after(sep);
    } else {
      document.body.appendChild(el);
    }
  }

  // ---------- ИНКРЕМЕНТ И ОТОБРАЖЕНИЕ ----------
  function incrementAndShow() {
    const valueEl = document.getElementById("counterValue");
    if (!valueEl) return;

    valueEl.textContent = "...";

    fetch(API + "/hit/" + NAMESPACE + "/" + KEY)
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(data => {
        const n = (typeof data.value === "number") ? data.value : 0;

        // ARG-усиление: показываем реальное число + скрытая "поправка"
        // (можно убрать эту строку, если хочешь честное число)
        const displayed = n;

        animateCount(valueEl, 0, displayed, 900);
        localStorage.setItem("last_visitor_count", String(displayed));
      })
      .catch(err => {
        console.warn("counter failed:", err);
        // fallback — берём последнее известное число
        const last = parseInt(localStorage.getItem("last_visitor_count") || "0", 10);
        if (last > 0) {
          valueEl.textContent = last.toLocaleString();
        } else {
          valueEl.textContent = "???";
        }
      });
  }

  // ---------- АНИМАЦИЯ ЧИСЛА ----------
  function animateCount(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(from + (to - from) * ease);
      el.textContent = value.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  // ---------- РЕДКИЕ СБОИ СЧЁТЧИКА (ARG) ----------
  function occasionallyGlitch() {
    setInterval(() => {
      if (Math.random() < 0.05) {
        const el = document.getElementById("counterValue");
        if (!el) return;
        const original = el.textContent;
        el.textContent = "0000";
        el.style.color = "#ff2b6a";
        setTimeout(() => {
          el.textContent = original;
          el.style.color = "";
        }, 220);
      }
    }, 45000);
  }

  // ---------- СТАРТ ----------
  createCounterElement();
  incrementAndShow();
  occasionallyGlitch();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._refreshCounter = incrementAndShow;
})();
