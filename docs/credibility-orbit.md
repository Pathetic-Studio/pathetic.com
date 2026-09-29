# Orbit credibility section

The homepage credibility block now uses `components/blocks/credibility/credibility-orbit-section.tsx`. Its original blob/logo design remains intact in `legacy-credibility-section.tsx`. To restore it, change the single re-export in `credibility-section.tsx` to `./legacy-credibility-section`.

This version uses the reference headline and seven local client wordmarks. It does not write to Sanity, and it leaves the existing credibility document, schema and logo arrays intact. The anchor and orbit duration still use the block's existing data.

## Scene

- A textured, rotating Earth with a separate cloud layer and blue atmospheric glow.
- White client logos on a slow elliptical orbit, passing behind/in front of the globe, with subtle pointer parallax.
- Sparse background stars and occasional shooting stars.
- A responsive black panel with white outer space and a yellow headline.
- The neighboring glasses scene can darken the outer space; the globe panel preserves its own lighting.

The renderer and textures initialize near the viewport. The Earth renders at a maximum of 30 fps with pixel ratio capped at 1.5; logo transforms share the section's single animation loop. Animation stops offscreen and when the tab is hidden. Reduced-motion mode uses a static composition. A lazy-loaded image globe remains available if WebGL cannot initialize or loses its context. Textures, geometry, materials and the WebGL context are released on unmount.

## Local assets

Earth textures are resized/converted to WebP. The textures and seven wordmarks total approximately 550 KB, with no runtime dependency on external image hosts.

| Local file (`public/images/credibility/`) | Source                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `earth-day.webp`                          | [Three.js Earth texture](https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg)                                                              |
| `earth-clouds.webp`                       | [Three.js cloud texture](https://threejs.org/examples/textures/planets/earth_clouds_1024.png)                                                             |
| `adidas.svg`                              | [Wikimedia wordmark](https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg)                                                                 |
| `doordash.svg`                            | [Wikimedia wordmark](https://upload.wikimedia.org/wikipedia/commons/6/6a/DoorDash_Logo.svg), with a responsive SVG viewBox added                          |
| `deel.svg`                                | [Deel website wordmark](https://website-media.deel.com/logo_revamp_white_3237bd2303.svg)                                                                  |
| `synthesia.svg`                           | [Synthesia website wordmark](https://cdn.prod.website-files.com/65e89895c5a4b8d764c0d710/65eae6894e82dff052cd139f_Logo-white.svg)                         |
| `reformation.svg`                         | [Reformation website wordmark](https://www.thereformation.com/on/demandware.static/Sites-reformation-us-Site/-/default/dwcaaab6e0/images/logo-footer.svg) |
| `mubi.webp`                               | Existing project/Sanity logo asset `d6a13f27b9a2d0ee222609b44a7142e659bd559d-500x150.webp`, read only                                                     |
| `square.webp`                             | Existing project/Sanity logo asset `40a6f2e16a08d21e0e0b58bb992ad52110c83c62-500x126.webp`, read only                                                     |

## Validation

Local draft preview in Chrome using Metal graphics: layouts at 320, 390, 768, 1440 and 1920 pixels; logo movement; shooting stars; offscreen and reduced-motion pauses; lazy texture loading; context-loss fallback; glasses Fun mode boundary; and navigation away from the scene. No JavaScript runtime errors were observed. A 90-frame desktop sample averaged 60 fps (17 ms maximum frame interval); this is a local measurement, not a guarantee across devices. `pnpm typecheck` and `git diff --check` passed. Screenshots and browser-check scripts are in `/private/tmp/pathetic-credibility/` during development. The temporary preview server was stopped after validation.
