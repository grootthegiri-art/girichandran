/* ============================================================================
   world.js: the 3D models, layout, gravity and behaviour of the objects, tree and cat.
   Loaded before scene.js, which calls WORLD.build(...). Sections: tree, then one function per object.
   ============================================================================ */
window.WORLD = function () {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const LUMPS = [
    [0, 5.6, 0, 2.3],
    [1.4, 5.2, 0.4, 1.7],
    [-1.5, 5.4, -0.3, 1.8],
    [0.2, 6.7, -0.3, 1.6],
    [-0.4, 5, 1.4, 1.2],
    [1.1, 6.3, -1, 1.5],
    [-1.3, 6.2, 0.8, 1.4],
    [0, 4.6, -1.5, 1.4]
  ];
  const LEAF = {
    cozy: ["#6b7a3a", "#7d8c45", "#5e6b35"],
    autumn: ["#c9722b", "#b5472a", "#d9a441", "#a8501f"],
    rain: ["#4a6a3e", "#3f5a36", "#557a48"],
    snow: ["#f2f6fa", "#dfe8f0", "#c9d6e2", "#f8fbff"],
    night: ["#2c3f3a", "#24342f", "#33473f"],
    fog: ["#7e8c76", "#6f7d68", "#8a9680"],
    storm: ["#2f4a3a", "#26403a", "#355142"],
    dusk: ["#a86a86", "#8a5a7a", "#c07f98"],
    sakura: ["#f6b8cf", "#f09ab8", "#ffd9e6", "#f7a6c2"],
    blossom: ["#f8fbff", "#f6b8cf", "#ffe3ee", "#dfe8f0"],
    aurora: ["#1f4a52", "#2a5f5a", "#244552"]
  };

  function build(ctx) {
    const T = ctx.THREE;
    const S = ctx.S;
    const NT = ctx.NT;
    const seat = ctx.seat;
    const C = ctx.C;
    const mat = (c, o) => {
      o = o || {};
      const m = new T.MeshStandardMaterial({
        color: c,
        roughness: o.r == null ? 0.8 : o.r,
        metalness: o.m || 0,
        map: NT,
        emissive: o.e || "#000000",
        transparent: !!o.t,
        opacity: o.t || 1
      });
      ctx.mats.push(m);
      return m;
    };
    const put = (g, geo, m, p, r, s) => {
      const me = new T.Mesh(geo, m);
      if (p) {
        me.position.set(p[0], p[1], p[2]);
      }
      if (r) {
        me.rotation.set(r[0], r[1], r[2]);
      }
      if (s) {
        me.scale.set(s[0], s[1], s[2]);
      }
      me.castShadow = me.receiveShadow = true;
      g.add(me);
      return me;
    };
    const rb = (w, h, d, r) => {
      const bv = Math.min(0.012, d / 4);
      const bs = bv * 0.8;
      const ww = w - 2 * bs;
      const hh = h - 2 * bs;
      const x = -ww / 2;
      const y = -hh / 2;
      r = Math.min(r, ww / 2 - 0.001, hh / 2 - 0.001);
      const s = new T.Shape();
      s.moveTo(x + r, y);
      s.lineTo(x + ww - r, y);
      s.quadraticCurveTo(x + ww, y, x + ww, y + r);
      s.lineTo(x + ww, y + hh - r);
      s.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh);
      s.lineTo(x + r, y + hh);
      s.quadraticCurveTo(x, y + hh, x, y + hh - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      const g = new T.ExtrudeGeometry(s, {
        depth: d - 2 * bv,
        bevelEnabled: true,
        bevelThickness: bv,
        bevelSize: bs,
        bevelSegments: 2,
        curveSegments: 6
      });
      g.translate(0, 0, -(d - 2 * bv) / 2);
      return g;
    };
    const grp = (x, y, z, ry) => {
      const g = new T.Group();
      g.position.set(x, y, z);
      g.rotation.y = ry || 0;
      S.add(g);
      return g;
    };
    const face = (x, z) => Math.atan2(seat[0] - x, seat[1] - z);
    const Cy = (a, b, h, n) => new T.CylinderGeometry(a, b, h, n || 16);
    const Sp = (r, n) => new T.SphereGeometry(r, n || 14, 10);
    const up = new T.Vector3(0, 1, 0);
    const rod = (g, a, b, ra, rb2, m) => {
      const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const len = d.length();
      const me = put(g, Cy(rb2, ra, len, 8), m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      me.quaternion.setFromUnitVectors(up, d.normalize());
      return me;
    };
    const rocks = [];
    const drops = [];
    const OBS = [[0, 0, 0.95], [seat[0], seat[1], 0.55]];
    const pos = {};
    const land = {};
    const rock = (x, z, r, sq, flat) => {
      const g = new T.IcosahedronGeometry(1, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const a = p.getX(i);
        const b = p.getY(i);
        const c = p.getZ(i);
        const n = 1 + 0.18 * Math.sin(a * 3.1 + b * 2.3) * Math.cos(c * 2.7 + a);
        p.setXYZ(i, a * n, Math.min(Math.max(b * n, -0.55), flat ? 0.55 : 9), c * n);
      }
      g.computeVertexNormals();
      const sy = r * (sq || 0.6);
      const m = new T.Mesh(g, mat("#6f6a60", { r: 0.95 }));
      m.scale.set(r, sy, r * 0.9);
      m.position.set(x, sy * 0.5, z);
      m.rotation.y = rnd(0, 6);
      m.castShadow = m.receiveShadow = true;
      S.add(m);
      OBS.push([x, z, r * 0.8]);
      return sy * 0.5 + sy * (flat ? 0.55 : 1.05);
    };
    const drop = (g, y, delay) => {
      /* objects now start at rest on their spot (no falling from the sky); drops stays empty so step() has nothing to animate */
      g.position.y = y;
    };

    // ---------- tree: uneven trunk, roots, branches, leaves that follow the weather
    function tree() {
      const bark = mat("#4a3326", { r: 0.95 });
      const pr = [];
      const TS = 0.6;
      /* TS = trunk girth scale (shape kept, just slimmer) */
      for (let i = 0; i <= 16; i++) {
        const y = i / 16 * 5.4;
        const fl = 1 + 1.1 * Math.exp(-y * 1.6);
        pr.push(new T.Vector2((0.78 - 0.26 * (y / 5.4)) * fl * (1 + 0.06 * Math.sin(y * 3.1)), y));
      }
      const g = new T.LatheGeometry(pr, 22);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i);
        let y = p.getY(i);
        let z = p.getZ(i);
        const a = Math.atan2(z, x);
        const k = 1 + 0.11 * Math.sin(a * 5 + y * 1.3) + 0.07 * Math.sin(a * 11 - y * 2.1);
        x = x * k + 0.28 * Math.sin(y * 0.5) + 0.04 * y;
        z = z * k + 0.18 * Math.cos(y * 0.42);
        p.setXYZ(i, x * TS, y, z * TS);
      }
      g.computeVertexNormals();
      put(S, g, bark, [0, 0, 0]);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + rnd(-0.3, 0.3);
        rod(S, [Math.cos(a) * 0.7 * TS, 0.25, Math.sin(a) * 0.7 * TS], [
          Math.cos(a) * 1.9 * TS,
          0.02,
          Math.sin(a) * 1.9 * TS
        ], 0.2 * TS, 0.05, bark);
      }
      [[3.1, 1], [3.6, 2], [4.1, 4], [4.4, 6], [3.8, 7], [3.3, 3]].forEach(b => {
        const L = LUMPS[b[1]];
        const s = [0.18 * Math.sin(b[0] * 0.5), b[0], 0.1];
        rod(S, s, [L[0] * 0.7, L[1] - 0.7, L[2] * 0.7], 0.13, 0.035, bark);
      });
      const N = 650;
      const li = new T.InstancedMesh(new T.IcosahedronGeometry(0.2, 0), new T.MeshLambertMaterial({ color: 16777215 }), N);
      const d = new T.Object3D();
      const cols = [];
      const tgt = [];
      for (let i = 0; i < N; i++) {
        const L = LUMPS[i % LUMPS.length];
        const u = rnd(0, 6.28);
        const v = Math.acos(rnd(-0.6, 1));
        const r = L[3] * rnd(0.85, 1.08);
        const s = rnd(0.7, 1.5);
        d.position.set(L[0] + r * Math.sin(v) * Math.cos(u), L[1] + r * Math.cos(v) * 0.9, L[2] + r * Math.sin(v) * Math.sin(u));
        d.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
        d.scale.set(s, s * 0.55, s);
        d.updateMatrix();
        li.setMatrixAt(i, d.matrix);
        cols.push(new T.Color("#6b7a3a"));
        tgt.push(new T.Color("#6b7a3a"));
        li.setColorAt(i, cols[i]);
      }
      li.castShadow = true;
      S.add(li);
      let moving = 0;
      let last = "";
      return {
        update(dt, wx) {
          if (wx !== last) {
            last = wx;
            const pal = LEAF[wx] || LEAF.cozy;
            for (let i = 0; i < N; i++) {
              tgt[i].set(pal[i % pal.length]);
            }
            moving = ctx.snap() ? 1 : 150;
          }
          if (moving > 0) {
            const k = moving === 1 ? 1 : 0.06;
            moving--;
            for (let i = 0; i < N; i++) {
              cols[i].lerp(tgt[i], k);
              li.setColorAt(i, cols[i]);
            }
            li.instanceColor.needsUpdate = true;
          }
        }
      };
    }

    // ---------- objects: every one rests on the ground, a rock or a stump, and falls into place when the scene opens
    function camera() {
      const g = grp(0, 0, 0);
      const blk = mat("#1d1a17", { r: 0.85 });
      const met = mat("#c9c4b8", { r: 0.4, m: 0.45 });
      const dk = mat("#2a2724", { r: 0.5, m: 0.3 });
      const glass = mat("#0e1522", { r: 0.1, m: 0.4, e: "#0a1a33" });
      put(g, rb(0.52, 0.28, 0.22, 0.045), blk, [0, 0.2, 0]);
      put(g, rb(0.53, 0.07, 0.23, 0.03), met, [0, 0.375, 0]);
      put(g, rb(0.2, 0.1, 0.17, 0.035), met, [0, 0.46, 0]);
      put(g, rb(0.53, 0.05, 0.225, 0.025), met, [0, 0.065, 0]);
      const pr = [
        [0, 0],
        [0.12, 0],
        [0.12, 0.04],
        [0.15, 0.05],
        [0.15, 0.12],
        [0.13, 0.125],
        [0.13, 0.16],
        [0.15, 0.165],
        [0.15, 0.2],
        [0.125, 0.205],
        [0.115, 0.19],
        [0.1, 0.19],
        [0.09, 0.17],
        [0, 0.17]
      ].map(a => new T.Vector2(a[0], a[1]));
      const lens = put(g, new T.LatheGeometry(pr, 28), dk, [0, 0.21, 0.11], [Math.PI / 2, 0, 0]);
      put(g, new T.TorusGeometry(0.142, 0.006, 8, 28), mat("#9b4130", { r: 0.5 }), [0, 0.21, 0.27]);
      put(g, Sp(0.092, 18), glass, [0, 0.21, 0.265], null, [1, 1, 0.35]);
      put(g, Cy(0.036, 0.036, 0.035, 14), met, [-0.19, 0.43, 0]);
      put(g, Cy(0.02, 0.02, 0.03, 12), mat("#9b4130"), [0.18, 0.43, 0]);
      put(g, rb(0.09, 0.018, 0.03, 0.008), met, [0.1, 0.425, -0.06]);
      [-1, 1].forEach(s => put(g, new T.TorusGeometry(0.022, 0.006, 6, 12), met, [s * 0.27, 0.28, 0], [
        0,
        Math.PI / 2,
        0
      ]));
      const cur = new T.CatmullRomCurve3([
        new T.Vector3(0.27, 0.28, 0),
        new T.Vector3(0.38, 0.06, 0.1),
        new T.Vector3(0.55, 0.015, 0.32),
        new T.Vector3(0.5, 0.015, 0.6),
        new T.Vector3(0.25, 0.015, 0.7),
        new T.Vector3(0.02, 0.015, 0.42),
        new T.Vector3(-0.1, 0.05, 0.15),
        new T.Vector3(-0.27, 0.28, 0)
      ]);
      put(g, new T.TubeGeometry(cur, 40, 0.016, 6), mat("#5a3a28", { r: 0.9 }), null, null, [1, 1, 1]);
      return g;
    }
    function radio() {
      const g = grp(0, 0, 0);
      const wood = mat("#6b4528", { r: 0.7 });
      const cream = mat("#e7dcc0", { r: 0.6 });
      const brass = mat("#c8a24a", { r: 0.35, m: 0.5 });
      const dk = mat("#17120f", { r: 0.7 });
      put(g, rb(0.44, 0.28, 0.16, 0.04), wood, [0, 0.15, 0]);
      put(g, rb(0.17, 0.2, 0.02, 0.02), dk, [-0.1, 0.15, 0.085]);
      for (let i = 0; i < 5; i++) {
        put(g, new T.BoxGeometry(0.012, 0.17, 0.004), cream, [-0.15 + i * 0.025, 0.15, 0.097]);
      }
      put(g, rb(0.14, 0.06, 0.02, 0.01), cream, [0.1, 0.21, 0.085]);
      put(g, new T.BoxGeometry(0.006, 0.05, 0.006), mat("#9b4130"), [0.12, 0.21, 0.097]);
      [0.07, 0.15].forEach(x => put(g, Cy(0.032, 0.032, 0.03, 16), brass, [x, 0.1, 0.095], [Math.PI / 2, 0, 0]));
      put(g, new T.TorusGeometry(0.12, 0.011, 8, 20, Math.PI), brass, [0, 0.29, 0]);
      const ant = put(g, Cy(0.006, 0.009, 0.36, 8), mat("#aab0b6", { r: 0.3, m: 0.7 }), [0.17, 0.48, -0.04], [
        0,
        0,
        -0.32
      ]);
      put(g, Sp(0.014, 8), brass, [0.23, 0.65, -0.04]);
      [-0.15, 0.15].forEach(x => put(g, new T.BoxGeometry(0.05, 0.012, 0.1), dk, [x, 0.004, 0]));
      return g;
    }
    function reel() {
      const g = grp(0, 0, 0);
      const inner = new T.Group();
      g.add(inner);
      inner.position.y = 0.38;
      const flange = mat("#1d1a17", { r: 0.5, m: 0.3 });
      const film = mat("#241d17", { r: 0.4 });
      const hub = mat("#9b4130", { r: 0.5 });
      [-0.075, 0.075].forEach(z => {
        put(inner, Cy(0.38, 0.38, 0.02, 40), flange, [0, 0, z], [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * 6.28;
          put(inner, Cy(0.07, 0.07, 0.024, 16), mat("#0d0b0a"), [Math.cos(a) * 0.22, Math.sin(a) * 0.22, z], [
            Math.PI / 2,
            0,
            0
          ]);
        }
      });
      put(inner, Cy(0.31, 0.31, 0.13, 40), film, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(inner, Cy(0.09, 0.09, 0.18, 20), hub, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(inner, Cy(0.03, 0.03, 0.2, 12), mat("#0d0b0a"), [0, 0, 0], [Math.PI / 2, 0, 0]);
      const cur = new T.CatmullRomCurve3([
        new T.Vector3(0, -0.31, 0),
        new T.Vector3(0.1, -0.37, 0.15),
        new T.Vector3(0, -0.378, 0.4),
        new T.Vector3(-0.15, -0.378, 0.65),
        new T.Vector3(0.1, -0.378, 0.9)
      ]);
      put(inner, new T.TubeGeometry(cur, 30, 0.02, 6), film, null, null, [1, 0.35, 1]);
      return { g, inner };
    }
    function notebook() {
      const g = grp(0, 0, 0);
      const lea = mat("#7a2f22", { r: 0.7 });
      const pg = mat("#eadfc9", { r: 0.9 });
      put(g, rb(0.5, 0.05, 0.66, 0.012), lea, [0, 0.025, 0]);
      put(g, rb(0.45, 0.034, 0.61, 0.006), pg, [0.012, 0.04, 0]);
      for (let i = 0; i < 7; i++) {
        put(g, new T.BoxGeometry(0.38, 0.001, 0.004), mat("#b8a98a"), [0.012, 0.0575, -0.24 + i * 0.08]);
      }
      put(g, rb(0.022, 0.054, 0.67, 0.004), mat("#17120f"), [0.17, 0.027, 0]);
      put(g, new T.BoxGeometry(0.012, 0.002, 0.2), mat("#b03a2e"), [-0.05, 0.058, 0.42]);
      const pen = put(g, Cy(0.012, 0.012, 0.3, 10), mat("#1f2a4a", { r: 0.4, m: 0.3 }), [0.05, 0.075, 0.02], [
        0,
        0,
        Math.PI / 2
      ]);
      pen.rotation.y = 0.5;
      put(g, new T.ConeGeometry(0.012, 0.04, 10), mat("#c8a24a", { r: 0.3, m: 0.6 }), [0.19, 0.075, -0.06], [
        0,
        0,
        -Math.PI / 2
      ]).rotation.y = 0.5;
      return g;
    }
    function book() {
      const g = grp(0, 0, 0);
      const gr = mat("#2d4a3e", { r: 0.7 });
      const pg = mat("#efe6d2", { r: 0.9 });
      put(g, rb(0.5, 0.06, 0.66, 0.014), mat("#5a3a28", { r: 0.75 }), [0, 0.03, 0]);
      put(g, rb(0.46, 0.05, 0.6, 0.006), pg, [0.01, 0.03, 0]);
      const t = put(g, rb(0.46, 0.07, 0.62, 0.014), gr, [-0.01, 0.095, 0], [0, 0.12, 0]);
      put(t, rb(0.44, 0.045, 0.57, 0.006), pg, [0.01, 0, 0]);
      put(g, new T.BoxGeometry(0.015, 0.072, 0.58), mat("#c8a24a", { r: 0.4, m: 0.5 }), [
        -0.22,
        0.095,
        0
      ]).rotation.y = 0.12;
      return g;
    }
    function letter() {
      const g = grp(0, 0, 0);
      const paper = mat("#eadfc9", { r: 0.85 });
      put(g, rb(0.5, 0.012, 0.34, 0.004), paper, [0, 0.006, 0]);
      const s = new T.Shape();
      s.moveTo(-0.25, 0);
      s.lineTo(0.25, 0);
      s.lineTo(0, -0.15);
      s.lineTo(-0.25, 0);
      const fg = new T.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false });
      put(g, fg, mat("#dccfae", { r: 0.85 }), [0, 0.0135, -0.02], [Math.PI / 2, 0, 0]);
      put(g, Cy(0.042, 0.042, 0.012, 20), mat("#9b4130", { r: 0.5 }), [0, 0.02, 0.125]);
      put(g, rb(0.08, 0.003, 0.06, 0.01), mat("#b03a2e"), [-0.18, 0.0135, -0.08]);
      return g;
    }
    function polaroid() {
      const g = grp(0, 0, 0);
      const inner = new T.Group();
      g.add(inner);
      put(inner, rb(0.4, 0.48, 0.02, 0.006), mat("#f4efe3", { r: 0.7 }), [0, 0.24, 0]);
      put(inner, rb(0.34, 0.34, 0.008, 0.004), mat("#5a6a7a", { r: 0.5 }), [0, 0.28, 0.012]);
      return { g, inner };
    }
    function folder() {
      const g = grp(0, 0, 0);
      const inner = new T.Group();
      g.add(inner);
      put(inner, rb(0.52, 0.66, 0.02, 0.01), mat("#c9a46a", { r: 0.8 }), [0, 0.33, 0]);
      put(inner, rb(0.18, 0.06, 0.02, 0.01), mat("#c9a46a", { r: 0.8 }), [-0.14, 0.69, 0]);
      put(inner, rb(0.48, 0.6, 0.008, 0.004), mat("#fbf6e8", { r: 0.9 }), [0.01, 0.35, 0.016]);
      put(inner, rb(0.46, 0.02, 0.006, 0.003), mat("#9b4130"), [0, 0.62, 0.022]);
      return { g, inner };
    }
    function player() {
      const g = grp(0, 0, 0);
      put(g, rb(0.28, 0.05, 0.46, 0.02), mat("#3a3835", { r: 0.5, m: 0.3 }), [0, 0.025, 0]);
      put(g, rb(0.22, 0.004, 0.18, 0.01), mat("#14110f"), [0, 0.052, -0.08]);
      [-0.08, -0.027, 0.027, 0.08].forEach(x => put(g, rb(0.04, 0.012, 0.05, 0.005), mat("#c9c4b8", {
        r: 0.4,
        m: 0.4
      }), [x, 0.054, 0.14]));
      put(g, Cy(0.01, 0.01, 0.04, 8), mat("#aab0b6", { m: 0.6 }), [-0.12, 0.06, -0.2]);
      return g;
    }
    function lantern() {
      const g = grp(0, 0, 0);
      const dk = mat("#2b2a33", { r: 0.5, m: 0.4 });
      put(g, Cy(0.1, 0.12, 0.04, 18), dk, [0, 0.02, 0]);
      put(g, Cy(0.09, 0.09, 0.26, 18), mat("#ffd9a0", { r: 0.2, t: 0.35, e: "#ffb347" }), [0, 0.17, 0]);
      put(g, Sp(0.05, 12), mat("#ffcf7a", { e: "#ffb347" }), [0, 0.17, 0]);
      put(g, Cy(0.05, 0.11, 0.05, 18), dk, [0, 0.32, 0]);
      put(g, new T.TorusGeometry(0.08, 0.008, 6, 16, Math.PI), dk, [0, 0.34, 0]);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.78;
        put(g, new T.BoxGeometry(0.008, 0.26, 0.008), dk, [Math.cos(a) * 0.09, 0.17, Math.sin(a) * 0.09]);
      }
      return g;
    }
    function mug() {
      const g = grp(0, 0, 0);
      const m = mat("#d8d2c6", { r: 0.35 });
      m.side = T.DoubleSide;
      // hollow ceramic cup (inner wall and floor), so there is room for real liquid
      const pr = [
        [0, 0],
        [0.05, 0],
        [0.058, 0.008],
        [0.068, 0.12],
        [0.07, 0.14],
        [0.063, 0.14],
        [0.0605, 0.132],
        [0.056, 0.03],
        [0.05, 0.016],
        [0, 0.016]
      ].map(a => new T.Vector2(a[0], a[1]));
      put(g, new T.LatheGeometry(pr, 28), m, [0, 0, 0]);
      put(g, new T.TorusGeometry(0.04, 0.011, 8, 14, Math.PI), m, [0.07, 0.07, 0], [0, 0, -Math.PI / 2]);
      // coffee surface: dark with a creamy spiral that drifts slowly, like a stirred cup
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const x = cv.getContext("2d");
      const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
      gr.addColorStop(0, "#5a3318");
      gr.addColorStop(0.7, "#3a200e");
      gr.addColorStop(1, "#6d4424");
      x.fillStyle = gr;
      x.fillRect(0, 0, 256, 256);
      x.lineCap = "round";
      [[16, 0.16], [8, 0.4]].forEach(q => {
        for (let k = 0; k < 3; k++) {
          x.beginPath();
          for (let i = 0; i <= 90; i++) {
            const th = i / 90 * 9 + k * 2.094;
            const r = 8 + i / 90 * 104;
            i ? x.lineTo(128 + Math.cos(th) * r, 128 + Math.sin(th) * r) : x.moveTo(128 + Math.cos(th) * r, 128 + Math.sin(th) * r);
          }
          x.strokeStyle = "rgba(214,170,110," + q[1] + ")";
          x.lineWidth = q[0];
          x.stroke();
        }
      });
      x.beginPath();
      x.arc(128, 128, 118, 0, 6.29);
      x.strokeStyle = "rgba(214,170,110,.3)";
      x.lineWidth = 12;
      x.stroke();
      const tex = new T.CanvasTexture(cv);
      tex.center.set(0.5, 0.5);
      const side = new T.MeshStandardMaterial({ color: "#2b170a", roughness: 0.3 });
      const topM = new T.MeshStandardMaterial({
        color: "#ffffff",
        map: tex,
        roughness: 0.12,
        metalness: 0,
        emissive: "#1a0d05"
      });
      const liq = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 1, 28), [side, topM, side]);
      g.add(liq);
      const set = lv => {
        lv = Math.max(0, Math.min(1, lv));
        const h = 0.004 + 0.09 * lv;
        liq.scale.y = h;
        liq.position.y = 0.03 + h / 2;
        liq.visible = lv > 0.01;
      };
      set(1);
      g.userData = { tex, set };
      return g;
    }
    function kettle() {
      const g = grp(0, 0, 0);
      const body = mat("#3d4a52", { r: 0.4, m: 0.5 });
      const lid = mat("#9a9a96", { r: 0.35, m: 0.6 });
      const dk = mat("#17120f", { r: 0.6 });
      const pr = [
        [0, 0],
        [0.1, 0],
        [0.115, 0.02],
        [0.118, 0.09],
        [0.1, 0.15],
        [0.062, 0.172],
        [0, 0.172]
      ].map(a => new T.Vector2(a[0], a[1]));
      put(g, new T.LatheGeometry(pr, 28), body, [0, 0, 0]);
      put(g, Cy(0.06, 0.06, 0.012, 20), lid, [0, 0.178, 0]);
      put(g, Sp(0.02, 10), dk, [0, 0.2, 0]);
      rod(g, [0, 0.07, 0.1], [0, 0.165, 0.19], 0.032, 0.016, body);
      put(g, new T.TorusGeometry(0.09, 0.009, 8, 20, Math.PI), dk, [0, 0.15, 0], [0, Math.PI / 2, 0]);
      g.userData = { grip: [0, 0.24, 0], tip: [0, 0.165, 0.19] };
      return g;
    }
    function pack() {
      const g = grp(0, 0, 0);
      put(g, rb(0.42, 0.52, 0.24, 0.08), mat("#5a4a30", { r: 0.9 }), [0, 0.26, 0]);
      put(g, rb(0.4, 0.2, 0.26, 0.06), mat("#6b5a3a", { r: 0.9 }), [0, 0.52, 0]);
      put(g, rb(0.26, 0.22, 0.04, 0.02), mat("#4a3c26", { r: 0.9 }), [0, 0.2, 0.13]);
      [-0.12, 0.12].forEach(x => put(g, new T.BoxGeometry(0.04, 0.4, 0.02), mat("#3a2f20"), [x, 0.26, -0.13]));
      return g;
    }
    function blanket() {
      const g = grp(0.93, 0, 1.23, 0.35);
      put(g, rb(1.4, 2.1, 0.03, 0.01), mat("#7a3426", { r: 0.95 }), [0, 0.017, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 4; i++) {
        put(g, new T.BoxGeometry(1.38, 0.004, 0.06), mat("#3a1a14"), [0, 0.034, -0.7 + i * 0.45]);
      }
      for (let i = 0; i < 3; i++) {
        put(g, new T.BoxGeometry(0.06, 0.004, 2.08), mat("#c9a46a"), [-0.4 + i * 0.4, 0.036, 0]);
      }
      return g;
    }
    const tr = tree();
    blanket();
    const lean = (g, x, z, rx, rz) => {
      g.rotation.y = Math.atan2(-(rx - x), -(rz - z));
    };
    // camera on a flat rock
    let top = rock(2.35, 1, 0.42, 0.5, true);
    let o = camera();
    o.position.set(2.35, top, 1);
    o.rotation.y = face(2.35, 1) - 0.5;
    drop(o, top, 0);
    pos.camera = [2.35, top + 0.25, 1];
    land.camera = [2.35, top + 0.52, 1];
    // radio on a stump
    const st = new T.Mesh(Cy(0.3, 0.36, 0.3, 18), mat("#5a3d28", { r: 0.95 }));
    st.position.set(2.85, 0.15, 0.2);
    st.castShadow = st.receiveShadow = true;
    S.add(st);
    put(S, Cy(0.28, 0.28, 0.01, 18), mat("#a8824f", { r: 0.9 }), [2.85, 0.305, 0.2]);
    OBS.push([2.85, 0.2, 0.38]);
    o = radio();
    o.position.set(2.85, 0.31, 0.2);
    o.rotation.y = face(2.85, 0.2);
    drop(o, 0.31, 0.12);
    pos.radio = [2.85, 0.5, 0.2];
    land.radio = [2.85, 0.6, 0.2];
    // film reel leaning against a rock
    rock(-1.55, 1.95, 0.42, 0.8);
    const r = reel();
    r.g.position.set(-1.15, 0, 1.7);
    lean(r.g, -1.15, 1.7, -1.55, 1.95);
    r.inner.rotation.x = -0.25;
    drop(r.g, 0, 0.24);
    pos.film = [-1.15, 0.4, 1.7];
    land.film = [-1.15, 0.82, 1.7];
    OBS.push([-1.15, 1.7, 0.4]);
    // folder (resume) leaning against a rock
    rock(-0.55, 2.85, 0.38, 0.8);
    const f = folder();
    f.g.position.set(-0.5, 0, 2.4);
    lean(f.g, -0.5, 2.4, -0.55, 2.85);
    f.inner.rotation.x = -0.42;
    drop(f.g, 0, 0.36);
    pos.resume = [-0.5, 0.35, 2.45];
    land.resume = [-0.5, 0.72, 2.4];
    OBS.push([-0.5, 2.4, 0.35]);
    // letter half under a small rock
    o = letter();
    o.position.set(-1.85, 0, 2.3);
    o.rotation.y = 0.6;
    drop(o, 0, 0.48);
    const lt = rock(-1.7, 2.18, 0.2, 0.6);
    pos.letter = [-1.85, 0.1, 2.3];
    land.letter = [-1.95, 0.03, 2.4];
    o = notebook();
    o.position.set(-0.35, 0, 1.35);
    o.rotation.y = 0.6;
    drop(o, 0, 0.6);
    pos.notebook = [-0.35, 0.12, 1.35];
    land.notebook = [-0.35, 0.1, 1.35];
    OBS.push([-0.35, 1.35, 0.38]);
    o = book();
    o.position.set(-2.1, 0, 0.5);
    o.rotation.y = -0.4;
    drop(o, 0, 0.72);
    pos.book = [-2.1, 0.12, 0.5];
    land.book = [-2.1, 0.2, 0.5];
    OBS.push([-2.1, 0.5, 0.38]);
    rock(1.2, 2.75, 0.14, 0.8);
    const p = polaroid();
    p.g.position.set(1, 0, 2.55);
    lean(p.g, 1, 2.55, 1.2, 2.75);
    p.inner.rotation.x = -0.5;
    drop(p.g, 0, 0.84);
    pos.social = [1, 0.25, 2.55];
    land.social = [1, 0.42, 2.55];
    o = player();
    o.position.set(1.55, 0, 1.55);
    o.rotation.y = -0.3;
    drop(o, 0, 0.96);
    pos.music = [1.55, 0.1, 1.55];
    land.music = [1.55, 0.08, 1.55];
    OBS.push([1.55, 1.55, 0.26]);
    o = lantern();
    o.position.set(-2.6, 0, -0.1);
    drop(o, 0, 1.08);
    land.lantern = [-2.6, 0.42, -0.1];
    OBS.push([-2.6, -0.1, 0.25]);
    // tea corner: a flat rock within Giri's reach, with the cup and the kettle on it
    const rk = rock(0.52, 1.12, 0.4, 0.6, true);
    const cupG = mug();
    const ketG = kettle();
    const KY = 2.4;
    cupG.position.set(0.45, rk, 1.15);
    drop(cupG, rk, 1.2);
    ketG.position.set(0.68, rk, 1.05);
    ketG.rotation.y = KY;
    drop(ketG, rk, 1.25);
    const tea = {
      cup: cupG,
      kettle: ketG,
      cupHome: [0.45, rk, 1.15],
      ketHome: [0.68, rk, 1.05],
      ketYaw: KY,
      grip: ketG.userData.grip,
      tip: ketG.userData.tip
    };
    o = pack();
    o.position.set(-0.78, 0, 0.78);
    o.rotation.y = Math.atan2(-0.78, 0.78);
    o.rotation.x = -0.12;
    drop(o, 0, 1.3);
    OBS.push([-0.78, 0.78, 0.32]);
    [
      [3.4, 2.4, 0.3],
      [-3.2, -1.2, 0.45],
      [0.8, -2.5, 0.35],
      [4, -0.4, 0.25],
      [-3.4, 2.2, 0.3]
    ].forEach(a => rock(a[0], a[1], a[2], 0.6));
    const lant = [-2.6, 0.3, -0.1];
    const player_ = [1.55, 0.08, 1.55];

    // ---------- the cat: chubby, big-headed, blinks, wanders, naps, zooms and pounces
    function makeCat() {
      const black = C.cat.color === "black";
      const col = black ? "#1d1b1f" : "#d9822b";
      const dk = black ? "#2b2830" : "#a85a1c";
      const cr = black ? "#2f2c36" : "#f3dcb8";
      const pink = "#e8a0a8";
      const iris = black ? "#e8c43a" : "#9fd84a";
      const lam = c => new T.MeshLambertMaterial({ color: c, map: NT });
      const G = new T.Group();
      S.add(G);
      const part = (par, geo, c, p, s) => {
        const m = new T.Mesh(geo, lam(c));
        m.position.set(p[0], p[1], p[2]);
        if (s) {
          m.scale.set(s[0], s[1], s[2]);
        }
        m.castShadow = true;
        par.add(m);
        return m;
      };
      const body = new T.Group();
      G.add(body);
      part(body, Sp(0.17, 16), col, [0, 0.2, 0], [0.9, 0.82, 1.5]);
      part(body, Sp(0.12, 12), cr, [0, 0.15, 0.12], [0.8, 0.7, 1]);
      [
        [-0.05, 0.31, -0.04],
        [0.04, 0.32, 0.06],
        [-0.03, 0.3, -0.14]
      ].forEach(q => part(body, new T.BoxGeometry(0.1, 0.012, 0.03), dk, q));
      const head = new T.Group();
      head.position.set(0, 0.36, 0.26);
      body.add(head);
      part(head, Sp(0.15, 18), col, [0, 0.02, 0], [1.08, 0.95, 1]);
      part(head, Sp(0.07, 12), cr, [0, -0.04, 0.11], [1.2, 0.8, 1]);
      part(head, Sp(0.018, 8), pink, [0, 0, 0.17], [1.3, 0.9, 1]);
      const eyes = [];
      [-1, 1].forEach(s => {
        const ear = part(head, new T.ConeGeometry(0.06, 0.13, 4), col, [s * 0.085, 0.15, -0.01]);
        ear.rotation.z = -s * 0.25;
        part(head, new T.ConeGeometry(0.032, 0.08, 4), pink, [s * 0.085, 0.145, 0.008]).rotation.z = -s * 0.25;
        const eg = new T.Group();
        eg.position.set(s * 0.06, 0.04, 0.13);
        head.add(eg);
        part(eg, Sp(0.042, 14), iris, [0, 0, 0], [1, 1.1, 0.55]);
        part(eg, Sp(0.022, 10), "#0b0b0b", [0, 0, 0.016], [0.8, 1.3, 0.5]);
        part(eg, Sp(0.01, 6), "#ffffff", [0.012, 0.014, 0.026]);
        eyes.push(eg);
        for (let j = 0; j < 3; j++) {
          const w = part(head, new T.CylinderGeometry(0.0025, 0.0025, 0.14, 4), "#f5efe0", [
            s * 0.1,
            -0.015 + j * 0.014,
            0.14
          ]);
          w.rotation.z = Math.PI / 2 + s * (j - 1) * 0.16;
        }
      });
      const legs = [];
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(a => {
        const l = new T.Group();
        l.position.set(a[0] * 0.085, 0.14, a[1] * 0.15);
        body.add(l);
        part(l, Cy(0.042, 0.036, 0.15, 8), col, [0, -0.07, 0]);
        part(l, Sp(0.05, 8), cr, [0, -0.14, 0.01], [1, 0.6, 1.3]);
        legs.push(l);
      });
      const tail = [];
      let par = body;
      for (let i = 0; i < 5; i++) {
        const s = new T.Group();
        s.position.set(0, i ? 0.09 : 0.24, i ? 0 : -0.26);
        par.add(s);
        part(s, Cy(0.034 - i * 0.004, 0.036 - i * 0.004, 0.1, 8), i === 4 ? cr : col, [0, 0.045, 0]);
        s.rotation.x = i ? 0 : -0.9;
        tail.push(s);
        par = s;
      }
      const sound = n => ctx.sfx(n);
      const clr = (x, z) => {
        let m = 9;
        for (const b of OBS) {
          m = Math.min(m, Math.hypot(x - b[0], z - b[1]) - b[2]);
        }
        return m;
      };
      const avoid = (x, z) => z >= -3.3 && Math.hypot(x, z) <= 9 && clr(x, z) >= 0.2;
      const st = {
        s: "sit",
        t: 1.5,
        tx: 2.4,
        tz: 0.4,
        h: 0,
        sp: 0,
        ph: 0,
        stuck: 0,
        blink: rnd(2, 5),
        meow: rnd(6, 14),
        pur: 2,
        pounce: 0,
        lw: ""
      };
      G.position.set(seat[0] + 1.6, 0, seat[1] - 0.3);
      for (let i = 0; i < 40; i++) {
        const a = rnd(0, 6.28);
        const r = rnd(1.2, 3);
        const x = seat[0] + Math.cos(a) * r;
        const z = seat[1] + Math.sin(a) * r;
        if (avoid(x, z)) {
          G.position.set(x, 0, z);
          break;
        }
      }
      const P = { low: 0, sit: 0, head: 0, hy: 0, str: 0, wag: 0.3, ears: 0 };
      const pick = () => {
        for (let i = 0; i < 10; i++) {
          const a = rnd(0, 6.28);
          const r = rnd(1.1, 4.6);
          const x = seat[0] + Math.cos(a) * r;
          const z = seat[1] + Math.sin(a) * r;
          if (avoid(x, z)) {
            st.tx = x;
            st.tz = z;
            return true;
          }
        }
        return false;
      };
      const next = () => {
        const wx = ctx.getWx();
        const wet = wx === "rain" || wx === "storm" || wx === "snow" || wx === "blossom";
        const n = wx === "night" || wx === "aurora";
        const w = [
          ["walk", 3],
          ["sit", 2],
          ["groom", 1.2],
          ["sleep", wet || n ? 3 : 0.6],
          ["stretch", 0.9],
          ["look", 1.2],
          ["zoom", 0.8],
          ["pounce", 0.6]
        ];
        const tot = w.reduce((a, b) => a + b[1], 0);
        let q = rnd(0, tot);
        let ch = "walk";
        for (const a of w) {
          q -= a[1];
          if (q <= 0) {
            ch = a[0];
            break;
          }
        }
        if (st.still >= 2) {
          ch = Math.random() < 0.8 ? "walk" : "zoom";
        }
        st.still = ["walk", "zoom", "pounce"].includes(ch) ? 0 : (st.still || 0) + 1;
        st.s = ch;
        st.stuck = 0;
        st.pounce = 0;
        if (ch === "walk" || ch === "zoom") {
          if (wet && Math.random() < 0.6) {
            st.tx = seat[0] + 1.1;
            st.tz = seat[1] - 0.3;
          } else if (!pick()) {
            st.s = "sit";
          }
        }
        st.t = ch === "walk" ? 9 : ch === "zoom" ? 3 : ch === "sleep" ? rnd(7, 14) : ch === "pounce" ? 1.5 : rnd(2, 5);
        if (ch === "look" || ch === "zoom" || ch === "stretch") {
          sound("cat");
        }
        if (ch === "pounce") {
          st.tx = G.position.x + Math.sin(G.rotation.y) * 0.8;
          st.tz = G.position.z + Math.cos(G.rotation.y) * 0.8;
        }
      };
      const step = (dt, sp) => {
        const dx = st.tx - G.position.x;
        const dz = st.tz - G.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.1) {
          return true;
        }
        let a = Math.atan2(dx, dz);
        let ok = false;
        for (const da of [
            0,
            0.7,
            -0.7,
            1.4,
            -1.4
          ]) {
          const nx = G.position.x + Math.sin(a + da) * sp * dt * 2;
          const nz = G.position.z + Math.cos(a + da) * sp * dt * 2;
          if (avoid(nx, nz) || clr(G.position.x, G.position.z) < 0.2 && clr(nx, nz) > clr(G.position.x, G.position.z) && nz > -3.3) {
            G.position.x += Math.sin(a + da) * sp * dt;
            G.position.z += Math.cos(a + da) * sp * dt;
            a += da;
            ok = true;
            break;
          }
        }
        if (!ok) {
          st.stuck += dt;
          if (st.stuck > 0.4) {
            st.t = 0;
          }
        } else {
          st.stuck = 0;
        }
        let r = a - G.rotation.y;
        r = Math.atan2(Math.sin(r), Math.cos(r));
        G.rotation.y += r * Math.min(1, dt * 8);
        return false;
      };
      function update(dt, t) {
        const s = st.s;
        const wx = ctx.getWx();
        if (wx !== st.lw) {
          st.lw = wx;
          if (wx === "rain" || wx === "storm") {
            st.t = 0;
          }
        }
        st.t -= dt;
        let sp = 0;
        let T2 = { low: 0, sit: 0, head: 0, hy: 0, str: 0, wag: 0.3, ears: 0 };
        if (s === "walk" || s === "zoom") {
          sp = s === "zoom" ? 2.2 : 0.6;
          if (step(dt, sp) || st.t <= 0) {
            next();
          }
          T2.ears = s === "zoom" ? 1 : 0;
          T2.wag = s === "zoom" ? 0.6 : 0.25;
        } else if (s === "sit") {
          T2.sit = 1;
          T2.hy = Math.sin(t / 1200 + st.ph) * 0.6;
          T2.wag = 0.2;
          if (st.t <= 0) {
            next();
          }
        } else if (s === "groom") {
          T2.sit = 1;
          T2.head = 0.75 + Math.sin(t / 110) * 0.12;
          if (st.t <= 0) {
            next();
          }
        } else if (s === "sleep") {
          T2.low = 1;
          T2.head = 0.7;
          T2.wag = 0.05;
          st.pur -= dt;
          if (st.pur <= 0) {
            st.pur = 3;
            sound("purr");
          }
          if (st.t <= 0) {
            next();
          }
        } else if (s === "stretch") {
          T2.str = 1;
          T2.head = -0.2;
          if (st.t <= 0) {
            next();
          }
        } else if (s === "look") {
          T2.hy = Math.sin(t / 500) * 0.9;
          T2.wag = 0.5;
          if (st.t <= 0) {
            next();
          }
        } else if (s === "pounce") {
          st.pounce += dt;
          if (st.pounce < 0.7) {
            T2.low = 0.5;
            T2.wag = 1;
          } else {
            sp = 2.6;
            if (st.pounce < 1.05) {
              step(dt, sp);
            }
          }
          if (st.t <= 0) {
            next();
          }
        }
        const k = Math.min(1, dt * 6);
        for (const q in P) {
          P[q] += (T2[q] - P[q]) * k;
        }
        st.ph += sp * dt * 9;
        const sw = Math.sin(st.ph) * (sp ? 0.7 : 0);
        body.position.y = -P.low * 0.09 - P.sit * 0.02 + Math.abs(Math.sin(st.ph * 0.5)) * 0.012 * (sp ? 1 : 0);
        body.rotation.x = -P.sit * 0.5 + P.str * 0.32;
        head.rotation.x = P.head - P.sit * 0.3 - P.str * 0.1;
        head.rotation.y = P.hy;
        head.position.y = 0.36 - P.str * 0.08;
        legs.forEach((l, i) => {
          l.rotation.x = (i % 2 ? sw : -sw) * (i < 2 ? 1 : -1);
          l.scale.y = 1 - P.low * 0.6;
        });
        tail.forEach((q, i) => {
          q.rotation.z = Math.sin(t / 300 + i * 0.8) * (0.12 + P.wag * 0.25);
          if (i) {
            q.rotation.x = -0.35 + Math.sin(t / 700 + i) * 0.1;
          }
        });
        st.blink -= dt;
        const closed = s === "sleep" || st.blink < 0.14 ? 0.08 : 1;
        if (st.blink < 0) {
          st.blink = rnd(2.2, 6);
        }
        eyes.forEach(e => {
          e.scale.y = closed;
        });
        st.meow -= dt;
        if (st.meow <= 0) {
          st.meow = rnd(7, 17);
          if (s !== "sleep") {
            sound("cat");
          }
        }
        ctx.OBJ.cat.pos = [G.position.x, 0.3, G.position.z];
      }
      return { g: G, update };
    }
    const cat = makeCat();
    return {
      tea,
      pos,
      land,
      obstacles: OBS,
      player: player_,
      lantern: lant,
      cat,
      tree: tr,
      step(dt, t) {
        drops.forEach(d => {
          if (d.done || t < 1500 + d.delay * 1000) {
            if (!d.done && t < 1500 + d.delay * 1000) {
              d.g.position.y = d.y + 4;
            }
            return;
          }
          d.vy -= 9.8 * dt;
          d.g.position.y += d.vy * dt;
          if (d.g.position.y <= d.y) {
            d.g.position.y = d.y;
            if (Math.abs(d.vy) > 0.8) {
              d.vy = -d.vy * 0.32;
            } else {
              d.vy = 0;
              d.done = true;
            }
          }
        });
      }
    };
  }

  function aurora(ctx) {
    const T = ctx.THREE;
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 128;
    const x = c.getContext("2d");
    const gr = x.createLinearGradient(0, 128, 0, 0);
    gr.addColorStop(0, "rgba(80,255,170,0)");
    gr.addColorStop(0.35, "rgba(80,255,170,.55)");
    gr.addColorStop(0.7, "rgba(120,160,255,.35)");
    gr.addColorStop(1, "rgba(200,120,255,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 8, 128);
    const tex = new T.CanvasTexture(c);
    const ms = [];
    for (let i = 0; i < 3; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(46, 15), new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: T.AdditiveBlending,
        depthWrite: false,
        fog: false,
        side: T.DoubleSide
      }));
      m.position.set(-8 + i * 9, 20 + i * 2, -50 - i * 2);
      m.visible = false;
      ctx.S.add(m);
      ms.push(m);
    }
    return {
      update(dt, t, on) {
        ms.forEach((m, i) => {
          m.material.opacity += ((on ? 0.5 : 0) - m.material.opacity) * 0.02;
          m.visible = m.material.opacity > 0.01;
          m.scale.x = 1 + 0.15 * Math.sin(t / 3000 + i * 2);
          m.position.x = -8 + i * 9 + 3 * Math.sin(t / 5000 + i);
        });
      }
    };
  }
  return { build, aurora };
}();
