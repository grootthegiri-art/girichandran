/* ==========================================================================
   audio.js: all sound (synthesised, no files needed)
   Ambient pads, weather sounds, interaction sounds (SFX), radio static helpers.
   Sound starts after the first tap or key press (browser rule) and can be toggled with the header button.
   sfx(name) plays one effect; tone / pluck / air are the building blocks.
   ========================================================================== */
// ambient sound: off by default, starts only on the button
let ac;

let master;

let on = true;

let audioEl;

let gest = false;

let bus;

let nbuf;

// ambient level multiplier: the radio lowers it (setDuck(0.08)) while music plays, and sets it back to 1 afterwards
let duck = 1;

function setDuck(v) {
  duck = v;
  if (!ac || !master || !gest) {
    return;
  }
  master.gain.setTargetAtTime(on && !audioEl ? duck : 0, ac.currentTime, 0.5);
  if (audioEl) {
    audioEl.volume = 0.5 * duck;
  }
  applyWx();
}

function setupAudio() {
  if (C.audio.src) {
    audioEl = new Audio(C.audio.src);
    audioEl.loop = true;
    audioEl.volume = 0.5;
  }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain();
  master.gain.value = 0;
  mkWeather();
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  master.connect(lp);
  lp.connect(ac.destination);
  mkBus();
  [130.81, 196, 246.94, 329.63].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const l = ac.createOscillator();
    const lg = ac.createGain();
    o.type = i % 2 ? "sine" : "triangle";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 6;
    g.gain.value = 0.05;
    l.frequency.value = 0.05 + i * 0.03;
    lg.gain.value = 0.03;
    l.connect(lg);
    lg.connect(g.gain);
    o.connect(g);
    g.connect(master);
    o.start();
    l.start();
  });
  setInterval(() => {
    if (!on || !gest) {
      return;
    }
    const o = ac.createOscillator();
    const g = ac.createGain();
    const n = ac.currentTime;
    o.frequency.value = [523.25, 659.25, 783.99, 987.77, 880][Math.random() * 5 | 0];
    g.gain.setValueAtTime(0, n);
    g.gain.linearRampToValueAtTime(0.05, n + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 3.5);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(n + 4);
  }, 3200);
}

$("#snd").onclick = e => {
  try {
    on = !on;
    if (audioEl) {
      on ? audioEl.play().catch(() => {
      }) : audioEl.pause();
    }
    ac.resume();
    master.gain.setTargetAtTime(on && !audioEl ? duck : 0, ac.currentTime, 0.6);
    applyWx();
    e.currentTarget.textContent = "Ambient sound: " + (on ? "on" : "off");
    e.currentTarget.setAttribute("aria-pressed", on);
    if (on) {
      gest = true;
      pluck(N.G5, 0.05);
      pluck(N.C6, 0.04, 0.12);
    }
  } catch (err) {
    e.currentTarget.textContent = "Sound unavailable";
  }
};

// weather sounds: rain hiss, wind, night crickets (synthesized, only audible after the sound button is pressed)
let wg = {};

function mkNoise(freq, q, type) {
  const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  s.buffer = b;
  s.loop = true;
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.value = 0;
  s.connect(f);
  f.connect(g);
  g.connect(ac.destination);
  s.start();
  return g;
}

function mkWeather() {
  wg.rain = mkNoise(3200, 0.6, "bandpass");
  wg.wind = mkNoise(400, 0.4, "lowpass");
  wg.rv = mkNoise(900, 0.7, "bandpass");
  const co = ac.createOscillator();
  const mod = ac.createGain();
  const cl = ac.createOscillator();
  const cd = ac.createGain();
  wg.cr = ac.createGain();
  wg.cr.gain.value = 0;
  co.frequency.value = 4300;
  mod.gain.value = 0.5;
  cl.frequency.value = 14;
  cd.gain.value = 0.5;
  cl.connect(cd);
  cd.connect(mod.gain);
  co.connect(mod);
  mod.connect(wg.cr);
  wg.cr.connect(ac.destination);
  co.start();
  cl.start();
}

function applyWx() {
  if (!ac || !wg.rain) {
    return;
  }
  const w = WX[wx];
  const a = on ? duck : 0;
  const n = ac.currentTime;
  wg.rain.gain.setTargetAtTime(w.rain * 0.3 * a, n, 1);
  wg.wind.gain.setTargetAtTime((w.leaf ? 0.07 : w.snow ? 0.05 : 0.015 + w.rain * 0.06) * a, n, 1);
  wg.cr.gain.setTargetAtTime(w.cr * 0.02 * a, n, 1);
  wg.rv.gain.setTargetAtTime((wx === "snow" ? 0 : 0.02) * a, n, 1);
}

try {
  setupAudio();
} catch (e) {
}

// Browsers only allow sound after a real tap, click or key press. Every one of those is tried until the audio engine is running,
// so the ambience starts with the very first interaction (a click, tap, key press or the start of a drag), not later.
const GESTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "touchstart", "touchend", "keydown"];

function startSound() {
  try {
    const go = () => {
      if (ac.state !== "running" || gest) {
        return;
      }
      GESTS.forEach(ev => removeEventListener(ev, startSound, true));
      if (audioEl && on) {
        audioEl.play().catch(() => {
        });
      }
      gest = true;
      master.gain.setTargetAtTime(on && !audioEl ? duck : 0, ac.currentTime, 2);
      applyWx();
    };
    const r = ac.resume();
    if (r && r.then) {
      r.then(go);
    } else {
      go();
    }
  } catch (err) {
  }
}

GESTS.forEach(ev => addEventListener(ev, startSound, true));

startSound();

// ---- interaction sounds: soft kalimba plucks and paper/air swells in the same C-major world as the ambience.
// Everything goes through one gentle bus (low-pass + a faint echo) so nothing is harsh, loud or distracting.
function mkBus() {
  bus = ac.createGain();
  bus.gain.value = 0.9;
  const lp = ac.createBiquadFilter();
  const dl = ac.createDelay(1);
  const fb = ac.createGain();
  const wet = ac.createGain();
  const dlp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3600;
  lp.Q.value = 0.4;
  dl.delayTime.value = 0.27;
  fb.gain.value = 0.3;
  wet.gain.value = 0.2;
  dlp.type = "lowpass";
  dlp.frequency.value = 1800;
  bus.connect(lp);
  lp.connect(ac.destination);
  lp.connect(dl);
  dl.connect(dlp);
  dlp.connect(fb);
  fb.connect(dl);
  dlp.connect(wet);
  wet.connect(ac.destination);
}

const N = { C4: 261.63, G4: 392, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };

// ui.js also calls tone(): harsh square/saw waves are softened here, so every old call sounds gentle too
function tone(f0, f1, d, type, vol, when) {
  if (!ac || !on || !gest || !bus) {
    return;
  }
  if (type === "square" || type === "sawtooth") {
    type = "triangle";
    vol *= 0.75;
  }
  const o = ac.createOscillator();
  const g = ac.createGain();
  const n = ac.currentTime + (when || 0);
  const at = Math.min(0.02, d * 0.4);
  o.type = type || "sine";
  o.frequency.setValueAtTime(f0, n);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), n + d);
  g.gain.setValueAtTime(0.0001, n);
  g.gain.linearRampToValueAtTime(vol, n + at);
  g.gain.exponentialRampToValueAtTime(0.0001, n + d);
  o.connect(g);
  g.connect(bus);
  o.start(n);
  o.stop(n + d + 0.05);
}

function pluck(f, vol, when, dur) {
  if (!ac || !on || !gest || !bus) {
    return;
  }
  dur = dur || 1.1;
  const n = ac.currentTime + (when || 0);
  [[1, 1], [2, 0.18], [3.01, 0.05]].forEach(h => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = f * h[0];
    g.gain.setValueAtTime(0.0001, n);
    g.gain.linearRampToValueAtTime(vol * h[1], n + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur / h[0]);
    o.connect(g);
    g.connect(bus);
    o.start(n);
    o.stop(n + dur + 0.05);
  });
}

function air(f0, f1, d, vol, when, q) {
  if (!ac || !on || !gest || !bus) {
    return;
  }
  const n = ac.currentTime + (when || 0);
  if (!nbuf) {
    nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const a = nbuf.getChannelData(0);
    for (let i = 0; i < a.length; i++) {
      a[i] = Math.random() * 2 - 1;
    }
  }
  const s = ac.createBufferSource();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  s.buffer = nbuf;
  s.loop = true;
  f.type = "bandpass";
  f.Q.value = q || 0.8;
  f.frequency.setValueAtTime(f0, n);
  f.frequency.exponentialRampToValueAtTime(f1, n + d);
  g.gain.setValueAtTime(0.0001, n);
  g.gain.linearRampToValueAtTime(vol, n + d * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, n + d);
  s.connect(f);
  f.connect(g);
  g.connect(bus);
  s.start(n);
  s.stop(n + d + 0.05);
}

const SFX = {
  close: () => {
    air(1600, 450, 0.3, 0.03);
    pluck(N.G5, 0.06);
    pluck(N.C5, 0.06, 0.11, 1.2);
  },
  camera: () => {
    air(2200, 1500, 0.05, 0.06);
    air(1800, 1200, 0.06, 0.05, 0.09);
    pluck(N.E5, 0.06, 0.12);
  },
  notebook: () => {
    air(900, 2400, 0.3, 0.05);
    pluck(N.G5, 0.05, 0.12);
  },
  book: () => {
    air(700, 1800, 0.35, 0.05);
    pluck(N.E5, 0.05, 0.14);
  },
  letter: () => {
    air(1200, 2800, 0.25, 0.04);
    pluck(N.A5, 0.05, 0.1);
  },
  resume: () => {
    air(800, 2000, 0.22, 0.045);
    pluck(N.D5, 0.05, 0.1);
  },
  page: () => air(1000, 2600, 0.16, 0.035),
  radio: () => {
    tone(320, 760, 0.3, "sine", 0.02);
    air(1500, 3000, 0.18, 0.02, 0.05);
    pluck(N.G5, 0.05, 0.32);
  },
  film: () => {
    for (let i = 0; i < 4; i++) {
      air(1400, 900, 0.04, 0.045, i * 0.075);
    }
    pluck(N.C5, 0.06, 0.3, 1.4);
  },
  music: () => {
    [N.C5, N.E5, N.G5].forEach((f, i) => pluck(f, 0.06, i * 0.13, 1.2));
  },
  social: () => {
    air(2400, 1600, 0.06, 0.05);
    pluck(N.C6, 0.04, 0.08);
    pluck(N.G5, 0.04, 0.2);
  },
  me: () => {
    pluck(N.C4, 0.1, 0, 1.8);
    pluck(N.G4, 0.07, 0.12, 1.8);
  },
  cat: () => {
    tone(500, 900, 0.25, "triangle", 0.03);
    tone(900, 450, 0.4, "triangle", 0.03, 0.25);
  },
  frog: () => {
    tone(220, 170, 0.14, "triangle", 0.03);
    tone(200, 160, 0.14, "triangle", 0.03, 0.2);
  },
  bird: () => {
    tone(2400, 3400, 0.1, "sine", 0.025);
    tone(3000, 2200, 0.12, "sine", 0.025, 0.14);
    tone(2600, 3500, 0.1, "sine", 0.025, 0.3);
  },
  sip: () => {
    air(700, 350, 0.35, 0.03);
    tone(190, 130, 0.12, "sine", 0.035, 0.2);
  },
  pour: () => air(1100, 1900, 2.4, 0.05, 0, 1.2),
  clink: () => pluck(2093, 0.03, 0, 0.5),
  kettle: () => {
    tone(260, 190, 0.1, "triangle", 0.03);
    air(900, 500, 0.12, 0.02);
  },
  butterfly: () => {
    pluck(1318.5, 0.025, 0, 0.8);
    pluck(1568, 0.02, 0.12, 0.8);
  }
};

function sfx(k) {
  if (!ac || !on || !gest || !SFX[k]) {
    return;
  }
  try {
    SFX[k]();
  } catch (e) {
  }
}

function thunder() {
  if (!ac || !on || !gest) {
    return;
  }
  const b = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  }
  const s = ac.createBufferSource();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  s.buffer = b;
  f.type = "lowpass";
  f.frequency.value = 140;
  g.gain.value = 0.8;
  s.connect(f);
  f.connect(g);
  g.connect(ac.destination);
  s.start();
}
