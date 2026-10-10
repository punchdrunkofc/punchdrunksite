// ==================================================================
//  intro.js — personalized intro after boot screen
//  Text changes based on player's progress in localStorage
// ==================================================================

(function () {
  "use strict";

  // ---------- ЧТЕНИЕ ДАННЫХ ИГРОКА ----------
  function getPlayerData() {
    const d = {};
    d.visits   = parseInt(localStorage.getItem("intro_visits") || "0", 10) + 1;
    d.spins    = parseInt(localStorage.getItem("spins") || "0", 10);
    d.jackpots = parseInt(localStorage.getItem("jackpots") || "0", 10);
    d.ciphers  = parseInt(localStorage.getItem("cipher_count") || "0", 10);
    d.copies   = parseInt(localStorage.getItem("copy_trap_count") || "0", 10);
    d.manifest = localStorage.getItem("manifest_reader") === "true";
    d.enemy    = parseInt(localStorage.getItem("enemy_visits") || "0", 10);
    d.chat     = localStorage.getItem("visited_chat") === "true";
    d.notfound = localStorage.getItem("visited_404") === "true";
    d.camera   = localStorage.getItem("used_camera") === "true";
    d.mic      = localStorage.getItem("used_mic") === "true";
    d.dbltotal = localStorage.getItem("overload") === "true";
    d.initied  = localStorage.getItem("initiated") === "true";
    d.oldVisit = localStorage.getItem("last_visit_time") || null;
    d.daysAway = 0;

    if (d.oldVisit) {
      const diff = Date.now() - parseInt(d.oldVisit, 10);
      d.daysAway = Math.floor(diff / 86400000);
      d.hoursAway = Math.floor(diff / 3600000);
      d.minutesAway = Math.floor(diff / 60000);
    }

    localStorage.setItem("intro_visits", d.visits.toString());
    localStorage.setItem("last_visit_time", Date.now().toString());

    return d;
  }

  // ---------- СБОРКА ВСТУПИТЕЛЬНОГО ТЕКСТА ----------
  function buildIntro(d) {
    const lines = [];

    // -------- ПРИВЕТСТВИЕ --------
    if (d.visits === 1) {
      lines.push({ text: "&gt; welcome, new subject.", cls: "system" });
      lines.push({ text: "&gt; you have just arrived.", cls: "dim" });
    } else if (d.visits < 5) {
      lines.push({ text: "&gt; you came back.", cls: "system" });
      lines.push({ text: "&gt; we noticed.", cls: "whisper" });
    } else if (d.visits < 20) {
      lines.push({ text: "&gt; you return often.", cls: "system" });
      lines.push({ text: "&gt; this is becoming a habit.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; you are still here.", cls: "err" });
      lines.push({ text: "&gt; after " + d.visits + " visits.", cls: "dim" });
    }

    // -------- СКОЛЬКО ВРЕМЕНИ НЕ БЫЛО --------
    if (d.daysAway >= 1) {
      lines.push({ text: "&gt; you were gone for " + d.daysAway + " day" + (d.daysAway === 1 ? "" : "s") + ".", cls: "dim" });
      lines.push({ text: "&gt; we counted every hour.", cls: "whisper" });
    } else if (d.hoursAway >= 1) {
      lines.push({ text: "&gt; you were gone for " + d.hoursAway + " hour" + (d.hoursAway === 1 ? "" : "s") + ".", cls: "dim" });
    } else if (d.minutesAway >= 5) {
      lines.push({ text: "&gt; you were gone for " + d.minutesAway + " minutes.", cls: "dim" });
    }

    // -------- ПРОГРЕСС: СПИНЫ --------
    if (d.spins === 0) {
      lines.push({ text: "&gt; you have not spun the wheel yet.", cls: "" });
      lines.push({ text: "&gt; press spin. we will watch.", cls: "whisper" });
    } else if (d.spins < 5) {
      lines.push({ text: "&gt; you have spun " + d.spins + " time" + (d.spins === 1 ? "" : "s") + ".", cls: "" });
    } else if (d.spins < 20) {
      lines.push({ text: "&gt; " + d.spins + " spins. you are learning.", cls: "dim" });
    } else if (d.spins < 100) {
      lines.push({ text: "&gt; " + d.spins + " spins. you understand the wheel.", cls: "dim" });
    } else {
      lines.push({ text: "&gt; " + d.spins + " spins. this is not normal.", cls: "err" });
    }

    // -------- ПРОГРЕСС: КОПИРОВАНИЕ --------
    if (d.copies === 0) {
      lines.push({ text: "&gt; you have not tried to copy anything yet.", cls: "dim" });
      lines.push({ text: "&gt; that is unusual.", cls: "whisper" });
    } else if (d.copies < 3) {
      lines.push({ text: "&gt; you tried to copy text " + d.copies + " time" + (d.copies === 1 ? "" : "s") + ".", cls: "dim" });
    } else {
      lines.push({ text: "&gt; you tried to copy text " + d.copies + " times.", cls: "err" });
      lines.push({ text: "&gt; we know what you tried to take.", cls: "whisper" });
    }

    // -------- ПРОГРЕСС: МАНИФЕСТ --------
    if (d.manifest && d.enemy > 0) {
      lines.push({ text: "&gt; you read both sides of the story.", cls: "dim" });
      lines.push({ text: "&gt; now you know neither is honest.", cls: "whisper" });
    } else if (d.manifest) {
      lines.push({ text: "&gt; you read the manifesto.", cls: "dim" });
      lines.push({ text: "&gt; there is another version. of course there is.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; you have not read the manifesto.", cls: "dim" });
    }

    // -------- ПРОГРЕСС: ШИФРЫ --------
    if (d.ciphers === 0) {
      lines.push({ text: "&gt; no ciphers solved yet.", cls: "dim" });
    } else if (d.ciphers < 3) {
      lines.push({ text: "&gt; you solved " + d.ciphers + " cipher" + (d.ciphers === 1 ? "" : "s") + ".", cls: "dim" });
    } else if (d.ciphers < 7) {
      lines.push({ text: "&gt; " + d.ciphers + " ciphers. you are getting closer.", cls: "" });
    } else {
      lines.push({ text: "&gt; " + d.ciphers + " ciphers solved.", cls: "ok" });
      lines.push({ text: "&gt; you are decoding the signal itself.", cls: "whisper" });
    }

    // -------- ПРОГРЕСС: ЧАТ --------
    if (!d.chat) {
      lines.push({ text: "&gt; you have not entered the channel.", cls: "dim" });
      lines.push({ text: "&gt; others are waiting there.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; you spoke with others in the channel.", cls: "dim" });
    }

    // -------- ПРОГРЕСС: КАМЕРА / МИКРОФОН --------
    if (d.camera) {
      lines.push({ text: "&gt; you let us see you.", cls: "err" });
      lines.push({ text: "&gt; we will not forget your face.", cls: "whisper" });
    }
    if (d.mic) {
      lines.push({ text: "&gt; we heard your voice.", cls: "err" });
    }

    // -------- ПРОГРЕСС: 404 --------
    if (d.notfound) {
      lines.push({ text: "&gt; you went too far once.", cls: "dim" });
      lines.push({ text: "&gt; there was nothing there.", cls: "whisper" });
    }

    // -------- ПРОГРЕСС: DOUBLE TOTAL --------
    if (d.dbltotal) {
      lines.push({ text: "&gt; you reached TOTAL twice in a row.", cls: "ok" });
      lines.push({ text: "&gt; this has happened before. to someone else.", cls: "whisper" });
    }

    // -------- ИТОГОВАЯ ОЦЕНКА --------
    lines.push({ text: "&nbsp;", cls: "" });

    if (d.visits === 1 && d.spins === 0 && d.copies === 0) {
      lines.push({ text: "&gt; status: untouched.", cls: "dim" });
      lines.push({ text: "&gt; begin.", cls: "whisper" });
    } else if (d.spins > 100 && d.ciphers >= 7) {
      lines.push({ text: "&gt; status: observer.", cls: "ok" });
      lines.push({ text: "&gt; you have been marked.", cls: "err" });
    } else if (d.manifest && d.chat && d.copies > 0) {
      lines.push({ text: "&gt; status: participant.", cls: "" });
      lines.push({ text: "&gt; you are part of this now.", cls: "whisper" });
    } else {
      lines.push({ text: "&gt; status: learning.", cls: "dim" });
    }

    lines.push({ text: "&nbsp;", cls: "" });
    lines.push({ text: "&gt; enter the wheel.", cls: "system" });

    return lines;
  }

  // ---------- ПОКАЗ ПАНЕЛИ ----------
  function showIntro() {
    const d = getPlayerData();
    const lines = buildIntro(d);

    // -------- СОЗДАНИЕ ПАНЕЛИ --------
    const panel = document.createElement("div");
    panel.id = "intro-panel";
    panel.innerHTML = `
      <div class="intro-box">
        <div class="intro-header">
          <span>NODE_07 :: SESSION START</span>
          <span class="intro-skip" id="introSkip">[ SKIP ]</span>
        </div>
        <div class="intro-body" id="introBody"></div>
      </div>
    `;
    document.body.appendChild(panel);

    // блокируем скролл
    document.body.style.overflow = "hidden";

    // -------- ПОСТРОЧНЫЙ ВЫВОД --------
    const body = document.getElementById("introBody");
    let delay = 300;

    lines.forEach((line) => {
      setTimeout(() => {
        const p = document.createElement("p");
        p.className = "intro-line " + (line.cls || "");
        p.innerHTML = line.text;
        body.appendChild(p);
      }, delay);
      delay += 350;
    });

    // -------- ЗАКРЫТИЕ --------
    function closeIntro() {
      panel.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      panel.style.opacity = "0";
      panel.style.transform = "scale(1.05)";
      setTimeout(() => {
        panel.remove();
        document.body.style.overflow = "";
        // сообщение в терминале
        if (typeof window.log === "function") {
          window.log("&gt; intro dismissed. press spin.", "dim");
        }
      }, 650);
    }

    // авто-закрытие через 10 секунд после последней строки
    setTimeout(closeIntro, delay + 5000);

    // клик по SKIP
    document.getElementById("introSkip").addEventListener("click", (e) => {
      e.stopPropagation();
      closeIntro();
    });

    // клик по любому месту панели — закрыть
    panel.addEventListener("click", closeIntro);
  }

  // ---------- ЗАПУСК ПОСЛЕ BOOT-SCREEN ----------
  function waitForBootScreen(cb) {
    const boot = document.getElementById("boot-screen");
    if (!boot) {
      // если boot уже закрыт или не существует — показываем сразу
      cb();
    } else {
      setTimeout(() => waitForBootScreen(cb), 500);
    }
  }

  // запуск после загрузки DOM
  if (document.readyState === "complete" || document.readyState === "interactive") {
    waitForBootScreen(showIntro);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      waitForBootScreen(showIntro);
    });
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._showIntro = showIntro;
})();
