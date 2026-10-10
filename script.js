// ================================================================
//  WHEEL_0x07 — PROCEDURAL DIGITAL HARDCORE ENGINE
//  Каждый спин генерирует НОВЫЙ трек. Ничего не повторяется.
// ================================================================

let AC = null;
function ctx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

// ---------- УТИЛИТЫ ----------
function rnd(min, max) { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p) { return Math.random() < p; }

function env(node, t0, attack, decay, peak = 1) {
  const g = node.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function noiseBuffer(dur = 0.5) {
  const c = ctx();
  const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function makeDistortion(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ---------- ГЕНЕРАТОР ТРЕКА ----------
// Возвращает объект трека со всеми параметрами — он уникален при каждом вызове.
function generateTrack() {
  const bpm = rndInt(140, 220);
  const spb = 60 / bpm;            // секунд на удар
  const step = spb / 4;            // 16-я нота
  const bars = rndInt(1, 2);       // длина в тактах
  const steps = bars * 16;         // всего 16-х шагов

  // Корневая нота (acid бас) — одна из трёх "злых" тональностей
  const root = pick([41.2, 55.0, 61.7, 73.4]); // E1, A1, B1, D2

  // Битовая маска кика — либо прямой четырёхбитный, либо ломаный
  const kickPattern = chance(0.5)
    ? [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]                 // четыре на пол
    : [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,1];                // сбитый

  const snarePattern = chance(0.5)
    ? [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]
    : [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0];

  const hatPattern = [];
  for (let i = 0; i < 16; i++) hatPattern.push(chance(0.65) ? 1 : 0);

  // ACID бас — паттерн из 16 шагов со случайными нотами
  const acidPattern = [];
  for (let i = 0; i < steps; i++) {
    const v = chance(0.45) ? rnd(0.5, 2.5) : 0;
    acidPattern.push(v);
  }

  // Глитч-вставки: случайные позиции, где будет "рвать" звук
  const glitchSteps = [];
  for (let i = 0; i < steps; i++) if (chance(0.06)) glitchSteps.push(i);

  return {
    bpm, spb, step, bars, steps,
    root,
    kickPattern, snarePattern, hatPattern,
    acidPattern, glitchSteps,
    kickDist: rndInt(20, 90),
    snareDist: rndInt(10, 60),
    acidQ: rnd(8, 25),
    acidCutoffStart: rnd(150, 400),
    acidCutoffPeak: rnd(1500, 4000),
    acidRes: rnd(2, 8),
    hatDecay: rnd(0.02, 0.06),
    masterGain: rnd(0.35, 0.5),
    tempoSwing: rnd(-0.02, 0.02) // лёгкий "пьяный" сдвиг
  };
}

// ---------- ИНСТРУМЕНТЫ (по одному удару) ----------

function scheduleKick(t, track, gainNode) {
  const c = ctx();
  const osc = c.createOscillator();
  const dist = c.createWaveShaper();
  dist.curve = makeDistortion(track.kickDist);
  const g = c.createGain();
  osc.type = pick(['sine', 'triangle']);
  osc.frequency.setValueAtTime(rnd(150, 220), t);
  osc.frequency.exponentialRampToValueAtTime(rnd(35, 55), t + rnd(0.15, 0.3));
  env(g, t, 0.002, rnd(0.15, 0.35), 1.0);
  osc.connect(dist).connect(g).connect(gainNode);
  osc.start(t); osc.stop(t + 0.5);
}

function scheduleSnare(t, track, gainNode) {
  const c = ctx();
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(0.2);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rnd(800, 2000);
  const dist = c.createWaveShaper(); dist.curve = makeDistortion(track.snareDist);
  const g = c.createGain();
  env(g, t, 0.001, rnd(0.08, 0.2), 0.5);
  n.connect(hp).connect(dist).connect(g).connect(gainNode);
  n.start(t); n.stop(t + 0.3);

  if (chance(0.5)) {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(rnd(180, 260), t);
    const g2 = c.createGain();
    env(g2, t, 0.001, 0.1, 0.3);
    osc.connect(g2).connect(gainNode);
    osc.start(t); osc.stop(t + 0.12);
  }
}

function scheduleHat(t, track, gainNode) {
  const c = ctx();
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(track.hatDecay + 0.02);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rnd(5000, 8000);
  const g = c.createGain();
  env(g, t, 0.001, track.hatDecay, 0.12);
  n.connect(hp).connect(g).connect(gainNode);
  n.start(t); n.stop(t + track.hatDecay + 0.03);
}

function scheduleAcid(t, freq, track, gainNode) {
  const c = ctx();
  const osc = c.createOscillator();
  const dist = c.createWaveShaper(); dist.curve = makeDistortion(40);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = track.acidQ;
  lp.frequency.setValueAtTime(track.acidCutoffStart, t);
  lp.frequency.exponentialRampToValueAtTime(track.acidCutoffPeak, t + 0.2);
  lp.frequency.exponentialRampToValueAtTime(track.acidCutoffStart, t + 0.5);
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  env(g, t, 0.005, 0.25, 0.3);
  osc.connect(dist).connect(lp).connect(g).connect(gainNode);
  osc.start(t); osc.stop(t + 0.4);
}

function scheduleGlitch(t, track, gainNode) {
  const c = ctx();
  const bursts = rndInt(3, 8);
  for (let i = 0; i < bursts; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = pick(['square', 'sawtooth', 'triangle']);
    osc.frequency.value = rnd(200, 6000);
    const tt = t + i * rnd(0.01, 0.04);
    env(g, tt, 0.0005, rnd(0.01, 0.03), 0.15);
    osc.connect(g).connect(gainNode);
    osc.start(tt); osc.stop(tt + 0.05);
  }
}

// ---------- ПЛЕЕР ТРЕКА ----------

function playTrack(track) {
  const c = ctx();
  const master = c.createGain();
  master.gain.value = track.masterGain;
  master.connect(c.destination);

  const t0 = c.currentTime + 0.05;

  for (let s = 0; s < track.steps; s++) {
    const swing = (s % 2 === 1) ? track.tempoSwing : 0;
    const t = t0 + s * track.step + swing;

    // Kick
    if (track.kickPattern[s % 16]) {
      scheduleKick(t, track, master);
    }
    // Snare
    if (track.snarePattern[s % 16]) {
      scheduleSnare(t, track, master);
    }
    // Hat
    if (track.hatPattern[s % 16]) {
      scheduleHat(t, track, master);
    }
    // Acid
    const acidVal = track.acidPattern[s];
    if (acidVal > 0) {
      const freq = track.root * acidVal * (chance(0.2) ? 2 : 1);
      scheduleAcid(t, freq, track, master);
    }
    // Glitch
    if (track.glitchSteps.includes(s)) {
      scheduleGlitch(t, track, master);
    }
  }

  // Общий "финальный удар" в конце
  const endT = t0 + track.steps * track.step;
  scheduleKick(endT, track, master);
  if (chance(0.5)) scheduleGlitch(endT, track, master);

  return endT - c.currentTime;
}

// ---------- СЕКТОРЫ (стиль-варианты) ----------
// Каждый сектор задаёт "предпочтения" для генератора, но трек всё равно
// создаётся процедурно и уникален каждый раз.
const SECTORS = [
  { label: 'KICK',      sub: 'your heart is a 909' },
  { label: 'SNARE',     sub: 'the noise remembers you' },
  { label: 'BASS',      sub: 'low frequencies = low truths' },
  { label: 'SIREN',     sub: 'they are coming' },
  { label: 'BREAKBEAT', sub: 'faster. faster. faster.' },
  { label: 'GLITCH',    sub: 'the signal breaks' },
  { label: 'ACID',      sub: 'the 303 never lies' },
  { label: 'TOTAL',     sub: 'DIGITAL HARDCORE // ANNIHILATION' }
];

const COLORS = [
  '#0d0d0d', '#1a0008', '#0d0d0d', '#1a0008',
  '#0d0d0d', '#1a0008', '#0d0d0d', '#2a0010'
];

// ---------- WHEEL ----------
const canvas = document.getElementById('wheel');
const ctxC = canvas.getContext('2d');
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
  ctxC.strokeStyle = '#ff0033';
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
    ctxC.strokeStyle = '#2a0008';
    ctxC.lineWidth = 1;
    ctxC.stroke();

    ctxC.save();
    ctxC.translate(CENTER, CENTER);
    ctxC.rotate(start + ANGLE / 2);
    ctxC.textAlign = 'right';
    ctxC.fillStyle = '#ff0033';
    ctxC.font = 'bold 18px "Courier New", monospace';
    ctxC.shadowColor = '#ff0033';
    ctxC.shadowBlur = 8;
    ctxC.fillText(SECTORS[i].label, RADIUS - 20, 6);
    ctxC.restore();
  }

  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, 70, 0, Math.PI * 2);
  ctxC.strokeStyle = '#ff0033';
  ctxC.lineWidth = 2;
  ctxC.stroke();
  ctxC.fillStyle = '#050505';
  ctxC.fill();
}
drawWheel();

// ---------- UI ----------
const spinBtn = document.getElementById('spin-btn');
const resultBox = document.getElementById('result');
const resultText = document.getElementById('result-text');
const resultSub = document.getElementById('result-sub');
const logEl = document.getElementById('log');
const counterEl = document.getElementById('counter');

function triggerGlitch(ms = 500) {
  const o = document.getElementById('glitch-overlay');
  o.classList.add('active');
  setTimeout(() => o.classList.remove('active'), ms);
}

function log(html, cls = '') {
  const p = document.createElement('p');
  p.className = 'line ' + cls;
  p.innerHTML = html;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

spinBtn.addEventListener('click', spin);

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;

  try { ctx(); } catch (e) { console.warn('audio init failed', e); }

  const idx = Math.floor(Math.random() * N);
  const sectorCenter = idx * ANGLE + ANGLE / 2;
  const target = -Math.PI / 2 - sectorCenter + Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
  const jitter = (Math.random() - 0.5) * (ANGLE * 0.6);
  rotation = target + jitter;

  canvas.style.transform = 'rotate(' + rotation + 'rad)';

  const spinDuration = 4500;

  // Тики во время вращения (сами по себе тоже процедурные — частота случайна)
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

// Тик — лёгкий сухой щелчок, тоже слегка рандомный
function playTick() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'square';
  osc.frequency.value = rnd(900, 2200);
  env(g, t, 0.001, 0.02, 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(t); osc.stop(t + 0.03);
}

// ---------- КУДА ИДЁТ РЕЗУЛЬТАТ ----------
function revealSector(idx) {
  const s = SECTORS[idx];

  // ГЛАВНОЕ: генерируем НОВЫЙ трек прямо сейчас
  const track = generateTrack();

  resultBox.classList.add('active');
  resultText.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  const dur = playTrack(track);

  triggerGlitch(600);
  log(
    '&gt; SPIN #' + (spins + 1) + ' &rarr; ' + s.label +
    ' &middot; BPM=' + track.bpm +
    ' &middot; BARS=' + track.bars +
    ' &middot; DIST=' + track.kickDist +
    ' &middot; Q=' + track.acidQ.toFixed(1),
    'system'
  );

  spins++;
  counterEl.textContent = 'SPINS: ' + spins;
  localStorage.setItem('spins', spins);

  if (spins === 3) setTimeout(() => log('...do you hear it yet?', 'whisper'), 800);
  if (spins === 7) setTimeout(() => log('seven. you are the seventh.', 'whisper'), 800);
  if (spins === 13) setTimeout(() => {
    triggerGlitch(1500);
    log('THE WHEEL KNOWS YOUR NAME.', 'err');
  }, 800);

  if (s.label === 'TOTAL') {
    setTimeout(() => {
      triggerGlitch(2500);
      log('* DIGITAL HARDCORE OVERLOAD *', 'err');
      log('you have reached the bottom. there is only sound down here.', 'whisper');
      localStorage.setItem('overload', 'true');
    }, 600);
  }
}

// ---------- КОМАНДЫ ----------
const cmds = {
  help: () => {
    log('available commands:', 'system');
    log('&nbsp;&nbsp;help &mdash; this list');
    log('&nbsp;&nbsp;spin &mdash; spin the wheel (new track each time)');
    log('&nbsp;&nbsp;madness &mdash; generate 3 tracks at once');
    log('&nbsp;&nbsp;whoami &mdash; who you are');
    log('&nbsp;&nbsp;clear &mdash; clear log');
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ''; },
  whoami: () => {
    log('you are ' + getSubjectId() + '.', 'system');
    log('but that is not your real name, is it?', 'whisper');
  },
  madness: () => {
    log('generating 3 tracks...', 'system');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const t = generateTrack();
        playTrack(t);
        log('  track#' + (i + 1) + ' :: BPM=' + t.bpm + ' BARS=' + t.bars, 'dim');
      }, i * 1500);
    }
    triggerGlitch(2500);
  }
};

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log('&gt; ' + raw, 'user');
  if (cmds[c]) { cmds[c](); return; }

  if (c === '7') {
    log('...', 'dim');
    log('you found the seventh node.', '');
    log('the wheel was never the game.', 'whisper');
    triggerGlitch(1500);
    return;
  }

  log('unknown command: ' + raw + ' (try "help")', 'err');
}

document.getElementById('cmd').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const v = e.target.value;
    e.target.value = '';
    handleCmd(v);
  }
});
document.body.addEventListener('click', () => {
  document.getElementById('cmd').focus();
}, { passive: true });

// ---------- АТМОСФЕРА ----------
setInterval(() => {
  if (Math.random() < 0.12) triggerGlitch(150);
}, 5000);

setInterval(() => {
  if (Math.random() < 0.08) {
    const w = ['you are being watched', 'spin again', 'they hear you', 'not random', 'do not stop'];
    log(w[Math.floor(Math.random() * w.length)], 'whisper');
  }
}, 15000);

// ---------- ID & CLOCK ----------
function getSubjectId() {
  let id = localStorage.getItem('subject_id');
  if (!id) {
    const hex = () => Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
    id = 'SUBJECT_' + hex() + '-' + hex();
    localStorage.setItem('subject_id', id);
  }
  return id;
}
document.getElementById('visitor-id').textContent = getSubjectId();

spins = parseInt(localStorage.getItem('spins') || '0');
counterEl.textContent = 'SPINS: ' + spins;

setInterval(() => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}, 1000);

// END OF FILE
