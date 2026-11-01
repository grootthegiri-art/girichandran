/* ==========================================================================
   controls.js: dragging, pinch-zoom, wheel, hover and link-tile tilt
   Mouse/touch on the 3D canvas. A short tap (no drag) on an object opens its panel.
   ========================================================================== */
// drag to look
let dragging = false;

let lx = 0;

let ly = 0;

let sx = 0;

let sy = 0;

const cv = $("#c");

const ptrs = new Map();

let pinch = 0;

let lastPick = 0;

cv.addEventListener("pointerdown", e => {
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  dragging = true;
  sx = lx = e.clientX;
  sy = ly = e.clientY;
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {
  }
  cv.style.cursor = "grabbing";
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
});

cv.addEventListener("pointermove", e => {
  if (ptrs.has(e.pointerId)) {
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  }
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    goal.r = Math.max(5, Math.min(14, goal.r + (pinch - d) * 0.02));
    pinch = d;
    sx = -10000;
    return;
  }
  if (!dragging) {
    if (e.pointerType === "mouse" && performance.now() - lastPick > 70) {
      lastPick = performance.now();
      hoverK = pickAt(e.clientX, e.clientY);
      cv.style.cursor = hoverK ? "pointer" : "grab";
    }
    return;
  }
  goal.th -= (e.clientX - lx) * 0.006;
  goal.ph = Math.max(0.85, Math.min(1.5, goal.ph - (e.clientY - ly) * 0.004));
  lx = e.clientX;
  ly = e.clientY;
});

const endPtr = e => {
  const multi = ptrs.size > 1;
  ptrs.delete(e.pointerId);
  if (!ptrs.size) {
    dragging = false;
  }
  cv.style.cursor = hoverK ? "pointer" : "grab";
  if (!multi && e.type === "pointerup" && started && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) {
    const k = pickAt(e.clientX, e.clientY);
    if (k) {
      show(k, { getBoundingClientRect: () => ({ left: e.clientX, top: e.clientY, width: 0, height: 0 }) });
    }
  }
};

cv.addEventListener("pointerup", endPtr);

cv.addEventListener("pointercancel", endPtr);

cv.addEventListener("wheel", e => {
  goal.r = Math.max(5, Math.min(14, goal.r + e.deltaY * 0.005));
}, { passive: true });

// 3D tilt on the link tiles
document.addEventListener("pointermove", e => {
  if (calm) {
    return;
  }
  const o = e.target.closest && e.target.closest(".orb:not(.soon)");
  if (!o) {
    return;
  }
  const r = o.getBoundingClientRect();
  o.querySelector(".tile").style.transform = `rotateX(${ -((e.clientY - r.top) / r.height - 0.5) * 40 }deg) rotateY(${ ((e.clientX - r.left) / r.width - 0.5) * 40 }deg) translateY(-4px) scale(1.06)`;
});

document.addEventListener("pointerout", e => {
  const o = e.target.closest && e.target.closest(".orb");
  if (o) {
    o.querySelector(".tile").style.transform = "";
  }
});
