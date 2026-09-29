# Work object refresh

Local feature-branch assets and code only. No Sanity mutations, publishing, or deployment.

## Source artwork

- Figma: [Work - 1](https://www.figma.com/design/B2iIUUnP09v4pt9mMg0QFF/Pathetic-JONO?node-id=953-9336) and [Work - 2](https://www.figma.com/design/B2iIUUnP09v4pt9mMg0QFF/Pathetic-JONO?node-id=967-2122).
- Square receipt and Cash App phone: the original 1254 × 1254 transparent Figma images, converted to WebP. Used as two home objects leading to the same case study, two objects in its single collection tile, and two independent bodies in one Matter world in the hero and next-case-study panel.
- Bless This Desk: exported transparent title composition from node 953:9408, preserving its clouds, glow and sparkles.
- You’re on Mute: original stacked vector title from node 953:9447.
- PATHETIC: original vector logo from node 953:9398, layered behind the existing animated fire. The reel destination and fullscreen playback remain the same.
- Air: a new cloud generated using the built-in image-generation tool, with [Air’s website](https://air.inc/) as a visual reference. Saved as `public/images/case-studies/objects/air-cloud.webp` (1024 × 1024, transparent).

`lib/work-assets.ts` is the shared source of the new object paths. The Air cloud replaces the photo-strip object; the photo-strip case-study imagery remains available in the project content. The Sandbar ring is the home object for its case study; the Dictation film remains on that case-study page.

## Motion

Show cards hold for 3.2 seconds, fade into one play-through of their existing optimized preview, then return to the card. The cycle runs only while the individual object is visible and the document is active. Opening the fullscreen player pauses the inline previews. Reduced-motion and Save-Data visitors see static title cards. Videos load only when their objects become visible.

Paired case-study objects share floor/wall collisions and collide with each other. Both are draggable, respond to scroll turbulence, pause offscreen and participate in the existing object-to-page transition. The collection still contains one destination per client case study.

## Cloud generation prompt

Built-in image-generation mode. The input was a screenshot of Air’s public homepage, used only as a style reference.

> Use case: stylized-concept. Asset type: a single transparent-background cloud cutout for the Air client object on PATHETIC's interactive portfolio website. The supplied website screenshot is a STYLE REFERENCE ONLY: study the natural volumetric white and light cool-grey clouds floating over the blue background on air.inc. Generate one original isolated cloud in a similar style, not the screenshot or any UI. One compact, fluffy three-dimensional cumulus cloud with an irregular cluster of rounded billowing lobes, fine soft wispy edges, bright white sunlit top and subtle cool pale grey-blue undersides. Broad horizontal silhouette, approximately 1.5:1 width to height. Photorealistic volumetric vapor, not plastic, not a cartoon cloud icon. Gentle directional daylight, enough underside definition to be readable floating on a white webpage. Center the complete cloud with a little transparent margin on all sides, no clipped edges. Genuinely transparent alpha background, no sky, no ground, no cast shadow outside the cloud, no detached wisps, no text, no logo, no watermark. High-resolution square PNG composition suitable for optimizing to WebP.

## Gallery and Deel refinement

- Deel now uses the original transparent “deel-02-payday-envelope / PAYDAY, EVERYWHERE” artwork from Figma node `969:2014`, converted to `public/images/case-studies/objects/deel-payday-envelope.webp` at 1254 × 1254. The shared `DEEL_OBJECT` updates the collection, draggable hero and next-case-study panel together.
- Bottom case-study galleries use a full shallow ellipse. Images remain upright, continuously scale with depth and pass behind the foreground images. Horizontal wheel/trackpad gestures, Shift + wheel, pointer dragging, arrow buttons and keyboard arrows move around the orbit. Ordinary vertical wheel scrolling continues to scroll the page; the active image still opens at full size.
- Orbit animation runs only while settling after an interaction and pauses outside the viewport or in hidden tabs. Reduced motion removes the settling animation.
- Results badges keep their text stationary and start without a tilt. The star has upright, uncompressed proportions and shares the nav star’s `header-feature-idle-y` animation: a vertical-axis (`rotateY`) turn over 18 seconds, with the same 700px perspective. Reduced motion disables the turn.

## Validation

- `pnpm typecheck` and `git diff --check` pass.
- Local Chrome at 1440 × 1000 and 390 × 844: new objects load; all five collection destinations remain; Square & Cash App has two moving, independently draggable bodies in both the hero and next panel. Collection and next-panel transitions arrive with both objects visible.
- Both home show cards cycle from card → 12-second video → card → video, pause offscreen, and remain static under reduced motion. Desktop and mobile screenshots inspected.
- Air gallery: all six images load; arrow buttons, horizontal wheel, drag, image lightbox, reduced motion, and mobile sizing checked. Front/back scale ranges from approximately 0.99 to 0.41 at rest. No mobile horizontal page overflow.
- Mobile touch emulation: horizontal swipe changes the active gallery image without scrolling the page or opening the lightbox; vertical swipe scrolls the page normally. Sandbar's two-image gallery wraps with keyboard arrows.
- Deel uses the new envelope in the collection and hero (the next panel reads the same shared object). Result-star transforms change over time while the text transform remains `none`; reduced motion disables the star animation.
- Browser checks reported no page errors. Temporary preview stopped after validation.

## Nav-aligned stars, panel spacing and pigeon easing

The result star shares the navigation star's vertical-axis animation and perspective, with a square image box restoring the source graphic's uncompressed shape. Browser checks at a matching animation time produce identical rotation matrices; the text remains stationary and reduced motion disables the rotation.

Client panels start at the fixed header's bottom edge: 96px on desktop and 72px on tablet/mobile. The rising-panel transition measures that same header edge. Verified zero gap and no overlap at 1440px, 1024px and 390px, including the next-case-study transition.

The shared newsletter pigeon's mouse-follow tweens now ease over 0.8–0.95 seconds, retaining the same travel range and wing motion. The paper still derives its attachment position directly from the rendered bird transform; only its angular swing has independent easing. Wide mouse movements covered 952px of horizontal travel with less than 0.03px measured separation at the grip. All bird layers retained matching transforms. Close behavior, reduced motion, `pnpm typecheck` and `git diff --check` passed; no form was submitted. Local browser captures and the validation script are in `/private/tmp/pathetic-stars-pigeon/`.
