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

function playJackpotFanfare() {
  const c = ctx();
  const t0 = c.currentTime + 0.05;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    const t = t0 + i * 0.12;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, t);
    const ws = shaper(curveHard(15));
    env(g, t, 0.005, 0.4, 0.35);
    osc.connect(ws).connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
  const tEnd = t0 + notes.length * 0.12;
  [523.25, 659.25, 783.99].forEach(f => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = f;
    const ws = shaper(curveHard(30));
    env(g, tEnd, 0.01, 1.2, 0.25);
    osc.connect(ws).connect(g).connect(c.destination);
    osc.start(tEnd);
    osc.stop(tEnd + 1.4);
  });
}

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
