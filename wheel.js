"use strict";

const SECTORS = [
  { label: "KICK",      sub: "your heart is a 909",              gen: makeKick },
  { label: "SNARE",     sub: "the noise remembers you",          gen: makeSnare },
  { label: "BASS",      sub: "low frequencies = low truths",     gen: makeBass },
  { label: "SIREN",     sub: "they are coming",                  gen: makeSiren },
  { label: "BREAKBEAT", sub: "faster. faster. faster.",          gen: makeBreakbeat },
  { label: "GLITCH",    sub: "the signal breaks",                gen: makeGlitch },
  { label: "ACID",      sub: "the 303 never lies",               gen: makeAcid },
  { label: "TOTAL",     sub: "DIGITAL HARDCORE // ANNIHILATION", gen: makeTotal }
];

const COLORS = [
  "#0d0d0d", "#1a0008", "#0d0d0d", "#1a0008",
  "#0d0d0d", "#1a0008", "#0d0d0d", "#2a0010"
];

const canvas = document.getElementById("wheel");
const ctxC = canvas.getContext("2d");
const SIZE = canvas.width;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;
const N = SECTORS.length;
const ANGLE = (Math.PI * 2) / N;

let rotation = 0;
let spinning = false;
let spins = 0;

function drawWheel() {
  ctxC.clearRect(0, 0, SIZE, SIZE);
  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, RADIUS + 5, 0, Math.PI * 2);
  ctxC.strokeStyle = "#ff0033";
  ctxC.lineWidth = 2;
  ctxC.stroke();

  for (let i = 0; i < N; i++) {
    const start = i * ANGLE + rotation;
    const end = start + ANGLE;
    ctxC.beginPath();
    ctxC.moveTo(CENTER, CENTER);
    ctxC.arc(CENTER, CENTER, RADIUS, start, end);
    ctxC.closePath();
    ctxC.fillStyle = COLORS[i % COLORS.length];
    ctxC.fill();
    ctxC.strokeStyle = "#2a0008";
    ctxC.lineWidth = 1;
    ctxC.stroke();

    ctxC.save();
    ctxC.translate(CENTER, CENTER);
    ctxC.rotate(start + ANGLE / 2);
    ctxC.textAlign = "right";
    ctxC.fillStyle = "#ff0033";
    ctxC.font = "bold 18px 'Courier New', monospace";
    ctxC.shadowColor = "#ff0033";
    ctxC.shadowBlur = 8;
    ctxC.fillText(SECTORS[i].label, RADIUS - 20, 6);
    ctxC.restore();
  }

  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, 70, 0, Math.PI * 2);
  ctxC.strokeStyle = "#ff0033";
  ctxC.lineWidth = 2;
  ctxC.stroke();
  ctxC.fillStyle = "#050505";
  ctxC.fill();
}
drawWheel();

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

spinBtn.addEventListener("click", spin);

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  try { ctx(); } catch (e) {}

  const idx = Math.floor(Math.random() * N);
  const sectorCenter = idx * ANGLE + ANGLE / 2;
  const target = -Math.PI / 2 - sectorCenter +
                 Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
  const jitter = (Math.random() - 0.5) * (ANGLE * 0.6);
  rotation = target + jitter;
  canvas.style.transform = "rotate(" + rotation + "rad)";

  const spinDuration = 4500;
  let lastTick = 0;
  const tickInterval = setInterval(() => {
    const now = Date.now();
    if (now - lastTick > 70 + Math.random() * 80) {
      playTick();
      lastTick = now;
    }
  }, 40);

  setTimeout(() => {
    clearInterval(tickInterval);
    revealSector(idx);
    spinning = false;
    spinBtn.disabled = false;
  }, spinDuration + 100);
}

function playTick() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.value = rnd(900, 2200);
  env(g, t, 0.001, 0.02, 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

function revealSector(idx) {
  const s = SECTORS[idx];
  resultBox.classList.add("active");
  resultTxt.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  try { s.gen(); } catch (e) { console.warn(e); }

  triggerGlitch(600);
  log("&gt; SPIN #" + (spins + 1) + " &rarr; " + s.label +
      " :: \"" + s.sub + "\"", "system");

  spins++;
  counterEl.textContent = "SPINS: " + spins;
  localStorage.setItem("spins", spins);

  if (spins === 3) setTimeout(() => log("...do you hear it yet?", "whisper"), 800);
  if (spins === 7) setTimeout(() => log("seven. you are the seventh.", "whisper"), 800);
  if (spins === 13) setTimeout(() => {
    triggerGlitch(1500);
    log("THE WHEEL KNOWS YOUR NAME.", "err");
  }, 800);
}

// END OF FILE — wheel.js
