/* ==================================================================
   WHEEL_0x07 — PROCEDURAL DIGITAL HARDCORE ENGINE
   Each spin generates a brand-new track. Nothing repeats.
   Style anchors: distorted kick, broken snare, acid 303, glitch chops,
   fast BPM (150-200), heavy waveshaping, sidechain pumping.
   ================================================================== */

"use strict";

// ------------------------------------------------------------------
// 0. GLOBAL AUDIO CONTEXT
// ------------------------------------------------------------------
let AC = null;

function ctx() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}

// ------------------------------------------------------------------
// 1. MATH / RANDOM HELPERS
// ------------------------------------------------------------------
const rnd     = (a, b) => Math.random() * (b - a) + a;
const rndInt  = (a, b) => Math.floor(rnd(a, b + 1));
const pick    = arr    => arr[Math.floor(Math.random() * arr.length)];
const chance  = p      => Math.random() < p;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ------------------------------------------------------------------
// 2. DSP PRIMITIVES
// ------------------------------------------------------------------

// ADSR-ish envelope on a GainNode
function env(gainNode, t0, attack, decay, peak) {
  const g = gainNode.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

// White noise buffer of given duration
function noiseBuffer(dur) {
  const c = ctx();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Waveshaper curve — the "digital hardcore" distortion
function distortionCurve(amount) {
  const n = 2048;
  const curve = new Float32Array(n);
  const k = amount;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * Math.PI / 180) /
               (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Saturation via waveshaper
function saturator(amount) {
  const ws = ctx().createWaveShaper();
  ws.curve = distortionCurve(amount);
  ws.oversample = "4x";
  return ws;
}

// Bitcrusher (simple, sample-and-hold) — real digital hardcore grit
function bitcrusher(bits, sampleRateDiv) {
  const c = ctx();
  const ws = c.createWaveShaper();
  const n = 2048;
  const curve = new Float32Array(n);
  const step = Math.pow(2, bits);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.round(x * step) / step;
  }
  ws.curve = curve;
  ws._srDiv = sampleRateDiv || 1;
  return ws;
}

// A simple delay/reverb "space" send
function makeSpace() {
  const c = ctx();
  const input = c.createGain();
  const delay = c.createDelay(1.0);
  delay.delayTime.value = rnd(0.08, 0.18);
  const fb = c.createGain();
  fb.gain.value = rnd(0.25, 0.45);
  const wet = c.createGain();
  wet.gain.value = rnd(0.15, 0.3);
  input.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  return { input, wet };
}

// ------------------------------------------------------------------
// 3. INSTRUMENTS
// ------------------------------------------------------------------

// --- KICK: pitched sine + waveshaper + click transient ---
function kick(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const startF = p.startFreq || rnd(160, 240);
  const endF   = p.endFreq   || rnd(30, 55);
  const dur    = p.dur       || rnd(0.18, 0.4);
  const drive  = p.drive     || rnd(30, 90);
  const peak   = p.peak      || 1.0;

  const osc = c.createOscillator();
  osc.type = chance(0.7) ? "sine" : "triangle";
  osc.frequency.setValueAtTime(startF, t);
  osc.frequency.exponentialRampToValueAtTime(endF, t + dur);

  const sat = saturator(drive);
  const g = c.createGain();
  env(g, t, 0.002, dur, peak);

  osc.connect(sat).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);

  // click transient
  if (chance(0.7)) {
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(0.01);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = rnd(1500, 4000);
    const ng = c.createGain();
    env(ng, t, 0.0005, 0.008, 0.25);
    n.connect(hp).connect(ng).connect(dest);
    n.start(t);
    n.stop(t + 0.02);
  }
}

// --- SNARE: noise + tonal body + distortion ---
function snare(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const dur   = p.dur   || rnd(0.12, 0.25);
  const drive = p.drive || rnd(10, 50);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur + 0.05);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = rnd(900, 2200);
  const sat = saturator(drive);
  const g = c.createGain();
  env(g, t, 0.001, dur, 0.5);
  n.connect(hp).connect(sat).connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.08);

  // tonal body
  if (chance(0.85)) {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(rnd(170, 260), t);
    osc.frequency.exponentialRampToValueAtTime(rnd(90, 140), t + dur * 0.8);
    const og = c.createGain();
    env(og, t, 0.001, dur * 0.7, 0.35);
    osc.connect(og).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

// --- HAT: filtered noise, tight ---
function hat(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const open = p.open || false;
  const dur = open ? rnd(0.12, 0.28) : rnd(0.02, 0.06);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur + 0.05);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = open ? rnd(4000, 6500) : rnd(6000, 9000);
  const g = c.createGain();
  env(g, t, 0.001, dur, 0.14);
  n.connect(hp).connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.05);
}

// --- ACID BASS: 303-style saw + resonant LPF sweep + distortion ---
function acid(t, dest, freq, params) {
  const c = ctx();
  const p = params || {};
  const dur   = p.dur   || rnd(0.12, 0.35);
  const Q     = p.Q     || rnd(6, 22);
  const cutA  = p.cutA  || rnd(120, 400);
  const cutB  = p.cutB  || rnd(1500, 5000);
  const drive = p.drive || rnd(20, 60);

  const osc = c.createOscillator();
  osc.type = chance(0.85) ? "sawtooth" : "square";
  osc.frequency.setValueAtTime(freq, t);

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = Q;
  lp.frequency.setValueAtTime(cutA, t);
  lp.frequency.exponentialRampToValueAtTime(cutB, t + dur * 0.5);
  lp.frequency.exponentialRampToValueAtTime(cutA * 1.5, t + dur);

  const sat = saturator(drive);
  const g = c.createGain();
  env(g, t, 0.005, dur, 0.35);

  osc.connect(lp).connect(sat).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// --- GLITCH: random square/triangle bursts, bitcrusher, super short ---
function glitch(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const bursts = p.bursts || rndInt(3, 7);

  for (let i = 0; i < bursts; i++) {
    const tt = t + i * rnd(0.008, 0.03);
    const osc = c.createOscillator();
    osc.type = pick(["square", "sawtooth", "triangle"]);
    osc.frequency.value = rnd(200, 6000);

    const bc = bitcrusher(rndInt(2, 6));
    const g = c.createGain();
    env(g, tt, 0.0005, rnd(0.006, 0.025), 0.15);

    osc.connect(bc).connect(g).connect(dest);
    osc.start(tt);
    osc.stop(tt + 0.05);
  }
}

// --- SIREN: sweeping saw, alarm-like, filtered ---
function siren(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const dur = p.dur || rnd(0.4, 1.2);

  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const f1 = rnd(300, 600);
  const f2 = rnd(1000, 1800);
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.linearRampToValueAtTime(f2, t + dur * 0.5);
  osc.frequency.linearRampToValueAtTime(f1, t + dur);

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = rnd(4, 10);
  bp.frequency.value = rnd(600, 1200);

  const sat = saturator(20);
  const g = c.createGain();
  env(g, t, 0.02, dur, 0.2);

  osc.connect(bp).connect(sat).connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// --- SAMPLE-CHOP: noise burst with heavy filter + bitcrusher + short envelope
//     (имитация "нарезанного" вокального/шумового сэмпла)
function chop(t, dest, params) {
  const c = ctx();
  const p = params || {};
  const dur = p.dur || rnd(0.05, 0.15);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(dur);
  n.playbackRate.value = rnd(0.7, 1.6);

  const bp = c.createBiquadFilter();
  bp.type = pick(["bandpass", "highpass"]);
  bp.frequency.value = rnd(400, 3500);
  bp.Q.value = rnd(3, 12);

  const bc = bitcrusher(rndInt(3, 7));
  const g = c.createGain();
  env(g, t, 0.001, dur, 0.35);

  n.connect(bp).connect(bc).connect(g).connect(dest);
  n.start(t);
  n.stop(t + dur + 0.03);
}

// ------------------------------------------------------------------
// 4. TRACK GENERATOR — build a unique track descriptor
// ------------------------------------------------------------------
function generateTrack(sectorBias) {
  const bias = sectorBias || {};

  const bpm = rndInt(150, 200);
  const spb = 60 / bpm;
  const step = spb / 4;         // 16th note
  const bars = rndInt(1, 2);
  const steps = bars * 16;

  // Root note in a dark, minor-ish register
  const root = pick([41.20, 43.65, 49.00, 55.00, 61.74]);

  // Patterns (16-step length, looped over bars)
  const kick16  = bias.kick16  || randomKickPattern();
  const snare16 = bias.snare16 || randomSnarePattern();
  const hat16   = bias.hat16   || randomHatPattern();
  const open16  = randomOpenHatPattern();
  const chop16  = randomChopPattern();

  // Acid pattern: note lengths relative to root (or 0 = rest)
  const acid16 = [];
  for (let i = 0; i < 16; i++) {
    acid16.push(chance(0.45) ? pick([0.5, 0.75, 1, 1.5, 2, 3]) : 0);
  }

  // Glitch positions
  const glitch16 = [];
  for (let i = 0; i < 16; i++) if (chance(0.08)) glitch16.push(i);

  // Siren trigger — one per track typically
  const sirenAt = chance(0.5) ? rndInt(0, steps - 1) : -1;

  // Style parameters
  return {
    bpm, spb, step, bars, steps, root,
    kick16, snare16, hat16, open16, chop16, acid16, glitch16, sirenAt,
    kickDrive:   rndInt(30, 100),
    snareDrive:  rndInt(15, 60),
    kickDur:     rnd(0.15, 0.35),
    masterGain:  rnd(0.35, 0.5),
    swing:       rnd(-0.015, 0.015),
    spaceAmount: rnd(0.1, 0.35),
  };
}

function randomKickPattern() {
  // 4-on-floor OR broken techno OR half-time
  const style = rndInt(0, 2);
  const p = new Array(16).fill(0);
  if (style === 0) {
    // 4 on the floor
    [0, 4, 8, 12].forEach(i => p[i] = 1);
    if (chance(0.4)) p[rndInt(0, 15)] = 1;
  } else if (style === 1) {
    // broken
    [0, 3, 6, 10, 14].forEach(i => p[i] = 1);
  } else {
    // half-time / industrial
    [0, 8].forEach(i => p[i] = 1);
    if (chance(0.7)) p[rndInt(0, 15)] = 1;
  }
  return p;
}

function randomSnarePattern() {
  const p = new Array(16).fill(0);
  // classic backbeat
  p[4] = 1; p[12] = 1;
  // add ghost hits
  for (let i = 0; i < 16; i++) if (chance(0.15)) p[i] = 1;
  return p;
}

function randomHatPattern() {
  const p = new Array(16).fill(0);
  const density = rnd(0.4, 0.9);
  for (let i = 0; i < 16; i++) if (chance(density)) p[i] = 1;
  return p;
}

function randomOpenHatPattern() {
  const p = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) if (chance(0.12)) p[i] = 1;
  return p;
}

function randomChopPattern() {
  const p = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) if (chance(0.18)) p[i] = 1;
  return p;
}

// ------------------------------------------------------------------
// 5. PLAY A GENERATED TRACK
// ------------------------------------------------------------------
function playTrack(track) {
  const c = ctx();
  const master = c.createGain();
  master.gain.value = track.masterGain;

  // Limiter to avoid clipping
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  master.connect(limiter).connect(c.destination);

  // Space send
  const space = makeSpace();
  const spaceSend = c.createGain();
  spaceSend.gain.value = track.spaceAmount;
  master.connect(spaceSend).connect(space.input);
  space.wet.connect(c.destination);

  const t0 = c.currentTime + 0.05;

  for (let s = 0; s < track.steps; s++) {
    const idx16 = s % 16;
    const swing = (s % 2 === 1) ? track.swing : 0;
    const t = t0 + s * track.step + swing;

    // Kick
    if (track.kick16[idx16]) {
      kick(t, master, {
        drive: track.kickDrive,
        dur:   track.kickDur
      });
    }

    // Snare
    if (track.snare16[idx16]) {
      snare(t, master, { drive: track.snareDrive });
    }

    // Hat
    if (track.hat16[idx16]) hat(t, master, { open: false });
    if (track.open16[idx16]) hat(t, master, { open: true });

    // Chop (sample-like bursts)
    if (track.chop16[idx16]) chop(t, master, {});

    // Acid
    const av = track.acid16[idx16];
    if (av > 0) {
      const freq = track.root * av;
      acid(t, master, freq, {});
    }

    // Glitch
    if (track.glitch16.includes(idx16)) glitch(t, master, {});

    // Siren (rare, dramatic)
    if (s === track.sirenAt) siren(t, master, {});
  }

  // Final downbeat
  const endT = t0 + track.steps * track.step;
  kick(endT, master, { drive: track.kickDrive + 20, dur: track.kickDur * 1.3 });
  if (chance(0.6)) glitch(endT + 0.01, master, {});

  return endT - c.currentTime;
}

// ------------------------------------------------------------------
// 6. SHORT UI TICK (for spin animation)
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 7. WHEEL SETUP
// ------------------------------------------------------------------
const SECTORS = [
  { label: "KICK",      sub: "your heart is a 909" },
  { label: "SNARE",     sub: "the noise remembers you" },
  { label: "BASS",      sub: "low frequencies = low truths" },
  { label: "SIREN",     sub: "they are coming" },
  { label: "BREAKBEAT", sub: "faster. faster. faster." },
  { label: "GLITCH",    sub: "the signal breaks" },
  { label: "ACID",      sub: "the 303 never lies" },
  { label: "TOTAL",     sub: "DIGITAL HARDCORE // ANNIHILATION" }
];

const COLORS = [
  "#0d0d0d", "#1a0008", "#0d0d0d", "#1a0008",
  "#0d0d0d", "#1a0008", "#0d0d0d", "#2a0010"
];

// Per-sector generator bias. Every bias still goes through the random
// generator, so the track stays unique — the bias just nudges the flavor.
const SECTOR_BIAS = {
  KICK:      { kickBoost: true },
  SNARE:     { snareBoost: true },
  BASS:      { bassBoost: true },
  SIREN:     { sirenBoost: true },
  BREAKBEAT: { fastBpm: true },
  GLITCH:    { glitchBoost: true },
  ACID:      { acidBoost: true },
  TOTAL:     { totalBoost: true }
};

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

  // outer ring
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

  // inner hub
  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, 70, 0, Math.PI * 2);
  ctxC.strokeStyle = "#ff0033";
  ctxC.lineWidth = 2;
  ctxC.stroke();
  ctxC.fillStyle = "#050505";
  ctxC.fill();
}
drawWheel();

// ------------------------------------------------------------------
// 8. UI HOOKS
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 9. SPIN LOGIC
// ------------------------------------------------------------------
function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;

  try { ctx(); } catch (e) { console.warn("audio init failed", e); }

  const idx = Math.floor(Math.random() * N);
  const sectorCenter = idx * ANGLE + ANGLE / 2;
  const target =
    -Math.PI / 2 - sectorCenter +
    Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
  const jitter = (Math.random() - 0.5) * (ANGLE * 0.6);
  rotation = target + jitter;

  canvas.style.transform = "rotate(" + rotation + "rad)";

  const spinDuration = 4500;

  // ticks during spin — nothing else plays yet
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

// ------------------------------------------------------------------
// 10. REVEAL + GENERATE + PLAY
// ------------------------------------------------------------------
function revealSector(idx) {
  const s = SECTORS[idx];

  // BUILD A BRAND NEW TRACK
  const track = generateTrack(SECTOR_BIAS[s.label] || {});

  // Nudge track based on sector, but keep everything random
  const bias = SECTOR_BIAS[s.label] || {};
  if (bias.fastBpm)    track.bpm  = clamp(track.bpm + 20, 140, 220);
  if (bias.glitchBoost) {
    for (let i = 0; i < 16; i++) if (chance(0.2)) track.glitch16.push(i);
  }
  if (bias.acidBoost) {
    for (let i = 0; i < 16; i++) if (chance(0.25)) track.acid16[i] = pick([0.5, 1, 1.5, 2]);
  }

  // Update UI
  resultBox.classList.add("active");
  resultTxt.textContent = s.label;
  resultSub.textContent = "\"" + s.sub + "\"";

  // Play
  playTrack(track);

  // Atmosphere
  triggerGlitch(600);
  log(
    "&gt; SPIN #" + (spins + 1) + " &rarr; " + s.label +
    " &middot; BPM=" + track.bpm +
    " &middot; BARS=" + track.bars +
    " &middot; DRIVE=" + track.kickDrive,
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

  if (s.label === "TOTAL") {
    setTimeout(() => {
      triggerGlitch(2500);
      log("* DIGITAL HARDCORE OVERLOAD *", "err");
      log("you have reached the bottom. there is only sound down here.", "whisper");
      localStorage.setItem("overload", "true");
    }, 600);
  }
}

// ------------------------------------------------------------------
// 11. TERMINAL COMMANDS
// ------------------------------------------------------------------
const cmds = {
  help: () => {
    log("available commands:", "system");
    log("&nbsp;&nbsp;help &mdash; this list");
    log("&nbsp;&nbsp;spin &mdash; generate a new digital hardcore track");
    log("&nbsp;&nbsp;madness &mdash; generate 3 tracks back-to-back");
    log("&nbsp;&nbsp;whoami &mdash; who you are");
    log("&nbsp;&nbsp;clear &mdash; clear the log");
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
        log("  track#" + (i + 1) + " :: BPM=" + t.bpm + " BARS=" + t.bars, "dim");
      }, i * 1800);
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

  log("unknown command: " + raw + " (try \"help\")", "err");
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

// ------------------------------------------------------------------
// 12. AMBIENT
// ------------------------------------------------------------------
setInterval(() => {
  if (Math.random() < 0.12) triggerGlitch(150);
}, 5000);

setInterval(() => {
  if (Math.random() < 0.08) {
    const w = [
      "you are being watched",
      "spin again",
      "they hear you",
      "not random",
      "do not stop"
    ];
    log(w[Math.floor(Math.random() * w.length)], "whisper");
  }
}, 15000);

// ------------------------------------------------------------------
// 13. VISITOR ID + CLOCK
// ------------------------------------------------------------------
function getSubjectId() {
  let id = localStorage.getItem("subject_id");
  if (!id) {
    const hex = () =>
      Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0").toUpperCase();
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
