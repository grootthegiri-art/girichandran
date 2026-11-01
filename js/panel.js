/* ==========================================================================
   panel.js: the full-screen panel that opens for each object
   show(key) opens it, hide() closes it. Also builds the hidden keyboard tab list (#tabs)
   and the epilogue line shown after every object has been opened once.
   ========================================================================== */
// panel
const panel = $("#panel");

const blob = $("#blob");

let current = null;

let lastBtn = null;

function words(root) {
  let n = 0;
  const wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const ts = [];
  while (wk.nextNode()) {
    ts.push(wk.currentNode);
  }
  ts.forEach(t => {
    if (!t.nodeValue.trim()) {
      return;
    }
    const f = document.createDocumentFragment();
    t.nodeValue.split(/(\s+)/).forEach(p => {
      if (!p || /^\s+$/.test(p)) {
        f.append(p);
        return;
      }
      const s = document.createElement("span");
      s.className = "w";
      s.style.setProperty("--i", n++);
      s.textContent = p;
      f.append(s);
    });
    t.replaceWith(f);
  });
}

let epiBoost = 0;

let epiDone = false;

let opener = null;

let openT = 0;

let curUI = null;

const opened = new Set();

const hint = { t: 9, k: null, on: 0 };

const inertEls = ["#c", "header", "#tabs"];

function show(k, btn) {
  if (curUI && curUI.unmount) {
    curUI.unmount();
  }
  const o = OBJ[k];
  const ui = window.UI && UI[k];
  curUI = ui || null;
  if (!current) {
    opener = document.activeElement;
  }
  current = k;
  opened.add(k);
  lastBtn = btn || lastBtn;
  sfx(k);
  const r = (btn || lastBtn).getBoundingClientRect();
  blob.style.setProperty("--bx", r.left + r.width / 2 + "px");
  blob.style.setProperty("--by", r.top + r.height / 2 + "px");
  const body = ui ? ui.html() : o.html();
  const empty = !ui && !body.replace(/<[^>]*>/g, "").trim();
  panel.dataset.ui = ui ? k : "";
  $("#pb").innerHTML = `<h2 id="pt">${ E(o.title) }</h2><p class="why">${ tx(C.story[k]) }</p>` + (empty ? `<p class="dim">Not developed yet. Some frames take their time.</p>` : body);
  $("#pb").classList.remove("fast");
  $("#pb").classList.toggle("rise", !!ui);
  if (ui) {
    if (ui.mount) {
      ui.mount($("#pb"));
    }
  } else {
    words($("#pb"));
  }
  blob.classList.add("open");
  clearTimeout(openT);
  openT = setTimeout(() => panel.classList.add("open"), 320);
  document.body.classList.add("reading");
  inertEls.forEach(s => {
    const el = $(s);
    if (el) {
      el.inert = true;
    }
  });
  $("#x").focus({ preventScroll: true });
  goal.tx = o.pos[0];
  goal.ty = o.pos[1];
  goal.tz = o.pos[2];
  goal.r = 4.6;
  goal.ph = 1.25;
}

function hide() {
  if (current) {
    sfx("close");
    if (!epiDone && opened.size >= Object.keys(OBJ).length) {
      epiDone = true;
      setTimeout(() => {
        if (current) {
          return;
        }
        $("#cap").textContent = C.epilogue || "You opened everything. Some things leave. Some things stay.";
        epiBoost = 1.6;
        setTimeout(() => {
          if (!current) {
            $("#cap").textContent = "";
          }
        }, 9000);
      }, 1400);
    }
  }
  document.body.classList.remove("reading");
  clearTimeout(openT);
  if (curUI && curUI.unmount) {
    curUI.unmount();
  }
  curUI = null;
  panel.classList.remove("open");
  blob.classList.remove("open");
  current = null;
  $("#cap").textContent = "";
  Object.assign(goal, HOME);
  inertEls.forEach(s => {
    const el = $(s);
    if (el) {
      el.inert = false;
    }
  });
  const f = opener || lastBtn;
  if (f && f.focus) {
    f.focus();
  }
  opener = null;
}

$("#x").onclick = hide;

$("#reset").onclick = hide;

$("#pb").addEventListener("pointerdown", () => $("#pb").classList.add("fast"));

addEventListener("keydown", e => {
  if (e.key === "Escape" && current) {
    hide();
  }
});

Object.entries(OBJ).forEach(([k, o]) => {
  const t = document.createElement("button");
  t.textContent = o.label;
  t.onclick = () => show(k, t);
  $("#tabs").appendChild(t);
});
