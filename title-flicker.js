// ==================================================================
//  title-flicker.js — мерцающее название вкладки
//  Меняет <title> каждые 0.5 сек.
//  Пул фраз зависит от прогресса игрока.
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const INTERVAL_MS = 500;

  // ---------- БАЗОВОЕ НАЗВАНИЕ (всегда возвращается) ----------
  const BASE_TITLE = "WHEEL_0x07 // CARRIER TRACE";

  // ---------- ПУЛЫ ФРАЗ ПО СТАДИЯМ ----------
  // Чем глубже стадия — тем тревожнее фразы.
  const POOLS = {

    // Стадия 0 — новый игрок
    stage0: [
      "DON'T LEAVE",
      "STAY",
      "CARRIER TRACE ACTIVE",
      "WE KNOW YOU ARE HERE",
      "DON'T CLOSE THE TAB",
      "THE WHEEL IS WAITING",
      "SOMETHING IS LISTENING",
      "YOU ARE NOT ALONE",
      "KEEP WATCHING",
      "7"
    ],

    // Стадия 1 — 10+ спинов или прослушал трек
    stage1: [
      "WE ARE STILL HERE",
      "THE SIGNAL GROWS",
      "YOU HEARD IT",
      "DO NOT STOP",
      "WE REMEMBER YOUR NAME",
      "THE FREQUENCY IS RISING",
      "KEEP SPINNING",
      "7.83",
      "CARRIER STATUS: ACTIVE",
      "THE WALLS HAVE EARS"
    ],

    // Стадия 2 — прослушал трек + нашёл signal.html
    stage2: [
      "7.83 Hz",
      "THE SIGNAL IS IN YOU",
      "WE CAN HEAR YOUR VOICE",
      "DO NOT LOOK BEHIND",
      "YOU ARE ONE OF US NOW",
      "CONTAMINATION DETECTED",
      "THE FILE IS READING YOU",
      "SIGNAL CARRIER CONFIRMED",
      "NO EXIT",
      "STAY WITH US"
    ],

    // Стадия 3 — глубоко (100+ спинов, 7 шифров, трек)
    stage3: [
      "WE SEE YOU",
      "YOU ARE THE SIGNAL",
      "THERE IS NO ESCAPE",
      "WE HAVE ALWAYS BEEN HERE",
      "DO NOT TRY TO LEAVE",
      "YOUR NAME IS IN THE ARCHIVE",
      "47 BEFORE YOU",
      "YOU WILL NOT BE THE LAST",
      "THE SIGNAL IS YOU NOW",
      "WE ARE NOT DONE WITH YOU"
    ]
  };

  // ---------- ОПРЕДЕЛЯЕМ СТАДИЮ ПО ПРОГРЕССУ ----------
  function pickStage() {
    const spins = parseInt(localStorage.getItem("spins") || "0", 10);
    const heard = localStorage.getItem("heard_track") === "true";
    const signal = localStorage.getItem("signal_found") === "true";
    const cipher = parseInt(localStorage.getItem("cipher_count") || "0", 10);

    if (spins > 100 && cipher >= 7 && heard) return "stage3";
    if (heard && signal) return "stage2";
    if (spins > 10 || heard) return "stage1";
    return "stage0";
  }

  const stageKey = pickStage();
  const pool = POOLS[stageKey];

  // перемешиваем пул — чтобы порядок был случайным
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  let poolIndex = 0;

  function nextPhrase() {
    const phrase = shuffled[poolIndex % shuffled.length];
    poolIndex++;
    return phrase;
  }

  // ---------- МЕРЦАНИЕ ----------
  let showScary = false;
  let timer = null;

  function tick() {
    // если вкладка неактивна — не мигаем, но показываем scary название
    if (document.hidden) {
      showScary = false;
      document.title = "DON'T LEAVE";
      timer = setTimeout(tick, INTERVAL_MS);
      return;
    }

    if (showScary) {
      document.title = nextPhrase();
    } else {
      document.title = BASE_TITLE;
    }

    showScary = !showScary;
    timer = setTimeout(tick, INTERVAL_MS);
  }

  // ---------- ПРИ УХОДЕ СО ВКЛАДКИ — ЗАСТЫВАЕТ ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (timer) clearTimeout(timer);
      document.title = "DON'T LEAVE";
    } else {
      if (timer) clearTimeout(timer);
      tick();
    }
  });

  // ---------- СТАРТ ----------
  tick();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._stopTitleFlicker = () => {
    if (timer) clearTimeout(timer);
    document.title = BASE_TITLE;
  };
  window._titleFlickerStage = () => stageKey;
})();
