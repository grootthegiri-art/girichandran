/* ==========================================================================
   state.js: shared state
   HOME   the resting camera view      cam / goal   current camera and where it is easing to
   started  becomes true after the intro   wx  current climate   gl  is WebGL working?
   ========================================================================== */
// camera state
const HOME = { tx: 0.4, ty: 1.4, tz: 1, th: 0.5, ph: 1.3, r: 9.5 };

const cam = { tx: 0, ty: 2, tz: 1, th: 0.5, ph: 1.1, r: 20 };

const goal = Object.assign({}, HOME, { r: 17 });

let started = false;

let wx = WORDER[Math.random() * WORDER.length | 0];

let hoverK = null;

let snap = 4;

let pickAt = () => null;

// 3D scene
let gl = true;

let R;

let S;

let K;

let tick = () => {
};
