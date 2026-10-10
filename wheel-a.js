"use strict";

const SECTORS = [
  { label: "KICK",      sub: "your heart is a 909",              gen: makeKick },
  { label: "SNARE",     sub: "the noise remembers you",          gen: makeSnare },
  { label: "BASS",      sub: "low frequencies = low truths",     gen: makeBass },
  { label: "SIREN",     sub: "they are coming",                  gen: makeSiren },
  { label: "BREAKBEAT", sub: "faster. faster. faster.",          gen: makeBreakbeat },
  { label: "GLITCH",    sub: "the signal breaks",                gen: makeGlitch },
  { label: "ACID",      sub: "the 303 never lies",               gen: makeAcid },
  { label: "TOTAL",     sub: "DIGITAL HARDCORE // ANNIHILATION", gen: makeTotal }
];

const COLORS = [
  "#0a0a0f", "#14081f", "#0a0a0f", "#14081f",
  "#0a0a0f", "#14081f", "#0a0a0f", "#4a3500"
];

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
