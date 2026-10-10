function drawWheel() {
  ctxC.clearRect(0, 0, SIZE, SIZE);

  // внешнее кольцо — фиолетовое
  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, RADIUS + 5, 0, Math.PI * 2);
  ctxC.strokeStyle = "#a020f0";
  ctxC.lineWidth = 2;
  ctxC.shadowColor = "#a020f0";
  ctxC.shadowBlur = 12;
  ctxC.stroke();
  ctxC.shadowBlur = 0;

  for (let i = 0; i < N; i++) {
    const start = i * ANGLE + rotation;
    const end = start + ANGLE;
    ctxC.beginPath();
    ctxC.moveTo(CENTER, CENTER);
    ctxC.arc(CENTER, CENTER, RADIUS, start, end);
    ctxC.closePath();

    if (SECTORS[i].label === "TOTAL") {
      // золотой градиент для главного приза
      const grad = ctxC.createRadialGradient(CENTER, CENTER, 40, CENTER, CENTER, RADIUS);
      grad.addColorStop(0.0, "#4a3500");
      grad.addColorStop(0.6, "#8a6a00");
      grad.addColorStop(1.0, "#ffcc33");
      ctxC.fillStyle = grad;
      ctxC.shadowColor = "#ffcc33";
      ctxC.shadowBlur = 25;
    } else {
      ctxC.fillStyle = COLORS[i % COLORS.length];
      ctxC.shadowBlur = 0;
    }
    ctxC.fill();
    ctxC.shadowBlur = 0;

    // обводка сектора — фиолетовая для обычных, золотая для TOTAL
    ctxC.strokeStyle = SECTORS[i].label === "TOTAL" ? "#ffcc33" : "#7b2cbf";
    ctxC.lineWidth   = SECTORS[i].label === "TOTAL" ? 2 : 1;
    ctxC.stroke();

    // текст сектора
    ctxC.save();
    ctxC.translate(CENTER, CENTER);
    ctxC.rotate(start + ANGLE / 2);
    ctxC.textAlign = "right";
    if (SECTORS[i].label === "TOTAL") {
      ctxC.fillStyle = "#ffcc33";
      ctxC.shadowColor = "#ffcc33";
      ctxC.shadowBlur = 14;
      ctxC.font = "bold 20px 'Courier New', monospace";
    } else {
      ctxC.fillStyle = "#a020f0";
      ctxC.shadowColor = "#a020f0";
      ctxC.shadowBlur = 10;
      ctxC.font = "bold 18px 'Courier New', monospace";
    }
    ctxC.fillText(SECTORS[i].label, RADIUS - 20, 6);
    ctxC.restore();
  }

  // внутренний круг (хаб под кнопкой) — фиолетовый
  ctxC.beginPath();
  ctxC.arc(CENTER, CENTER, 70, 0, Math.PI * 2);
  ctxC.strokeStyle = "#a020f0";
  ctxC.lineWidth = 2;
  ctxC.shadowColor = "#a020f0";
  ctxC.shadowBlur = 15;
  ctxC.stroke();
  ctxC.shadowBlur = 0;
  ctxC.fillStyle = "#0a0a0f";
  ctxC.fill();
}
drawWheel();
