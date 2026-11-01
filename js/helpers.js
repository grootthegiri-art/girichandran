/* ==========================================================================
   helpers.js: small shared tools
   Loaded first. Defines globals used by every other file:
     $  (querySelector)   calm (reduced motion)   LOW (phone/low memory)   Q (render quality)
     E  (escape HTML)     tx (text span)          ok (is this a real link/file?)
     LOGO (link icons)    A (link tile)           embed (Spotify player)   C (= CONTENT, your info)
   ========================================================================== */

/* ============ ENGINE (do not edit) ============ */
const $ = s => document.querySelector(s);

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Quality tiers: phones and low-memory devices start at a lower render scale and smaller shadow map, then adapt to measured frame time.
const LOW = matchMedia("(pointer: coarse)").matches || navigator.deviceMemory && navigator.deviceMemory <= 4;

const Q = {
  cap: Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 2),
  min: 0.75,
  debug: /[?&]debug\b/.test(location.search)
};

Q.pr = Q.cap;

if (LOW) {
  document.documentElement.classList.add("low");
}

if (Q.debug) {
  const d = document.createElement("div");
  d.id = "perf";
  d.setAttribute("aria-hidden", "true");
  d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:20;font:12px monospace;color:#fff;background:#0009;padding:4px 6px";
  document.body.appendChild(d);
}

const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;"
}[c]));

const isPh = t => /^\s*\[.*\]\s*$/.test(t || "");

const tx = t => t ? `<span class="${ isPh(t) ? "ph" : "" }">${ E(t) }</span>` : "";

const ok = u => /^(https?:\/\/\S+|[\w.\-\/ ]+\.(pdf|docx?))$/i.test(u || "");

const LOGO = {
  ig: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"1.9\" stroke-linecap=\"round\" aria-hidden=\"true\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\".7\" fill=\"#fff\"/></svg>",
  sp: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0b0b0b\" stroke-width=\"2.1\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M5 9c4.5-1.3 9.5-1 14 1.2\"/><path d=\"M6 12.7c3.8-1 7.7-.7 11.3 1\"/><path d=\"M7 16c3.2-.7 6.2-.5 9 .8\"/></svg>",
  lb: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"6.5\" cy=\"12\" r=\"4.4\" fill=\"#ff8000\"/><circle cx=\"12\" cy=\"12\" r=\"4.4\" fill=\"#00e054\" fill-opacity=\".92\"/><circle cx=\"17.5\" cy=\"12\" r=\"4.4\" fill=\"#40bcf4\" fill-opacity=\".92\"/></svg>",
  web: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M7 17 17 7M9 7h8v8\"/></svg>"
};

const kindOf = (u, l, k) => k || (/instagram\.com/i.test(u) || /instagram/i.test(l) ? "ig" : /spotify\.com/i.test(u) || /spotify/i.test(l) ? "sp" : /letterboxd\.com|boxd\.it/i.test(u) || /letterboxd/i.test(l) ? "lb" : "web");

const A = (u, l, k) => {
  const kd = kindOf(u, l, k);
  if (ok(u)) {
    return `<a class="orb k-${ kd }" href="${ E(u) }" target="_blank" rel="noopener noreferrer" aria-label="${ l } (opens in a new tab)"><span class="tile">${ LOGO[kd] }</span><span class="orb-l">${ l }</span></a>`;
  }
  if (kd !== "web") {
    return `<span class="orb k-${ kd } soon" role="img" aria-label="${ l }: coming soon"><span class="tile">${ LOGO[kd] }</span><span class="orb-l">${ l }<small>coming soon</small></span></span>`;
  }
  return "";
};

function embed(u) {
  const m = /open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/.exec(u || "");
  return m ? `<iframe src="https://open.spotify.com/embed/${ m[1] }/${ m[2] }" title="Spotify player" loading="lazy" allow="encrypted-media"></iframe>` : "";
}

const C = CONTENT;
