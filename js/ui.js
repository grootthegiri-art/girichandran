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
  UI.games = {
    html() {
      const G = C.games;
      const row = (k, v) => `<div class="sv"><small>${ k }</small><b>${ tx(v) }</b></div>`;
      return `<section class="game-feature"><div class="game-poster-wrap"><img class="game-poster" src="images/hong-kong-noir-poster.png" alt="Original Hong Kong neon-noir artwork inspired by the atmosphere of Sleeping Dogs"><span class="poster-stamp">FAVOURITE GAME</span></div><div class="game-feature-copy"><p class="emo">${ tx(G.emotion) }</p><p class="game-kicker">THE ONE I ALWAYS COME BACK TO</p><h3>Sleeping Dogs</h3><p>Hong Kong after dark. Neon on wet streets. A story that feels like a crime film you get to step inside.</p></div></section><div class="save game-save"><div class="save-h">PLAYER 1 · SAVE FILE</div>${ row("Playing / watching", G.now) }${ row("All-time favourite", G.fav) }${ row("A moment I still remember", G.moment) }</div><p class="note-p">${ tx(G.note) }</p><div class="game-library"><p class="game-kicker">THE GAMES THAT LEFT A MARK</p><div class="game-tags">${ (G.library || []).map(x => `<span>${ tx(x) }</span>`).join("") }</div></div><div class="stream-note"><span class="stream-icon">▶</span><div><b>THE BACKSEAT PLAYER</b><p>${ tx(G.watching) }</p></div></div>`;
    }
  };

  // ---- earphones: cassette deck
  UI.music = {
    html() {
      const l = C.music.latest;
      return `<div class="tape-stage"><div class="tape" id="tape"><div class="tape-top"><span class="tape-lbl"><b>${ tx(l.title) || "Untitled" }</b><small>${ tx(l.artist) }</small></span><span class="tape-side">SIDE A · 01</span></div><div class="tape-mid"><i class="reel"></i><div class="tape-win"></div><i class="reel"></i></div><div class="tape-bottom">GIRI'S MIXTAPE <span>PLAY IT LOUD</span></div></div></div><div class="deck"><button type="button" class="play" aria-pressed="false">▶ Play preview</button><span class="tape-status" aria-live="polite">Loading the listening shelf…</span></div><div class="scr" hidden></div><div class="album-now" id="album-now"><div class="album-art-placeholder">♫</div><div><small>NOW ON THE TAPE</small><b>${ tx(l.title) }</b><span>${ tx(l.artist) }</span></div></div><p class="note-p">${ tx(l.note) }</p><div class="preview-heading"><span>THE REPLAY SHELF</span><small>FREE 30-SECOND PREVIEWS</small></div><div class="preview-list" id="preview-list"><p class="dim">Finding playable previews…</p></div><p class="preview-foot">Previews are supplied by the Apple Music / iTunes Search API. Full tracks open in Spotify when a Spotify link is added.</p>${ A(C.music.playlistUrl, "Open playlist", "sp") }${ A(C.music.profileUrl, "Spotify profile", "sp") }`;
    },
    mount(root) {
      const tape = root.querySelector("#tape");
      const play = root.querySelector(".play");
      const status = root.querySelector(".tape-status");
      const shelf = root.querySelector("#preview-list");
      const now = root.querySelector("#album-now");
      const scr = root.querySelector(".scr");
      const tracks = [
        { title: "Lovers Rock", artist: "TV Girl", query: "TV Girl Lovers Rock" },
        { title: "No Surprises", artist: "Radiohead", query: "Radiohead No Surprises" },
        { title: "505", artist: "Arctic Monkeys", query: "Arctic Monkeys 505" },
        { title: "Someday", artist: "The Strokes", query: "The Strokes Someday" },
        { title: "After Hours", artist: "The Weeknd", query: "The Weeknd After Hours" }
      ];
      let audio = null;
      let active = null;
      let stopped = false;
      const stop = () => {
        if (audio) audio.pause();
        tape.classList.remove("on");
        play.setAttribute("aria-pressed", "false");
        play.textContent = "▶ Play preview";
        if (typeof setDuck === "function") setDuck(1);
      };
      const selectTrack = async (track, autoPlay) => {
        if (!track || !track.previewUrl) return;
        active = track;
        stop();
        if (!audio) {
          audio = new Audio();
          audio.onended = stop;
          audio.onerror = () => { status.textContent = "This preview is unavailable. Try another track."; stop(); };
        }
        audio.pause();
        audio.src = track.previewUrl;
        audio.currentTime = 0;
        audio.volume = 0.85;
        now.innerHTML = `<img src="${ E(track.artworkUrl600 || track.artworkUrl100 || "") }" alt="${ E(track.collectionName || "Album cover") }"><div><small>NOW ON THE TAPE</small><b>${ E(track.trackName) }</b><span>${ E(track.artistName) }</span><em>${ E(track.collectionName || "Single") }</em></div>`;
        root.querySelectorAll(".preview-track").forEach(el => el.classList.toggle("selected", el.dataset.trackId === String(track.trackId)));
        status.textContent = `${track.trackName} · 30-second preview`;
        if (autoPlay) {
          try {
            await audio.play();
            tape.classList.add("on");
            play.setAttribute("aria-pressed", "true");
            play.textContent = "Ⅱ Pause preview";
            if (typeof setDuck === "function") setDuck(0.08);
          } catch (err) {
            status.textContent = "Tap play again to start the preview.";
          }
        }
      };
      play.onclick = async () => {
        if (audio && !audio.paused) {
          audio.pause(); stop(); return;
        }
        if (active && !audio) {
          await selectTrack(active, true);
        } else if (active) {
          try { await audio.play(); tape.classList.add("on"); play.setAttribute("aria-pressed", "true"); play.textContent = "Ⅱ Pause preview"; if (typeof setDuck === "function") setDuck(0.08); }
          catch (err) { status.textContent = "This preview could not start. Choose another track."; }
        } else {
          const first = tracks.find(t => t.previewUrl);
          if (first) await selectTrack(first, true);
          else status.textContent = "No preview is ready yet. Check your connection and try again.";
        }
      };
      this.unmount = () => { stopped = true; stop(); if (audio) { audio.pause(); audio.src = ""; } };
      const render = () => {
        shelf.innerHTML = tracks.filter(t => t.previewUrl).map(t => `<button type="button" class="preview-track" data-track-id="${ E(t.trackId) }"><img src="${ E(t.artworkUrl100 || "") }" alt=""><span><b>${ E(t.trackName) }</b><small>${ E(t.artistName) } · ${ E(t.collectionName || "Single") }</small></span><i>▶</i></button>`).join("") || `<p class="dim">No playable previews were returned. Try again when connected to the internet.</p>`;
        shelf.querySelectorAll(".preview-track").forEach((button, index) => button.onclick = () => selectTrack(tracks.filter(t => t.previewUrl)[index], true));
        if (tracks.some(t => t.previewUrl)) {
          status.textContent = "Preview shelf ready · choose a track";
          const first = tracks.find(t => t.previewUrl);
          now.innerHTML = `<img src="${ E(first.artworkUrl600 || first.artworkUrl100 || "") }" alt="Album cover"><div><small>READY TO PLAY</small><b>${ E(first.trackName) }</b><span>${ E(first.artistName) }</span><em>${ E(first.collectionName || "Single") }</em></div>`;
          active = first;
        }
      };
      const load = async () => {
        try {
          await Promise.all(tracks.map(async t => {
            try {
              const url = "https://itunes.apple.com/search?media=music&entity=song&limit=8&term=" + encodeURIComponent(t.query);
              const response = await fetch(url);
              if (!response.ok) return;
              const data = await response.json();
              const hit = (data.results || []).find(x => x.previewUrl && x.trackName && x.artistName);
              if (hit) Object.assign(t, hit);
            } catch (err) { /* One unavailable search should not block the other tracks. */ }
          }));
          if (!stopped) render();
        } catch (err) {
          if (!stopped) {
            shelf.innerHTML = `<p class="dim">The preview service could not be reached. Open this site through a local web server or hosted HTTPS page, then try again.</p>`;
            status.textContent = location.protocol === "file:" ? "Use a local server (not file://) to load previews." : "Network unavailable · previews need an internet connection.";
          }
        }
      };
      load();
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
  /* Streaming stations: free, no API key, nothing is downloaded or stored.
     f = dial position x10. kind "stream" = live internet radio (SomaFM), "lofi" = live lofi stations looked up from the free radio-browser.info directory,
     "itunes" = the artist's songs as 30 second previews from Apple's free iTunes Search API. Add or edit lines freely. */
  const SOMA = n => ["https://ice1.somafm.com/" + n + "-128-mp3", "https://ice2.somafm.com/" + n + "-128-mp3", "https://ice4.somafm.com/" + n + "-128-mp3"];
  const STATIONS = [
    { f: 886, name: "Groove Salad", kind: "stream", urls: SOMA("groovesalad"), desc: "Downtempo and chill, live from SomaFM.", cred: "Live stream: SomaFM" },
    { f: 903, name: "Lush", kind: "stream", urls: SOMA("lush"), desc: "Sultry, mellow, dreamy vocals, live from SomaFM.", cred: "Live stream: SomaFM" },
    { f: 920, name: "Lofi beats", kind: "rb", qs: ["tag=lofi", "tag=chillhop"], rand: true, fb: "fluid", desc: "Lofi hip-hop to sit under a tree with.", cred: "Live stations via radio-browser.info" },
    { f: 937, name: "Indie Pop Rocks", kind: "stream", urls: SOMA("indiepop"), desc: "Indie pop, live from SomaFM.", cred: "Live stream: SomaFM" },
    { f: 955, name: "Tamil FM", kind: "rb", qs: ["language=tamil", "tag=tamil", "tag=tamil%20fm"], off: 0, desc: "Tamil FM, live.", cred: "Live stations via radio-browser.info" },
    { f: 991, name: "Cigarettes After Sex", kind: "itunes", term: "Cigarettes After Sex", desc: "Slow, hazy, 3 a.m. dream-pop.", cred: "30 second previews via the iTunes Search API" },
    { f: 1009, name: "TV Girl", kind: "itunes", term: "TV Girl", desc: "Sun-bleached samples and sad, funny lyrics.", cred: "30 second previews via the iTunes Search API" },
    { f: 1027, name: "Mazzy Star", kind: "itunes", term: "Mazzy Star", desc: "Slowcore and haze.", cred: "30 second previews via the iTunes Search API" },
    { f: 1045, name: "Beach House", kind: "itunes", term: "Beach House", desc: "Dream-pop that feels like drifting.", cred: "30 second previews via the iTunes Search API" },
    { f: 1062, name: "Fluid", kind: "stream", urls: SOMA("fluid"), desc: "Instrumental hip-hop and future soul, live from SomaFM.", cred: "Live stream: SomaFM" },
    { f: 1077, name: "Tamil FM 2", kind: "rb", qs: ["language=tamil", "tag=tamil", "tag=tamil%20fm"], off: 3, desc: "Another Tamil FM, live.", cred: "Live stations via radio-browser.info" }
  ];

  const RB = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://at1.api.radio-browser.info"];
  const getJSON = async (urls, path) => {
    for (const u of urls) {
      try {
        const r = await fetch(u + path);
        if (r.ok) {
          return await r.json();
        }
      } catch (e) {
      }
    }
    return null;
  };
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  UI.radio = {
    html: () => `<div class="radio"><div class="r-face"><div class="grille"></div><div><div class="led" id="rf">88.4</div><div class="sig"><i id="rs"></i></div></div></div><input id="rd" class="dial" type="range" min="880" max="1080" step="1" value="884" aria-label="Tuning dial"><p class="r-hint" id="rh">Turn the dial. Somewhere in the static there is a station.</p><div class="r-out" id="ro"><p>${ tx(C.radio.note) }</p>${ trk().length ? `<div class="rplay"><p class="rnow"></p><div class="rctl"><button type="button" class="rprev" aria-label="Previous song">&#9198;</button><button type="button" class="rpp" aria-pressed="false">&#9654; Play</button><button type="button" class="rnext" aria-label="Next song">&#9197;</button></div></div>` : embed(C.radio.url) || "" }${ A(C.radio.url, "Station or playlist", "sp") }</div><div class="r-out" id="ro2"><p class="xdesc"></p><div class="rplay"><p class="xnow"></p><div class="xctl"><button type="button" class="xprev" aria-label="Previous song">&#9198;</button><button type="button" class="xpp" aria-pressed="false">&#9654; Play</button><button type="button" class="xnext" aria-label="Next song">&#9197;</button></div></div><p class="xcred"></p></div></div>`,
    mount(root) {
      const rd = root.querySelector("#rd");
      const rf = root.querySelector("#rf");
      const rs = root.querySelector("#rs");
      const rh = root.querySelector("#rh");
      const ro = root.querySelector("#ro");
      const st = Math.round(parseFloat(C.radio.freq || "97.3") * 10) || 973;
      const ro2 = root.querySelector("#ro2");
      const all = [{ f: st, home: true }].concat(STATIONS);
      let node = null;
      let locked = null;

      /* ---- streaming player for the dial stations ---- */
      const xd = ro2.querySelector(".xdesc");
      const xn = ro2.querySelector(".xnow");
      const xc = ro2.querySelector(".xcred");
      const xpp = ro2.querySelector(".xpp");
      const xprev = ro2.querySelector(".xprev");
      const xnext = ro2.querySelector(".xnext");
      const xa = new Audio();
      let tok = 0;
      let list = [];
      let li = 0;
      let cur = null;
      const setPP = () => {
        const pl = !xa.paused;
        xpp.setAttribute("aria-pressed", String(pl));
        xpp.innerHTML = pl ? "&#10074;&#10074; Pause" : "&#9654; Play";
      };
      const say = t => {
        xn.textContent = t;
      };
      const playCur = () => {
        const p = xa.play();
        if (p && p.catch) {
          p.catch(() => {
            say("Press play to start the music.");
            setPP();
          });
        }
      };
      let hops = 0;
      let dtm = 0;
      const duck = lo => {
        clearTimeout(dtm);
        if (typeof setDuck !== "function") {
          return;
        }
        if (lo) {
          setDuck(0.08);
        } else {
          dtm = setTimeout(() => setDuck(1), 500);
        }
      };
      const goStation = d => {
        const ord = all.slice().sort((a, b) => a.f - b.f);
        const v = locked ? locked.f : +rd.value;
        let nx;
        if (d > 0) {
          nx = ord.find(a => a.f > v) || ord[0];
        } else {
          nx = ord.slice().reverse().find(a => a.f < v) || ord[ord.length - 1];
        }
        rd.value = nx.f;
        upd();
      };
      const dead = () => {
        const me = cur;
        say("No signal here, moving to the next station...");
        setTimeout(() => {
          if (cur && cur === me && hops < all.length) {
            hops++;
            goStation(1);
          }
        }, 1600);
      };
      const loadItem = () => {
        const it = list[li];
        if (!it) {
          dead();
          return;
        }
        xa.src = it.src;
        say(it.label);
        playCur();
      };
      const skip = d => {
        if (!list.length) {
          return;
        }
        li = (li + d + list.length) % list.length;
        loadItem();
      };
      xa.volume = 0.7;
      xa.preload = "none";
      xa.addEventListener("play", () => {
        setPP();
        duck(true);
      });
      xa.addEventListener("pause", () => {
        setPP();
        duck(false);
      });
      xa.addEventListener("playing", () => {
        hops = 0;
      });
      xa.addEventListener("ended", () => skip(1));
      xa.addEventListener("error", () => {
        if (!cur || !xa.getAttribute("src")) {
          return;
        }
        if (list.length > 1 && li < list.length - 1) {
          li++;
          loadItem();
        } else {
          dead();
        }
      });
      xpp.onclick = () => {
        if (!xa.src) {
          return;
        }
        if (xa.paused) {
          playCur();
        } else {
          xa.pause();
        }
      };
      xprev.onclick = () => {
        hops = 0;
        goStation(-1);
      };
      xnext.onclick = () => {
        hops = 0;
        goStation(1);
      };
      const leave = () => {
        tok++;
        cur = null;
        xa.pause();
        xa.removeAttribute("src");
        xa.load();
        list = [];
        setPP();
      };
      const enter = async S0 => {
        const my = ++tok;
        cur = S0;
        list = [];
        li = 0;
        xd.textContent = S0.desc;
        xc.textContent = S0.cred;
        say("tuning in...");
        if (S0.kind === "stream") {
          list = S0.urls.map(u => ({ src: u, label: S0.name + " (live)" }));
        } else if (S0.kind === "itunes") {
          const j = await getJSON(["https://itunes.apple.com"], "/search?media=music&entity=song&limit=30&term=" + encodeURIComponent(S0.term));
          const key = S0.term.toLowerCase();
          const rows = j && j.results ? j.results.filter(r => r.previewUrl && (r.artistName || "").toLowerCase().indexOf(key) >= 0) : [];
          list = shuffle(rows).map(r => ({ src: r.previewUrl, label: r.trackName + ", " + r.artistName + "  (30 s preview)" }));
        } else {
          const qs = S0.qs.slice();
          if (S0.rand) {
            shuffle(qs);
          }
          let rows = [];
          for (const q of qs) {
            const j = await getJSON(RB, "/json/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=40&" + q);
            rows = Array.isArray(j) ? j.filter(r => r.lastcheckok && (/^https:/i.test(r.url_resolved || "") || (location.protocol !== "https:" && /^http:/i.test(r.url_resolved || "")))) : [];
            if (rows.length || my !== tok) {
              break;
            }
          }
          if (S0.rand) {
            rows = shuffle(rows.slice(0, 15));
          } else if (rows.length > 1) {
            const o = (S0.off || 0) % rows.length;
            rows = rows.slice(o).concat(rows.slice(0, o));
          }
          list = rows.slice(0, 12).map(r => ({ src: r.url_resolved, label: (r.name || S0.name).trim() + " (live)" }));
          if (!list.length && S0.fb) {
            list = SOMA(S0.fb).map(u => ({ src: u, label: "Fluid (live)" }));
          }
        }
        if (my !== tok) {
          return;
        }
        loadItem();
      };

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
        let best = all[0];
        all.forEach(a => {
          if (Math.abs(v - a.f) < Math.abs(v - best.f)) {
            best = a;
          }
        });
        const d = Math.abs(v - best.f);
        const q = Math.max(0, 1 - d / 70);
        const lock = d <= 4;
        rf.textContent = (v / 10).toFixed(1);
        rs.style.width = Math.round(q * 100) + "%";
        rd.setAttribute("aria-valuetext", (v / 10).toFixed(1) + " megahertz");
        if (node) {
          node.g.gain.setTargetAtTime(lock ? 0 : 0.05 * (1 - q) * (1 - q), ac.currentTime, 0.05);
        }
        const who = lock ? best : null;
        if (who !== locked) {
          const was = locked;
          locked = who;
          ro.classList.toggle("on", !!who && !!who.home);
          ro2.classList.toggle("on", !!who && !who.home);
          if (was && !was.home) {
            leave();
          }
          if (who) {
            rh.textContent = who.home ? "there you are." : "there you are: " + who.name;
            if (!who.home) {
              enter(who);
            }
            if (ac && on) {
              tone(660, 660, 0.6, "sine", 0.04);
              tone(880, 880, 0.8, "sine", 0.03, 0.12);
            }
          } else {
            rh.textContent = "Lost it. Turn the dial back.";
          }
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
        au.onplay = () => duck(true);
        au.onpause = () => duck(false);
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
      this.leave = leave;
      rd.addEventListener("input", upd);
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
      if (this.leave) {
        this.leave();
      }
      if (typeof setDuck === "function") {
        setDuck(1);
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
      return `<div class="folder" id="fold"><div class="f-tab">${ tx(R.emotion) || "resume" }</div><div class="f-paper"><p>${ tx(R.summary) }</p>${ es.map(r => `<div class="role"><b>${ tx(r.role) }</b>${ tx(r.place) } ${ tx(r.years) }<br><span class="dim">${ tx(r.note) }</span></div>`).join("") }</div><div class="f-front"><span>RESUME</span></div></div>${ ok(R.fileUrl) ? A(R.fileUrl, "Open the resume", "web") : "" }`;
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
      return `<div class="pol" id="pol" tabindex="0" role="img" aria-label="${ E(S2.photoAlt || "Polaroid photo") }"><div class="pol-img">${ has ? `<img src="${ E(S2.photo) }" alt="">` : "" }<span class="pol-fog"></span></div><p class="pol-cap">${ tx(S2.photoNote) }</p></div><p class="note-p">${ tx(S2.caption) }</p>`;
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

  // ---- me: travel-license parody + manually browsable meme mixtape
  UI.me = {
    html() {
      const memes = [
        ["./images/meme-ambition.jpg", "Ambitious nature"],
        ["./images/meme-we-ball.jpg", "We ball"],
        ["./images/meme-cat-love.jpg", "Cat love"],
        ["./images/meme-neurodivergent.jpg", "Neurodivergent experience"],
        ["./images/meme-inside-out.jpg", "Me inside out"],
        ["./images/meme-referee.jpg", "I don't want to play anymore"]
      ];
      return `
        <section class="me-passport" aria-label="Personal travel license">
          <div class="me-passport-head">
            <span>PERMANENT LICENSE OF TRAVEL</span>
            <b>NO. TTC6252021</b>
          </div>
          <div class="me-passport-main">
            <div class="me-passport-photo">
              <img src="./images/me.jpg" alt="Photograph of Chandru">
              <small>Photograph of Authorized Traveler</small>
            </div>
            <div class="me-passport-details">
              <div class="me-id-row"><span>Issued to</span><b>Chandru</b></div>
              <div class="me-id-row"><span>Date of birth</span><b>9/2/2005</b></div>
              <div class="me-id-row"><span>Place of issue</span><b>BEDROOM</b></div>
              <h3>LICENSE OF TRAVEL</h3>
              <p>This is to certify that the person named and described above is permitted to travel and explore freely unless detained by law.</p>
              <h4>IMPORTANT</h4>
              <p class="me-id-one-line">A super nerd with an INFP personality and a neurodivergent brain.</p>
            </div>
          </div>
          <div class="me-passport-sign"><span class="me-paw-sign" aria-label="Cat paw signature">🐾 🐾</span><i>Signature of Authorized Traveler</i></div>
        </section>
        <div class="me-album-heading"><span>THE GIRI MIXTAPE</span><i>ONE FRAME AT A TIME</i></div>
        <section class="me-album-player" aria-label="Meme mixtape">
          <div class="me-album-case">
            <div class="me-album-art"><img class="me-slide-image" src="${ E(memes[0][0]) }" alt="${ E(memes[0][1]) }"></div>
            <div class="me-album-case-label"><span>GIRI'S MIXTAPE</span><span class="me-slide-count">01 / 06</span></div>
          </div>
          <div class="me-album-controls">
            <button type="button" class="me-slide-prev" aria-label="Previous meme">&larr;</button>
            <div class="me-slide-dots" role="group" aria-label="Choose a meme">
              ${memes.map((m,i)=>`<button type="button" class="me-slide-dot${i===0?" active":""}" data-slide="${i}" aria-label="Show meme ${i+1}" aria-pressed="${i===0?"true":"false"}"></button>`).join("")}
            </div>
            <button type="button" class="me-slide-next" aria-label="Next meme">&rarr;</button>
          </div>
        </section>
        <div class="me-links">${ C.links.filter(l => l.url).map(l => A(l.url, E(l.label))).join("") }</div>`;
    },
    mount(root) {
      const memes = [
        ["./images/meme-ambition.jpg", "Ambitious nature"],
        ["./images/meme-we-ball.jpg", "We ball"],
        ["./images/meme-cat-love.jpg", "Cat love"],
        ["./images/meme-neurodivergent.jpg", "Neurodivergent experience"],
        ["./images/meme-inside-out.jpg", "Me inside out"],
        ["./images/meme-referee.jpg", "I don't want to play anymore"]
      ];
      const image = root.querySelector(".me-slide-image");
      const count = root.querySelector(".me-slide-count");
      const dots = [...root.querySelectorAll(".me-slide-dot")];
      let active = 0;
      const show = index => {
        active = (index + memes.length) % memes.length;
        image.classList.remove("loaded");
        image.src = new URL(memes[active][0], document.baseURI).href;
        image.alt = memes[active][1];
        count.textContent = String(active + 1).padStart(2,"0") + " / " + String(memes.length).padStart(2,"0");
        dots.forEach((dot,i) => {
          dot.classList.toggle("active",i===active);
          dot.setAttribute("aria-pressed",i===active?"true":"false");
        });
      };
      image.onload = () => image.classList.add("loaded");
      image.onerror = () => {
        image.classList.add("load-error");
        image.alt = "Meme image could not be loaded: " + memes[active][1];
      };
      root.querySelector(".me-slide-prev").onclick = () => show(active - 1);
      root.querySelector(".me-slide-next").onclick = () => show(active + 1);
      dots.forEach(dot => dot.onclick = () => show(Number(dot.dataset.slide)));
      show(0);
    }
  };
}());
