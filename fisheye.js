// ==================================================================
//  fisheye.js — настоящий fisheye через SVG feDisplacementMap
//  Искажает пиксели нелинейно. Центр выпуклый, края закручиваются.
// ==================================================================

(function () {
  "use strict";

  // ---------- SVG-ФИЛЬТР ----------
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.left = "-9999px";
  svg.innerHTML = `
    <defs>
      <filter id="fisheye-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feImage id="fisheye-map" result="map"
                 preserveAspectRatio="none"/>
        <feDisplacementMap in="SourceGraphic" in2="map"
                           scale="40"
                           xChannelSelector="R"
                           yChannelSelector="G"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);

  // ---------- КАРТА СМЕЩЕНИЙ (gradient map) ----------
  // Создаём canvas с радиальным градиентом — он задаёт вектор искажения
  function createDisplacementMap() {
    const size = 512;
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
        const dx = (x - center) / maxR;
        const dy = (y - center) / maxR;
        const r = Math.sqrt(dx * dx + dy * dy);

        // Ключевая формула fisheye:
        // чем дальше от центра — тем сильнее смещение наружу
        const norm = Math.min(r, 1);
        const distort = Math.pow(norm, 2.2); // <-- степень искажения
        const nx = norm > 0 ? (dx / norm) * distort : 0;
        const ny = norm > 0 ? (dy / norm) * distort : 0;

        // R-канал = X-смещение, G-канал = Y-смещение
        img.data[i]     = Math.round(128 + nx * 127);
        img.data[i + 1] = Math.round(128 + ny * 127);
        img.data[i + 2] = 0;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  }

  // ---------- ПРИМЕНЯЕМ К КОНТЕНТУ ----------
  function applyFisheye() {
    const mapURL = createDisplacementMap();

    // вставляем карту в feImage
    const feImage = document.getElementById("fisheye-map");
    feImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", mapURL);
    feImage.setAttribute("href", mapURL);

    // применяем фильтр ко всем контейнерам сайта
    const targets = [
      ".stage",
      ".hud",
      ".hidden-footer",
      ".channel-btn",
      "#boot-screen",
      "#intro-panel",
      "#mic-bg"
    ];

    targets.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.filter = "url(#fisheye-filter)";
      }
    });
  }

  // ---------- ЖДЁМ ЗАГРУЗКИ DOM ----------
  if (document.readyState === "complete" || document.readyState === "interactive") {
    applyFisheye();
  } else {
    document.addEventListener("DOMContentLoaded", applyFisheye);
  }

  // ---------- ЭКСПОРТ ДЛЯ ОТЛАДКИ ----------
  window._disableFisheye = () => {
    document.querySelectorAll("*").forEach(el => {
      if (el.style.filter && el.style.filter.includes("fisheye-filter")) {
        el.style.filter = "";
      }
    });
  };

  window._setFisheyeIntensity = (n) => {
    const f = document.querySelector("#fisheye-filter feDisplacementMap");
    if (f) f.setAttribute("scale", n);
  };
})();
