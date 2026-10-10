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
