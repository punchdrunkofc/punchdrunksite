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

    if (SECTORS[i].label === "TOTAL") {
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

    ctxC.strokeStyle = SECTORS[i].label === "TOTAL" ? "#ffcc33" : "#2a0008";
    ctxC.lineWidth   = SECTORS[i].label === "TOTAL" ? 2 : 1;
    ctxC.stroke();

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
      ctxC.fillStyle = "#ff0033";
      ctxC.shadowColor = "#ff0033";
      ctxC.shadowBlur = 8;
      ctxC.font = "bold 18px 'Courier New', monospace";
    }
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
