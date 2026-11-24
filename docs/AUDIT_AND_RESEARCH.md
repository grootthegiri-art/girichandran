# Audit, research and changes

Read this first: what was and was not verified
- I could NOT load or interact with rachelqrwei.ca. Fetching it returned only its page title and description (the site draws itself with scripts). I found no public write-up, repository or interview about how it was built. So nothing below claims to be an observation of that site.
- I did not load or test any of the other reference sites either. Everything about them comes from their authors' own descriptions (forum posts, case studies, interviews), which I could read through search results. "Fast on mobile" is unverified for all of them.
- I had no GPU, no real phone and no three.js library offline. I could run your site in headless Chromium: the no-3D fallback, panels, keyboard behaviour and editor were really tested. The 3D engine was exercised with a stand-in for three.js (it proves the code runs without errors for several seconds, not that it looks right or runs fast).
- No frame rates or load times were measured. Use the built-in ?debug overlay on your own phone (see below).

## References (author descriptions only; none tested by me)
| Site | Distinctive idea | Evidence | Lesson |
|---|---|---|---|
| bruno-simon.com | Playable car portfolio with physics | Author case study: https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b ; interview https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors | Place things so the first action teaches that objects move; hide debug tools behind a URL flag |
| taha-shajarian.ir | Stylised room, guided tour, sleeping cat, automatic quality scaling | Author post https://discourse.threejs.org/t/an-interactive-3d-portfolio-room/93515 | Guided orientation; adaptive quality for weak devices |
| burnerwong.com | A storefront you step into, character and dog | Description on https://contra.com/ali_mendoza_perez_7qtkp8gb | Alive characters make a place feel inhabited |
| (pixel-art room site on the same Contra profile; URL not given) | Each project is a book, a lamp switches dark mode | Same profile page | Diegetic controls: the object is the interface |
| migueljimenezbenajes.com | Desktop-room portfolio (Three.js and React) | https://discourse.threejs.org/t/portfolio-3d-desktop-room/20736 | Familiar room metaphor |
| shahbaj-sheikh.vercel.app | Room scene, smooth camera transitions, responsive controls | https://discourse.threejs.org/t/showcase-3d-portfolio-website-built-with-three-js-and-react-three-fiber/87470 | Camera reframing as the transition |
| tawfeeq-portfolio.vercel.app | Three.js portfolio with public repo | https://discourse.threejs.org/t/interactive-three-js-portfolio-website-personal-3d-developer-portfolio/89934 | Claims "optimized performance" (author claim, unverified) |
| stephentrieu.com | Space objects, generated star clusters | https://discourse.threejs.org/t/personal-portfolio-3d-space-website/41756 | Atmosphere from few elements |
| brandonkylely.github.io/r3-portfolio | Inspired by Bruno's; HTML pages overlaid instead of an iframe; laptop-opening intro | https://github.com/brandonkylely/r3-portfolio | Own the content layer in HTML; a short theatrical intro |
| robertaportfolio.com | Home-office scene | https://discourse.threejs.org/t/3d-portfolio-for-submission/73220 | (Forum feedback noted a stretched look: check aspect handling) |
| v5.activetheory.net | Changing real-time environments, a screen as the centrepiece, custom CMS | https://www.commarts.com/webpicks/active-theory-1 | One focal object; content managed separately |
| Igloo Inc (by abeto/Bureaux) | Interactive particle shapes for the links section | Case study https://awwwards.com/igloo-inc-case-study.html | Links can be expressive without being confusing |
| patrickheintzmann.com | Creative developer showing WebGL pieces, e.g. an 80s TV installation | The page itself | Small objects as stages for content |
Also on your list, not evaluated: lusionstudio.com, a1.gallery, brittanychiang.com.
Weak sources I ignored: skill-registry pages and SEO blogs that describe Bruno's stack differently from his own case study.

Recurring patterns in the above: teach interaction through placement; keep content in HTML you control; adapt quality instead of removing features; make interface elements belong to the scene; keep intros short.

## Rachel Wei comparison
Not possible as asked (see top). If you send a screen recording, screenshots or a link to source, I can do the comparison properly.

## Audit of your source, ranked
1. CRITICAL, verified in browser: when 3D could not start, the "use the buttons below" fallback buttons were invisible and unclickable, so no content could be reached. FIXED. Now a readable list; all 11 panels tested.
2. HIGH, verified: closing a panel within about half a second of opening left it stuck open. FIXED.
3. HIGH, code reading, not measured: phones rendered at up to 2x pixel ratio with a 1024 shadow map; about 100 hair tufts were separate meshes and materials; the earphone cable allocated new objects every frame. MITIGATED: lower start scale on touch devices, automatic downscale when frames take longer than about 22 ms, 512 shadow map on low-power devices, hair merged into one mesh, no per-frame allocation, hover picking limited to about 14 times a second, context-loss handling.
4. HIGH, verified: opening an object by touching the 3D scene did not return keyboard focus afterwards, and Tab could reach hidden controls behind the panel. FIXED: background made inert while a panel is open, focus restored on close.
5. MEDIUM: intro took about 8 s and could not be skipped. FIXED: objects usable after about 2.6 s, tap or key skips.
6. MEDIUM: panel text appeared word by word for up to about 3.4 s. FIXED: at most about 1.7 s; tap to show everything at once.
7. MEDIUM: no pinch-to-zoom on touch. ADDED.
8. MEDIUM: empty objects (Camera has no photos yet) opened a panel with only a draft line. FIXED with an honest empty state. The content itself is still yours to supply.
9. MEDIUM: nothing hinted that objects can be touched. ADDED a soft glow on an untouched object every few seconds until two have been opened.
10. LOW: link check was not anchored. TIGHTENED. Dynamic HTML is escaped; external links use noopener noreferrer; Spotify embeds accept only alphanumeric ids.
11. LOW, left as you asked: the page has no <title>, which is an accessibility failure (WCAG 2.4.2). Consider a neutral title.
12. DEPENDENCY: three.js and fonts load from CDNs. If they are blocked the site falls back to the plain list. To be fully self-hosted, download three.min.js (r128) next to index.html and change its script tag.

## Not done (and why)
Baked shadows, level-of-detail, compressed textures, a build step: no measurements justify them yet. Run ?debug on target phones first.
Rewrite or migration to another framework: not warranted.

## How to measure on your phone
Open index.html?debug (or yourdomain/?debug). A small line shows fps, frame time, render scale, draw calls and triangles, updated every 1.5 s. Try: first 10 s, after opening 3 objects, in rain/storm, and after 5 minutes. Send me the numbers and the device name.

## Manual tests still needed
Real iPhone Safari and a mid-range Android; touch orbit, pinch and tap on small objects; audio start on iOS; long session heat; screen reader pass.
