// ==================================================================
//  visualizer.js — audio-reactive bars under the wheel
// ==================================================================

(function () {
  "use strict";

  const canvas = document.getElementById("visualizer");
  if (!canvas) return;

  const ctx2d = canvas.getContext("2d");
  const wrap = canvas.parentElement;

  const BARS = 64;
  let hideTimer = null;

  function draw() {
    requestAnimationFrame(draw);

    const analyser = window.analyserNode;
    if (!analyser) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const barW = w / BARS;
    const gap = 2;

    let sum = 0;
    for (let i = 0; i < freqData.length; i++) sum += freqData[i];
    const hasSignal = sum > 0;

    if (hasSignal) {
      wrap.classList.add("active");
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        wrap.classList.remove("active");
      }, 2000);
    }

    for (let i = 0; i < BARS; i++) {
      const t = i / BARS;
      const idx = Math.floor(Math.pow(t, 1.8) * freqData.length);
      const v = freqData[idx] || 0;

      const barH = (v / 255) * h;
      const x = i * barW + gap / 2;
      const y = h - barH;

      const grad = ctx2d.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, "#7b2cbf");
      grad.addColorStop(0.5, "#a020f0");
      grad.addColorStop(1, "#d8a8ff");

      ctx2d.fillStyle = grad;
      ctx2d.fillRect(x, y, barW - gap, barH);
    }

    ctx2d.fillStyle = "rgba(160, 32, 240, 0.3)";
    ctx2d.fillRect(0, h - 1, w, 1);
  }

  draw();
})();
