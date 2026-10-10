// ==================================================================
//  cmd-6.js — [SYSTEM] messages and silent observation
// ==================================================================

(function () {
  "use strict";

  // ------ УТИЛИТА: напечатать [SYSTEM]-строку ------
  function sysPrint(text, cls) {
    if (typeof log !== "function") return;
    const p = document.createElement("p");
    p.className = "line " + (cls || "system");
    p.innerHTML = "<span style='color:#8a8a95;'>[SYSTEM]</span> " + text;
    // добавляем в тот же logEl, что используется везде
    const logEl = document.getElementById("log");
    if (!logEl) return;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;

    // короткий тихий писк системы
    try { sysBeep(); } catch (e) {}
  }

  // ------ ЗВУК: короткий «тик» системы ------
  let AC = null;
  function sysBeep() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const c = AC;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.1);
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

  // ------ ЗАМЕНА ПЛЕЙСХОЛДЕРОВ ------
  function fillPlaceholders(text) {
    const subject = (typeof getSubjectId === "function")
      ? getSubjectId()
      : (localStorage.getItem("subject_id") || "SUBJECT_????-????");
    return text.replace(/\{SUBJECT\}/g, subject);
  }

  // ------ СЛУЧАЙНОЕ СООБЩЕНИЕ ------
  function randomSystemMessage() {
    const raw = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return fillPlaceholders(raw);
  }

  // ------ СПЛАНИРОВАННОЕ ПОЯВЛЕНИЕ ------
  // В первый раз — через 30 секунд после загрузки.
  // Потом — случайно каждые 90–180 секунд.
  function scheduleNext(delay) {
    setTimeout(() => {
      // не мешаем, если игрок сейчас что-то делает (не критично, но вежливо)
      sysPrint(randomSystemMessage(), "system");

      // иногда (30%) — ещё одно сообщение через 3-6 сек
      if (Math.random() < 0.3) {
        setTimeout(() => {
          sysPrint(randomSystemMessage(), "system");
        }, 3000 + Math.random() * 3000);
      }

      // следующее — через случайный интервал
      scheduleNext(90000 + Math.random() * 90000);
    }, delay);
  }

  // запускаем только после того, как пользователь «разбудил» аудио
  function start() {
    scheduleNext(30000); // первое сообщение через 30 сек
  }

  // ждём первого клика (для AudioContext)
  let started = false;
  document.addEventListener("click", function onFirstClick() {
    if (started) return;
    started = true;
    document.removeEventListener("click", onFirstClick);
    start();
  });

  // На случай, если пользователь уже кликал до загрузки скрипта
  if (document.readyState === "complete") {
    // всё равно ждём клик — так тише и вежливее
  }

  // ------ РЕАКЦИЯ НА БЕЗДЕЙСТВИЕ ------
  // Если игрок не жмёт клавиш/не двигает мышь 90 секунд — посылаем сигнал.
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
        sysPrint("why did you stop?", "whisper");
      }, 500);
    }
  }, 5000);

  // ------ ДИАЛОГ НА СПЕЦИАЛЬНЫЕ КОМАНДЫ ------
  // Ловим ввод игрока после того, как handleCmd уже обработал команду.
  // Но у нас нет прямого доступа к вводу — поэтому просто слушаем Enter.
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
    // считываем ДО того, как handleCmd очистит поле — 
    // поэтому ставим свой обработчик микротаском позже
    setTimeout(() => {
      // input уже очищен, читать поздно. Перехватываем раньше — см. ниже.
    }, 0);
  }, true); // capture = true — срабатываем ПЕРЕД основным обработчиком

  // Более надёжный способ: переопределяем обработчик ввода
  // (работает, потому что мы подключаемся в capture-фазе)
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

      // Выводим не сразу, а через 600-900 мс после обычного "unknown command"
      setTimeout(() => {
        sysPrint(filled, "whisper");
      }, 700 + Math.random() * 400);
    }
  }, true);

  // экспорт для отладки
  window._sysPrint = sysPrint;
  window._sysPrintRandom = () => sysPrint(randomSystemMessage(), "system");
})();
