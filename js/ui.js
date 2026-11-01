/* ============================================================================
   ui.js: one unique screen per object (notebook pages, camera viewfinder, radio dial...)
   Each entry has html() and optional mount(root) / unmount().
   Uses helpers from helpers.js, audio.js and panel.js (E, tx, A, C, ok, isPh, sfx, tone, embed, LOGO, ac, on).
   ============================================================================ */
(function () {
  LOGO.mail = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2\"/><path d=\"m4 7 8 6 8-6\"/></svg>";
  SFX.page = () => {
    tone(520, 150, 0.14, "sawtooth", 0.008);
    tone(900, 220, 0.08, "sine", 0.006, 0.05);
  };
  SFX.cat = () => {
    const f = 450 + Math.random() * 200;
    tone(f, f * 1.9, 0.22, "triangle", 0.06);
    tone(f * 1.9, f * 0.8, 0.38, "triangle", 0.06, 0.22);
  };
  SFX.purr = () => {
    for (let i = 0; i < 8; i++) {
      tone(70, 62, 0.09, "sawtooth", 0.02, i * 0.1);
    }
  };
  SFX.butterfly = () => {
    tone(1800, 2600, 0.08, "sine", 0.03);
    tone(2400, 3200, 0.08, "sine", 0.03, 0.09);
    tone(3000, 2200, 0.12, "sine", 0.025, 0.18);
  };
  SFX.frog = () => {
    tone(190, 140, 0.13, "square", 0.05);
    tone(180, 130, 0.13, "square", 0.05, 0.19);
    tone(200, 150, 0.15, "square", 0.05, 0.4);
  };
  SFX.bird = () => {
    [0, 0.14, 0.3, 0.5].forEach((d, i) => tone(2600 + i * 250, 3600 - i * 150, 0.1, "sine", 0.05, d));
  };
  const UI = window.UI = {};

  // ---- shared page-turning book
  const bookHTML = (label, cover, pgs, cls) => {
    const all = [cover, ...pgs];
    const n = all.length;
    return `<div class="book ${ cls || "" }" tabindex="0" role="group" aria-roledescription="book" aria-label="${ E(label) }"><div class="bk-back"></div>${ all.map((p, i) => `<section class="leaf${ i ? "" : " cov" }" style="z-index:${ n - i }"><div class="pg">${ p }</div></section>`).join("") }</div><div class="bk-ctl"><button type="button" class="bk-prev" aria-label="Previous page">&lsaquo;</button><span class="bk-n" aria-live="polite"></span><button type="button" class="bk-next" aria-label="Next page">&rsaquo;</button></div>`;
  };
  const bookMount = root => {
    const bk = root.querySelector(".book");
    const lv = [...bk.querySelectorAll(".leaf")];
    const nEl = root.querySelector(".bk-n");
    const pv = root.querySelector(".bk-prev");
    const nx = root.querySelector(".bk-next");
    let i = 0;
    let x0 = null;
    const upd = () => {
      lv.forEach((l, j) => {
        l.classList.toggle("t", j < i);
        l.inert = j !== i;
        l.setAttribute("aria-hidden", j === i ? "false" : "true");
      });
      nEl.textContent = i + 1 + " / " + lv.length;
      pv.disabled = !i;
      nx.disabled = i === lv.length - 1;
    };
    const go = d => {
      const j = Math.max(0, Math.min(lv.length - 1, i + d));
      if (j !== i) {
        i = j;
        sfx("page");
        upd();
      }
    };
    pv.onclick = () => go(-1);
    nx.onclick = () => go(1);
    bk.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") {
        go(1);
      }
      if (e.key === "ArrowLeft") {
        go(-1);
      }
    });
    bk.addEventListener("pointerdown", e => {
      x0 = e.clientX;
    });
    bk.addEventListener("pointerup", e => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 45) {
        go(e.clientX < x0 ? 1 : -1);
      }
      x0 = null;
    });
    upd();
  };
  UI.notebook = {
    html() {
      const es = C.notebook.entries.filter(e => e.title || e.text);
      const cover = `<p class="cv-t">Notebook</p><p class="cv-e">${ tx(C.notebook.emotion) }</p><p class="cv-h">turn the page &rsaquo;</p>`;
      const pg = es.map(e => `<span class="date">${ tx(e.date) }</span><h3>${ tx(e.title) }</h3><p>${ tx(e.text) }</p>`);
      if (!pg.length) {
        pg.push(`<p class="dim">Blank pages. Nothing written yet.</p>`);
      }
      pg.push(`<p class="date">&mdash;</p><p class="dim">That&rsquo;s all that&rsquo;s written, for now.</p>`);
      return bookHTML("Notebook", cover, pg);
    },
    mount: bookMount
  };
  UI.book = {
    html() {
      const B = C.book;
      const parts = (B.title || "").split(/\s+[\u2014-]\s+/);
      const cover = `<p class="cv-t">${ tx(parts[0] || "Book") }</p><p class="cv-e">${ tx(parts.slice(1).join(" - ")) }</p><p class="cv-h">open it &rsaquo;</p>`;
      return bookHTML("Book", cover, [
        `<span class="date">${ tx(B.emotion) }</span><p>${ tx(B.note) }</p>`,
        `<p class="dim">Dog-eared here.</p>${ A(B.url, "The book") }`
      ], "green");
    },
    mount: bookMount
  };

  // ---- camera: viewfinder, shutter, developing frames
  UI.camera = {
    html: () => `<div class="vf"><div class="vf-img" aria-live="polite"></div><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="vf-foc"></div><div class="flash"></div><span class="vf-hud">${ tx(C.camera.emotion) }</span></div><div class="cam-row"><button type="button" class="shutter" aria-label="Press the shutter"><span></span></button><div class="strip"></div></div><p class="cam-cap"></p><p class="cam-mem"></p>`,
    mount(root) {
      const ph = C.camera.photos.filter(p => p.src || p.caption);
      const img = root.querySelector(".vf-img");
      const cap = root.querySelector(".cam-cap");
      const mem = root.querySelector(".cam-mem");
      const fl = root.querySelector(".flash");
      const st = root.querySelector(".strip");
      let i = -1;
      st.innerHTML = ph.map((p, j) => `<button type="button" class="th" data-j="${ j }" aria-label="Photo ${ j + 1 }">${ j + 1 }</button>`).join("");
      const showP = j => {
        i = j;
        const p = ph[j];
        img.innerHTML = p.src && !isPh(p.src) ? `<img class="dev" src="${ E(p.src) }" alt="${ E(p.alt || p.caption || "") }">` : `<span>frame ${ j + 1 }</span>`;
        cap.innerHTML = tx(p.caption);
        mem.innerHTML = p.meaning ? tx(p.meaning) : "";
        st.querySelectorAll(".th").forEach((b, k) => b.classList.toggle("on", k === j));
      };
      const snap = () => {
        sfx("camera");
        fl.classList.remove("go");
        void fl.offsetWidth;
        fl.classList.add("go");
        if (ph.length) {
          showP((i + 1) % ph.length);
        } else {
          img.innerHTML = "<span>no film in the camera yet</span>";
          cap.textContent = "Not developed yet. Some frames take their time.";
        }
      };
      root.querySelector(".shutter").onclick = snap;
      st.onclick = e => {
        const b = e.target.closest(".th");
        if (b) {
          sfx("camera");
          showP(+b.dataset.j);
        }
      };
      img.innerHTML = "<span>press the shutter</span>";
    }
  };

  // ---- earphones: cassette deck
  UI.music = {
    html() {
      const l = C.music.latest;
      return `<div class="tape" id="tape"><div class="tape-top"><span class="tape-lbl"><b>${ tx(l.title) || "Untitled" }</b><small>${ tx(l.artist) }</small></span></div><div class="tape-mid"><i class="reel"></i><div class="tape-win"></div><i class="reel"></i></div></div><div class="deck"><button type="button" class="play" aria-pressed="false">&#9654; Play tape</button></div><div class="scr" hidden></div><p class="note-p">${ tx(l.note) }</p>${ A(l.url, "Open the song", "sp") }${ A(C.music.playlistUrl, "Playlist", "sp") }${ A(C.music.profileUrl, "Spotify profile", "sp") }`;
    },
    mount(root) {
      const t = root.querySelector("#tape");
      const b = root.querySelector(".play");
      const s = root.querySelector(".scr");
      b.onclick = () => {
        const o = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", o);
        b.innerHTML = o ? "&#10074;&#10074; Stop tape" : "&#9654; Play tape";
        t.classList.toggle("on", o);
        sfx("music");
        const em = embed(C.music.latest.url);
        s.innerHTML = o && em ? em : "";
        s.hidden = !(o && em);
      };
    }
  };

  // ---- film reel: clapperboard and subtitles
  UI.film = {
    html() {
      const l = C.film.latest;
      return `<div class="clap" id="clap"><div class="stick"></div><div class="board"><div class="cr"><span>FILM</span><b>${ tx(l.title) || "&mdash;" }</b></div><div class="cr"><span>SCENE</span><i>${ tx(l.scene) }</i></div><div class="cr two"><span>TAKE</span><b>1</b><span>ROLL</span><b>${ tx(C.film.emotion) || "&mdash;" }</b></div></div></div><div class="subs"><p>${ tx(l.review) }</p></div>${ A(l.url, "The film", "lb") }${ A(C.film.letterboxdUrl, "Letterboxd profile", "lb") }`;
    },
    mount(root) {
      const c = root.querySelector("#clap");
      setTimeout(() => {
        c.classList.add("go");
        sfx("film");
      }, 250);
    }
  };

  // ---- radio: turn the dial through the static to find the station
  const trk = () => (C.radio.tracks || []).filter(t => t.file);
  UI.radio = {
    html: () => `<div class="radio"><div class="r-face"><div class="grille"></div><div><div class="led" id="rf">88.4</div><div class="sig"><i id="rs"></i></div></div></div><input id="rd" class="dial" type="range" min="880" max="1080" step="1" value="884" aria-label="Tuning dial"><p class="r-hint" id="rh">Turn the dial. Somewhere in the static there is a station.</p><button type="button" class="r-skip">tune it for me</button><div class="r-out" id="ro"><p>${ tx(C.radio.note) }</p>${ trk().length ? `<div class="rplay"><p class="rnow"></p><div class="rctl"><button type="button" class="rprev" aria-label="Previous song">&#9198;</button><button type="button" class="rpp" aria-pressed="false">&#9654; Play</button><button type="button" class="rnext" aria-label="Next song">&#9197;</button></div></div>` : embed(C.radio.url) || "" }${ A(C.radio.url, "Station or playlist", "sp") }</div></div>`,
    mount(root) {
      const rd = root.querySelector("#rd");
      const rf = root.querySelector("#rf");
      const rs = root.querySelector("#rs");
      const rh = root.querySelector("#rh");
      const ro = root.querySelector("#ro");
      const st = Math.round(parseFloat(C.radio.freq || "97.3") * 10) || 973;
      let node = null;
      let locked = false;
      const mk = () => {
        if (!ac || !on || node) {
          return;
        }
        const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          d[i] = Math.random() * 2 - 1;
        }
        const s = ac.createBufferSource();
        const f = ac.createBiquadFilter();
        const g = ac.createGain();
        s.buffer = b;
        s.loop = true;
        f.type = "bandpass";
        f.frequency.value = 1800;
        f.Q.value = 0.5;
        g.gain.value = 0;
        s.connect(f);
        f.connect(g);
        g.connect(ac.destination);
        s.start();
        node = { s, g };
      };
      const upd = () => {
        mk();
        const v = +rd.value;
        const d = Math.abs(v - st);
        const q = Math.max(0, 1 - d / 70);
        const lock = d <= 4;
        rf.textContent = (v / 10).toFixed(1);
        rs.style.width = Math.round(q * 100) + "%";
        rd.setAttribute("aria-valuetext", (v / 10).toFixed(1) + " megahertz");
        if (node) {
          node.g.gain.setTargetAtTime(lock ? 0 : 0.05 * (1 - q) * (1 - q), ac.currentTime, 0.05);
        }
        if (lock && !locked) {
          locked = true;
          ro.classList.add("on");
          rh.textContent = "there you are.";
          if (ac && on) {
            tone(660, 660, 0.6, "sine", 0.04);
            tone(880, 880, 0.8, "sine", 0.03, 0.12);
          }
        } else if (!lock && locked) {
          locked = false;
          ro.classList.remove("on");
          rh.textContent = "Lost it. Turn the dial back.";
        }
      };
      const tl = trk();
      let ti = 0;
      let au = null;
      const nowEl = root.querySelector(".rnow");
      const pp = root.querySelector(".rpp");
      const load = () => {
        if (!tl.length) {
          return;
        }
        if (au) {
          au.pause();
        }
        au = new Audio(tl[ti].file);
        au.volume = 0.7;
        au.onended = () => {
          ti = (ti + 1) % tl.length;
          load();
          au.play().catch(() => {
          });
        };
        nowEl.textContent = (tl[ti].title || "Track " + (ti + 1)) + (tl[ti].artist ? " , " + tl[ti].artist : "") + "  (" + (ti + 1) + "/" + tl.length + ")";
        pp.setAttribute("aria-pressed", "false");
        pp.innerHTML = "&#9654; Play";
      };
      if (tl.length) {
        load();
        pp.onclick = () => {
          if (au.paused) {
            au.play().catch(() => {
            });
            pp.setAttribute("aria-pressed", "true");
            pp.innerHTML = "&#10074;&#10074; Pause";
          } else {
            au.pause();
            pp.setAttribute("aria-pressed", "false");
            pp.innerHTML = "&#9654; Play";
          }
        };
        root.querySelector(".rnext").onclick = () => {
          ti = (ti + 1) % tl.length;
          load();
          au.play().catch(() => {
          });
          pp.innerHTML = "&#10074;&#10074; Pause";
          pp.setAttribute("aria-pressed", "true");
        };
        root.querySelector(".rprev").onclick = () => {
          ti = (ti - 1 + tl.length) % tl.length;
          load();
          au.play().catch(() => {
          });
          pp.innerHTML = "&#10074;&#10074; Pause";
          pp.setAttribute("aria-pressed", "true");
        };
      }
      this.au = () => au;
      rd.addEventListener("input", upd);
      root.querySelector(".r-skip").onclick = () => {
        rd.value = st;
        upd();
      };
      this.stop = () => {
        if (node) {
          try {
            node.s.stop();
          } catch (e) {
          }
          node = null;
        }
      };
      upd();
    },
    unmount() {
      if (this.stop) {
        this.stop();
      }
      const a = this.au && this.au();
      if (a) {
        a.pause();
      }
    }
  };

  // ---- resume: a folder that opens
  UI.resume = {
    html() {
      const R = C.resume;
      const es = R.entries.filter(r => r.role || r.place);
      return `<div class="folder" id="fold"><div class="f-tab">${ tx(R.emotion) || "resume" }</div><div class="f-paper"><p>${ tx(R.summary) }</p>${ es.map(r => `<div class="role"><b>${ tx(r.role) }</b>${ tx(r.place) } ${ tx(r.years) }<br><span class="dim">${ tx(r.note) }</span></div>`).join("") }</div><div class="f-front"><span>RESUME</span></div></div>${ ok(R.fileUrl) ? A(R.fileUrl, "Open the resume", "web") : `<p class="dim">The resume file isn&rsquo;t in the folder yet.</p>` }`;
    },
    mount(root) {
      const f = root.querySelector("#fold");
      setTimeout(() => {
        f.classList.add("open");
        sfx("resume");
      }, 200);
      f.addEventListener("click", () => f.classList.toggle("open"));
    }
  };

  // ---- letter: break the seal
  UI.letter = {
    html() {
      const L = C.letter;
      const em = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(L.email || "") ? L.email : "";
      return `<div class="env" id="env"><div class="env-letter"><p class="emo">${ tx(L.emotion) }</p><p>${ tx(L.note) }</p></div><div class="env-body"></div><div class="env-flap"></div><button type="button" class="seal" aria-label="Break the seal and open the letter" aria-expanded="false"></button></div>${ em ? `<a class="orb k-mail" href="mailto:${ E(em) }"><span class="tile">${ LOGO.mail }</span><span class="orb-l">Write back<small>${ E(em) }</small></span></a>` : "" }`;
    },
    mount(root) {
      const e = root.querySelector("#env");
      const s = root.querySelector(".seal");
      s.onclick = () => {
        const o = !e.classList.contains("open");
        e.classList.toggle("open", o);
        s.setAttribute("aria-expanded", o);
        sfx("letter");
      };
    }
  };

  // ---- polaroid: develops in front of you
  UI.social = {
    html() {
      const S2 = C.social;
      const has = S2.photo && !isPh(S2.photo);
      return `<div class="pol" id="pol" tabindex="0" role="img" aria-label="${ E(S2.photoAlt || "Polaroid photo") }"><div class="pol-img">${ has ? `<img src="${ E(S2.photo) }" alt="">` : "" }<span class="pol-fog"></span></div><p class="pol-cap">${ tx(S2.photoNote) }</p></div><p class="note-p">${ tx(S2.caption) }</p>${ A(S2.url, "Instagram", "ig") }`;
    },
    mount(root) {
      const p = root.querySelector("#pol");
      const dev = () => {
        p.classList.remove("dev");
        void p.offsetWidth;
        setTimeout(() => p.classList.add("dev"), 60);
        sfx("social");
      };
      setTimeout(dev, 300);
      p.addEventListener("click", dev);
      p.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          dev();
        }
      });
    }
  };

  // ---- cat: a collar tag that flips
  UI.cat = {
    html: () => `<div class="tagw" id="tagw"><button type="button" class="tag" aria-label="Flip the collar tag"><span class="tag-in"><span class="tf"><b>${ tx(C.cat.name) }</b><small>${ C.cat.color === "black" ? "black cat" : "ginger cat" }</small><em>tap to flip</em></span><span class="tb"><span>${ tx(C.cat.story) }</span></span></span></button></div>`,
    mount(root) {
      const w = root.querySelector("#tagw");
      w.querySelector(".tag").onclick = () => {
        w.classList.toggle("flip");
        sfx("cat");
      };
    }
  };

  // ---- Girichandran: cinema tickets you can tear
  UI.me = {
    html() {
      const p = C.person;
      const t = (h, body) => `<div class="tk"><div class="tk-main"><small>ADMIT ONE</small><h4>${ h }</h4><p>${ tx(body) }</p></div><div class="tk-stub"><span>${ tx(p.emotion) || "&nbsp;" }</span></div></div>`;
      return `<div class="tix" id="tix">${ p.wantToCreate ? `<div class="tkw t2">${ t("What I&rsquo;m chasing", p.wantToCreate) }</div>` : "" }<div class="tkw t1">${ t("The way I see it", p.seesLifeAs) }</div></div><button type="button" class="tix-b">Tear the ticket</button><div>${ C.links.map(l => A(l.url, E(l.label))).join("") }</div>`;
    },
    mount(root) {
      const x = root.querySelector("#tix");
      const b = root.querySelector(".tix-b");
      b.onclick = () => {
        const t = x.classList.toggle("torn");
        b.textContent = t ? "Put it back together" : "Tear the ticket";
        sfx("page");
      };
      if (!x.querySelector(".t2")) {
        b.hidden = true;
      }
    }
  };
}());
