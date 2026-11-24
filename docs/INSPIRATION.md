# Inspiration notes: why the famous Three.js portfolios work, and where yours stands

How sure am I? I read author write-ups, interviews and forum posts through search results. I did not open or test these sites, so "feels fast" or "feels good" below is the authors' account, not my observation.

## What the best-known ones have in common
1. One clear idea that a stranger understands in seconds. Bruno Simon's site is a car you drive around (his own case study: https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b). An interview about it carries the title "how a design portfolio got the attention of 400 000 visitors" (https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors).
2. The site feels like its maker. A write-up of personal sites that inspired rebuilds says the best ones are unmistakably made by their owner (https://issastro.pages.dev/blog/personal-websites-that-made-me-want-to-rebuild-mine).
3. Placement teaches interaction (Bruno puts the car where you naturally start driving).
4. Content layers are HTML on top of the scene, not locked inside 3D (one portfolio README says it overlays pages to control how they react: https://github.com/brandonkylely/r3-portfolio).
5. Quality adapts to the device (one author lists automatic quality scaling and a guided tour: https://discourse.threejs.org/t/an-interactive-3d-portfolio-room/93515).
6. Criticism also repeats: a Hacker News thread about this style of site raises people who cannot or will not use the controls. Keep an easy way to reach the content.

## Where yours is the same, and where it is different
Same: a 3D place with meaningful objects; content opens over the scene; sound, weather and small animals add life; quality adapts.
Different, and worth leaning into: your objects are not buttons with labels, each one opens its own tiny world; the whole thing is a mood and a person (a boy under a tree), not a skills showcase; text is personal and poetic.

## What this version adds because of that
- A unique interface per object (all plain HTML and CSS, so they cost almost nothing on phones):
  Notebook: a book whose pages turn (swipe, buttons or arrow keys).
  Camera: viewfinder and shutter; photos develop in the frame.
  Earphones: a cassette that plays (Spotify player opens inside).
  Film reel: a clapperboard that claps, review shown as subtitles.
  Radio: turn the dial through static to find the hidden station; the note appears when tuned.
  Folder: opens to the resume, with a button that opens the file.
  Letter: break the wax seal; "Write back" opens an email.
  Polaroid: the photo develops in front of you.
  Book: a closed cover you open to read.
  Cat: a collar tag that swings and flips.
  You: cinema tickets you tear to reveal the next.
- A glowing ring on the ground under the object you point at (or the hinted one), a small 3D touch with almost no cost.
- Reduced work on phones: the full-screen liquid wobble is switched off on low-power devices.

## Ideas to consider next (not built)
Guided first-visit story beat; one signature moment people share (the radio could play a short clip of your own song); a "what's new" object that changes; a quiet photo wall; a printable one-page text version for recruiters.
