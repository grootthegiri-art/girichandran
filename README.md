# My website

A quiet interactive 3D scene: someone under a tree with a camera, notebook, film reel, radio, a cat.
Plain HTML + CSS + JavaScript. No build step, no framework. Double-click `index.html` to run it.

## Folder map

```
index.html        the page (rarely touched)
content.js        ALL YOUR INFO: text, links, photo names.  <-- the file you edit
editor.html       a form that edits content.js for you (local tool, optional to upload)
css/
  style.css       colours, fonts, layout (sections are labelled)
  editor.css      look of editor.html
js/               the code, loaded in this order (see index.html)
  world.js          3D models: tree, every object, the cat
  helpers.js        small shared tools ($, E, tx, A, C ...)
  objects.js        the 11 clickable objects (labels, captions, camera targets)
  weather-data.js   the 11 climates (colours, fog, light, particles)
  state.js          camera + shared state
  audio.js          all sound (synthesised, no files needed)
  panel.js          the page that opens for each object
  scene.js          the 3D world, in numbered sections (largest file)
  controls.js       drag, pinch, wheel, hover
  ui.js             the unique screen of each object (notebook pages, radio dial ...)
  main.js           start-up: weather rotation, intro, render loop
  editor.js         logic of editor.html
images/ audio/ files/   your photos, optional music, resume PDF
docs/             notes and history (not needed on the live site)
```

## Everyday edits (all in `content.js`)

Open `content.js` in any text editor. Keep the quotes and commas as they are.
An empty value (`""`) is simply not shown on the site.

| I want to...                  | Change this |
|-------------------------------|-------------|
| Add a journal entry           | `notebook.entries`: copy one `{ "date", "title", "text" }` block, paste after it with a comma |
| Add a photograph              | put the file in `images/`, add `{ "src": "images/name.jpg", "alt": "...", "caption": "...", "meaning": "..." }` to `camera.photos` |
| Add / change a link           | `links` (Instagram, Letterboxd, Spotify ...). Empty URL on Instagram/Spotify/Letterboxd shows a greyed "coming soon" tile |
| Add your resume               | put the PDF in `files/`, set `resume.fileUrl` to `"files/resume.pdf"`, optionally add `resume.entries` |
| Change latest song / film     | `music.latest`, `film.latest` (add the Spotify / Letterboxd link in `url`) |
| Own songs on the radio        | put mp3 files in `audio/`, add them to `radio.tracks` (`title`, `artist`, `file`) |
| Background music              | `audio.src` = `"audio/yourtrack.mp3"` (otherwise a soft synthesised ambience plays) |
| Change the hidden radio station | `radio.freq` (88.0 to 108.0) |
| Cat name / colour / story     | `cat` (`color` is `"ginger"` or `"black"`) |
| Closing line after opening everything | add `"epilogue": "your line"` inside `CONTENT` |

Prefer a form? Open `editor.html`, fill it in, press **Download update pack**, unzip it and copy everything over
this folder (replace `content.js`, merge `images/ audio/ files/`).
The editor can also copy a prompt for an AI chat and load the AI's JSON answer back into the form.

## Changing the look

- Colours / fonts: top of `css/style.css` (`--ink`, `--paper`, `--rust`, fonts).
- Climates (colours, fog, rain, snow, leaves): `js/weather-data.js`. Delete a climate's line from `WX` to drop it.
- Starting view of the camera: `HOME` in `js/state.js`.

## Adding a brand-new object (advanced)

An object lives in four places. Copy an existing one (e.g. the book) and rename:
1. `js/world.js`: build its 3D model and give it a position.
2. `js/objects.js`: add an entry (label, title, caption, plain `html()`).
3. `js/ui.js`: add its screen (`UI.yourobject = { html(), mount() }`).
4. `content.js`: its text, plus a line in `story` (the one-liner shown under the title).

## Put it online

It is a static site: upload the folder to GitHub Pages, Netlify, Cloudflare Pages or any host.
- Upload everything. `editor.html` and `docs/` are optional (they are harmless but not needed for visitors).
- Keep the folder structure; all paths are relative, so it also works in a sub-folder.
- Use HTTPS (all of these hosts do).
- Check on your phone after uploading. Add `?debug` to the address (`yourdomain/?debug`) to see frames per second.

### Self-host three.js (optional, more reliable)

The 3D library loads from cdnjs. If you want zero outside dependency: download
`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` (it must be version r128),
save it as `vendor/three.min.js`, and `index.html` will use it automatically whenever the CDN is unreachable.
If three.js cannot load at all, the site falls back to a plain list of the objects, so nothing is lost.

## Notes

- Sound starts after the first tap or key press (browser rule). The header button toggles it.
- Photos: JPG or PNG, ideally under 400 KB each.
- A Spotify *track / playlist / album* link shows a player. Profile links show as a normal link.
- Use only music you own or have a licence for.
- `docs/AUDIT_AND_RESEARCH.md` explains what was tested earlier and what was not.
