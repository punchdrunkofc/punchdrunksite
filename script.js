// ================================================================
//  WHEEL_0x07 — DIGITAL HARDCORE ARG
// ================================================================

let AC = null;
function ctx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

function env(node, t0, attack, decay, peak = 1) {
  const g = node.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function noiseBuffer(dur = 0.5) {
  const c = ctx();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function makeDistortion(amount) {
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function playKick(dur = 0.35) {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const dist = c.createWaveShaper();
  dist.curve = makeDistortion(30);
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + dur);
  osc.type = 'sine';
  env(gain, t, 0.002, dur, 1.0);
  osc.connect(dist).connect(gain).connect(c.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function playSnare() {
  const c = ctx(), t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(0.25);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
  const g = c.createGain();
  env(g, t, 0.001, 0.18, 0.6);
  n.connect(hp).connect(g).connect(c.destination);
  n.start(t); n.stop(t + 0.3);
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, t);
  const g2 = c.createGain();
  env(g2, t, 0.001, 0.12, 0.4);
  osc.connect(g2).connect(c.destination);
  osc.start(t); osc.stop(t + 0.15);
}

function playBass() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const dist = c.createWaveShaper(); dist.curve = makeDistortion(80);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(55, t);
  env(g, t, 0.005, 0.4, 0.35);
  osc.connect(dist).connect(lp).connect(g).connect(c.destination);
  osc.start(t); osc.stop(t + 0.5);
}

function playSiren() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.linearRampToValueAtTime(1400, t + 0.5);
  osc.frequency.linearRampToValueAtTime(400, t + 1.0);
  env(g, t, 0.05, 1.0, 0.18);
  osc.connect(g).connect(c.destination);
  osc.start(t); osc.stop(t + 1.1);
}

function playBreakbeat() {
  const c = ctx();
  const t0 = c.currentTime;
  for (let i = 0; i < 8; i++) {
    const t = t0 + i * 0.11;
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(0.05);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = c.createGain();
    env(g, t, 0.001, 0.04, 0.15);
    n.connect(hp).connect(g).connect(c.destination);
    n.start(t); n.stop(t + 0.06);
  }
  for (let k = 0; k < 3; k++) {
    setTimeout(() => playKick(0.2), k * 300);
  }
}

function playGlitch() {
  const c = ctx(), t = c.currentTime;
  for (let i = 0; i < 20; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
    osc.frequency.value = 100 + Math.random() * 4000;
    env(g, t + i * 0.02, 0.001, 0.03, 0.12);
    osc.connect(g).connect(c.destination);
    osc.start(t + i * 0.02);
    osc.stop(t + i * 0.02 + 0.05);
  }
}

function playAcid() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 20;
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, t);
  lp.frequency.setValueAtTime(200, t);
  lp.frequency.exponentialRampToValueAtTime(3000, t + 0.4);
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.8);
  env(g, t, 0.01, 0.8, 0.25);
  osc.connect(lp).connect(g).connect(c.destination);
  osc.start(t); osc.stop(t + 0.9);
}

function playTotalMadness() {
  playKick(0.5);
  setTimeout(playSnare, 100);
  setTimeout(playBass, 200);
  setTimeout(playSiren, 300);
  setTimeout(playGlitch, 500);
  setTimeout(playBreakbeat, 700);
  setTimeout(playAcid, 1000);
  setTimeout(playKick, 1200);
  setTimeout(playSnare, 1300);
}

function playTick() {
  const c = ctx(), t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'square';
  osc.frequency.value = 1200 + Math.random() * 800;
  env(g, t, 0.001, 0.02, 0.06);
  osc.connect(g).connect(c.destination);
  osc.start(t); osc.stop(t + 0.03);
}

const SECTORS = [
  { label: 'KICK',      sub: 'your heart is a 909',              play: playKick },
  { label: 'SNARE',     sub: 'the noise remembers you',          play: playSnare },
  { label: 'BASS',      sub: 'low frequencies = low truths',     play: playBass },
  { label: 'SIREN',     sub: 'they are coming',                  play: playSiren },
  { label: 'BREAKBEAT', sub: 'faster. faster. faster.',          play: playBreakbeat },
  { label: 'GLITCH',    sub: 'the signal breaks',                play: playGlitch },
  { label: 'ACID',      sub: 'the 303 never lies',               play: playAcid },
  { label: 'TOTAL',     sub: 'DIGITAL HARDCORE // ANNIHILATION', play: playTotalMadness }
];

const COLORS = [
  '#0d0d0d', '#1a0008', '#0d0d0d', '#1a0008',
  '#0d0d0d', '#1a0008', '#0d0d0d', '#2a0010'
];

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
  resultBox.classList.add('active');
  resultText.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  try { s.play(); } catch (e) { console.warn('sound failed', e); }

  triggerGlitch(600);
  log('&gt; SPIN #' + (spins + 1) + ' &rarr; ' + s.label + ' :: "' + s.sub + '"', 'system');

  spins++;
  counterEl.textContent = 'SPINS: ' + spins;
  localStorage.setItem('spins', spins);

  if (spins === 3) setTimeout(() => log('...do you hear it yet?', 'whisper'), 800);
  if (spins === 7) setTimeout(() => log('seven. you are the seventh.', 'whisper'), 800);
  if (spins === 13) setTimeout(() => { triggerGlitch(1500); log('THE WHEEL KNOWS YOUR NAME.', 'err'); }, 800);

  if (s.label === 'TOTAL') {
    setTimeout(() => {
      triggerGlitch(2500);
      log('* DIGITAL HARDCORE OVERLOAD *', 'err');
      log('you have reached the bottom. there is only sound down here.', 'whisper');
      localStorage.setItem('overload', 'true');
    }, 600);
  }
}

const cmds = {
  help: () => {
    log('available commands:', 'system');
    log('&nbsp;&nbsp;help &mdash; this list');
    log('&nbsp;&nbsp;spin &mdash; spin the wheel');
    log('&nbsp;&nbsp;play [kick|snare|bass|siren|breakbeat|glitch|acid|total]');
    log('&nbsp;&nbsp;whoami &mdash; who you are');
    log('&nbsp;&nbsp;clear &mdash; clear log');
    log('&nbsp;&nbsp;madness &mdash; if you are ready');
  },
  spin: () => spin(),
  clear: () => { logEl.innerHTML = ''; },
  whoami: () => {
    log('you are ' + getSubjectId() + '.', 'system');
    log('but that is not your real name, is it?', 'whisper');
  },
  madness: () => {
    log('...', 'system');
    setTimeout(() => { playTotalMadness(); triggerGlitch(2500); log('DIGITAL HARDCORE.', 'err'); }, 400);
  }
};

function handleCmd(raw) {
  const c = raw.trim().toLowerCase();
  if (!c) return;
  log('&gt; ' + raw, 'user');

  if (cmds[c]) { cmds[c](); return; }

  if (c.startsWith('play ')) {
    const name = c.slice(5).trim().toUpperCase();
    const s = SECTORS.find(x => x.label === name);
    if (s) { s.play(); log('playing: ' + s.label, 'ok'); }
    else log('unknown sound: ' + name, 'err');
    return;
  }

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

setInterval(() => {
  if (Math.random() < 0.12) triggerGlitch(150);
}, 5000);

setInterval(() => {
  if (Math.random() < 0.08) {
    const w = ['you are being watched', 'spin again', 'they hear you', 'not random', 'do not stop'];
    log(w[Math.floor(Math.random() * w.length)], 'whisper');
  }
}, 15000);

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
