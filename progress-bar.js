// ==================================================================
//  progress-bar.js — полоса прогресса на главной
//  Показывает, сколько из 10 условий финала выполнено.
//  Появляется в HUD под шапкой.
// ==================================================================

(function () {
  "use strict";

  // ---------- УСЛОВИЯ ФИНАЛА (те же, что в loop.js) ----------
  const CONDITIONS = [
    {
      key: "spins",
      label: "SPINS",
      hint: "spin the wheel 100 times",
      check: () => parseInt(localStorage.getItem("spins") || "0", 10) >= 100,
      progress: () => Math.min(1, parseInt(localStorage.getItem("spins") || "0", 10) / 100)
    },
    {
      key: "ciphers",
      label: "CIPHERS",
      hint: "solve 7 ciphers in the terminal",
      check: () => parseInt(localStorage.getItem("cipher_count") || "0", 10) >= 7,
      progress: () => Math.min(1, parseInt(localStorage.getItem("cipher_count") || "0", 10) / 7)
    },
    {
      key: "manifest",
      label: "MANIFEST",
      hint: "read manifest.html",
      check: () => localStorage.getItem("manifest_reader") === "true",
      progress: () => localStorage.getItem("manifest_reader") === "true" ? 1 : 0
    },
    {
      key: "enemy",
      label: "OFFICIAL",
      hint: "read manifest-enemy.html",
      check: () => parseInt(localStorage.getItem("enemy_visits") || "0", 10) > 0,
      progress: () => parseInt(localStorage.getItem("enemy_visits") || "0", 10) > 0 ? 1 : 0
    },
    {
      key: "label",
      label: "LABEL",
      hint: "open label.html",
      check: () => localStorage.getItem("label_archive_found") === "true",
      progress: () => localStorage.getItem("label_archive_found") === "true" ? 1 : 0
    },
    {
      key: "labelSite",
      label: "NOCTURNE",
      hint: "corrupt label-site.html to level 10",
      check: () => parseInt(localStorage.getItem("label_site_corrupt_level") || "0", 10) >= 10,
      progress: () => Math.min(1, parseInt(localStorage.getItem("label_site_corrupt_level") || "0", 10) / 10)
    },
    {
      key: "breakdown",
      label: "BREAKDOWN",
      hint: "read the full recovered file",
      check: () => localStorage.getItem("read_full_file") === "true",
      progress: () => localStorage.getItem("read_full_file") === "true" ? 1 : 0
    },
    {
      key: "archive",
      label: "ARCHIVE_47",
      hint: "find the 47 carriers archive",
      check: () => localStorage.getItem("archive_47_seen") === "true",
      progress: () => localStorage.getItem("archive_47_seen") === "true" ? 1 : 0
    },
    {
      key: "chat",
      label: "CHANNEL",
      hint: "enter chat.html",
      check: () => localStorage.getItem("visited_chat") === "true",
      progress: () => localStorage.getItem("visited_chat") === "true" ? 1 : 0
    },
    {
      key: "signal",
      label: "SIGNAL",
      hint: "find signal.html",
      check: () => localStorage.getItem("signal_found") === "true",
      progress: () => localStorage.getItem("signal_found") === "true" ? 1 : 0
    }
  ];

  // ---------- СОЗДАНИЕ ПАНЕЛИ ----------
  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "progress-panel";
    panel.innerHTML = `
      <div class="progress-header">
        <span class="progress-label">// CARRIER PROGRESS</span>
        <span class="progress-count" id="progressCount">0 / 10</span>
        <span class="progress-toggle" id="progressToggle">[ EXPAND ]</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="progress-list" id="progressList"></div>
    `;
    document.body.appendChild(panel);

    // обработчик кнопки expand
    const toggle = document.getElementById("progressToggle");
    toggle.addEventListener("click", () => {
      panel.classList.toggle("expanded");
      toggle.textContent = panel.classList.contains("expanded")
        ? "[ COLLAPSE ]"
        : "[ EXPAND ]";
    });
  }

  // ---------- ОБНОВЛЕНИЕ ПАНЕЛИ ----------
  function updatePanel() {
    const panel = document.getElementById("progress-panel");
    if (!panel) return;

    // общий процент
    const totalProgress = CONDITIONS.reduce((sum, c) => sum + c.progress(), 0);
    const percent = Math.round((totalProgress / CONDITIONS.length) * 100);

    // общее число выполненных
    const done = CONDITIONS.filter(c => c.check()).length;
    const allDone = done === CONDITIONS.length;

    // заголовок
    const countEl = document.getElementById("progressCount");
    if (countEl) {
      countEl.textContent = done + " / " + CONDITIONS.length;
      if (allDone) {
        countEl.style.color = "#d8a8ff";
        countEl.style.textShadow = "0 0 12px #a020f0";
        countEl.style.animation = "progress-done-pulse 1.5s infinite";
      }
    }

    // полоса
    const fillEl = document.getElementById("progressFill");
    if (fillEl) {
      fillEl.style.width = percent + "%";
      if (allDone) {
        fillEl.style.background = "linear-gradient(to right, #a020f0, #d8a8ff)";
        fillEl.style.boxShadow = "0 0 20px #a020f0";
      }
    }

    // список условий
    const listEl = document.getElementById("progressList");
    if (listEl) {
      listEl.innerHTML = "";
      CONDITIONS.forEach(c => {
        const isDone = c.check();
        const item = document.createElement("div");
        item.className = "progress-item" + (isDone ? " done" : "");
        item.innerHTML = `
          <span class="progress-mark">${isDone ? "[✓]" : "[ ]"}</span>
          <span class="progress-item-label">${c.label}</span>
          <span class="progress-item-hint">${isDone ? "complete" : c.hint}</span>
        `;
        listEl.appendChild(item);
      });
    }

    // если всё выполнено — панель пульсирует фиолетовым
    if (allDone) {
      panel.classList.add("all-done");
    } else {
      panel.classList.remove("all-done");
    }
  }

  // ---------- ПЕРВИЧНОЕ СОЗДАНИЕ ----------
  function init() {
    if (!document.getElementById("progress-panel")) {
      createPanel();
    }
    updatePanel();

    // обновление раз в 2 секунды + при визите
    setInterval(updatePanel, 2000);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._progressStatus = () => {
    const done = CONDITIONS.filter(c => c.check()).length;
    return {
      done,
      total: CONDITIONS.length,
      percent: Math.round(CONDITIONS.reduce((s, c) => s + c.progress(), 0) / CONDITIONS.length * 100),
      conditions: CONDITIONS.map(c => ({
        key: c.key,
        done: c.check(),
        progress: Math.round(c.progress() * 100) + "%"
      }))
    };
  };
  window._progressUpdate = updatePanel;
  window._progressExpand = () => {
    const panel = document.getElementById("progress-panel");
    const toggle = document.getElementById("progressToggle");
    if (panel && !panel.classList.contains("expanded")) {
      panel.classList.add("expanded");
      if (toggle) toggle.textContent = "[ COLLAPSE ]";
    }
  };
})();
