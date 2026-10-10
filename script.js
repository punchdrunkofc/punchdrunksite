/* ==================================================================
   WHEEL_0x07 — TRUE RANDOM DIGITAL HARDCORE ENGINE v2
   Every spin -> a brand-new track. Every kick/snare/hat/acid
   has its own randomization, playbackRate, distortion, and dropouts.
   ================================================================== */

"use strict";

let AC = null;
function ctx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  return AC;
}

// ---------- RANDOM HELPERS ----------
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

// ---------- NOISE BUFFER ----------
function noiseBuffer(dur) {
  const c = ctx();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ---------- WAVESHAPER CURVES ----------
function curveHard(k) {
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
  }
  return c;
}
function curveFold(k) {
  // wave folding — more extreme, "broken" texture
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x = (i * 2) / n - 1;
    x *= k;
    x = Math.sin(x * Math.PI);
    c[i] = x;
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

// ---------- SIDECHAIN PUMP ----------
// Route: master -> compressor (sidechained by a "ghost" kick pattern)
function makePumpBus(sidechainSource) {
  const c = ctx();
  const bus = c.createGain();
  bus.gain.value = 1;

  // fake "ducking" by scheduling gain dips on kicks
  return {
    input: bus,
    triggerDuck(t, amount = 0.6, dur = 0.15) {
      const g = bus.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(1, t);
      g.linearRampToValueAtTime(1 - amount, t + 0.005);
      g.linearRampToValueAtTime(1, t + dur);
    }
  };
}

// ---------- INSTRUMENTS (each hit fully randomized) ----------

function kick(t, dest, opts) {
  const c = ctx();
  const o = opts || {};
  const startF = o.startF || rnd(120, 260);
  const endF   = o.endF   || rnd(28, 60);
  const dur    = o.dur    || rnd(0.12, 0.4);
  const drive  = o.drive  || rnd(20, 120);

  // randomly choose saturation type
  const curve = chance(0.5) ? curveHard(drive) : curveFold(drive);

  const osc = c.createOscillator();
  osc.type = pick(["sine", "triangle"]);
  osc.frequency.setValueAtTime(startF, t);
  osc.frequency.exponentialRampToValueAtTime(endF, t + dur);

  // slight pitch drop jitter — every kick has a random contour
  if (chance(0.5)) {
    osc.frequency.setValueAtTime(startF * rnd(0.8, 1.2), t + dur * 0.3);
  }

  const ws = shaper(curve);
  const g  = c.createGain();
  env(g, t, 0.002, dur, 1.0);

  osc.connect(ws).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);

  // click transient (sometimes)
  if (chance(0.8)) {
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(0.015);
    n.playbackRate.value = rnd(0.8, 2.0);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = rnd(1200, 5000);
    const ng = c.createGain();
    env(ng, t, 0.0005, rnd(0.005, 0.015), 0.25);
    n.connect(hp).connect(ng).connect(dest);
    n.start(t);
    n.stop(t + 0.02);
  }
}

function snare(t, dest, opts) {
  const c = ctx();
  const o = opts || {};
  const dur   = o.dur   || rnd(0.08, 0.28);
  const drive = o.drive || rnd(10, 70);
  const curve = chance(0.5) ? curveHard(drive) : curveCrush(rndInt(3, 6));

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur + 0.1);
  n.playbackRate.value = rnd(0.7, 1.8);  // ← каждый снейр звучит по-другому
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = rnd(700, 3000);

  const ws = shaper(curve);
  const g = c.createGain();
  env(g, t, 0.001, dur, 0.55);

  n.connect(hp).connect(ws).connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.1);

  // tonal body — sometimes absent
  if (chance(0.7)) {
    const osc = c.createOscillator();
    osc.type = pick(["triangle", "sine"]);
    const f0 = rnd(150, 320);
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f0 * rnd(0.4, 0.7), t + dur * 0.8);
    const og = c.createGain();
    env(og, t, 0.001, dur * 0.7, rnd(0.2, 0.45));
    osc.connect(og).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

function hat(t, dest, opts) {
  const c = ctx();
  const o = opts || {};
  const open = o.open || false;
  const dur = open ? rnd(0.08, 0.3) : rnd(0.015, 0.06);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur + 0.05);
  n.playbackRate.value = rnd(0.5, 2.0);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = open ? rnd(3000, 7000) : rnd(5000, 10000);

  // occasional bitcrush on hats
  const chain = n.connect(hp);
  let last = hp;
  if (chance(0.3)) {
    const bc = shaper(curveCrush(rndInt(4, 7)));
    last.connect(bc);
    last = bc;
  }
  const g = c.createGain();
  env(g, t, 0.001, dur, rnd(0.06, 0.18));
  last.connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.05);
}

function acid(t, dest, freq, opts) {
  const c = ctx();
  const o = opts || {};
  const dur = o.dur || rnd(0.08, 0.35);
  const Q   = o.Q   || rnd(4, 28);

  const cA = o.cutA || rnd(80, 400);
  const cB = o.cutB || rnd(1200, 5500);
  const cC = o.cutC || rnd(200, 900);  // иногда возвращается

  const osc = c.createOscillator();
  osc.type = chance(0.85) ? "sawtooth" : "square";
  osc.frequency.setValueAtTime(freq, t);
  // микро-питч-дрейф
  osc.detune.value = rnd(-20, 20);

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = Q;
  lp.frequency.setValueAtTime(cA, t);
  lp.frequency.exponentialRampToValueAtTime(cB, t + dur * 0.4);
  lp.frequency.exponentialRampToValueAtTime(cC, t + dur * 0.9);

  const ws = shaper(chance(0.5) ? curveHard(40) : curveFold(15));
  const g = c.createGain();
  env(g, t, 0.005, dur, rnd(0.25, 0.45));

  osc.connect(lp).connect(ws).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function glitch(t, dest) {
  const c = ctx();
  const bursts = rndInt(2, 8);
  for (let i = 0; i < bursts; i++) {
    const tt = t + i * rnd(0.005, 0.04);
    const osc = c.createOscillator();
    osc.type = pick(["square", "sawtooth", "triangle"]);
    osc.frequency.value = rnd(80, 7000);

    const ws = shaper(chance(0.5) ? curveCrush(rndInt(2, 5)) : curveFold(rnd(5, 25)));
    const g = c.createGain();
    env(g, tt, 0.0005, rnd(0.004, 0.03), rnd(0.08, 0.2));

    osc.connect(ws).connect(g).connect(dest);
    osc.start(tt);
    osc.stop(tt + 0.06);
  }
}

function siren(t, dest) {
  const c = ctx();
  const dur = rnd(0.3, 1.4);
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const f1 = rnd(200, 700);
  const f2 = rnd(900, 2200);
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.linearRampToValueAtTime(f2, t + dur * 0.5);
  osc.frequency.linearRampToValueAtTime(f1, t + dur);

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = rnd(3, 12);
  bp.frequency.value = rnd(500, 1500);

  const ws = shaper(curveHard(rnd(10, 40)));
  const g = c.createGain();
  env(g, t, 0.02, dur, rnd(0.12, 0.25));

  osc.connect(bp).connect(ws).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function chop(t, dest) {
  const c = ctx();
  const dur = rnd(0.03, 0.2);
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur);
  n.playbackRate.value = rnd(0.4, 2.5);

  const bp = c.createBiquadFilter();
  bp.type = pick(["bandpass", "highpass", "lowpass"]);
  bp.frequency.value = rnd(200, 5000);
  bp.Q.value = rnd(2, 15);

  const ws = shaper(chance(0.6) ? curveCrush(rndInt(3, 7)) : curveHard(rnd(20, 60)));
  const g = c.createGain();
  env(g, t, 0.001, dur, rnd(0.2, 0.5));

  n.connect(bp).connect(ws).connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.03);
}

// ---------- TRACK GENERATOR ----------
function generateTrack(bias) {
  bias = bias || {};

  // Three styles of digital hardcore
  const STYLE = bias.style || pick(["techno", "breakcore", "industrial"]);

  let bpm, bars;
  if (STYLE === "techno")      { bpm = rndInt(150, 175); bars = rndInt(1, 2); }
  if (STYLE === "breakcore")   { bpm = rndInt(180, 220); bars = rndInt(1, 2); }
  if (STYLE === "industrial")  { bpm = rndInt(140, 165); bars = rndInt(2, 3); }

  const spb  = 60 / bpm;
  const step = spb / 4;
  const steps = bars * 16;

  // Track-wide "playback rate" affects everything downstream a bit
  const globalRate = rnd(0.9, 1.1);

  // Root note (acid bass)
  const root = pick([41.20, 43.65, 49.00, 55.00, 61.74, 32.70]);

  // Patterns
  const kick16  = bias.kick16  || patternKick(STYLE);
  const snare16 = bias.snare16 || patternSnare(STYLE);
  const hat16   = patternHat(STYLE);
  const open16  = patternOpenHat(STYLE);
  const chop16  = patternChop(STYLE);

  // Dropouts — some steps are skipped entirely for "broken" feel
  const dropout = [];
  for (let i = 0; i < 16; i++) if (chance(STYLE === "breakcore" ? 0.12 : 0.05)) dropout.push(i);

  // Acid notes
  const acid16 = [];
  for (let i = 0; i < 16; i++) {
    acid16.push(chance(STYLE === "industrial" ? 0.3 : 0.5)
      ? pick([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4])
      : 0);
  }

  // Glitch positions
  const glitch16 = [];
  for (let i = 0; i < 16; i++) if (chance(STYLE === "breakcore" ? 0.15 : 0.07)) glitch16.push(i);

  // Stutter — repeat a step 2-4 times
  const stutterAt = chance(0.5) ? rndInt(0, 15) : -1;
  const stutterCount = rndInt(2, 4);

  // Siren
  const sirenAt = chance(0.4) ? rndInt(0, steps - 1) : -1;

  return {
    style: STYLE, bpm, spb, step, bars, steps, root, globalRate,
    kick16, snare16, hat16, open16, chop16, acid16, glitch16, dropout,
    stutterAt, stutterCount, sirenAt,
    masterGain: rnd(0.35, 0.55),
    swing: rnd(-0.02, 0.02)
  };
}

// --- pattern generators per style ---

function patternKick(style) {
  const p = new Array(16).fill(0);
  if (style === "techno") {
    [0, 4, 8, 12].forEach(i => p[i] = 1);
    if (chance(0.5)) p[rndInt(0, 15)] = 1;
  } else if (style === "breakcore") {
    [0, 2, 5, 7, 10, 12, 15].forEach(i => { if (chance(0.8)) p[i] = 1; });
  } else {
    [0, 6, 8, 14].forEach(i => p[i] = 1);
    if (chance(0.7)) p[rndInt(0, 15)] = 1;
  }
  return p;
}

function patternSnare(style) {
  const p = new Array(16).fill(0);
  if (style === "techno") { p[4] = 1; p[12] = 1; }
  if (style === "breakcore") { [2, 6, 9, 13].forEach(i => p[i] = 1); }
  if (style === "industrial") { p[8] = 1; }
  for (let i = 0; i < 16; i++) if (chance(style === "breakcore" ? 0.2 : 0.1)) p[i] = 1;
  return p;
}

function patternHat(style) {
  const p = new Array(16).fill(0);
  const dens = style === "breakcore" ? 0.85 : style === "techno" ? 0.7 : 0.5;
  for (let i = 0; i < 16; i++) if (chance(dens)) p[i] = 1;
  return p;
}

function patternOpenHat(style) {
  const p = new Array(16).fill(0);
  const dens = style === "breakcore" ? 0.2 : 0.1;
  for (let i = 0; i < 16; i++) if (chance(dens)) p[i] = 1;
  return p;
}

function patternChop(style) {
  const p = new Array(16).fill(0);
  const dens = style === "breakcore" ? 0.3 : 0.15;
  for (let i = 0; i < 16; i++) if (chance(dens)) p[i] = 1;
  return p;
}

// ---------- PLAY A TRACK ----------
function playTrack(track) {
  const c = ctx();
  const master = c.createGain();
  master.gain.value = track.masterGain;

  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  master.connect(limiter).connect(c.destination);

  const t0 = c.currentTime + 0.05;

  for (let s = 0; s < track.steps; s++) {
    const i = s % 16;
    const swing = (s % 2 === 1) ? track.swing : 0;
    const t = t0 + s * track.step + swing;

    if (track.dropout.includes(i)) continue;

    // Stutter: repeat the current step several times quickly
    if (s === track.stutterAt) {
      for (let k = 0; k < track.stutterCount; k++) {
        const tt = t + k * track.step * 0.5;
        kick(tt, master, {});
        if (chance(0.6)) snare(tt, master, {});
      }
      continue;
    }

    if (track.kick16[i])  kick(t, master, {});
    if (track.snare16[i]) snare(t, master, {});
    if (track.hat16[i])   hat(t, master, { open: false });
    if (track.open16[i])  hat(t, master, { open: true });
    if (track.chop16[i])  chop(t, master);

    const av = track.acid16[i];
    if (av > 0) acid(t, master, track.root * av, {});

    if (track.glitch16.includes(i)) glitch(t, master);
    if (s === track.sirenAt) siren(t, master);
  }

  // final downbeat
  const endT = t0 + track.steps * track.step;
  kick(endT, master, { drive: 100, dur: 0.4 });
  if (chance(0.7)) glitch(endT, master);
}

// ---------- UI TICK ----------
function playTick() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.value = rnd(800, 2400);
  env(g, t, 0.001, 0.02, 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

// ---------- WHEEL ----------
const SECTORS = [
  { label: "KICK",      sub: "your heart is a 909",              style: "techno" },
  { label: "SNARE",     sub: "the noise remembers you",          style: "techno" },
  { label: "BASS",      sub: "low frequencies = low truths",     style: "industrial" },
  { label: "SIREN",     sub: "they are coming",                  style: "industrial" },
  { label: "BREAKBEAT", sub: "faster. faster. faster.",          style: "breakcore" },
  { label: "GLITCH",    sub: "the signal breaks",                style: "breakcore" },
  { label: "ACID",      sub: "the 303 never lies",               style: "techno" },
  { label: "TOTAL",     sub: "DIGITAL HARDCORE // ANNIHILATION", style: null }
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

let rotation = 0, spinning = false, spins = 0;

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

// ---------- UI ----------
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

function revealSector(idx) {
  const s = SECTORS[idx];

  // build a fresh track — style biasing if sector declares one
  const track = generateTrack({ style: s.style });

  resultBox.classList.add("active");
  resultTxt.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  playTrack(track);

  triggerGlitch(600);
  log(
    "&gt; SPIN #" + (spins + 1) + " &rarr; " + s.label +
    " &middot; STYLE=" + track.style +
    " &middot; BPM=" + track.bpm +
    " &middot; BARS=" + track.bars,
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

// ---------- COMMANDS ----------
const cmds = {
  help: () => {
    log("available commands:", "system");
    log("&nbsp;&nbsp;help &mdash; this list");
    log("&nbsp;&nbsp;spin &mdash; new random track");
    log("&nbsp;&nbsp;madness &mdash; 3 tracks in a row");
    log("&nbsp;&nbsp;whoami &mdash; who you are");
    log("&nbsp;&nbsp;clear &mdash; clear log");
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ""; },
  whoami: () => {
    log("you are " + getSubjectId() + ".", "system");
    log("but that is not your real name, is it?", "whisper");
  },
  madness: () => {
    log("generating 3 tracks...", "system");
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const t = generateTrack({});
        playTrack(t);
        log("  track#" + (i + 1) +
            " :: STYLE=" + t.style +
            " BPM=" + t.bpm + " BARS=" + t.bars, "dim");
      }, i * 2000);
    }
    triggerGlitch(2500);
  }
};

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log("&gt; " + raw, "user");
  if (cmds[c]) { cmds[c](); return; }

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

// ---------- AMBIENT ----------
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

// ---------- ID + CLOCK ----------
function getSubjectId() {
  let id = localStorage.getItem("subject_id");
  if (!id) {
    const hex = () => Math.floor(Math.random() * 0xFFFF)
