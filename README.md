# Olwethu Ngalo — Field Notes from the Orbit

An interactive, responsive WebGL portfolio that presents Olwethu Ngalo's CV as a cinematic constellation of technical-support work. The site is a live browser-rendered 3D experience, not a pre-rendered video. All scene monuments are modeled from Three.js geometry in source; no external 3D model files or image downloads are required.

## Run locally

**Requirements:** Node.js 22 or newer and pnpm 11.25.0 (the package manager is pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

Vite listens on `http://localhost:3000`. The development command binds to `0.0.0.0` for managed preview. Use the left-side atlas (or the numbered mobile atlas) to jump between stations. Drag the scene to orbit, scroll/pinch to zoom, select a station monument in the canvas, use the keyboard arrow keys, or activate any section with its visible navigation button. Press the motion control to pause/resume ambient motion. Phone/email links open the native contact handler.

## Production build

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm preview -- --port 4173
```

Vite emits the static production site in `dist/`. The site has no application server, private credentials, database or external runtime API. Hosting can serve `dist/` as static output. The managed project build is declared separately from the local preview configuration. Build output includes Vite-generated bundles and source maps; retain source maps only on hosts whose source-disclosure policy permits them.

## Architecture

- `index.html` — semantic document shell, accessible navigation, viewport/canvas host, overlays and SEO metadata.
- `src/main.js` — CV data, DOM rendering, Three.js world, model factories, input and navigation, camera transitions and responsive rendering.
- `src/style.css` — Tailwind v4 import/theme tokens plus the hand-authored cinematic layout, HUD, typography, responsive breakpoints and reduced-motion behavior.
- `vite.config.js` — Tailwind Vite plugin and production bundling.
- `public/manus-routes.json` — declared site routes; currently the single page at `/`.
- `public/olwethu-orbit.svg` — original orbit insignia used as the browser favicon.

The CV details are stored in one source-of-truth data object in `src/main.js`; the same values feed accessible portfolio panels, the 3D labels and the animated CV transmission strip. A short animated atlas-synchronization state precedes the scene. The main content remains ordinary DOM text. WebGL is a progressive visual layer: if WebGL cannot be initialized, all CV content and HTML navigation remain usable.

## 3D environment and asset interactions

The scene uses a perspective camera, physically based materials, emissive accents, fog, lights, a star field and orbit/coordinate motifs. Six navigable stations share the same world: overview, skills, Raydian, BEMBA IT Solutions, education/certifications and contact. A station choice eases the camera and orbit target toward that monument via GSAP; nav state and heading update together. The full atlas restores the wide constellation view. OrbitControls adds damped pointer/touch orbiting and bounded zoom. Clickable scene monuments invoke the same section transition as their accessible DOM navigation counterparts.

### Procedurally modeled monuments

- **Raydian:** the compact multifunction printer and tall production printer are separate assemblies built from box, cylinder, torus, tube and custom frame meshes. Details include scanner lid, touch display, paper drawers, output path, rollers, feed trays, structural rails and service lights. Animated geometry morph weights reshape each main chassis between a compact and expanded profile; GSAP also opens the scanner lid, moves trays and shifts the assembly through a service-cycle pose. An animated paper-feed signal communicates diagnostics and print-flow work.
- **BEMBA IT Solutions:** a gaming desktop tower has a transparent side panel, illuminated chassis, motherboard, CPU block, RAM banks, GPU, power/storage blocks, cable lines and three assembled fan modules. Fan blades rotate, RGB accents breathe and component groups pulse on focus to echo diagnostics, upgrade and thermal-testing work.
- **Skills:** the Java monument is a tapered, open-rim coffee cup with handle, saucer and extruded 3D `JAVA` lettering. The MySQL monument uses a custom bezier silhouette extruded into a metallic dolphin and raised `MySQL` lettering. Their actual mesh vertices include animated morph targets (wave/deformation profiles); GSAP alternates morph weights while the two wordmarks float and turn. The DOM lists every supplied CV skill in readable, selectable text.
- **Education:** five milestones form an illuminated physical timeline, with a central certificate prism and animated data ribbon.
- **Contact:** a curved handset and folded envelope are modeled as interactive 3D objects; their scene hit targets use the same `tel:` and `mailto:` destinations as the keyboard-accessible links in the contact panel. Only phone and email were present in the supplied CV, so no social account URLs are invented.
- **Experience typography:** the bottom CV transmission rail continuously translates a repeated live text feed through a masked viewport; its slight layered grid/HUD treatment embeds the moving resume facts into the environment. Each experience panel still exposes all responsibilities as normal accessible HTML.

All models are source-generated and scale from primitive/custom geometries rather than downloaded assets. Adjust their factories in `src/main.js` to alter dimensions, materials, segment counts, morph targets or animation behavior.

## Accessibility, motion and performance

The WebGL canvas is decorative (`aria-hidden`); all CV details are in semantic HTML and all important destinations/actions have keyboard-operable links or buttons. The section nav exposes the selected state, includes a skip link, announces updated section content with a polite live region, and responds to left/right arrows. Scene objects are not the only way to navigate. Phone and email are regular anchors.

`prefers-reduced-motion` disables the continuous marquee, pulsing indicators and ambient scene spin while preserving manual navigation and camera controls. The visible motion button can pause/resume ambient animation. The canvas uses a capped device-pixel ratio, the star field uses one buffer geometry, and the scene shares materials and shapes where practical. On smaller screens the atlas becomes a bottom dock, typography and scene HUD adapt to viewport size, and navigation stays usable without WebGL pointer selection.

## CV coverage

This site preserves the supplied profile, career objective, complete skill list, both internship periods and responsibilities, all five education/training/certification records, and the Coursera signatory/date/verification URL. The contact panel includes the supplied phone and email. An employer or certification verification link opens in a new tab with `noopener noreferrer`.
