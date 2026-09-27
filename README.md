# Aleja Urueña — Portfolio

UI/UX Designer with a technical background in games QA. This repository holds the source of
my portfolio site: interface systems for games and digital products.

**Live site:** https://alejauruena.github.io/portfolio/

---

## About this build

Hand-written HTML, CSS and JavaScript. No framework, no build step, no dependencies beyond
four Google Fonts. The design system comes from a Figma file; its tokens are mirrored as CSS
custom properties in `:root`, so re-theming the whole site means editing one block.

Some deliberate decisions, in case they're of interest:

- **Work is filtered by vertical**, and the choice is mirrored in the URL (`?v=product`), so a
  single link can open the site on either discipline without maintaining two portfolios.
- **Project thumbnails stay sharp.** The gradient sits on the seam between text and image and
  fades from an opaque panel colour, so text contrast never depends on the image behind it.
- **Every card declares the scope of my contribution** — design, implementation or visual work
  are different skills, and conflating them helps nobody.
- **Colour contrast is verified**, not assumed: every text pairing meets WCAG AA.

`MAINTENANCE.md` has the build and deployment notes.

---

## Structure

```
index.html            Hero · Work · About · Contact
css/style.css         design tokens in :root, then components
js/main.js            vertical filter, URL state, section highlighting
projects/             one page per case study
assets/               thumbnails and tool icons (CSS masks, recoloured with currentColor)
```

---

© Aleja Urueña. Projects referencing third-party brands are independent conceptual exercises,
non-commercial and without affiliation.
