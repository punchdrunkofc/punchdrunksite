// ==================================================================
//  fisheye.js — настоящий fisheye через SVG feDisplacementMap
//  Искажает только .stage. HUD, футер и кнопка чата остаются
//  фиксированными и не искажаются.
// ==================================================================

(function () {
  "use strict";

  // ---------- НАСТРОЙКИ ----------
  const CONFIG = {
    size: 1024,             // размер карты смещений (больше = чётче)
    scale: 60,              // сила искажения (20–120)
    exponent: 2.0,          // нелинейность (1.5 = слабо, 3.0 = сильно)
    applyTo: [".stage"]     // к чему применяем фильтр
  };

  // ---------- СОЗДАНИЕ SVG-ФИЛЬТРА ----------
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;left:-9999px;width:0;height:0;";
  svg.innerHTML = `
    <defs>
      <filter id="fisheye-filter"
              x="-20%" y="-20%"
              width="140%" height="140%"
              color-interpolation-filters="sRGB">
        <feImage id="fisheye-map" result="map"
                 preserveAspectRatio="none"/>
        <feDisplacementMap in="SourceGraphic" in2="map"
                           scale="${CONFIG.scale}"
                           xChannelSelector="R"
                           yChannelSelector="G"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);

  // ---------- СОЗДАНИЕ КАРТЫ СМЕЩЕНИЙ ----------
  // Canvas с радиальным градиентом: R-канал = X-смещение,
  // G-канал = Y-смещение, B-канал = 0.
  function createDisplacementMap() {
    const size = CONFIG.size;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);

    const center = size / 2;
    const maxR = center;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // нормализованные координаты относительно центра
        const dx = (x - center) / maxR;
        const dy = (y - center) / maxR;

        const r = Math.sqrt(dx * dx + dy * dy);

        // нелинейное искажение: чем дальше от центра — тем сильнее
        const norm = Math.min(r, 1);
        const distorted = Math.pow(norm, CONFIG.exponent);

        // вектор искажения
        let nx = 0, ny = 0;
        if (norm > 0.0001) {
          nx = (dx / norm) * distorted;
          ny = (dy / norm) * distorted;
        }

        // R = X-смещение, G = Y-смещение (128 = нейтраль)
        img.data[i]     = Math.round(128 + nx * 127);
        img.data[i + 1] = Math.round(128 + ny * 127);
        img.data[i + 2] = 0;
        img.data[i + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  }

  // ---------- ПРИМЕНЕНИЕ ФИЛЬТРА ----------
  function applyFisheye() {
    const mapURL = createDisplacementMap();

    // вставляем карту в feImage
    const feImage = document.getElementById("fisheye-map");
    if (!feImage) return;
    // ставим оба атрибута — для совместимости браузеров
    feImage.setAttribute("href", mapURL);
    feImage.setAttributeNS(
      "http://www.w3.org/1999/xlink", "xlink:href", mapURL
    );

    // применяем фильтр к целевым элементам
    CONFIG.applyTo.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.filter = "url(#fisheye-filter)";
      }
    });
  }

  // ---------- ЗАПУСК ----------
  function start() {
    // на мобильных не применяем — слишком медленно
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

    // применяем через небольшую задержку,
    // чтобы DOM успел отрисоваться
    setTimeout(applyFisheye, 600);
  }

  if (document.readyState === "complete" ||
      document.readyState === "interactive") {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._disableFisheye = () => {
    CONFIG.applyTo.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.filter = "";
    });
  };

  window._setFisheyeIntensity = (n) => {
    const fe = document.querySelector("#fisheye-filter feDisplacementMap");
    if (fe) fe.setAttribute("scale", String(n));
  };

  window._refreshFisheyeMap = () => {
    const mapURL = createDisplacementMap();
    const feImage = document.getElementById("fisheye-map");
    if (!feImage) return;
    feImage.setAttribute("href", mapURL);
    feImage.setAttributeNS(
      "http://www.w3.org/1999/xlink", "xlink:href", mapURL
    );
  };
})();
