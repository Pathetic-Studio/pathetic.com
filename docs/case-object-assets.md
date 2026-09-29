# Case-study object assets

Local-only revision, 27 September 2026. No Sanity writes or publishing.

The computer and Stream ring use high-resolution restorations of the existing cutouts. Both were made with the built-in imagegen tool, inspected against the original artwork, and converted to WebP with alpha preserved. Original site assets are retained.

| Asset | Saved file | Resolution | File size |
| --- | --- | --- | --- |
| Computer | `public/images/case-studies/objects/computer-hires.webp` | 1254 × 1254 | 98,176 bytes |
| Stream ring | `public/images/case-studies/objects/stream-ring-hires.webp` | 1254 × 1254 | 106,010 bytes |

These are AI-assisted restorations, rather than higher-resolution originals obtained from the clients. The original ring cutout was 219 × 275 despite its old 540 × 540 data entry; the computer was 460 × 451. The other client objects retain their existing larger sources: Air 602 × 1308, Ramp 1396 × 884, Square terminal 1000 × 611. All are shared by the index, hero and next-client panel.

## Prompts

Computer (edit target: `public/images/basket-links/computer.png`):

> Upscale and faithfully restore this exact floating CRT computer cutout as a crisp 1536 x 1536 PNG with actual transparent background. Keep precisely the same computer design, perspective, tilted pose, grey case, stand, yellow screen and black simple smiley face. Preserve its appearance as closely as possible. Remove stray dirty pixels outside the object. No cast shadow, no floor, no background, no glow, no redesign. Center the full object with modest transparent margin. High-resolution clean product edges and fine surface details.

Ring (edit target: `public/images/what-we-do/sandbar.png`):

> Faithfully restore and upscale this exact Sandbar Stream ring product cutout as a crisp 1536 x 1536 PNG with actual transparent background. This is an image restoration: preserve the exact oblique pose, oval ring geometry, dark inner band, bright silver thin outer metal rim, and small pill-shaped flat button on the right front. Retain the existing design and materials, do not invent branding or features. Single ring centered, fill roughly 78% of frame height. No cast shadow, floor, scene or background. Remove pixelated and coloured edge artifacts. Sharp clean product edges.

The tool returned 1254px assets. The requests for 1536px did not determine the actual output size; the table records the verified files.
