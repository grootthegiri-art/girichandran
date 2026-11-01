/* ==========================================================================
   main.js: start-up (loaded last)
   Applies the starting climate, rotates climates every 45 s, runs the opening animation
   and starts the render loop. Everything it needs is defined in the files above.
   ========================================================================== */

function setWx(k) {
  wx = k;
  applyWx();
  $("#glow").style.backgroundColor = GLOW[k];
  if (window.setLeafPal) {
    setLeafPal(k);
  }
}

$("#glow").style.backgroundColor = GLOW[wx];

if (window.setLeafPal) {
  setLeafPal(wx);
}

const nextWx = () => {
  const o = WORDER.filter(k => k !== wx);
  return o[Math.random() * o.length | 0];
};

setInterval(() => {
  if (!document.hidden) {
    setWx(nextWx());
  }
}, 45000);

// intro
if (calm || !gl) {
  $("#intro").remove();
  started = true;
  Object.assign(goal, HOME);
} else {
  const open = () => {
    if (started) {
      return;
    }
    started = true;
    Object.assign(goal, HOME);
  };
  const end = () => {
    open();
    const i = $("#intro");
    if (i) {
      i.remove();
    }
  };
  setTimeout(open, 2600);
  setTimeout(end, 5600);
  $("#intro").style.pointerEvents = "auto";
  $("#intro").addEventListener("pointerdown", end, { once: true });
  addEventListener("keydown", end, { once: true });
}

(function loop(t) {
  if (gl) {
    tick(t);
  }
  requestAnimationFrame(loop);
}(0));
