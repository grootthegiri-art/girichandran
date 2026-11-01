/* ==========================================================================
   objects.js: the 11 clickable objects
   One entry per object: its tab label, panel title, caption, camera target (pos)
   and a plain html() used by the no-3D fallback. The fancy per-object screens are in ui.js.
   To add a new object you also need: a 3D model (world.js), a story line (content.js),
   and a screen (ui.js). See README.md.
   ========================================================================== */
const OBJ = {
  notebook: {
    label: "Notebook",
    title: "The notebook",
    cap: "A notebook left open. The journal lives here.",
    pos: [0.2, 0.35, 1.7],
    html: () => `<p class="emo">${ tx(C.notebook.emotion) }</p>` + C.notebook.entries.filter(e => e.title || e.text).map(e => `<div class="entry"><span class="dim">${ tx(e.date) }</span><h3>${ tx(e.title) }</h3><p>${ tx(e.text) }</p></div>`).join("")
  },
  camera: {
    label: "Camera",
    title: "The camera",
    cap: "A camera that kept what he wanted to keep.",
    pos: [2.1, 0.6, 1.6],
    html: () => `<p class="emo">${ tx(C.camera.emotion) }</p>` + C.camera.photos.filter(p => p.src || p.caption).map(p => `<figure><div class="pic">${ p.src && !isPh(p.src) ? `<img src="${ E(p.src) }" alt="${ E(p.alt || p.caption) }" loading="lazy">` : "Placeholder: set photos[].src" }</div><figcaption>${ tx(p.caption) }</figcaption>${ p.meaning ? `<details><summary>The memory</summary><p>${ tx(p.meaning) }</p></details>` : "" }</figure>`).join("")
  },
  music: {
    label: "Earphones",
    title: "The earphones",
    cap: "Wired earphones, still plugged in. What he heard last.",
    pos: [1.4, 0.35, 2.05],
    html: () => {
      const l = C.music.latest;
      return `<p class="emo">${ tx(C.music.emotion) }</p><h3 class="dim">Latest song</h3><p style="font:1.6rem var(--serif);margin:0">${ tx(l.title) }</p><p class="dim">${ tx(l.artist) }</p><p>${ tx(l.note) }</p>${ embed(l.url) }${ A(l.url, "Open the song", "sp") }${ A(C.music.playlistUrl, "Playlist", "sp") }${ A(C.music.profileUrl, "Spotify profile", "sp") }`;
    }
  },
  film: {
    label: "Film reel",
    title: "The film reel",
    cap: "A reel. What he watched, and what he said about it.",
    pos: [-1.4, 0.7, 1.6],
    html: () => {
      const l = C.film.latest;
      return `<p class="emo">${ tx(C.film.emotion) }</p><h3 class="dim">Latest film</h3><p style="font:1.8rem var(--serif);margin:0">${ tx(l.title) }</p><p class="dim">${ tx(l.scene) }</p><div class="entry"><p>${ tx(l.review) }</p></div>${ A(l.url, "The film", "lb") }${ A(C.film.letterboxdUrl, "Letterboxd profile", "lb") }`;
    }
  },
  resume: {
    label: "Folder",
    title: "The folder",
    cap: "The practical things, folded away.",
    pos: [-0.4, 0.65, 2.25],
    html: () => `<p class="emo">${ tx(C.resume.emotion) }</p><p>${ tx(C.resume.summary) }</p>` + C.resume.entries.filter(r => r.role || r.place).map(r => `<div class="role"><b>${ tx(r.role) }</b>${ tx(r.place) } ${ tx(r.years) }<br><span class="dim">${ tx(r.note) }</span></div>`).join("") + A(C.resume.fileUrl, "Full resume")
  },
  me: {
    label: "Girichandran",
    title: C.person.name,
    cap: "Someone sitting under a tree.",
    pos: [1, 1.7, 0.9],
    html: () => {
      const p = C.person;
      return `<p class="emo">${ tx(p.emotion) }</p>${ p.tagline ? `<p style="font:italic 1.3rem var(--serif)">${ tx(p.tagline) }</p>` : "" }${ p.intro ? `<p style="font:1.2rem/1.6 var(--serif);white-space:pre-line">${ tx(p.intro) }</p>` : "" }${ p.seesLifeAs ? `<h3 class="dim">The way I see it</h3><p style="font:1.15rem/1.6 var(--serif);white-space:pre-line">${ tx(p.seesLifeAs) }</p>` : "" }${ p.wantToCreate ? `<h3 class="dim">What I&rsquo;m chasing</h3><p style="font:1.15rem/1.6 var(--serif);white-space:pre-line">${ tx(p.wantToCreate) }</p>` : "" }` + C.links.map(l => A(l.url, E(l.label))).join("");
    }
  },
  radio: {
    label: "Radio",
    title: "The radio",
    cap: "",
    pos: [2.9, 0.3, 1],
    html: () => `<p class="emo">${ tx(C.radio.emotion) }</p><p style="font:1.3rem/1.5 var(--serif)">${ tx(C.radio.note) }</p>${ A(C.radio.url, "Station or playlist", "sp") }`
  },
  social: {
    label: "Photo",
    title: "The polaroid",
    cap: "A photo left face up.",
    pos: [0.9, 0.2, 2.5],
    html: () => `<p class="emo">${ tx(C.social.emotion) }</p>${ C.social.photo ? `<figure><div class="pic"><img src="${ E(C.social.photo) }" alt="${ E(C.social.photoAlt || "") }" loading="lazy"></div>${ C.social.photoNote ? `<figcaption>${ tx(C.social.photoNote) }</figcaption>` : "" }</figure>` : "" }<p style="font:1.2rem/1.55 var(--serif)">${ tx(C.social.caption) }</p>${ A(C.social.url, "Instagram", "ig") }`
  },
  book: {
    label: "Book",
    title: "The book",
    cap: "Pages folded where he stopped.",
    pos: [-2, 0.2, 0.9],
    html: () => `<p class="emo">${ tx(C.book.emotion) }</p><p style="font:1.6rem var(--serif);margin:0">${ tx(C.book.title) }</p><p>${ tx(C.book.note) }</p>${ A(C.book.url, "The book") }`
  },
  letter: {
    label: "Letter",
    title: "The letter",
    cap: "A letter with a wax seal.",
    pos: [-1, 0.15, 2.9],
    html: () => `<p class="emo">${ tx(C.letter.emotion) }</p><p style="font:1.3rem/1.5 var(--serif)">${ tx(C.letter.note) }</p><p style="font:1.1rem var(--serif)">${ tx(C.letter.email) }</p>`
  },
  cat: {
    label: "Cat",
    title: C.cat.name,
    cap: "A cat that decides where the day goes.",
    pos: [2.4, 0.5, 0.4],
    html: () => `<p class="emo">${ tx(C.cat.color === "black" ? "black cat" : "ginger cat") }</p><p style="font:1.3rem/1.5 var(--serif)">${ tx(C.cat.story) }</p>`
  }
};
