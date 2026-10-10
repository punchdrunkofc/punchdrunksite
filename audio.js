"use strict";

// ---------- AUDIO CONTEXT + ANALYSER ----------
let AC = null;
let ANALYSER = null;

function ctx() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    ANALYSER = AC.createAnalyser();
    ANALYSER.fftSize = 256;
    ANALYSER.smoothingTimeConstant = 0.75;
    ANALYSER.connect(AC.destination);
    window.analyserNode = ANALYSER;
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}

// Все генераторы подключаются сюда — вместо прямого destination
function dest() {
  ctx();
  return ANALYSER;
}

const rnd    = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick   = arr    => arr[Math.floor(Math.random() * arr.length)];
const chance = p      => Math.random() < p;

function env(g, t0, a, d, peak) {
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function noiseBuffer(dur) {
  const c = ctx();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

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

// ---------- KICK ----------
function makeKick() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.9;
  out.connect(dest());

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

// ---------- SNARE ----------
function makeSnare() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(dest());

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

// ---------- BASS ----------
function makeBass() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(dest());

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

// ---------- SIREN ----------
function makeSiren() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.7;
  out.connect(dest());

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

// ---------- BREAKBEAT ----------
function makeBreakbeat() {
  const c = ctx();
  const t0 = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.85;
  out.connect(dest());

  const bpm = rndInt(170, 210);
  const step = 60 / bpm / 4;
  const len  = rndInt(8, 16);

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

// ---------- GLITCH ----------
function makeGlitch() {
  const c = ctx();
  const t0 = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.75;
  out.connect(dest());

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

// ---------- ACID ----------
function makeAcid() {
  const c = ctx();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.75;
  out.connect(dest());

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

// ---------- TOTAL ----------
function makeTotal() {
  const dur = Math.max(
    makeKick(),
    makeSnare(),
    makeBreakbeat(),
    makeGlitch(),
    makeAcid()
  );
  setTimeout(() => { try { makeSiren(); } catch (e) {} }, 150);
  setTimeout(() => { try { makeBass();  } catch (e) {} }, 400);
  return dur + 1.2;
}

// END OF FILE — audio.js
