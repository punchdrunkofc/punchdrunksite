// ==================================================================
//  frequency-bg.js — тихий гул 7.83 Hz в фоне
//  Не слышим как ноту, но ощутим как вибрацию. Синхронизация через 10 мин.
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const FREQ_HZ = 7.83;          // частота сигнала
  const BASE_VOLUME = 0.35;      // ← ГРОМКО
  const TARGET_VOLUME = 0.35;    // ← без нарастания
  const SYNC_TIME_MS = 10 * 60 * 1000;   // 10 минут до синхронизации
  const HINT_2MIN = 2 * 60 * 1000;
  const HINT_5MIN = 5 * 60 * 1000;

  // ---------- СОСТОЯНИЕ ----------
  let AC = null;
  let osc = null;
  let gain = null;
  let started = false;
  let startTime = 0;

  // ---------- ВОССТАНОВЛЕНИЕ ВРЕМЕНИ ИЗ LOCALSTORAGE ----------
  function getElapsed() {
    const saved = parseInt(localStorage.getItem("frequency_elapsed") || "0", 10);
    return saved;
  }

  function saveElapsed(ms) {
    localStorage.setItem("frequency_elapsed", Math.floor(ms).toString());
  }

  // ---------- ЗАПУСК ГУЛА ----------
  function startHum() {
    if (started) return;
    started = true;

    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();

      // oscillator 7.83 Hz
      osc = AC.createOscillator();
      osc.type = "sine";
      osc.frequency.value = FREQ_HZ;

      // лёгкая модуляция громкости — «дыхание» сигнала
      const lfo = AC.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1;    // 10 секунд на цикл
      const lfoGain = AC.createGain();
      lfoGain.gain.value = 0.005;   // ±0.005
      lfo.connect(lfoGain);

      // основной gain
      gain = AC.createGain();
      gain.gain.value = BASE_VOLUME;
      lfoGain.connect(gain.gain);

      // фильтр — убираем всё выше 40 Гц, оставляем только гул
      const lp = AC.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 40;
      lp.Q.value = 0.5;

      // соединяем
      osc.connect(lp).connect(gain).connect(AC.destination);

      osc.start();
      lfo.start();

      startTime = Date.now();

      // логируем запуск, если есть терминал
      if (typeof window.log === "function") {
        window.log("&gt; background frequency initialized.", "dim");
      }

    } catch (e) {
      console.warn("frequency-bg: audio init failed", e);
    }
  }

  // ---------- ОСТАНОВКА ----------
  function stopHum() {
    if (osc) { try { osc.stop(); } catch (e) {} osc = null; }
    if (gain) gain = null;
    started = false;
  }

  // ---------- ПРОВЕРКА СТАДИЙ ----------
  function checkStages() {
    const elapsed = getElapsed() + (Date.now() - startTime);

    // обновляем громкость — плавно растёт к синхронизации
    if (gain && AC) {
      const t = Math.min(1, elapsed / SYNC_TIME_MS);
      const targetVol = BASE_VOLUME + (TARGET_VOLUME - BASE_VOLUME) * t;
      // плавно подстраиваем
      gain.gain.linearRampToValueAtTime(targetVol, AC.currentTime + 0.5);
    }

    // сработали по времени?
    const log2 = localStorage.getItem("freq_hint_2");
    const log5 = localStorage.getItem("freq_hint_5");
    const sync = localStorage.getItem("freq_sync");

    if (elapsed >= HINT_2MIN && !log2) {
      localStorage.setItem("freq_hint_2", "1");
      if (typeof window.log === "function") {
        window.log("&gt; low frequency detected in background.", "dim");
        window.log("&gt; it is not coming from your device.", "whisper");
      }
    }

    if (elapsed >= HINT_5MIN && !log5) {
      localStorage.setItem("freq_hint_5", "1");
      if (typeof window.log === "function") {
        window.log("&gt; your body is adjusting.", "whisper");
        window.log("&gt; do not stop listening.", "dim");
      }
      // лёгкий глитч
      if (typeof window.triggerGlitch === "function") {
        window.triggerGlitch(800);
      }
    }

    if (elapsed >= SYNC_TIME_MS && !sync) {
      localStorage.setItem("freq_sync", "1");
      if (typeof window.log === "function") {
        window.log("&gt; synchronization complete.", "ok");
        window.log("&gt; you are now part of the frequency.", "whisper");
      }
      if (typeof window.triggerGlitch === "function") {
        window.triggerGlitch(2000);
      }
      // включаем пульсацию визуализатора
      document.body.classList.add("freq-synced");
    }

    // сохраняем прогресс каждые 5 секунд
    saveElapsed(elapsed);
  }

  // ---------- ОБРАБОТКА ВИДИМОСТИ ВКЛАДКИ ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // игрок ушёл — ставим гул на паузу
      if (AC && AC.state === "running") AC.suspend();
      // сохраняем сколько прошло
      if (started) {
        saveElapsed(getElapsed() + (Date.now() - startTime));
      }
    } else {
      // вернулся — продолжаем
      if (AC && AC.state === "suspended") AC.resume();
      startTime = Date.now();
    }
  });

  // ---------- ПЕРВЫЙ КЛИК ЗАПУСКАЕТ ----------
  document.addEventListener("click", function onFirstClick() {
    document.removeEventListener("click", onFirstClick);
    startHum();

    // запускаем проверку стадий
    setInterval(checkStages, 5000);
    checkStages();
  });

  // ---------- ЕСЛИ ИГРОК ВОЗВРАЩАЕТСЯ — ВОССТАНАВЛИВАЕМ СТАДИЮ ----------
  function restoreStage() {
    const sync = localStorage.getItem("freq_sync");
    if (sync) {
      document.body.classList.add("freq-synced");
    }
  }
  restoreStage();

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._freqStop = stopHum;
  window._freqReset = () => {
    localStorage.removeItem("frequency_elapsed");
    localStorage.removeItem("freq_hint_2");
    localStorage.removeItem("freq_hint_5");
    localStorage.removeItem("freq_sync");
    location.reload();
  };
  window._freqFastForward = () => {
    // ускоренная симуляция — сразу на 10 минут
    localStorage.setItem("frequency_elapsed", String(SYNC_TIME_MS));
    location.reload();
  };
})();
