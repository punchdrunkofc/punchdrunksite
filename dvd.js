// ==================================================================
//  dvd.js — bouncing logo screensaver
// ==================================================================

(function () {
  "use strict";

  const logo = document.getElementById("dvd-logo");
  if (!logo) return;

  // ---------- ПОЗИЦИЯ И СКОРОСТЬ ----------
  let x = 40;
  let y = 40;
  let vx = 2.0;
  let vy = 1.8;

  // ---------- ЦВЕТА ПРИ ОТСКОКЕ ----------
  const COLORS = [
    "hue-rotate(270deg) saturate(2)",    // фиолетовый
    "hue-rotate(180deg) saturate(2.5)",  // синий
    "hue-rotate(300deg) saturate(2.5)",  // пурпурный
    "hue-rotate(120deg) saturate(2)",    // зелёный
    "hue-rotate(0deg) saturate(3)",      // красный
    "hue-rotate(60deg) saturate(2.5)",   // золотой
    "hue-rotate(230deg) saturate(2.5)"   // индиго
  ];
  let colorIdx = 0;

  function nextColor() {
    colorIdx = (colorIdx + 1) % COLORS.length;
    logo.style.filter = "invert(1) " + COLORS[colorIdx] +
                        " drop-shadow(0 0 14px rgba(160, 32, 240, 0.7))";
  }

  // ---------- РАЗМЕРЫ ----------
  function bounds() {
    const rect = logo.getBoundingClientRect();
    return {
      lw: rect.width || 140,
      lh: rect.height || 140,
      ww: window.innerWidth,
      wh: window.innerHeight
    };
  }

  // ---------- РАНДОМИЗАЦИЯ СКОРОСТИ КАЖДЫЕ 7 СЕКУНД ----------
  setInterval(() => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.6 + Math.random() * 1.0;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    if (Math.abs(vx) < 0.7) vx = vx >= 0 ? 0.7 : -0.7;
    if (Math.abs(vy) < 0.7) vy = vy >= 0 ? 0.7 : -0.7;
  }, 7000);

  // ---------- АНИМАЦИЯ ----------
  function tick() {
    const b = bounds();

    x += vx;
    y += vy;

    let bounced = false;

    // горизонталь
    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx);
      bounced = true;
    } else if (x + b.lw >= b.ww) {
      x = b.ww - b.lw;
      vx = -Math.abs(vx);
      bounced = true;
    }

    // вертикаль
    if (y <= 0) {
      y = 0;
      vy = Math.abs(vy);
      bounced = true;
    } else if (y + b.lh >= b.wh) {
      y = b.wh - b.lh;
      vy = -Math.abs(vy);
      bounced = true;
    }

    // отрисовка
    if (bounced) {
      nextColor();

      // короткий наклон — как будто ударился
      const tilt = (Math.random() * 16 - 8);
      logo.style.transform = "translate(" + x + "px," + y + "px) rotate(" + tilt + "deg)";
      setTimeout(() => {
        logo.style.transform = "translate(" + x + "px," + y + "px) rotate(0deg)";
      }, 100);

      // короткий звук удара
      try { bounceSound(); } catch (e) {}
    } else {
      logo.style.transform = "translate(" + x + "px," + y + "px)";
    }

    requestAnimationFrame(tick);
  }

  // ---------- ЗВУК ПРИ ОТСКОКЕ ----------
  let AC = null;
  function bounceSound() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const c = AC;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // ---------- РЕСАЙЗ ОКНА ----------
  window.addEventListener("resize", () => {
    const b = bounds();
    if (x + b.lw > b.ww) x = b.ww - b.lw;
    if (y + b.lh > b.wh) y = b.wh - b.lh;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
  });

  // ---------- СТАРТ ----------
  tick();
})();
