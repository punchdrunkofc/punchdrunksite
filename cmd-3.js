function revealSector(idx) {
  const s = SECTORS[idx];
  resultBox.classList.add("active");
  resultTxt.textContent = s.label;
  resultSub.textContent = '"' + s.sub + '"';

  try { s.gen(); } catch (e) { console.warn(e); }

  triggerGlitch(600);
  log("&gt; SPIN #" + (spins + 1) + " &rarr; " + s.label +
      " :: \"" + s.sub + "\"", "system");

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
    const flash = document.getElementById("gold-flash");
    if (flash) {
      flash.classList.remove("active");
      void flash.offsetWidth;
      flash.classList.add("active");
    }
    resultBox.classList.add("jackpot");

    let jp = parseInt(localStorage.getItem("jackpots") || "0", 10) + 1;
    localStorage.setItem("jackpots", jp);

    setTimeout(() => {
      log("&#9733; &#9733; &#9733;  G O L D   J A C K P O T  &#9733; &#9733; &#9733;", "ok");
      log("TOTAL sector hit. You have reached the core.", "whisper");
      log("JACKPOTS: " + jp, "system");
    }, 700);

    try { playJackpotFanfare(); } catch (e) {}
  } else {
    resultBox.classList.remove("jackpot");
  }
}
window.revealSector = revealSector;
