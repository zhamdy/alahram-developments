# archive

Files kept out of the build. Some are still **inputs to**
`scripts/generate-images.js` — deleting those breaks the build. Nothing here is copied into the
build: `angular.json` only globs `public/` and `src/assets/`.

## images

- `hero-bg-*.webp`, `hero-bg.jpg` — a classical apartment-building photograph.
  Only ever referenced by a malformed `<link rel="preload">` in `src/index.html`
  that had no `href`, so it was downloaded at high priority on every visit and
  never rendered. The hero is, and was, the aerial sunset image `hero-*.png`.
- `hero.png` — the 2.6 MB original the `hero-*.png` variants were cut from.

- `breadcrumb.png`, `lifestyle-strip.png`, `brand-story.png`, `cta.png` — 10.2 MB
  of decorative section art, replaced by WebP copies from
  `scripts/generate-images.js` totalling 762 KB. `breadcrumb` was the hero
  background on nine pages, so it was above the fold on most of the site.

## maps-pdf

- `6/7/12/14/15.pdf` — superseded by the `area-NN.pdf` naming the maps page
  uses. Nothing linked to them; they were 3.8 MB of dead deploy weight.
