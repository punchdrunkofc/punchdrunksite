/* ==================================================================
   WHEEL_0x07 — PER-SECTOR DIGITAL HARDCORE SAMPLER
   Each sector plays ONE sound. Every spin generates a NEW variation
   of that sound. No layering — except TOTAL, which is chaos by design.
   ================================================================== */

"use strict";

// ---------- AUDIO CONTEXT ----------
let AC = null;
function ctx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  return AC;
}

// ---------- RANDOM ----------
const rnd    = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick   = arr    => arr[Math.floor(Math.random() * arr.length)];
const chance = p      => Math.random() < p;

// ---------- ENVELOPE ----------
function env(g, t0, a, d, peak) {
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

// ---------- NOISE ----------
function noiseBuffer(dur) {
  const c = ctx();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ---------- SHAPERS ----------
function curveHard(k) {
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
  }
  return c;
}
function curveFold(k) {
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x = ((i * 2) / n - 1) * k;
    c[i] = Math.sin(x * Math.PI);
  }
  return c;
}
function curveCrush(bits) {
  const n = 2048, c = new Float32Array(n);
  const step = Math.pow(2, bits);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = Math.round(x * step) / step;
  }
  return c;
}
function shaper(curve) {
  const ws = ctx().createWaveShaper();
  ws.curve = curve;
  ws.oversample = "4x";
  return ws;
}

// ==================================================================
// 8 SOUND GENERATORS — each returns a short, unique sample
// ==================================================================

// ---------- 1. KICK ----------
function makeKick() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.9;
  out.connect(c.destination);

  const startF = rnd(110, 280);
  const endF   = rnd(28, 55);
  const dur    = rnd(0.18, 0.5);
  const drive  = rnd(30, 130);

  const osc = c.createOscillator();
  osc.type = pick(["sine", "triangle"]);
  osc.frequency.setValueAtTime(startF, t);
  osc.frequency.exponentialRampToValueAtTime(endF, t + dur);

  const ws = shaper(chance(0.5) ? curveHard(drive) : curveFold(drive));
  const g = c.createGain();
  env(g, t, 0.002, dur, 1.0);
  osc.connect(ws).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.1);

  // click transient
  if (chance(0.85)) {
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(0.02);
    n.playbackRate.value = rnd(0.8, 2.5);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = rnd(1000, 5000);
    const ng = c.createGain();
    env(ng, t, 0.0005, rnd(0.005, 0.02), 0.3);
    n.connect(hp).connect(ng).connect(out);
    n.start(t);
    n.stop(t + 0.03);
  }

  return dur + 0.3;
}

// ---------- 2. SNARE ----------
function makeSnare() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(c.destination);

  const dur   = rnd(0.15, 0.4);
  const drive = rnd(15, 80);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur + 0.1);
  n.playbackRate.value = rnd(0.7, 1.9);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = rnd(700, 3000);
  const ws = shaper(chance(0.5) ? curveHard(drive) : curveCrush(rndInt(3, 6)));
  const g = c.createGain();
  env(g, t, 0.001, dur, 0.6);
  n.connect(hp).connect(ws).connect(g).connect(out);
  n.start(t);
  n.stop(t + dur + 0.1);

  // tonal body
  if (chance(0.8)) {
    const osc = c.createOscillator();
    osc.type = pick(["triangle", "sine"]);
    const f0 = rnd(150, 320);
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f0 * rnd(0.4, 0.7), t + dur * 0.8);
    const og = c.createGain();
    env(og, t, 0.001, dur * 0.7, rnd(0.25, 0.5));
    osc.connect(og).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  return dur + 0.3;
}

// ---------- 3. BASS ----------
function makeBass() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(c.destination);

  const root = pick([41.2, 43.65, 49.0, 55.0, 32.7]);
  const mult = pick([1, 1, 1, 1.5, 2, 3]);
  const f    = root * mult;
  const dur  = rnd(0.4, 1.2);

  const osc = c.createOscillator();
  osc.type = pick(["sawtooth", "square"]);
  osc.frequency.setValueAtTime(f, t);
  osc.detune.value = rnd(-15, 15);

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = rnd(6, 24);
  lp.frequency.setValueAtTime(rnd(120, 350), t);
  lp.frequency.exponentialRampToValueAtTime(rnd(1500, 4500), t + dur * 0.4);
  lp.frequency.exponentialRampToValueAtTime(rnd(200, 800), t + dur);

  const ws = shaper(chance(0.5) ? curveHard(rnd(30, 80)) : curveFold(rnd(8, 25)));
  const g = c.createGain();
  env(g, t, 0.008, dur, 0.5);

  osc.connect(lp).connect(ws).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);

  return dur + 0.3;
}

// ---------- 4. SIREN ----------
function makeSiren() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.7;
  out.connect(c.destination);

  const dur = rnd(0.8, 2.2);
  const f1  = rnd(200, 700);
  const f2  = rnd(900, 2400);

  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.linearRampToValueAtTime(f2, t + dur * 0.5);
  osc.frequency.linearRampToValueAtTime(f1, t + dur);

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = rnd(4, 14);
  bp.frequency.value = rnd(600, 1600);

  const ws = shaper(curveHard(rnd(15, 45)));
  const g = c.createGain();
  env(g, t, 0.05, dur, 0.4);

  osc.connect(bp).connect(ws).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.1);

  return dur + 0.3;
}

// ---------- 5. BREAKBEAT (fast loop, but SHORT, standalone) ----------
function makeBreakbeat() {
  const c = ctx();
  const t0 = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(c.destination);

  const bpm = rndInt(170, 210);
  const step = 60 / bpm / 4;
  const len  = rndInt(8, 16);

  // kick pattern
  for (let i = 0; i < len; i++) {
    const t = t0 + i * step;
    if (i % 4 === 0 || chance(0.15)) {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(rnd(140, 220), t);
      osc.frequency.exponentialRampToValueAtTime(rnd(40, 60), t + 0.18);
      const g = c.createGain();
      env(g, t, 0.002, 0.18, 0.9);
      const ws = shaper(curveHard(rnd(20, 60)));
      osc.connect(ws).connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.25);
    }
    if (i % 4 === 2 || chance(0.2)) {
      const n = c.createBufferSource();
      n.buffer = noiseBuffer(0.15);
      n.playbackRate.value = rnd(0.9, 1.6);
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = rnd(900, 2500);
      const g = c.createGain();
      env(g, t, 0.001, 0.12, 0.5);
      n.connect(hp).connect(g).connect(out);
      n.start(t);
      n.stop(t + 0.18);
    }
    if (chance(0.8)) {
      const n = c.createBufferSource();
      n.buffer = noiseBuffer(0.03);
      n.playbackRate.value = rnd(1.2, 2.5);
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = rnd(6000, 10000);
      const g = c.createGain();
      env(g, t, 0.001, 0.02, 0.12);
      n.connect(hp).connect(g).connect(out);
      n.start(t);
      n.stop(t + 0.05);
    }
  }

  return len * step + 0.3;
}

// ---------- 6. GLITCH ----------
function makeGlitch() {
  const c = ctx();
  const t0 = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.75;
  out.connect(c.destination);

  const bursts = rndInt(6, 20);
  const total  = rnd(0.4, 1.4);

  for (let i = 0; i < bursts; i++) {
    const t = t0 + rnd(0, total);
    const osc = c.createOscillator();
    osc.type = pick(["square", "sawtooth", "triangle"]);
    osc.frequency.value = rnd(60, 8000);

    const ws = shaper(chance(0.5)
      ? curveCrush(rndInt(2, 5))
      : curveFold(rnd(5, 30)));
    const g = c.createGain();
    env(g, t, 0.0005, rnd(0.004, 0.05), rnd(0.08, 0.2));

    osc.connect(ws).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // add some chopped noise
  for (let i = 0; i < rndInt(2, 6); i++) {
    const t = t0 + rnd(0, total);
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(rnd(0.02, 0.15));
    n.playbackRate.value = rnd(0.5, 3);
    const bp = c.createBiquadFilter();
    bp.type = pick(["bandpass", "highpass"]);
    bp.frequency.value = rnd(300, 6000);
    bp.Q.value = rnd(4, 15);
    const g = c.createGain();
    env(g, t, 0.001, rnd(0.02, 0.1), 0.25);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.2);
  }

  return total + 0.3;
}

// ---------- 7. ACID ----------
function makeAcid() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.75;
  out.connect(c.destination);

  const dur    = rnd(0.6, 1.8);
  const root   = pick([41.2, 55.0, 61.7, 73.4]);
  const notes  = rndInt(4, 10);
  const step   = dur / notes;

  for (let i = 0; i < notes; i++) {
    const t0 = t + i * step;
    const f  = root * pick([0.5, 0.75, 1, 1.5, 2, 3, 4]);

    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f, t0);

    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = rnd(8, 26);
    lp.frequency.setValueAtTime(rnd(120, 400), t0);
    lp.frequency.exponentialRampToValueAtTime(rnd(1500, 5000), t0 + step * 0.5);
    lp.frequency.exponentialRampToValueAtTime(rnd(200, 900), t0 + step);

    const ws = shaper(chance(0.5) ? curveHard(40) : curveFold(15));
    const g = c.createGain();
    env(g, t0, 0.005, step * 0.9, 0.45);

    osc.connect(lp).connect(ws).connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + step + 0.05);
  }

  return dur + 0.3;
}

// ---------- 8. TOTAL — chaos combo (this one CAN layer, on purpose) ----------
function makeTotal() {
  const c = ctx();
  const out = c.createGain();
  out.gain.value = 0.8;
  out.connect(c.destination);

  // Run several generators in parallel but limited — this is intentional chaos
  const dur = Math.max(
    makeKick(),
    makeSnare(),
    makeBreakbeat(),
    makeGlitch(),
    makeAcid()
  );

  // Add a siren on top for extra chaos
  setTimeout(() => {
    try { makeSiren(); } catch (e) {}
  }, 150);

  // Add a bass hit midway
  setTimeout(() => {
    try { makeBass(); } catch (e) {}
  }, 400);

  return dur + 1.2;
}

// ==================================================================
// SECTORS — each points to one generator function
// ==================================================================
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

// ==================================================================
// WHEEL
// ==================================================================
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

// ==================================================================
// UI
// ==================================================================
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

// ==================================================================
// SPIN
// ==================================================================
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

// tick sound during spin
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

// ==================================================================
// REVEAL — plays ONLY the sector's own sound
// ==================================================================
function revealSector(idx) {
  const s = SECTORS[idx];

  resultBox.classList.add("active");
  resultTxt.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  // Play ONLY this sector's generated sound
  try { s.gen(); } catch (e) { console.warn(e); }

  triggerGlitch(600);
  log(
    "&gt; SPIN #" + (spins + 1) + " &rarr; " + s.label +
    " :: \"" + s.sub + "\"",
    "system"
  );

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

// ==================================================================
// COMMANDS
// ==================================================================
const cmds = {
  help: () => {
    log("available commands:", "system");
    log("&nbsp;&nbsp;help &mdash; this list");
    log("&nbsp;&nbsp;spin &mdash; new random sound");
    log("&nbsp;&nbsp;play [kick|snare|bass|siren|breakbeat|glitch|acid|total]");
    log("&nbsp;&nbsp;whoami &mdash; who you are");
    log("&nbsp;&nbsp;clear &mdash; clear log");
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ""; },
  whoami: () => {
    log("you are " + getSubjectId() + ".", "system");
    log("but that is not your real name, is it?", "whisper");
  }
};

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log("&gt; " + raw, "user");

  if (cmds[c]) { cmds[c](); return; }

  if (c.startsWith("play ")) {
    const name = c.slice(5).trim().toUpperCase();
    const s = SECTORS.find(x => x.label === name);
    if (s) {
      try { s.gen(); } catch (e) {}
      log("playing: " + s.label, "ok");
    } else {
      log("unknown sound: " + name, "err");
    }
    return;
  }

  if (c === "7") {
    log("...", "dim");
    log("you found the seventh node.", "");
    log("the wheel was never the game.", "whisper");
    triggerGlitch(1500);
    return;
  }

  log("unknown command: " + raw + ' (try "help")', "err");
}

document.getElementById("cmd").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const v = e.target.value;
    e.target.value = "";
    handleCmd(v);
  }
});

document.body.addEventListener("click", () => {
  document.getElementById("cmd").focus();
}, { passive: true });

// ==================================================================
// AMBIENT
// ==================================================================
setInterval(() => {
  if (Math.random() < 0.12) triggerGlitch(150);
}, 5000);

setInterval(() => {
  if (Math.random() < 0.08) {
    const w = ["you are being watched", "spin again", "they hear you",
               "not random", "do not stop"];
    log(w[Math.floor(Math.random() * w.length)], "whisper");
  }
}, 15000);

// ==================================================================
// ID + CLOCK
// ==================================================================
function getSubjectId() {
  let id = localStorage.getItem("subject_id");
  if (!id) {
    const hex = () => Math.floor(Math.random() * 0xFFFF)
      .toString(16).padStart(4, "0").toUpperCase();
    id = "SUBJECT_" + hex() + "-" + hex();
    localStorage.setItem("subject_id", id);
  }
  return id;
}
document.getElementById("visitor-id").textContent = getSubjectId();

spins = parseInt(localStorage.getItem("spins") || "0", 10);
counterEl.textContent = "SPINS: " + spins;

setInterval(() => {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  const el = document.getElementById("clock");
  if (el) {
    el.textContent =
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
}, 1000);

// END OF FILE
