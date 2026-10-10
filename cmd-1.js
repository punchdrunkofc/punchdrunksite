"use strict";

const spinBtn   = document.getElementById("spin-btn");
const resultBox = document.getElementById("result");
const resultTxt = document.getElementById("result-text");
const resultSub = document.getElementById("result-sub");
const logEl     = document.getElementById("log");
const counterEl = document.getElementById("counter");

function triggerGlitch(ms) {
  const o = document.getElementById("glitch-overlay");
  if (!o) return;
  o.classList.add("active");
  setTimeout(() => o.classList.remove("active"), ms || 500);
}

function log(html, cls) {
  const p = document.createElement("p");
  p.className = "line " + (cls || "");
  p.innerHTML = html;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ---
window.spinBtn   = spinBtn;
window.resultBox = resultBox;
window.resultTxt = resultTxt;
window.resultSub = resultSub;
window.logEl     = logEl;
window.counterEl = counterEl;
window.triggerGlitch = triggerGlitch;
window.log = log;

spinBtn.addEventListener("click", function () { window.spin(); });
