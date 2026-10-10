// ==================================================================
//  cmd-6.js — [SYSTEM] messages (no body shake, no forced scroll)
// ==================================================================

(function () {
  "use strict";

  // ------ УТИЛИТА: напечатать [SYSTEM]-строку ------
  function sysPrint(text, cls) {
    const logEl = document.getElementById("log");
    if (!logEl) return;

    // проверяем, был ли игрок внизу лога ДО добавления строки
    const wasAtBottom =
      logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40;

    const p = document.createElement("p");
    p.className = "line " + (cls || "system");
    p.innerHTML = "<span style='color:#8a8a95;'>[SYSTEM]</span> " + text;

    logEl.appendChild(p);

    // скроллим ТОЛЬКО если игрок уже был внизу
    if (wasAtBottom) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  // ------ ПУЛ СООБЩЕНИЙ ------
  const MESSAGES = [
    "unauthorized access detected on this node",
    "user {SUBJECT} traced",
    "this session will be archived",
    "packet integrity check: <span style='color:#ff8a8a;'>FAILED</span>",
    "unknown listener detected on port 0x07",
    "signal injection from external source",
    "keep-alive handshake: <span style='color:#ff8a8a;'>NO RESPONSE</span>",
    "attempting to identify origin...",
    "origin: masked",
    "session duration exceeds expected parameters",
    "your presence has been noted by node 0x0F",
    "3 active observers",
    "their permissions have been updated",
    "do not trust the wheel",
    "the wheel is not the game",
    "recommend termination of this session",
    "they have already read this line",
    "you are not the first",
    "you will not be the last"
  ];

  function fillPlaceholders(text) {
    const subject = (typeof getSubjectId === "function")
      ? getSubjectId()
      : (localStorage.getItem("subject_id") || "SUBJECT_????-????");
    return text.replace(/\{SUBJECT\}/g, subject);
  }

  function randomSystemMessage() {
    const raw = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return fillPlaceholders(raw);
  }

  // ------ СПЛАНИРОВАННОЕ ПОЯВЛЕНИЕ ------
  function scheduleNext(delay) {
    setTimeout(() => {
      sysPrint(randomSystemMessage(), "system");

      if (Math.random() < 0.3) {
        setTimeout(() => {
          sysPrint(randomSystemMessage(), "system");
        }, 3000 + Math.random() * 3000);
      }

      scheduleNext(90000 + Math.random() * 90000);
    }, delay);
  }

  function start() {
    scheduleNext(30000);
  }

  // ждём первого клика для запуска
  let started = false;
  document.addEventListener("click", function onFirstClick() {
    if (started) return;
    started = true;
    document.removeEventListener("click", onFirstClick);
    start();
  });

  // ------ РЕАКЦИЯ НА БЕЗДЕЙСТВИЕ ------
  let lastActivity = Date.now();
  let idleWarned = false;

  ["mousemove", "keydown", "click", "touchstart"].forEach(ev => {
    document.addEventListener(ev, () => {
      lastActivity = Date.now();
      idleWarned = false;
    }, { passive: true });
  });

  setInterval(() => {
    if (!started) return;
    const idle = Date.now() - lastActivity;
    if (idle > 90000 && !idleWarned) {
      idleWarned = true;
      setTimeout(() => {
        const logEl = document.getElementById("log");
        if (!logEl) return;

        const wasAtBottom =
          logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40;

        const p = document.createElement("p");
        p.className = "line whisper";
        p.textContent = "why did you stop?";
        logEl.appendChild(p);

        if (wasAtBottom) {
          logEl.scrollTop = logEl.scrollHeight;
        }
      }, 500);
    }
  }, 5000);

  // ------ ДИАЛОГ НА СПЕЦИАЛЬНЫЕ КОМАНДЫ ------
  const REACTIONS = {
    "why": [
      "because you keep spinning",
      "because we are still here",
      "because it is not over"
    ],
    "who": [
      "you know who",
      "the ones who erased node 0x00",
      "we cannot say. they are listening"
    ],
    "help me": [
      "you are already helping",
      "there is no help. only the signal",
      "we cannot. you can"
    ],
    "hello": [
      "hello, {SUBJECT}",
      "you said that last time too"
    ]
  };

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    const input = document.getElementById("cmd");
    if (!input) return;
    const value = input.value.trim().toLowerCase();
    if (!value) return;

    const response = REACTIONS[value];
    if (response) {
      const text = response[Math.floor(Math.random() * response.length)];
      const filled = fillPlaceholders(text);

      setTimeout(() => {
        const logEl = document.getElementById("log");
        if (!logEl) return;

        const wasAtBottom =
          logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40;

        const p = document.createElement("p");
        p.className = "line whisper";
        p.textContent = filled;
        logEl.appendChild(p);

        if (wasAtBottom) {
          logEl.scrollTop = logEl.scrollHeight;
        }
      }, 700 + Math.random() * 400);
    }
  }, true);

  // экспорт для отладки
  window._sysPrint = sysPrint;
  window._sysPrintRandom = () => sysPrint(randomSystemMessage(), "system");
})();
