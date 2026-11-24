/* ============================================================================
   editor.js: logic of editor.html (the easy form that edits content.js)
   - SECTIONS describes every form section: [path in CONTENT, label, optional type].
     Types: "area" (big text box), "image" / "audio" / "file" (file pickers), "select:a,b".
   - The form edits a copy (S) of CONTENT. "Download update pack" writes a new content.js
     (+ any photos/audio/PDF you picked) into a zip you unzip over the site folder.
   To add a new editable field: add it to content.js, then add one line to SECTIONS.
   ============================================================================ */
const emo = p => [p + ".emotion", "One emotion word for this object"];

const SECTIONS = [
  {
    t: "About you",
    f: [
      ["person.name", "Your name"],
      ["person.emotion", "One emotion word for you"],
      ["person.tagline", "Tagline"],
      ["person.intro", "Introduction", "area"],
      ["person.seesLifeAs", "How you see life", "area"],
      ["person.wantToCreate", "What you want to create", "area"]
    ]
  },
  {
    t: "Links (Instagram, Letterboxd, Spotify, anything)",
    list: "links",
    item: [["label", "Name"], ["url", "Link"]]
  },
  {
    t: "Notebook (journal)",
    f: [emo("notebook")],
    list: "notebook.entries",
    item: [["date", "Date"], ["title", "Title"], ["text", "Text", "area"]]
  },
  {
    t: "Camera (photographs)",
    f: [emo("camera")],
    list: "camera.photos",
    item: [
      ["src", "Photo", "image"],
      ["alt", "Describe the photo (for screen readers)"],
      ["caption", "Caption"],
      ["meaning", "The memory behind it", "area"]
    ]
  },
  {
    t: "Earphones (music)",
    f: [
      emo("music"),
      ["music.profileUrl", "Spotify profile link"],
      ["music.playlistUrl", "Spotify playlist link"],
      ["music.latest.title", "Latest song title"],
      ["music.latest.artist", "Artist"],
      ["music.latest.note", "How it makes you feel", "area"],
      ["music.latest.url", "Song link (Spotify)"]
    ]
  },
  {
    t: "Film reel",
    f: [
      emo("film"),
      ["film.letterboxdUrl", "Letterboxd profile link"],
      ["film.latest.title", "Latest film"],
      ["film.latest.scene", "Scene or idea"],
      ["film.latest.review", "Your review", "area"],
      ["film.latest.url", "Film link"]
    ]
  },
  {
    t: "Resume (folder)",
    f: [emo("resume"), ["resume.summary", "Short summary", "area"], ["resume.fileUrl", "Resume file (PDF)", "file"]],
    list: "resume.entries",
    item: [["role", "Role"], ["place", "Place"], ["years", "Years"], ["note", "Note"]]
  },
  {
    t: "Radio",
    f: [
      emo("radio"),
      ["radio.note", "Note", "area"],
      ["radio.url", "Station or playlist link"],
      ["radio.freq", "Hidden station on the dial (88.0 to 108.0)"]
    ],
    list: "radio.tracks",
    item: [
      ["title", "Song title"],
      ["artist", "Artist"],
      ["file", "Song file (mp3 you own or are licensed to use)", "audio"]
    ]
  },
  {
    t: "Polaroid (Instagram)",
    f: [
      emo("social"),
      ["social.photo", "Polaroid photo", "image"],
      ["social.photoAlt", "Describe the photo (for screen readers)"],
      ["social.photoNote", "Small note under the photo"],
      ["social.caption", "Caption", "area"],
      ["social.url", "Instagram link"]
    ]
  },
  {
    t: "Book",
    f: [emo("book"), ["book.title", "Book title"], ["book.note", "Your note", "area"], ["book.url", "Book link"]]
  },
  {
    t: "Letter (contact)",
    f: [emo("letter"), ["letter.note", "A short written note", "area"], ["letter.email", "Email"]]
  },
  {
    t: "Cat",
    f: [
      ["cat.name", "Cat\u2019s name"],
      ["cat.color", "Colour", "select:ginger,black"],
      ["cat.story", "Story", "area"]
    ]
  },
  {
    t: "Why each object is here (one line each)",
    f: [
      ["story.me", "Why he is under the tree", "area"],
      ["story.notebook", "Notebook"],
      ["story.camera", "Camera"],
      ["story.music", "Earphones"],
      ["story.film", "Film reel"],
      ["story.radio", "Radio"],
      ["story.book", "Book"],
      ["story.social", "Polaroid"],
      ["story.letter", "Letter"],
      ["story.resume", "Folder"],
      ["story.lantern", "Lantern"],
      ["story.cat", "Cat"]
    ]
  },
  { t: "Background audio (optional)", f: [["audio.src", "Audio file (mp3)", "audio"], ["audio.credit", "Credit"]] }
];

let S = typeof CONTENT !== "undefined" ? JSON.parse(JSON.stringify(CONTENT)) : {};

const FILES = {};

const $ = s => document.querySelector(s);

const get = (o, p) => p.split(".").reduce((a, k) => a == null ? undefined : a[k], o);

const set = (o, p, v) => {
  const ks = p.split(".");
  const last = ks.pop();
  ks.reduce((a, k) => a[k] = a[k] || {}, o)[last] = v;
};

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;"
}[c]));

const say = t => {
  $("#msg").textContent = t;
};

function input(type, val, attrs) {
  if (type === "area") {
    return `<textarea rows="3" ${ attrs }>${ esc(val) }</textarea>`;
  }
  if (type.startsWith("select:")) {
    return `<select ${ attrs }>${ type.slice(7).split(",").map(o => `<option ${ o === val ? "selected" : "" }>${ o }</option>`).join("") }</select>`;
  }
  if ([
      "image",
      "audio",
      "file"
    ].includes(type)) {
    return `<span class="file"><input type="text" ${ attrs } value="${ esc(val) }" placeholder="no file chosen"><input type="file" data-file="${ type }" ${ attrs } accept="${ type === "image" ? "image/*" : type === "audio" ? "audio/*" : "application/pdf,.doc,.docx" }"></span>`;
  }
  return `<input type="text" ${ attrs } value="${ esc(val) }">`;
}

const row = (f, attrs, val) => `<label><span>${ f[1] }</span>${ input(f[2] || "text", val, attrs) }</label>`;

function listHtml(sec) {
  const arr = get(S, sec.list) || [];
  return `<div>${ arr.map((it, i) => `<fieldset><legend>#${ i + 1 }<button type="button" data-del="${ sec.list }" data-i="${ i }">Remove</button></legend>${ sec.item.map(f => row(f, `data-l="${ sec.list }" data-i="${ i }" data-k="${ f[0] }"`, it[f[0]])).join("") }</fieldset>`).join("") }<button type="button" data-add="${ sec.list }">+ Add another</button></div>`;
}

function render() {
  $("#app").innerHTML = SECTIONS.map(sec => `<section><h2>${ sec.t }</h2>${ (sec.f || []).map(f => row(f, `data-p="${ f[0] }"`, get(S, f[0]))).join("") }${ sec.list ? listHtml(sec) : "" }</section>`).join("");
}

function upd(t, v) {
  if (t.dataset.p) {
    set(S, t.dataset.p, v);
  } else {
    get(S, t.dataset.l)[+t.dataset.i][t.dataset.k] = v;
  }
}

const app = $("#app");

app.addEventListener("input", e => {
  if (e.target.type !== "file") {
    upd(e.target, e.target.value);
  }
});

app.addEventListener("change", e => {
  const t = e.target;
  if (t.type === "file" && t.files[0]) {
    const f = t.files[0];
    const dir = { image: "images", audio: "audio", file: "files" }[t.dataset.file];
    const ext = (f.name.split(".").pop() || "bin").toLowerCase();
    const base = t.dataset.l ? `${ t.dataset.l.split(".").pop() }-${ +t.dataset.i + 1 }` : t.dataset.p.endsWith("fileUrl") ? "resume" : t.dataset.p.endsWith("photo") ? "polaroid" : "ambient";
    const name = `${ dir }/${ base }.${ ext }`;
    FILES[name] = f;
    upd(t, name);
    t.previousElementSibling.value = name;
    say("Added " + name + ". It will be inside the zip.");
  } else if (t.tagName === "SELECT") {
    upd(t, t.value);
  }
});

app.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) {
    return;
  }
  if (b.dataset.add) {
    const sec = SECTIONS.find(s => s.list === b.dataset.add);
    const blank = {};
    sec.item.forEach(f => {
      blank[f[0]] = "";
    });
    if (!get(S, sec.list)) {
      set(S, sec.list, []);
    }
    get(S, sec.list).push(blank);
    render();
  }
  if (b.dataset.del) {
    get(S, b.dataset.del).splice(+b.dataset.i, 1);
    render();
  }
});

const contentJS = () => "/* Edited with editor.html. You can also edit by hand. Empty values are not shown. */\nconst CONTENT = " + JSON.stringify(S, null, 2) + ";\n";

const dl = (blob, name) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

$("#zip").onclick = async () => {
  const js = contentJS();
  const used = JSON.stringify(S);
  if (typeof JSZip === "undefined") {
    dl(new Blob([js], { type: "text/javascript" }), "content.js");
    say("No internet, so I downloaded content.js only. Copy your photos into the images folder yourself.");
    return;
  }
  const z = new JSZip();
  z.file("content.js", js);
  Object.keys(FILES).forEach(n => {
    if (used.includes(n)) {
      z.file(n, FILES[n]);
    }
  });
  dl(await z.generateAsync({ type: "blob" }), "update-pack.zip");
  say("Done. Unzip update-pack.zip over your site folder and replace the files.");
};

$("#copy").onclick = async () => {
  const p = "You are helping me fill in the content file for my personal website. Below is my current content as JSON. Fill or rewrite fields using the notes I give you after the JSON.\nRules: return ONLY valid JSON with exactly the same keys and structure. Do not invent facts about me. Leave a field as \"\" if I did not give it. Keep every link exactly as I give it. For photos use file names like images/photos-1.jpg.\n\nMY NOTES:\n(type or paste your notes here)\n\nCURRENT JSON:\n" + JSON.stringify(S, null, 2);
  try {
    await navigator.clipboard.writeText(p);
    say("Copied. Paste it into any AI, add your notes, then paste its answer under \u201CPaste what an AI gave you back\u201D.");
  } catch (e) {
    $("#imp").value = p;
    say("Couldn\u2019t use the clipboard. The prompt is in the box below, copy it from there.");
    document.querySelector("details").open = true;
  }
};

$("#load").onclick = () => {
  try {
    const o = JSON.parse($("#imp").value.replace(/^```(?:json)?|```$/gm, "").trim());
    if (typeof o !== "object" || !o) {
      throw 0;
    }
    S = o;
    render();
    say("Loaded into the form. Check it, then download the update pack.");
  } catch (e) {
    say("That wasn\u2019t valid JSON. Ask the AI to return only JSON.");
  }
};

$("#clr").onclick = () => {
  const w = o => {
    for (const k in o) {
      if (typeof o[k] === "string" && /^\s*\[.*\]\s*$/.test(o[k])) {
        o[k] = "";
      } else if (o[k] && typeof o[k] === "object") {
        w(o[k]);
      }
    }
  };
  w(S);
  render();
  say("Cleared. Anything you left empty is hidden on the site.");
};

render();
