// ==================================================================
//  loop.js — финальная петля
//  Проверяет условия прохождения. Если всё пройдено —
//  показывает сцену «архивации» и запускает режим CARRIER_01.
// ==================================================================

(function () {
  "use strict";

  const LOOP_KEY = "loop_completed";

  // ---------- ЧТО СЧИТАЕТСЯ ПРОХОЖДЕНИЕМ ----------
  function checkRequirements() {
    const spins    = parseInt(localStorage.getItem("spins") || "0", 10);
    const ciphers  = parseInt(localStorage.getItem("cipher_count") || "0", 10);
    const manifest = localStorage.getItem("manifest_reader") === "true";
    const enemy    = parseInt(localStorage.getItem("enemy_visits") || "0", 10) > 0;
    const label    = localStorage.getItem("label_archive_found") === "true";
    const labelSite= parseInt(localStorage.getItem("label_site_corrupt_level") || "0", 10) >= 10;
    const breakdown= localStorage.getItem("read_full_file") === "true";
    const archive  = localStorage.getItem("archive_47_seen") === "true";
    const chat     = localStorage.getItem("visited_chat") === "true";
    const signal   = localStorage.getItem("signal_found") === "true";

    const done = {
      spins:    spins >= 100,
      ciphers:  ciphers >= 7,
      manifest: manifest,
      enemy:    enemy,
      label:    label,
      labelSite:labelSite,
      breakdown:breakdown,
      archive:  archive,
      chat:     chat,
      signal:   signal
    };

    const total = Object.values(done).filter(Boolean).length;
    const required = Object.keys(done).length;

    return { done, total, required, complete: total === required };
  }

  // ---------- ПОКАЗ СЦЕНЫ АРХИВАЦИИ ----------
  function showArchiveScene() {
    // Полноэкранный оверлей
    const overlay = document.createElement("div");
    overlay.id = "loop-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000000;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Courier New", monospace;
      opacity: 0;
      transition: opacity 1s ease;
      cursor: none;
    `;

    const body = document.createElement("div");
    body.style.cssText = `
      max-width: 700px;
      padding: 40px;
      color: #c8c8d0;
      font-size: 16px;
      line-height: 2;
      letter-spacing: 1px;
    `;

    overlay.appendChild(body);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Пауза, потом плавное появление
    setTimeout(() => { overlay.style.opacity = "1"; }, 100);

    // ---------- СТРОКИ ----------
    const lines = [
      { text: "> your session has been archived.",       cls: "dim",    delay: 1500 },
      { text: "> thank you for carrying the signal.",    cls: "whisper",delay: 2500 },
      { text: "> you are now carrier 0x01.",             cls: "ok",     delay: 2500 },
      { text: "",                                        cls: "",       delay: 1500 },
      { text: "resetting...",                            cls: "dim",    delay: 2000 },
    ];

    let total = 1500;
    lines.forEach((line) => {
      total += line.delay;
      setTimeout(() => {
        const p = document.createElement("p");
        p.style.margin = "0 0 8px";
        p.style.opacity = "0";
        p.style.transition = "opacity 0.6s ease";
        p.textContent = line.text;

        if (line.cls === "dim")     p.style.color = "#6a5a75";
        if (line.cls === "whisper") { p.style.color = "#a020f0"; p.style.fontStyle = "italic"; }
        if (line.cls === "ok")      { p.style.color = "#d8a8ff"; p.style.fontWeight = "bold"; }

        body.appendChild(p);
        // плавное появление
        setTimeout(() => { p.style.opacity = "1"; }, 50);
      }, total);
    });

    // ---------- СБРОС ----------
    setTimeout(() => {
      // обнуляем все счётчики
      const keepKeys = [
        "subject_id",       // ID игрока оставляем
        "first_visit",      // дату первого визита оставляем
        "intro_visits",     // сколько раз заходил
      ];
      // остальное — удаляем
      const savedValues = {};
      keepKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v !== null) savedValues[k] = v;
      });

      localStorage.clear();

      keepKeys.forEach(k => {
        if (savedValues[k] !== undefined) {
          localStorage.setItem(k, savedValues[k]);
        }
      });

      // ставим флаги финала
      localStorage.setItem("loop_completed", "true");
      localStorage.setItem("carrier_01", "true");
      localStorage.setItem("spins", "0");
      localStorage.setItem("cipher_count", "0");

      // маленькая пауза, потом редирект
      setTimeout(() => {
        window.location.href = "carrier_01.html";
      }, 1500);

    }, total + 3000);
  }

  // ---------- ПРОВЕРКА ПРИ ЗАГРУЗКЕ ----------
  function checkLoop() {
    // если финал уже был — не показываем ещё раз
    if (localStorage.getItem(LOOP_KEY) === "true") return;

    // ждём 5 секунд, чтобы все скрипты успели обновить localStorage
    setTimeout(() => {
      const r = checkRequirements();

      // отладка
      window._loopStatus = r;

      if (r.complete) {
        showArchiveScene();
      } else {
        // если не всё пройдено — можно вызвать вручную через консоль
        // console.log("loop: not complete", r.done);
      }
    }, 5000);
  }

  // ---------- ЗАПУСК ----------
  if (document.readyState === "complete" || document.readyState === "interactive") {
    checkLoop();
  } else {
    document.addEventListener("DOMContentLoaded", checkLoop);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._loopCheck = checkRequirements;
  window._loopForce = showArchiveScene;
  window._loopReset = () => {
    localStorage.removeItem("loop_completed");
    localStorage.removeItem("carrier_01");
    location.reload();
  };
})();
