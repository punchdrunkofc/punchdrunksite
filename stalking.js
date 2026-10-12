// ==================================================================
//  stalking.js — фраза «you did this» после финала
//  Появляется в шёпоте, HUD, логе, фоне. Ненавязчиво, но везде.
// ==================================================================

(function () {
  "use strict";

  // Если финал ещё не пройден — не запускаемся
  if (localStorage.getItem("loop_completed") !== "true") return;

  // ---------- 1. ФРАЗА В ШЁПОТЕ (в терминале) ----------
  function whisperInTerminal() {
    const log = document.getElementById("log");
    if (!log) return;

    const line = document.createElement("p");
    line.className = "line whisper";
    line.textContent = "you did this.";
    line.style.color = "#a020f0";
    line.style.fontStyle = "italic";
    line.style.marginTop = "8px";
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  // Первое появление — через 7 секунд
  setTimeout(whisperInTerminal, 7000);

  // Потом — каждые 90 секунд, случайно
  setInterval(() => {
    if (Math.random() < 0.5) whisperInTerminal();
  }, 90000);

  // ---------- 2. ФРАЗА В HUD ----------
  function addHudText() {
    const hudRight = document.querySelector(".hud-right");
    if (!hudRight) return;
    if (document.getElementById("guilt-hud")) return;

    const el = document.createElement("span");
    el.id = "guilt-hud";
    el.style.cssText = `
      color: #a020f0;
      font-family: "Courier New", monospace;
      font-size: 11px;
      letter-spacing: 2px;
      margin-left: 12px;
      padding: 2px 8px;
      border: 1px solid #a020f0;
      background: rgba(160, 32, 240, 0.08);
      animation: guilt-pulse 3s infinite;
    `;
    el.textContent = "you did this";
    hudRight.appendChild(el);
  }
  addHudText();

  // CSS для пульсации
  const style = document.createElement("style");
  style.textContent = `
    @keyframes guilt-pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);

  // ---------- 3. ФРАЗА В ФОНЕ ----------
  function backgroundGuilt() {
    const el = document.createElement("div");
    el.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-family: "Courier New", monospace;
      font-size: 180px;
      font-weight: bold;
      color: #a020f0;
      opacity: 0.04;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 20px;
      white-space: nowrap;
      text-transform: uppercase;
      text-shadow: 0 0 40px #a020f0;
      animation: bg-guilt-pulse 6s infinite;
      user-select: none;
    `;
    el.textContent = "YOU DID THIS";
    document.body.appendChild(el);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes bg-guilt-pulse {
        0%, 100% { opacity: 0.03; }
        50%      { opacity: 0.07; }
      }
    `;
    document.head.appendChild(style);
  }
  backgroundGuilt();

  // ---------- 4. СЛУЧАЙНЫЙ ШЁПОТ ПО ВСЕМУ ЭКРАНУ ----------
  function randomWhisper() {
    const w = document.createElement("div");
    const size = 12 + Math.random() * 8;
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    w.style.cssText = `
      position: fixed;
      top: ${y}%;
      left: ${x}%;
      transform: translate(-50%, -50%);
      font-family: "Courier New", monospace;
      font-size: ${size}px;
      color: #a020f0;
      opacity: 0;
      pointer-events: none;
      z-index: 9000;
      font-style: italic;
      letter-spacing: 2px;
      transition: opacity 2s ease;
      user-select: none;
    `;
    w.textContent = "you did this";
    document.body.appendChild(w);

    // проявление
    setTimeout(() => { w.style.opacity = "0.4"; }, 100);
    // затухание
    setTimeout(() => { w.style.opacity = "0"; }, 3000);
    // удаление
    setTimeout(() => { w.remove(); }, 5000);
  }

  // Каждые 60 секунд — случайный шёпот на экране
  setInterval(() => {
    if (Math.random() < 0.4) randomWhisper();
  }, 60000);

  // ---------- 5. ФРАЗА В TITLE ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = "you did this";
    } else {
      // возвращаем — но не оригинальное, а с припиской
      setTimeout(() => {
        document.title = "CARRIER_01 // YOU DID THIS";
      }, 500);
    }
  });

  // ---------- 6. ФРАЗА В КОНСОЛИ ----------
  console.log(
    "%cYOU DID THIS",
    "color:#a020f0;font-family:monospace;font-size:32px;font-weight:bold;text-shadow:0 0 20px #a020f0;"
  );

  // ---------- 7. МЕНЯЕМ ЛОГОТИП НА ФОНЕ (body::before) ----------
  // Переопределяем логотип на текст «you did this» — но через канвас.
  // (оставляем логотип — это ARG-элемент)

  // ---------- 8. ОБНОВЛЯЕМ ФУТЕР — ВСЕ ССЫЛКИ НА 47.html ----------
  function redirectFooter() {
    const footer = document.querySelector(".hidden-footer");
    if (!footer) return;

    // заменяем ссылки на одну, ведущую в 47.html
    footer.innerHTML = `
      <a href="47.html" class="secret-dot" style="color:#a020f0;font-weight:bold;">carrier.node</a>
      <a href="47.html" class="secret-dot" style="color:#a020f0;">you did this</a>
      <a href="47.html" class="secret-dot" style="color:#a020f0;">carrier.node</a>
      <span class="hidden-tag" style="color:#a020f0;">1</span>
    `;
  }
  redirectFooter();

  // ---------- 9. МЕНЯЕМ HUD-LEFTSIDE ----------
  function changeHudLeft() {
    const hudTitle = document.querySelector(".hud-title");
    if (!hudTitle) return;
    hudTitle.innerHTML = `NODE_01 // SIGNAL: <span style="color:#a020f0;">STABLE</span>`;
  }
  changeHudLeft();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._forceWhisper = whisperInTerminal;
  window._forceRandomWhisper = randomWhisper;
})();
