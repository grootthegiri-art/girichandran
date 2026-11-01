/* ==========================================================================
   scene.js: the 3D world (three.js)
   Everything inside ONE try block: if WebGL is unavailable the catch at the bottom switches
   the page to the plain list of objects. Sections are numbered below.
   
   Short names used in this file:
     R renderer   S scene   K camera   W world (from world.js)   G / hip / tor / hd = Giri's groups
     M(geo,color,pos,rot,emissive)  add a lit mesh to the scene
     P(group,geo,color,pos,scale)   add a part to a group     B box  Cy cylinder  Sp sphere
     ss smoking state   tea tea state   bs butterfly state   mats = every material (for wet look)
   ========================================================================== */
try {

  /* ===== 1. RENDERER, SCENE, CAMERA AND LIGHTS ===== */
  R = new THREE.WebGLRenderer({ canvas: $("#c"), antialias: true });
  R.setPixelRatio(Q.pr);
  R.shadowMap.enabled = true;
  $("#c").addEventListener("webglcontextlost", ev => {
    ev.preventDefault();
    gl = false;
    document.body.classList.add("nogl");
    $("#cap").textContent = "The 3D view was interrupted. Reload the page to see it again.";
  });
  $("#c").addEventListener("webglcontextrestored", () => location.reload());
  S = new THREE.Scene();
  S.background = new THREE.Color("#c0845a");
  S.fog = new THREE.Fog("#c0845a", 12, 34);
  K = new THREE.PerspectiveCamera(48, 1, 0.03, 80);
  const hemi = new THREE.HemisphereLight("#ffd7a6", "#3b2a2a", 0.75);
  const canopy = [];
  S.add(hemi);
  const sun = new THREE.DirectionalLight("#ffb46b", 1.1);
  sun.position.set(-6, 6, 5);
  sun.castShadow = true;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  sun.shadow.mapSize.set(LOW ? 512 : 1024, LOW ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, far: 30 });
  S.add(sun);
  const lamp = new THREE.PointLight("#ffbf6b", 1.2, 7);
  lamp.position.set(-2.4, 0.9, 0.6);
  S.add(lamp);
  const NT = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const x = cv.getContext("2d");
    const d = x.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 226 + Math.random() * 29;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    for (let i = 0; i < 50; i++) {
      x.fillStyle = "rgba(90,80,70,.04)";
      x.beginPath();
      x.arc(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 14, 0, 6.28);
      x.fill();
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.magFilter = THREE.NearestFilter;
    return t;
  })();
  const mats = [];
  const M = (g, c, p, r, em) => {
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.9,
      metalness: 0,
      map: NT,
      emissive: em || "#000"
    }));
    mats.push(m.material);
    m.position.set(...p);
    if (r) {
      m.rotation.set(...r);
    }
    m.castShadow = m.receiveShadow = true;
    S.add(m);
    return m;
  };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cy = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s || 16);
  const Sp = (r, d) => new THREE.IcosahedronGeometry(r, d == null ? 3 : Math.max(d, 1));

  /* ===== 2. GROUND, WORLD OBJECTS (built by world.js) AND THE TREE CANOPY ===== */
  const ground = M(Cy(30, 30, 0.2, 40), "#7b6a3c", [0, -0.1, 0]);
  ground.material.map = null;
  const W = WORLD.build({
    THREE,
    S,
    NT,
    mats,
    C,
    OBJ,
    sfx,
    getWx: () => wx,
    seat: [0.73, 0.68],
    snap: () => snap > 0
  });
  Object.keys(W.pos).forEach(k => {
    if (OBJ[k]) {
      OBJ[k].pos = W.pos[k];
    }
  });
  lamp.position.set(W.lantern[0], W.lantern[1] + 0.35, W.lantern[2]);
  [
    ["#6b6a3a", 0, 5.6, 0, 2.3],
    ["#7d7a3f", 1.4, 5.2, 0.4, 1.7],
    ["#8a6a35", -1.5, 5.4, -0.3, 1.8],
    ["#5d6035", 0.2, 6.7, -0.3, 1.6],
    ["#9b5a35", -0.4, 5, 1.4, 1.2],
    ["#6f6d3c", 1.1, 6.3, -1, 1.5],
    ["#7a7a42", -1.3, 6.2, 0.8, 1.4],
    ["#5f6838", 0, 4.6, -1.5, 1.4]
  ].forEach(l => {
    const m = M(Sp(l[4]), l[0], [l[1], l[2], l[3]]);
    const pa = m.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const y = pa.getY(i);
      const z = pa.getZ(i);
      const n = 1 + 0.13 * Math.sin(x * 2.7 + y * 1.9) * Math.cos(z * 2.3 + x * 1.3);
      pa.setXYZ(i, x * n, y * n, z * n);
    }
    m.userData.base = new THREE.Color(l[0]);
    canopy.push(m);
  });

  /* ===== 3. GRASS AND FIREFLIES ===== */
  const g = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.35, 4), new THREE.MeshStandardMaterial({
    color: "#8a8a45",
    flatShading: true
  }), 160);
  const d = new THREE.Object3D();
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * 6.28;
    const r = 2 + Math.random() * 11;
    d.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r);
    d.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
    d.updateMatrix();
    g.setMatrixAt(i, d.matrix);
  }
  S.add(g);
  const N = 70;
  const pp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 10;
    pp[i * 3 + 1] = 0.4 + Math.random() * 4;
    pp[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const ge = new THREE.BufferGeometry();
  ge.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const ff = new THREE.Points(ge, new THREE.PointsMaterial({
    color: "#f6d38a",
    size: 0.09,
    transparent: true,
    opacity: 0.8
  }));
  S.add(ff);
  const tmp = new THREE.Color();
  const tmp2 = new THREE.Color();
  const P = (g, geo, c, p, s, ro) => {
    const mt = new THREE.MeshLambertMaterial({ color: c, map: NT });
    mats.push(mt);
    const m = new THREE.Mesh(geo, mt);
    m.position.set(...p);
    if (s) {
      m.scale.set(...s);
    }
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const cat = W.cat.g;
  const catUpd = (dt, t) => W.cat.update(dt, t);

  /* ===== 4. FROGS AND BIRDS (hop around, appear depending on weather) ===== */
  const frog = new THREE.Group();
  const bird = new THREE.Group();
  S.add(frog, bird);
  frog.position.set(2.8, 0, 0.2);
  bird.position.set(-1.4, 0, -0.8);
  P(frog, Sp(0.1, 0), "#5e8c3a", [0, 0.07, 0], [1, 0.7, 1.3]);
  P(frog, Sp(0.03, 0), "#f2e8a0", [-0.05, 0.14, 0.08]);
  P(frog, Sp(0.03, 0), "#f2e8a0", [0.05, 0.14, 0.08]);
  P(bird, Sp(0.09, 0), "#8a3b2a", [0, 0.1, 0], [1, 1, 1.2]);
  P(bird, Sp(0.06, 0), "#eadfc9", [0, 0.07, 0.04]);
  P(bird, Sp(0.05, 0), "#5a4034", [0, 0.17, 0.06]);
  P(bird, Cy(0, 0.015, 0.05, 4), "#e2b24a", [0, 0.17, 0.12]).rotation.x = 1.57;
  const crit = (g, hx, hz, rad, h) => ({ g, hx, hz, rad, h, u: 1, fx: hx, fz: hz, tx: hx, tz: hz, w: 1 });
  const cf = crit(frog, 2.8, 0.2, 1.2, 0.18);
  const cb = crit(bird, -1.4, -0.8, 1.1, 0.1);
  const frog2 = frog.clone();
  const bird2 = bird.clone();
  S.add(frog2, bird2);
  frog2.position.set(3.4, 0, 1.4);
  bird2.position.set(-2.4, 0, -1.2);
  const cf2 = crit(frog2, 3.4, 1.4, 1.2, 0.16);
  const cb2 = crit(bird2, -2.4, -1.2, 1.2, 0.1);

  function hop(c, dt) {
    if (c.u < 1) {
      c.u += dt * 2.2;
      const u = Math.min(c.u, 1);
      c.g.position.set(c.fx + (c.tx - c.fx) * u, Math.sin(u * Math.PI) * c.h, c.fz + (c.tz - c.fz) * u);
      if (u >= 1) {
        push(c.g.position);
      }
      return;
    }
    c.w -= dt;
    if (c.w <= 0) {
      c.fx = c.g.position.x;
      c.fz = c.g.position.z;
      const a = Math.random() * 6.28;
      const r = Math.random() * c.rad;
      c.tx = c.hx + Math.cos(a) * r;
      c.tz = c.hz + Math.sin(a) * r;
      c.g.rotation.y = Math.atan2(c.tx - c.fx, c.tz - c.fz);
      c.u = 0;
      c.w = 1 + Math.random() * 3;
    }
  }

  /* ===== 5. WEATHER PARTICLES: rain, snow, falling leaves ===== */
  const rain = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({
    color: "#cfe0ea",
    transparent: true,
    opacity: 0
  }));
  const RN = 600;
  const rp = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) {
    rp[i * 6] = (Math.random() - 0.5) * 20;
    rp[i * 6 + 1] = Math.random() * 9;
    rp[i * 6 + 2] = (Math.random() - 0.5) * 20;
  }
  rain.geometry.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  rain.frustumCulled = false;
  S.add(rain);
  const pts = (n, sz, col, vc) => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 20;
      a[i * 3 + 1] = Math.random() * 9;
      a[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    if (vc) {
      const c = new Float32Array(n * 3);
      const pal = [[0.7, 0.33, 0.17], [0.8, 0.55, 0.2], [0.55, 0.2, 0.12]];
      for (let i = 0; i < n; i++) {
        c.set(pal[i % 3], i * 3);
      }
      g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    }
    const p = new THREE.Points(g, new THREE.PointsMaterial({
      color: vc ? 16777215 : col,
      size: sz,
      transparent: true,
      opacity: 0,
      vertexColors: !!vc,
      depthWrite: false
    }));
    p.frustumCulled = false;
    S.add(p);
    return { p, a };
  };
  const sn = pts(450, 0.07, "#ffffff");
  const lf = pts(90, 0.17, 0, 1);
  const LPAL = {
    sakura: [[0.98, 0.72, 0.82], [0.95, 0.6, 0.75], [1, 0.85, 0.9]],
    blossom: [[0.98, 0.72, 0.82], [0.95, 0.6, 0.75], [1, 0.85, 0.9]],
    autumn: [[0.7, 0.33, 0.17], [0.8, 0.55, 0.2], [0.55, 0.2, 0.12]]
  };
  window.setLeafPal = k => {
    const pal = LPAL[k] || LPAL.autumn;
    const a = lf.p.geometry.attributes.color.array;
    for (let i = 0; i < 90; i++) {
      a.set(pal[i % pal.length], i * 3);
    }
    lf.p.geometry.attributes.color.needsUpdate = true;
  };

  /* ===== 6. WEATHER -> SCENE: eases colours, fog, light and particles toward the current climate ===== */

  function wxUpd(dt, t) {
    const w = WX[wx];
    const k = calm || snap > 0 ? 1 : 0.03;
    S.background.lerp(tmp.set(w.bg), k);
    S.fog.color.copy(S.background);
    S.fog.near += (w.fog[0] - S.fog.near) * k;
    S.fog.far += (w.fog[1] - S.fog.far) * k;
    hemi.color.lerp(tmp.set(w.hemi), k);
    sun.color.lerp(tmp.set(w.sun), k);
    sun.intensity += (w.si - sun.intensity) * k;
    hemi.intensity += (w.hi - hemi.intensity) * k;
    ground.material.color.lerp(tmp.set(w.g), k);
    canopy.forEach(m => {
      tmp.copy(m.userData.base).lerp(tmp2.set(w.ct[0]), w.ct[1]);
      m.material.color.lerp(tmp, k);
    });
    rain.material.opacity += (w.rain * 0.45 - rain.material.opacity) * k;
    sn.p.material.opacity += (w.snow * 0.9 - sn.p.material.opacity) * k;
    lf.p.material.opacity += (w.leaf - lf.p.material.opacity) * k;
    rain.visible = rain.material.opacity > 0.02;
    sn.p.visible = sn.p.material.opacity > 0.02;
    lf.p.visible = lf.p.material.opacity > 0.02;
    const fv = wx === "rain" || wx === "night" || wx === "storm" || wx === "aurora";
    const bv = ["snow", "autumn", "cozy", "dusk", "fog", "sakura", "blossom"].includes(wx);
    if (started && fv && !frog.visible) {
      sfx("frog");
    }
    if (started && bv && !bird.visible) {
      sfx("bird");
    }
    frog.visible = frog2.visible = fv;
    bird.visible = bird2.visible = bv;
    ff.visible = wx === "cozy" || wx === "night" || wx === "dusk" || wx === "aurora";
    if (calm) {
      return;
    }
    if (rain.visible) {
      for (let i = 0; i < RN; i++) {
        const j = i * 6;
        rp[j + 1] -= 14 * dt;
        if (rp[j + 1] < 0) {
          rp[j + 1] = 9;
        }
        rp[j + 3] = rp[j] + 0.04;
        rp[j + 4] = rp[j + 1] + 0.4;
        rp[j + 5] = rp[j + 2];
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    if (sn.p.visible) {
      const a = sn.a;
      for (let i = 0; i < 450; i++) {
        a[i * 3 + 1] -= 0.7 * dt;
        if (a[i * 3 + 1] < 0) {
          a[i * 3 + 1] = 9;
        }
        a[i * 3] += Math.sin(t / 900 + i) * 0.004;
      }
      sn.p.geometry.attributes.position.needsUpdate = true;
    }
    if (lf.p.visible) {
      const a = lf.a;
      for (let i = 0; i < 90; i++) {
        lf.vy = lf.vy || new Float32Array(90);
        lf.rs = lf.rs || new Float32Array(90);
        if (a[i * 3 + 1] <= 0.03) {
          a[i * 3 + 1] = 0.03;
          if (!lf.rs[i]) {
            lf.rs[i] = 3 + Math.random() * 6;
          }
          lf.rs[i] -= dt;
          if (lf.rs[i] <= 0) {
            a[i * 3 + 1] = 9;
            lf.vy[i] = 0;
            lf.rs[i] = 0;
          }
        } else {
          lf.vy[i] = Math.min(lf.vy[i] + 1.1 * dt, 0.9);
          a[i * 3 + 1] = Math.max(0.03, a[i * 3 + 1] - lf.vy[i] * dt);
          a[i * 3] += Math.sin(t / 700 + i) * 0.012;
          a[i * 3 + 2] += Math.cos(t / 900 + i) * 0.006;
        }
      }
      lf.p.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ===== 7. CIGARETTE AND SMOKE PUFFS ===== */
  const ember = M(Sp(0.015, 0), "#ff7a2a", [1.06, 1.26, 1.29], null, "#ff5a1a");
  // cigarette arm: raise, drag, exhale, rest 3s, repeat until it burns down, then a long random wait
  const cig = P(S, Cy(0.012, 0.012, 0.12, 8), "#eadfc9", [0, 0, 0]);
  const puffs = [];
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(Sp(0.05, 1), new THREE.MeshBasicMaterial({
      color: "#d6cfc4",
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    m.visible = false;
    S.add(m);
    puffs.push({ m, l: 0, s: 1 });
  }

  function puff(x, y, z, s) {
    const p = puffs.find(q => q.l <= 0);
    if (!p) {
      return;
    }
    p.l = 1;
    p.s = s;
    p.m.position.set(x, y, z);
    p.m.visible = true;
  }
  const ss = { st: "idle", t: 7, n: 0, tot: 1, u: 0, e: 0 };
  const wv = new THREE.Vector3();

  function smokeUpd(dt, t) {
    ss.t -= dt;
    if (ss.st === "idle") {
      cig.visible = ember.visible = false;
      if (ss.t <= 0) {
        if (tea.st === "idle" && Math.random() < WX[wx].smoke) {
          ss.st = "grab";
          ss.t = 1.6;
          ss.n = ss.tot = 5 + (Math.random() * 3 | 0);
          cig.visible = ember.visible = false;
          cig.scale.y = 1;
          packCig.visible = true;
        } else {
          ss.t = 8 + Math.random() * 12;
        }
      }
    } else if (ss.st === "grab") {
      if (ss.t < 0.7) {
        cig.visible = true;
        packCig.visible = false;
      }
      if (ss.t <= 0) {
        ss.st = "up";
        ss.t = 1;
        ember.visible = true;
      }
    } else if (ss.st === "up" && ss.t <= 0) {
      ss.st = "out";
      ss.t = 2.6;
      ss.e = 0;
    } else if (ss.st === "out") {
      ss.e -= dt;
      if (ss.e <= 0) {
        ss.e = 0.16;
        mouth.getWorldPosition(wv);
        puff(wv.x, wv.y, wv.z, 1 + Math.random() * 0.5);
      }
      if (ss.t <= 0) {
        ss.n--;
        cig.scale.y = Math.max(0.2, ss.n / ss.tot);
        if (ss.n <= 0) {
          ss.st = "idle";
          ss.t = 20 + Math.random() * 40;
        } else {
          ss.st = "rest";
          ss.t = 3;
        }
      }
    } else if (ss.st === "rest") {
      ss.e -= dt;
      if (ss.e <= 0) {
        ss.e = 0.7;
        ember.getWorldPosition(wv);
        puff(wv.x, wv.y, wv.z, 0.5);
      }
      if (ss.t <= 0) {
        ss.st = "up";
        ss.t = 1;
      }
    }
    const up = ss.st === "up" || ss.st === "out";
    ss.u += ((up ? 1 : 0) - ss.u) * Math.min(1, dt * 3);
    ember.material.emissiveIntensity = 0.5 + (ss.st === "up" ? 1.2 : 0) + Math.sin(t / 300) * 0.1;
    puffs.forEach(p => {
      if (p.l > 0) {
        p.l -= dt * 0.22;
        p.m.position.y += dt * 0.5;
        p.m.position.x += Math.sin(t / 600 + p.m.position.y * 3) * 0.004 + dt * 0.06;
        p.m.scale.setScalar(p.s * (1 + (1 - p.l) * 4));
        p.m.material.opacity = Math.max(0, p.l) * 0.3;
        if (p.l <= 0) {
          p.m.visible = false;
        }
      }
    });
  }
  // rain ripples + wet look

  /* ===== 8. RAIN RIPPLES AND WET LOOK ===== */
  const rip = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.07, 24), new THREE.MeshBasicMaterial({
      color: "#dfeaf0",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    S.add(m);
    rip.push({ m, l: 0 });
  }

  function ripUpd(dt) {
    const wet = rain.material.opacity > 0.15;
    if (wet && !calm && Math.random() < dt * 12) {
      const r = rip.find(q => q.l <= 0);
      if (r) {
        const a = Math.random() * 6.28;
        const d = 1 + Math.random() * 5;
        r.l = 1;
        r.m.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d);
        r.m.visible = true;
      }
    }
    rip.forEach(r => {
      if (r.l > 0) {
        r.l -= dt * 1.1;
        r.m.scale.setScalar(1 + (1 - r.l) * 6);
        r.m.material.opacity = Math.max(0, r.l) * 0.5;
        if (r.l <= 0) {
          r.m.visible = false;
        }
      }
    });
    mats.forEach(m => {
      m.roughness += ((wet ? 0.3 : 0.85) - m.roughness) * 0.02;
    });
  }
  // picking: touch an object to open it; hover glows

  /* ===== 9. PICKING: touch / hover an object to open it ===== */
  const ray = new THREE.Raycaster();
  const nd = new THREE.Vector2();
  const glow = new THREE.PointLight("#ffe2a8", 0, 2.5);
  S.add(glow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 40), new THREE.MeshBasicMaterial({
    color: "#ffe2a8",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  S.add(ring);
  pickAt = (x, y) => {
    nd.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(nd, K);
    const h = ray.intersectObjects(S.children, true).find(q => q.object.isMesh && q.object.visible && !q.object.material.transparent && !q.object.isInstancedMesh);
    if (!h) {
      return null;
    }
    let best = null;
    let bd = 1;
    for (const k in OBJ) {
      const o = OBJ[k];
      const d = Math.hypot(h.point.x - o.pos[0], h.point.y - o.pos[1], h.point.z - o.pos[2]) / (o.r || (k === "me" ? 1.4 : k === "cat" ? 0.6 : 0.75));
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  };
  // animal calls, now and then (only when sound is on)

  /* ===== 10. ANIMAL CALLS (only when sound is on) ===== */
  setInterval(() => {
    if (!ac || !on || !gest || document.hidden) {
      return;
    }
    [[frog.visible, "frog", 0.4], [bird.visible, "bird", 0.45], [1, "cat", 0.15]].forEach(a => {
      if (a[0] && Math.random() < a[2]) {
        sfx(a[1]);
      }
    });
  }, 4500);
  // objects appear one by one while the eyes are still closed

  /* ===== 11. OBJECTS APPEAR ONE BY ONE DURING THE INTRO ===== */
  const reveal = S.children.filter(c => (c.isMesh || c.isGroup) && c.visible);
  reveal.forEach(c => {
    c.visible = false;
  });
  let ri = 0;

  // ===== Giri: sits under the tree, smokes, rests =====

  /* ===== 12. GIRI: the character (body, hair, outfit, glasses) ===== */
  const G = new THREE.Group();
  const hip = new THREE.Group();
  const tor = new THREE.Group();
  const hd = new THREE.Group();
  S.add(G);
  G.add(hip);
  hip.add(tor);
  tor.add(hd);
  const SK = "#8a5a3c";
  const HD = "#9b4130";
  const TR = "#2b2a33";
  const mouth = new THREE.Object3D();
  hd.position.set(0, 0.63, 0);
  mouth.position.set(0, 0.022, 0.095);
  hd.add(mouth);
  const legs = [-1, 1].map(s => {
    const th = new THREE.Group();
    const kn = new THREE.Group();
    th.position.set(s * 0.09, 0, 0);
    hip.add(th);
    kn.position.y = -0.42;
    th.add(kn);
    return { th, kn };
  });
  const arms = [-1, 1].map(s => {
    const sh = new THREE.Group();
    const el = new THREE.Group();
    sh.position.set(s * 0.21, 0.5, 0);
    tor.add(sh);
    el.position.y = -0.29;
    sh.add(el);
    return { sh, el };
  });
  arms[1].el.add(cig, ember);
  cig.position.set(0, -0.3, -0.04);
  cig.rotation.set(Math.PI / 2, 0, 0);
  ember.position.set(0, -0.3, -0.1);
  const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 14 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: "#17120f" }));
  cable.frustumCulled = false;
  S.add(cable);
  const pl = new THREE.Vector3(W.player[0], W.player[1], W.player[2]);
  const ea = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const SKN = (g, geo, p, s) => {
    const m = P(g, geo, SK, p, s, 0.55);
    m.material.emissive.set("#33160a");
    return m;
  };
  const rot = (m, x, y, z) => {
    m.rotation.set(x || 0, y || 0, z || 0);
    return m;
  };
  const tp = [
    [0, -0.02],
    [0.15, 0],
    [0.145, 0.1],
    [0.133, 0.22],
    [0.148, 0.33],
    [0.17, 0.43],
    [0.165, 0.52],
    [0.1, 0.585],
    [0.05, 0.61],
    [0, 0.61]
  ].map(a => new THREE.Vector2(a[0], a[1]));
  P(tor, new THREE.LatheGeometry(tp, 28), HD, [0, 0, 0], [1, 1, 0.78]);
  rot(P(tor, new THREE.TorusGeometry(0.085, 0.04, 12, 28), "#7d3224", [0, 0.6, -0.03]), 1.25);
  SKN(tor, Cy(0.05, 0.06, 0.13, 18), [0, 0.64, 0]);
  P(hip, Sp(0.17, 3), TR, [0, 0.02, 0], [1, 0.7, 0.85]);
  legs.forEach(l => {
    P(l.th, Cy(0.085, 0.062, 0.42, 20), TR, [0, -0.21, 0]);
    P(l.th, Sp(0.064, 2), TR, [0, -0.42, 0]);
    P(l.kn, Cy(0.06, 0.043, 0.41, 20), TR, [0, -0.205, 0]);
    P(l.kn, Cy(0.05, 0.052, 0.06, 18), "#3b3b44", [0, -0.385, 0]);
    P(l.kn, Sp(0.06, 3), "#d9d2c3", [0, -0.44, 0.06], [0.95, 0.62, 2]);
    P(l.kn, B(0.1, 0.022, 0.27), "#8a8279", [0, -0.47, 0.065]);
  });
  arms.forEach((a, i) => {
    P(a.sh, Sp(0.064, 3), HD, [0, 0, 0]);
    P(a.sh, Cy(0.054, 0.046, 0.29, 20), HD, [0, -0.145, 0]);
    P(a.el, Sp(0.047, 3), HD, [0, 0, 0]);
    P(a.el, Cy(0.046, 0.037, 0.26, 20), HD, [0, -0.13, 0]);
    rot(P(a.el, new THREE.TorusGeometry(0.039, 0.011, 8, 18), "#7d3224", [0, -0.255, 0]), 1.571);
    SKN(a.el, Sp(0.042, 3), [0, -0.31, 0], [0.85, 1.35, 0.5]);
  });
  const fg = new THREE.SphereGeometry(0.11, 40, 32);
  const pa0 = fg.attributes.position;
  for (let i = 0; i < pa0.count; i++) {
    let x = pa0.getX(i);
    let y = pa0.getY(i);
    let z = pa0.getZ(i);
    y *= 1.17;
    if (y < 0) {
      const q = Math.min(1, -y / 0.13);
      x *= 1 - 0.24 * q * q;
      z *= 1 - 0.1 * q;
    } else {
      z *= 1 - 0.05 * (y / 0.13);
    }
    x *= 1 + 0.04 * Math.max(0, 1 - Math.abs(y) / 0.06);
    pa0.setXYZ(i, x, y, z);
  }
  fg.computeVertexNormals();
  SKN(hd, fg, [0, 0.1, 0]);
  mouth.position.set(0, 0.022, 0.095);
  [-1, 1].forEach(s => {
    SKN(hd, Sp(0.022, 3), [s * 0.105, 0.095, -0.005], [0.5, 1, 0.7]);
  });
  P(hd, Sp(0.012, 2), "#eadfc9", [-0.113, 0.092, 0]);
  // hair: thick, wavy, middle part, curtain bangs, medium length
  const HM = "#2b1d14";
  P(hd, new THREE.SphereGeometry(0.119, 36, 28, 2.27, 4.88, 0, 2), HM, [0, 0.1, -0.012], [1.02, 1.1, 1.04], 0.5);
  const lock = (s, z0, kind, ph) => {
    const y0 = 0.1 + 0.13 * Math.sqrt(Math.max(0, 1 - (z0 / 0.112) ** 2)) + 0.004;
    const w = Math.sin(ph) * 0.01;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const pts = kind === "b" ? [
      V(s * 0.004, y0, z0),
      V(s * 0.05, y0 - 0.01, z0 + 0.012),
      V(s * 0.086, 0.15, 0.104),
      V(s * 0.098 + w, 0.085, 0.1),
      V(s * 0.112 + w * 1.5, 0.025, 0.085)
    ] : kind === "s" ? [
      V(s * 0.004, y0, z0),
      V(s * 0.065, y0 - 0.02, z0),
      V(s * 0.114, 0.125, z0),
      V(s * 0.12 + w, 0.045, z0 - 0.005),
      V(s * 0.112 + w * 1.5, -0.03, z0 - 0.01)
    ] : [
      V(s * 0.004, y0, z0),
      V(s * 0.06, y0 - 0.025, z0),
      V(s * 0.1, 0.1, z0),
      V(s * 0.095 + w, 0, z0 * 1.05),
      V(s * 0.07 + w * 1.5, -0.07, z0 * 1.05)
    ];
    P(hd, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0165, 6), HM, [0, 0, 0], null, 0.5);
  };
  [-1, 1].forEach(s => {
    [0.082, 0.07, 0.058].forEach((z, i) => lock(s, z, "b", i * 2 + s));
    [0.035, 0.01, -0.015, -0.038].forEach((z, i) => lock(s, z, "s", i * 1.7 + s));
    [-0.06, -0.08, -0.095].forEach((z, i) => lock(s, z, "k", i * 2.1 + s));
  });

  // ===== outfit palette (new every page load), cap, short hair, glasses =====
  legs.forEach(l => {
    l.th.rotation.order = "YXZ";
  });
  hd.children.filter(c => c.isMesh && (c.geometry.type === "TubeGeometry" || c.geometry.type === "SphereGeometry" && c.geometry.parameters.thetaLength === 2)).forEach(c => hd.remove(c));
  const PALS = [
    { h: "#9b4130", a: "#7d3224", t: "#2b2a33", s: "#d9d2c3" },
    { h: "#3f5a45", a: "#2e4434", t: "#3a3a35", s: "#c9c2b0" },
    { h: "#c08a2e", a: "#8f6420", t: "#2a2a2e", s: "#e6dfd0" },
    { h: "#27384f", a: "#1b2738", t: "#4a4338", s: "#d6d0c4" },
    { h: "#6b6a3a", a: "#4f4e2a", t: "#2c2a26", s: "#cfc7b4" },
    { h: "#5b3a4f", a: "#432a3b", t: "#2d2d33", s: "#d9d2c3" },
    { h: "#53708a", a: "#3d556b", t: "#34322e", s: "#e6e0d2" },
    { h: "#e3d7bd", a: "#bfb196", t: "#1f1f24", s: "#8a8279" }
  ];
  const pal = PALS[Math.random() * PALS.length | 0];
  const CM = { "9b4130": pal.h, "7d3224": pal.a, "2b2a33": pal.t, "3b3b44": pal.a, "d9d2c3": pal.s };
  G.traverse(o => {
    if (o.isMesh && CM[o.material.color.getHexString()]) {
      o.material.color.set(CM[o.material.color.getHexString()]);
    }
  });
  P(hd, new THREE.SphereGeometry(0.117, 32, 24, 0, 6.2832, 0, 1.55), HM, [0, 0.12, -0.03], [1.02, 1.1, 1.04], 0.55);
  P(hd, new THREE.SphereGeometry(0.12, 24, 20, 3.61, 2.2, 0, 2.05), HM, [0, 0.1, -0.012], [1.02, 1.1, 1.04], 0.55);
  const GL = "#18181b";
  [-1, 1].forEach(s => {
    P(hd, new THREE.TorusGeometry(0.026, 0.0035, 8, 28), GL, [s * 0.04, 0.115, 0.117], [1.12, 0.92, 1], 0.4);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0255, 24), new THREE.MeshStandardMaterial({
      color: "#cfe3ff",
      transparent: true,
      opacity: 0.13,
      roughness: 0.05,
      depthWrite: false
    }));
    lens.position.set(s * 0.04, 0.115, 0.1175);
    lens.scale.set(1.12, 0.92, 1);
    hd.add(lens);
    const tg = new THREE.Group();
    tg.position.set(s * 0.087, 0.113, 0.058);
    tg.rotation.y = -s * 0.33;
    hd.add(tg);
    rot(P(tg, Cy(0.0028, 0.0028, 0.125, 8), GL, [0, 0, 0], null, 0.4), Math.PI / 2);
  });
  rot(P(hd, Cy(0.0028, 0.0028, 0.026, 8), GL, [0, 0.124, 0.118], null, 0.4), 0, 0, Math.PI / 2);
  // glowing butterfly: appears now and then and lands on the objects you can touch
  const ws = new THREE.Shape();
  ws.moveTo(0, 0);
  ws.bezierCurveTo(0.02, 0.07, 0.1, 0.09, 0.12, 0.04);
  ws.bezierCurveTo(0.13, 0, 0.1, -0.01, 0.06, -0.02);
  ws.bezierCurveTo(0.09, -0.06, 0.06, -0.1, 0.02, -0.07);
  ws.bezierCurveTo(0.01, -0.05, 0, -0.02, 0, 0);
  const wgeo = new THREE.ShapeGeometry(ws);
  const wmat = new THREE.MeshBasicMaterial({
    color: "#8fe3ff",
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const bf = new THREE.Group();
  const bfr = new THREE.Group();
  const wR = new THREE.Group();
  const wL = new THREE.Group();
  const bl = new THREE.PointLight("#8fe3ff", 0, 1.8);
  bfr.rotation.x = -Math.PI / 2;
  wR.add(new THREE.Mesh(wgeo, wmat));
  const lw = new THREE.Mesh(wgeo, wmat);
  lw.scale.x = -1;
  wL.add(lw);
  bfr.add(wR, wL);
  const bb = new THREE.Mesh(Sp(0.007, 1), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  bb.scale.set(1, 4, 1);
  bfr.add(bb);
  bf.add(bfr, bl);
  bf.visible = false;
  S.add(bf);

  /* ===== 13. BUTTERFLY (flies to the objects you can touch) ===== */
  const BL = {
    notebook: [0.2, 0.13, 1.7],
    camera: [2.1, 0.68, 1.6],
    radio: [2.9, 0.23, 1],
    book: [-2, 0.12, 0.9],
    social: [0.9, 0.07, 2.5],
    letter: [-1, 0.08, 2.9],
    film: [-1.4, 0.8, 1.6],
    resume: [-0.4, 0.9, 2.1],
    music: [1.4, 0.1, 2.1],
    lantern: [-2.4, 0.75, 0.6]
  };
  Object.assign(BL, W.land);
  const bs = { m: "wait", t: 8, q: [], tg: null, st: 0 };

  function bfUpd(dt, t) {
    if (bs.m === "wait") {
      bf.visible = false;
      bl.intensity = 0;
      bs.t -= dt;
      if (bs.t <= 0) {
        if (wx === "rain" || wx === "snow" || wx === "storm" || wx === "blossom") {
          bs.t = 6;
          return;
        }
        const a = Math.random() * 6.28;
        bf.position.set(Math.cos(a) * 7, 2.6, Math.sin(a) * 7);
        bf.visible = true;
        sfx("butterfly");
        bs.q = Object.keys(BL).sort(() => Math.random() - 0.5).slice(0, 4 + (Math.random() * 3 | 0));
        bs.tg = BL[bs.q.shift()];
        bs.m = "fly";
      }
      return;
    }
    let a = 0;
    bl.intensity += (0.7 - bl.intensity) * 0.05;
    if (bs.m === "fly" || bs.m === "leave") {
      const T = bs.tg;
      const dx = T[0] - bf.position.x;
      const dy = T[1] - bf.position.y;
      const dz = T[2] - bf.position.z;
      const d = Math.hypot(dx, dy, dz);
      const sp = bs.m === "leave" ? 2.2 : Math.min(1.7, 0.35 + d * 1.1);
      const wb = Math.min(1, d);
      if (d < 0.06) {
        if (bs.m === "leave") {
          bs.m = "wait";
          bs.t = 18 + Math.random() * 22;
          return;
        }
        bf.position.set(T[0], T[1], T[2]);
        bs.m = "land";
        bs.st = 3 + Math.random() * 2.5;
      } else {
        bf.position.x += dx / d * sp * dt + Math.sin(t / 260) * 0.35 * dt * wb;
        bf.position.y += dy / d * sp * dt + Math.sin(t / 190) * 0.45 * dt * wb;
        bf.position.z += dz / d * sp * dt + Math.cos(t / 310) * 0.35 * dt * wb;
        bf.rotation.y = Math.atan2(-dx, -dz);
        a = Math.sin(t * 0.035) * 0.85;
      }
    } else {
      bs.st -= dt;
      a = Math.sin(t * 0.004) * 0.28 + 0.2;
      if (bs.st <= 0) {
        if (bs.q.length) {
          bs.tg = BL[bs.q.shift()];
          bs.m = "fly";
        } else {
          const an = Math.random() * 6.28;
          bs.tg = [Math.cos(an) * 9, 4.5, Math.sin(an) * 9];
          bs.m = "leave";
        }
      }
    }
    wR.rotation.y = -a;
    wL.rotation.y = a;
  }
  // cat paw prints that fade out over 3 seconds

  /* ===== 14. CAT PAW PRINTS ===== */
  const PR = [];
  for (let i = 0; i < 22; i++) {
    const g = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: "#6b4426", transparent: true, opacity: 0, depthWrite: false });
    [[0, 0, 0.045], [-0.04, 0.06, 0.021], [0, 0.078, 0.021], [0.04, 0.06, 0.021]].forEach(q => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(q[2], 12), m);
      c.rotation.x = -Math.PI / 2;
      c.position.set(q[0], 0, q[1]);
      g.add(c);
    });
    g.visible = false;
    S.add(g);
    PR.push({ g, m, l: 0 });
  }
  let lpx = 0;
  let lpz = 0;
  let lside = 1;

  function trailUpd(dt) {
    if (Math.hypot(cat.position.x - lpx, cat.position.z - lpz) > 0.3) {
      const p = PR.find(q => q.l <= 0);
      if (p) {
        p.l = 1;
        p.g.visible = true;
        const h = cat.rotation.y;
        lside = -lside;
        p.g.position.set(cat.position.x + Math.cos(h) * 0.05 * lside, 0.025, cat.position.z - Math.sin(h) * 0.05 * lside);
        p.g.rotation.y = h;
      }
      lpx = cat.position.x;
      lpz = cat.position.z;
    }
    PR.forEach(p => {
      if (p.l > 0) {
        p.l -= dt / 3;
        p.m.opacity = Math.max(0, p.l) * 0.8;
        if (p.l <= 0) {
          p.g.visible = false;
        }
      }
    });
  }
  // cigarette pack beside him: he takes a cigarette from it before each smoke

  /* ===== 15. CIGARETTE PACK BESIDE HIM ===== */
  const pk = new THREE.Group();
  pk.position.set(1.09, 0.047, 0.44);
  pk.rotation.y = 0.82;
  S.add(pk);
  P(pk, B(0.085, 0.022, 0.055), "#e6dfcf", [0, 0, 0], null, 0.7);
  P(pk, B(0.02, 0.0235, 0.056), "#9b4130", [-0.015, 0, 0], null, 0.7);
  rot(P(pk, B(0.03, 0.006, 0.056), "#c9c1af", [0.05, 0.015, 0], null, 0.7), 0, 0, -0.5);
  const packCig = rot(P(pk, Cy(0.0045, 0.0045, 0.06, 8), "#eadfc9", [0.07, 0.016, 0.01]), 0, 0, Math.PI / 2);
  rot(P(pk, Cy(0.0045, 0.0045, 0.055, 8), "#eadfc9", [0.068, 0.016, -0.01]), 0, 0, Math.PI / 2);

  // ===== mountains and a winding river behind the tree; both follow the weather (snowy peaks, frozen river) =====

  /* ===== 16. MOUNTAINS AND RIVER (follow the weather) ===== */
  const ENV = {
    cozy: { r: "#7a6a58", c: "#f4efe6", k: 0.55, w: "#5aa7c4", f: 0 },
    autumn: { r: "#86623f", c: "#f2ebdd", k: 0.45, w: "#7fae9c", f: 0 },
    rain: { r: "#566068", c: "#dfe5ea", k: 0.4, w: "#4d7488", f: 0 },
    snow: { r: "#aab3c1", c: "#ffffff", k: 1.35, w: "#d9e9f2", f: 1 },
    night: { r: "#2b3042", c: "#a9b5d0", k: 0.6, w: "#27407a", f: 0 },
    fog: { r: "#98a4aa", c: "#e1e7ea", k: 0.4, w: "#88a5b3", f: 0 },
    storm: { r: "#3d464f", c: "#c9d1d8", k: 0.45, w: "#34505e", f: 0 },
    dusk: { r: "#6a4c60", c: "#f5dfe6", k: 0.55, w: "#8d7aa8", f: 0 },
    sakura: { r: "#8a7a78", c: "#fff3f6", k: 0.5, w: "#9cc0d0", f: 0 },
    blossom: { r: "#b6bccb", c: "#ffffff", k: 1.2, w: "#dfeaf3", f: 1 },
    aurora: { r: "#1f2c3c", c: "#9bc4d6", k: 0.8, w: "#16304a", f: 0 }
  };
  const jit = geo => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const n = Math.sin(x * 1.3 + z * 0.9) * Math.cos(z * 1.1 - x * 0.4);
      p.setXYZ(i, x * (1 + 0.16 * n), y + 0.5 * n, z * (1 + 0.16 * n));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const rockM = new THREE.MeshStandardMaterial({ color: "#7a6a58", roughness: 0.95, flatShading: true, fog: false });
  const capM = new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.8, flatShading: true, fog: false });
  const caps = [];
  [
    [-14, -30, 9, 10],
    [-2, -35, 12, 14],
    [12, -31, 9, 9.5],
    [25, -27, 8, 8],
    [-27, -25, 8, 8.5],
    [5, -42, 16, 12]
  ].forEach(m => {
    const r = new THREE.Mesh(jit(new THREE.ConeGeometry(m[2], m[3], 8, 3)), rockM);
    r.position.set(m[0], m[3] / 2 - 1, m[1]);
    S.add(r);
    const ch = m[3] * 0.45;
    const cg = new THREE.ConeGeometry(m[2] * 0.47, ch, 8, 2);
    cg.translate(0, -ch / 2, 0);
    const c = new THREE.Mesh(jit(cg), capM);
    c.position.set(m[0], m[3] - 1.02, m[1]);
    S.add(c);
    caps.push(c);
  });
  const rc = x => -6 + 1.6 * Math.sin(x * 0.2);
  const RN2 = 60;
  const rv = [];
  const rIdx = [];
  const ruv = [];
  for (let i = 0; i <= RN2; i++) {
    const x = -26 + i * (52 / RN2);
    const z = rc(x);
    const w = 2 + 0.5 * Math.sin(x * 0.3);
    rv.push(x, 0.035, z - w, x, 0.035, z + w);
    ruv.push(i / 6, 0, i / 6, 1);
    if (i < RN2) {
      rIdx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.Float32BufferAttribute(rv, 3));
  rg.setAttribute("uv", new THREE.Float32BufferAttribute(ruv, 2));
  rg.setIndex(rIdx);
  rg.computeVertexNormals();
  const WT = (() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#b8b8b8";
    x.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 140; i++) {
      const y = Math.random() * 128;
      const l = 30 + Math.random() * 90;
      const px = Math.random() * 256;
      x.strokeStyle = Math.random() < 0.6 ? "rgba(255,255,255,.55)" : "rgba(60,80,100,.35)";
      x.lineWidth = 1 + Math.random() * 2;
      x.beginPath();
      x.moveTo(px, y);
      x.lineTo(px + l, y);
      x.stroke();
      x.beginPath();
      x.moveTo(px - 256, y);
      x.lineTo(px - 256 + l, y);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.6, 1);
    return t;
  })();
  const water = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({
    color: "#5aa7c4",
    map: WT,
    roughness: 0.15,
    metalness: 0.25,
    transparent: true,
    opacity: 0.95,
    fog: false
  }));
  water.receiveShadow = true;
  S.add(water);
  const rk = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({
    color: "#6b6760",
    roughness: 0.95,
    flatShading: true
  }), 70);
  const dm = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    const x = -25 + Math.random() * 50;
    const side = i % 2 ? 1 : -1;
    const s = 0.5 + Math.random() * 1.1;
    dm.position.set(x, 0.08, rc(x) + side * (2.4 + Math.random() * 0.8));
    dm.scale.set(s, s * 0.6, s);
    dm.rotation.set(Math.random(), Math.random() * 3, 0);
    dm.updateMatrix();
    rk.setMatrixAt(i, dm.matrix);
  }
  rk.castShadow = true;
  S.add(rk);
  const fm = [];
  const fmat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false });
  const fz = { v: 0 };
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.05), fmat);
    m.rotation.x = -Math.PI / 2;
    m.userData = { x: -26 + Math.random() * 52, o: (Math.random() - 0.5) * 1.6, sp: 0.5 + Math.random() * 0.5 };
    S.add(m);
    fm.push(m);
  }

  function envUpd(dt, t) {
    const e = ENV[wx];
    const k = calm || snap > 0 ? 1 : 0.03;
    rockM.color.lerp(tmp.set(e.r), k);
    capM.color.lerp(tmp.set(e.c), k);
    fz.v += (e.f - fz.v) * k;
    caps.forEach(c => {
      const s = c.scale.x + (e.k - c.scale.x) * k;
      c.scale.set(s, s, s);
    });
    water.material.color.lerp(tmp.set(e.w), k);
    water.material.roughness = 0.12 + 0.3 * fz.v;
    water.material.metalness = 0.35 - 0.25 * fz.v;
    water.material.opacity = 0.88 + 0.12 * fz.v;
    fmat.opacity = 0.35 * (1 - fz.v);
    fm.forEach(m => {
      const u = m.userData;
      if (!calm) {
        u.x += u.sp * dt * (1 - fz.v);
      }
      if (u.x > 26) {
        u.x = -26;
      }
      m.position.set(u.x, 0.045, rc(u.x) + u.o * 1.2);
      m.visible = fz.v < 0.9;
    });
  }
  // hair tufts so the head reads as hair, not a smooth cap

  /* ===== 17. HAIR TUFTS ===== */
  const up = new THREE.Vector3(0, 1, 0);
  const hn = new THREE.Vector3();
  const mergeG = gs => {
    let n = 0;
    let ni = 0;
    gs.forEach(g => {
      n += g.attributes.position.count;
      ni += g.index.count;
    });
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    const idx = new Uint32Array(ni);
    let o = 0;
    let oi = 0;
    gs.forEach(g => {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      uv.set(g.attributes.uv.array, o * 2);
      g.index.array.forEach((v, i) => {
        idx[oi + i] = v + o;
      });
      o += g.attributes.position.count;
      oi += g.index.count;
      g.dispose();
    });
    const m = new THREE.BufferGeometry();
    m.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    m.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    m.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    m.setIndex(new THREE.BufferAttribute(idx, 1));
    return m;
  };
  const tufts = [];
  const tM = new THREE.Matrix4();
  const tQ = new THREE.Quaternion();
  const tP = new THREE.Vector3();
  const tS = new THREE.Vector3(1, 1, 1);
  const tuft = (rad, L, x, y, z) => {
    const g = new THREE.ConeGeometry(rad, L, 5);
    tQ.setFromUnitVectors(up, hn);
    tM.compose(tP.set(x, y, z), tQ, tS);
    g.applyMatrix4(tM);
    tufts.push(g);
  };
  for (let i = 0; i < 90; i++) {
    const th = 0.12 + Math.random() * 1.4;
    const ph = Math.random() * 6.2832;
    const x = 0.119 * Math.sin(th) * Math.cos(ph);
    const y = 0.129 * Math.cos(th);
    const z = 0.1217 * Math.sin(th) * Math.sin(ph);
    if (z > 0.01 && 0.12 + y < 0.215) {
      continue;
    }
    hn.set(x / 0.0142, y / 0.01664, z / 0.0148).normalize();
    const L = 0.035 + Math.random() * 0.035;
    tuft(0.014, L, x + hn.x * L * 0.4, 0.12 + y + hn.y * L * 0.4, -0.03 + z + hn.z * L * 0.4);
  }
  for (let i = 0; i < 11; i++) {
    const L = 0.045 + Math.random() * 0.02;
    hn.set((i - 5) * 0.05, -0.55, 0.85).normalize();
    tuft(0.013, L, (i - 5) * 0.014 + hn.x * L / 2, 0.205 + hn.y * L / 2, 0.062 + hn.z * L / 2);
  }
  P(hd, mergeG(tufts), HM, [0, 0, 0]);
  // mist, floating dust, stars, moon, lightning

  /* ===== 18. MIST, DUST, STARS, MOON, LIGHTNING ===== */
  const MIST = {
    cozy: 0.08,
    autumn: 0.15,
    rain: 0.4,
    snow: 0.3,
    night: 0.35,
    fog: 1,
    storm: 0.5,
    dusk: 0.25,
    sakura: 0.18,
    blossom: 0.4,
    aurora: 0.3
  };
  const mcv = document.createElement("canvas");
  mcv.width = mcv.height = 128;
  const mx = mcv.getContext("2d");
  const mgr = mx.createRadialGradient(64, 64, 0, 64, 64, 64);
  mgr.addColorStop(0, "rgba(255,255,255,.9)");
  mgr.addColorStop(1, "rgba(255,255,255,0)");
  mx.fillStyle = mgr;
  mx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(mcv);
  const mistM = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    color: "#ffffff"
  });
  const mist = [];
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(mistM);
    const s = 4 + Math.random() * 5;
    sp.scale.set(s, s * 0.55, 1);
    sp.position.set((Math.random() - 0.5) * 26, 0.3 + Math.random() * 1.5, (Math.random() - 0.5) * 26 - 2);
    sp.userData = { sp: 0.1 + Math.random() * 0.15 };
    S.add(sp);
    mist.push(sp);
  }
  const mo = pts(140, 0.04, "#ffe9bd");
  const sa = new Float32Array(960);
  for (let i = 0; i < 320; i++) {
    const th = Math.random() * 6.2832;
    const y = 0.08 + Math.random() * 0.9;
    const r = Math.sqrt(1 - y * y);
    sa[i * 3] = Math.cos(th) * r * 55;
    sa[i * 3 + 1] = y * 55;
    sa[i * 3 + 2] = Math.sin(th) * r * 55;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sa, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({
    color: "#ffffff",
    size: 1.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    fog: false,
    depthWrite: false
  }));
  stars.frustumCulled = false;
  stars.visible = false;
  S.add(stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: "#dfe6ff",
    transparent: true,
    opacity: 0,
    fog: false,
    depthWrite: false
  }));
  moon.scale.set(7, 7, 1);
  moon.position.set(-14, 17, -36);
  moon.visible = false;
  S.add(moon);
  const aur = WORLD.aurora({ THREE, S });
  const bolt = new THREE.PointLight("#cfd8ff", 0, 70);
  bolt.position.set(-5, 14, -10);
  S.add(bolt);
  const bt = { v: 6 };

  function calmUpd(dt, t) {
    const k = calm || snap > 0 ? 1 : 0.03;
    aur.update(dt, t, wx === "aurora");
    WT.offset.x -= calm ? 0 : dt * 0.2 * (1 - fz.v);
    mistM.opacity += (MIST[wx] * 0.55 - mistM.opacity) * k;
    mistM.color.lerp(tmp.copy(S.background).lerp(tmp2.set("#ffffff"), 0.45), k);
    if (!calm) {
      mist.forEach(s => {
        s.position.x += s.userData.sp * dt;
        if (s.position.x > 14) {
          s.position.x = -14;
        }
      });
    }
    const MO = { cozy: 0.6, autumn: 0.5, dusk: 0.7, fog: 0.25 };
    mo.p.material.opacity += ((MO[wx] || 0) - mo.p.material.opacity) * k;
    mo.p.visible = mo.p.material.opacity > 0.02;
    if (mo.p.visible && !calm) {
      const a = mo.a;
      for (let i = 0; i < 140; i++) {
        a[i * 3 + 1] += 0.04 * dt;
        if (a[i * 3 + 1] > 5) {
          a[i * 3 + 1] = 0.2;
        }
        a[i * 3] += Math.sin(t / 1200 + i) * 0.002;
      }
      mo.p.geometry.attributes.position.needsUpdate = true;
    }
    stars.material.opacity += ((wx === "night" || wx === "aurora" ? 0.95 : wx === "dusk" ? 0.25 : 0) - stars.material.opacity) * k;
    moon.material.opacity += ((wx === "night" || wx === "aurora" ? 0.9 : wx === "dusk" ? 0.3 : 0) - moon.material.opacity) * k;
    stars.visible = stars.material.opacity > 0.02;
    moon.visible = moon.material.opacity > 0.02;
    if (!calm) {
      canopy.forEach((m, i) => {
        m.rotation.z = Math.sin(t / 2300 + i) * 0.02;
        m.rotation.x = Math.cos(t / 2900 + i) * 0.015;
      });
    }
    if (wx === "storm" && !calm) {
      bt.v -= dt;
      if (bt.v <= 0) {
        bt.v = 4 + Math.random() * 8;
        bolt.intensity = 9;
        setTimeout(() => {
          bolt.intensity = 6;
        }, 120);
        setTimeout(thunder, 500 + Math.random() * 1200);
      }
    }
    bolt.intensity *= 0.88;
  }
  // collision: animals walk around the trunk, Giri and the objects

  /* ===== 19. COLLISIONS AND GIRI'S POSE EACH FRAME ===== */
  const OB = W.obstacles;
  const push = p => OB.forEach(o => {
    const dx = p.x - o[0];
    const dz = p.z - o[1];
    const d = Math.hypot(dx, dz);
    const m = o[2] + 0.18;
    if (d < m && d > 0.001) {
      p.x = o[0] + dx / d * m;
      p.z = o[1] + dz / d * m;
    }
  });
  const SIT = [0.13, -1.45, 0.12, -0.22, -0.5, -1.5, -0.3, -0.9, 0.12];
  const cur = SIT.slice();
  const gs = { x: 0.73, z: 0.68, h: 0.82 };
  const cabC = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
  const cabV = new THREE.Vector3();

  function giriUpd(dt, t) {
    const k = Math.min(1, dt * 3.5);
    const tgt = SIT.slice();
    ss.g = (ss.g || 0) + ((ss.st === "grab" ? 1 : 0) - (ss.g || 0)) * Math.min(1, dt * 3);
    tgt[3] += 0.2 * ss.g;
    tgt[6] = (-0.3 - 0.15 * ss.u) * (1 - ss.g) - 0.12 * ss.g;
    tgt[7] = (-0.9 - 1.4 * ss.u) * (1 - ss.g) - 0.35 * ss.g;
    tgt[8] = 0.12 - 0.17 * ss.u + 0.12 * ss.g;
    for (let i = 0; i < 9; i++) {
      cur[i] += (tgt[i] - cur[i]) * k;
    }
    G.position.set(gs.x, 0, gs.z);
    G.rotation.y = gs.h;
    hip.position.y = cur[0];
    tor.rotation.x = cur[3];
    hd.rotation.x = cur[8];
    hd.rotation.y = Math.sin(t / 3400) * 0.3;
    tor.scale.y = 1 + Math.sin(t / 850) * 0.006;
    legs[0].th.rotation.set(-2.27, -0.2, 0);
    legs[1].th.rotation.set(cur[1], 0.25, 0);
    legs[0].kn.rotation.x = 1.77;
    legs[1].kn.rotation.x = cur[2];
    arms[1].sh.rotation.z = ss.g * 0.45;
    arms[0].sh.rotation.set(cur[4], 0, 0);
    arms[0].el.rotation.x = cur[5];
    arms[1].sh.rotation.x = cur[6];
    arms[1].el.rotation.x = cur[7];
    cig.position.z = 0.02 - 0.06 * cig.scale.y;
    ember.position.z = 0.02 - 0.12 * cig.scale.y;
    OBJ.me.pos = [gs.x, 1.1, gs.z];
    hd.localToWorld(ea.set(-0.12, 0.09, 0));
    mid.copy(ea).add(pl).multiplyScalar(0.5);
    mid.y = Math.max(0.1, mid.y - 0.35);
    const pa = cable.geometry.attributes.position;
    cabC.points[0].copy(ea);
    cabC.points[1].copy(mid);
    cabC.points[2].copy(pl);
    for (let i = 0; i < 14; i++) {
      cabC.getPoint(i / 13, cabV);
      pa.setXYZ(i, cabV.x, cabV.y, cabV.z);
    }
    pa.needsUpdate = true;
  }

  // ===== tea: now and then he sips from the cup; when it is empty he fills it from the kettle, then sips again =====

  /* ===== 20. TEA: sipping, and refilling from the kettle (arm IK) ===== */
  const TEA = W.tea;
  const cupG = TEA.cup;
  const ketG = TEA.kettle;
  const cu = cupG.userData;
  const ch = new THREE.Vector3(...TEA.cupHome);
  const kh = new THREE.Vector3(...TEA.ketHome);
  const tea = {
    st: "idle",
    t: 10,
    ph: 0,
    w: 0,
    lv: 1,
    lv0: 1,
    sw: 0.12,
    hot: 0.8,
    said: false,
    seq: null,
    i: 0,
    sm: 0
  };
  const XA = new THREE.Vector3(1, 0, 0);
  const YA = new THREE.Vector3(0, 1, 0);
  const QI = new THREE.Quaternion();
  const QK = new THREE.Quaternion().setFromAxisAngle(YA, TEA.ketYaw);
  const TV = {
    a: new THREE.Vector3(),
    p: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    hand: new THREE.Vector3(),
    cp: new THREE.Vector3(),
    cq: new THREE.Quaternion(),
    kp: new THREE.Vector3(),
    kq: new THREE.Quaternion(),
    tip: new THREE.Vector3()
  };
  const IK = {
    S: new THREE.Vector3(),
    u: new THREE.Vector3(),
    a: new THREE.Vector3(),
    p: new THREE.Vector3(),
    X: new THREE.Vector3(),
    Y: new THREE.Vector3(),
    Z: new THREE.Vector3(),
    M: new THREE.Matrix4(),
    q: new THREE.Quaternion(),
    pq: new THREE.Quaternion(),
    rq: new THREE.Quaternion(),
    e: new THREE.Euler()
  };
  const SEQ = { drink: ["reach", "lift", "sip", "down", "rel"], fill: ["kreach", "klift", "pour", "kback", "krel"] };
  const DUR = {
    reach: 1,
    lift: 1.1,
    sip: 1.8,
    down: 1.1,
    rel: 0.7,
    kreach: 1,
    klift: 1.4,
    pour: 2.8,
    kback: 1.4,
    krel: 0.7
  };
  const ez = u => {
    u = Math.max(0, Math.min(1, u));
    return u * u * (3 - 2 * u);
  };
  const CUPGRIP = [-0.075, 0.075, 0];
  // two-bone arm: reach the left hand to a world point (weight w blends from his resting pose)
  function armIK(T3, w) {
    const A = arms[0];
    const L1 = 0.29;
    const L2 = 0.31;
    const s = IK.S;
    const u = IK.u;
    const a = IK.a;
    const p = IK.p;
    A.sh.getWorldPosition(s);
    u.subVectors(T3, s);
    const d = Math.min(L1 + L2 - 0.01, Math.max(0.12, u.length()));
    u.normalize();
    const al = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const phi = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
    const h = gs.h;
    p.set(-Math.cos(h) * 0.6 - Math.sin(h) * 0.2, -0.8, Math.sin(h) * 0.6 - Math.cos(h) * 0.2);
    p.addScaledVector(u, -p.dot(u));
    if (p.lengthSq() < 0.0001) {
      p.set(0, -1, 0);
    }
    p.normalize();
    a.copy(u).multiplyScalar(Math.cos(al)).addScaledVector(p, Math.sin(al));
    IK.Y.copy(a).negate();
    IK.Z.copy(u).addScaledVector(a, -u.dot(a));
    if (IK.Z.lengthSq() < 0.000001) {
      IK.Z.set(0, 0, 1);
    }
    IK.Z.normalize();
    IK.X.crossVectors(IK.Y, IK.Z);
    IK.M.makeBasis(IK.X, IK.Y, IK.Z);
    IK.q.setFromRotationMatrix(IK.M);
    A.sh.parent.getWorldQuaternion(IK.pq);
    IK.q.premultiply(IK.pq.invert());
    IK.e.set(cur[4], 0, 0);
    IK.rq.setFromEuler(IK.e);
    A.sh.quaternion.copy(IK.rq).slerp(IK.q, w);
    A.el.rotation.x = cur[5] + (phi - Math.PI - cur[5]) * w;
    A.sh.updateMatrixWorld(true);
  }
  const yawTilt = (q, th) => {
    q.setFromAxisAngle(YA, gs.h);
    TV.q.setFromAxisAngle(XA, th);
    return q.multiply(TV.q);
  };
  // cup pose with its rim at his lips, tipped back by th
  function cupAtLips(th, P, Q) {
    yawTilt(Q, -th);
    TV.a.set(0, 0.14, 0).applyQuaternion(Q);
    mouth.getWorldPosition(P);
    P.x += Math.sin(gs.h) * 0.012 - TV.a.x;
    P.y -= TV.a.y;
    P.z += Math.cos(gs.h) * 0.012 - TV.a.z;
  }
  // kettle pose with the spout over the middle of the cup, tipped forward by th
  function ketOverCup(th, P, Q) {
    yawTilt(Q, th);
    TV.a.set(TEA.tip[0], TEA.tip[1], TEA.tip[2]).applyQuaternion(Q);
    P.set(ch.x - TV.a.x, ch.y + 0.24 - TV.a.y, ch.z - TV.a.z);
  }
  const strm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), new THREE.MeshStandardMaterial({
    color: "#4a2a12",
    roughness: 0.2
  }));
  strm.visible = false;
  S.add(strm);

  function teaUpd(dt, t) {
    cu.set(tea.lv);
    if (calm) {
      return;
    }
    G.updateMatrixWorld(true);
    tea.sw += ((tea.st === "pour" ? 1.8 : 0.12) - tea.sw) * Math.min(1, dt * 2);
    cu.tex.rotation += dt * tea.sw;
    tea.hot = Math.max(0, tea.hot - dt / 150);
    if (tea.lv > 0.05 && tea.hot > 0) {
      tea.sm -= dt;
      if (tea.sm <= 0) {
        tea.sm = 1.6 + Math.random() * 1.2;
        puff(cupG.position.x, cupG.position.y + 0.16, cupG.position.z, 0.3 + tea.hot * 0.15);
      }
    }
    if (tea.st === "idle") {
      if (!current && !document.hidden && ss.st === "idle") {
        tea.t -= dt;
      }
      if (tea.t > 0) {
        return;
      }
      tea.seq = tea.lv > 0.05 ? SEQ.drink : SEQ.fill;
      tea.i = 0;
      tea.ph = 0;
      tea.st = tea.seq[0];
      tea.lv0 = tea.lv;
      tea.said = false;
    }
    const st = tea.st;
    const u = Math.min(1, tea.ph / DUR[st]);
    const isK = st[0] === "k" || st === "pour";
    tea.ph += dt;
    if (st === "reach") {
      tea.w = ez(u);
    } else if (st === "kreach") {
      tea.w = ez(u);
    } else if (st === "rel" || st === "krel") {
      tea.w = 1 - ez(u);
    } else {
      tea.w = 1;
    }
    if (st === "lift" || st === "down") {
      cupAtLips(0.15, TV.cp, TV.cq);
      const e = ez(st === "lift" ? u : 1 - u);
      cupG.position.lerpVectors(ch, TV.cp, e);
      cupG.quaternion.slerpQuaternions(QI, TV.cq, e);
      if (st === "down" && u > 0.93 && !tea.said) {
        tea.said = true;
        sfx("clink");
      }
    } else if (st === "sip") {
      cupAtLips(0.15 + 0.7 * ez(Math.sin(u * Math.PI)), cupG.position, cupG.quaternion);
      tea.lv = Math.max(0, tea.lv0 - 0.25 * ez((u - 0.35) / 0.3));
      if (u > 0.42 && !tea.said) {
        tea.said = true;
        sfx("sip");
        puff(cupG.position.x, cupG.position.y + 0.15, cupG.position.z, 0.4);
      }
    } else if (st === "rel") {
      cupG.position.copy(ch);
      cupG.quaternion.copy(QI);
    } else if (st === "klift" || st === "kback") {
      ketOverCup(0, TV.kp, TV.kq);
      const e = ez(st === "klift" ? u : 1 - u);
      ketG.position.lerpVectors(kh, TV.kp, e);
      ketG.quaternion.slerpQuaternions(QK, TV.kq, e);
      if (st === "kback" && u > 0.93 && !tea.said) {
        tea.said = true;
        sfx("kettle");
      }
    } else if (st === "pour") {
      const th = 0.7 * (u < 0.88 ? ez(u / 0.2) : 1 - ez((u - 0.88) / 0.12));
      ketOverCup(th, ketG.position, ketG.quaternion);
      tea.lv = tea.lv0 + (1 - tea.lv0) * ez((u - 0.12) / 0.7);
      tea.hot = 1;
      if (u > 0.1 && !tea.said) {
        tea.said = true;
        sfx("pour");
      }
      if (th > 0.35 && u > 0.12 && u < 0.9) {
        TV.tip.set(TEA.tip[0], TEA.tip[1], TEA.tip[2]).applyQuaternion(ketG.quaternion).add(ketG.position);
        const sy = ch.y + 0.034 + 0.09 * tea.lv;
        const len = Math.max(0.01, TV.tip.y - sy);
        strm.visible = true;
        strm.position.set(TV.tip.x, sy + len / 2, TV.tip.z);
        strm.scale.set(1 + 0.2 * Math.sin(t / 55), len, 1 + 0.2 * Math.cos(t / 47));
      } else {
        strm.visible = false;
      }
    } else if (st === "krel") {
      ketG.position.copy(kh);
      ketG.quaternion.copy(QK);
      strm.visible = false;
    }
    if (tea.w > 0.001) {
      const o = isK ? ketG : cupG;
      const l = isK ? TEA.grip : CUPGRIP;
      TV.hand.set(l[0], l[1], l[2]).applyQuaternion(o.quaternion).add(o.position);
      armIK(TV.hand, tea.w);
    }
    if (tea.ph >= DUR[st]) {
      tea.i++;
      tea.ph = 0;
      tea.said = false;
      if (tea.i >= tea.seq.length) {
        tea.st = "idle";
        tea.w = 0;
        tea.t = 9 + Math.random() * 12;
        strm.visible = false;
      } else {
        tea.st = tea.seq[tea.i];
      }
    }
  }

  /* ===== 21. AUTOMATIC QUALITY: lowers render scale when frames are slow ===== */
  const qw = { n: 0, s: 0, lo: 0 };

  function qual(dt) {
    if (dt > 0.09) {
      return;
    }
    qw.n++;
    qw.s += dt;
    if (qw.n < 90) {
      return;
    }
    const ms = qw.s / qw.n * 1000;
    qw.n = 0;
    qw.s = 0;
    if (Q.debug) {
      const el = $("#perf");
      if (el) {
        el.textContent = (1000 / ms).toFixed(0) + " fps | " + ms.toFixed(1) + " ms | scale " + Q.pr.toFixed(2) + " | calls " + R.info.render.calls + " | tris " + R.info.render.triangles;
      }
    }
    if (ms > 22 && Q.pr > Q.min) {
      Q.pr = Math.max(Q.min, Q.pr * 0.85);
      R.setPixelRatio(Q.pr);
      rs();
      qw.lo = 0;
    } else if (ms < 13 && Q.pr < Q.cap) {
      if (++qw.lo >= 4) {
        Q.pr = Math.min(Q.cap, Q.pr * 1.1);
        R.setPixelRatio(Q.pr);
        rs();
        qw.lo = 0;
      }
    } else {
      qw.lo = 0;
    }
  }

  /* ===== 22. MAIN FRAME: runs every animation frame ===== */
  tick = t => {
    const dt = Math.min((t - (tick.l || t)) / 1000, 0.1);
    tick.l = t;
    const k = calm ? 1 : 0.06;
    for (const p of [
        "tx",
        "ty",
        "tz",
        "th",
        "ph",
        "r"
      ]) {
      cam[p] += (goal[p] - cam[p]) * k;
    }
    if (started && !current && !dragging && !calm) {
      goal.th += 0.0007;
    }
    K.position.set(cam.tx + cam.r * Math.sin(cam.ph) * Math.sin(cam.th), cam.ty + cam.r * Math.cos(cam.ph), cam.tz + cam.r * Math.sin(cam.ph) * Math.cos(cam.th));
    K.position.y = Math.max(K.position.y, 0.4);
    K.lookAt(cam.tx, cam.ty, cam.tz);
    if (!calm) {
      K.position.y += Math.sin(t / 2500) * 0.03;
    }
    if (!calm) {
      ff.position.y = Math.sin(t / 1800) * 0.15;
      ff.rotation.y = t / 22000;
      ff.material.opacity = 0.6 + Math.sin(t / 400) * 0.2;
      lamp.intensity = WX[wx].lamp + Math.sin(t / 230) * 0.15 + epiBoost;
      epiBoost *= 0.996;
    }
    if (ri < reveal.length) {
      for (let j = 0; j < Math.ceil(reveal.length / 150) && ri < reveal.length; j++) {
        reveal[ri++].visible = true;
      }
    }
    wxUpd(dt, t);
    W.step(dt, t);
    W.tree.update(dt, wx);
    catUpd(dt, t);
    hop(cf, dt);
    hop(cb, dt);
    hop(cf2, dt);
    hop(cb2, dt);
    smokeUpd(dt, t);
    ripUpd(dt);
    giriUpd(dt, t);
    teaUpd(dt, t);
    bfUpd(dt, t);
    trailUpd(dt);
    envUpd(dt, t);
    calmUpd(dt, t);
    if (snap > 0) {
      snap--;
    }
    if (started && !current && !calm && opened.size < 2) {
      hint.t -= dt;
      if (hint.t <= 0) {
        hint.t = 6;
        const ks = Object.keys(OBJ).filter(k => !opened.has(k));
        hint.k = ks[Math.random() * ks.length | 0];
        hint.on = 2.2;
      }
    }
    hint.on = Math.max(0, hint.on - dt);
    const hk = hoverK || (hint.on > 0 ? hint.k : null);
    if (hk) {
      glow.position.set(OBJ[hk].pos[0], OBJ[hk].pos[1] + 0.3, OBJ[hk].pos[2]);
    }
    glow.intensity += ((hk ? hoverK ? 1.2 : 0.7 + 0.5 * Math.sin(t / 250) : 0) - glow.intensity) * 0.15;
    if (hk) {
      ring.position.set(OBJ[hk].pos[0], 0.045, OBJ[hk].pos[2]);
    }
    ring.material.opacity += ((hk ? 0.55 : 0) - ring.material.opacity) * 0.15;
    ring.visible = ring.material.opacity > 0.02;
    ring.scale.setScalar(1 + 0.08 * Math.sin(t / 300));
    R.render(S, K);
    qual(dt);
  };

  /* ===== 23. RESIZE ===== */
  const rs = () => {
    R.setSize(innerWidth, innerHeight, false);
    K.aspect = innerWidth / innerHeight;
    K.updateProjectionMatrix();
  };
  addEventListener("resize", rs);
  rs();
} catch (e) {
  gl = false;
  $("#c").style.display = "none";
  document.body.classList.add("nogl");
  $("#cap").textContent = "The 3D scene can\u2019t run on this device, so everything is here in plain form.";
}
