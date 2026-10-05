# Responsive layout audit — 29 September 2026

Open `/debug/layout-audit` in the local development server. It is a plain visual to-do list with 12 observations, 21 optimized screenshots, viewport filtering, and browser-local review checkboxes. The route returns 404 in production and has noindex metadata. The original audit left existing sections unchanged. The 2 October follow-up supplies the friends cutouts and handles, and replaces the What We Are placeholder copy.

## Coverage

Chrome emulation at 320 × 740, 390 × 844, 768 × 1024, and 1024 × 768:

- Homepage: intro, each lifecycle scene, credibility, work objects, services, Talent Matrix, network/phone, friends, belief, What We Are, contact CTA, basket, footer.
- Case-study index and all five client pages: Deel, Air, Ramp, Stream by Sandbar, Square & Cash App; headings, content, galleries where present, and next-client panels.
- Jobs: initial scene and opening the Project Manager details.
- Phone and portrait tablet: menu open/close, services horizontal scrolling, contact and newsletter form layout, Air gallery next-image and lightbox, Deel project jump and ability to scroll back to the top.
- Additional 1440 px desktop checks for the new figure and changing reduced-motion preference after load.

No form was submitted. Purchases, production speed, third-party destinations, Instagram freshness, physical-device behavior, and soft-keyboard layout were not validated. CSS element-bound checks alone miss overflowing text glyphs, so screenshots were inspected as well.

## Findings to prioritize

1. **Landscape tablet lifecycle:** with a touch pointer at 1024 px, the section remains one viewport tall while the orbit and glasses slides are hidden. Its desktop animation timeline expects a pinned range that the touch scroller does not create. Compare 1024 touch (900 px section in a 900 px viewport) with 1440 pointer (7200 px section in the same-height viewport).
2. **Desktop motion preference:** changing to reduced motion after loading the homepage produces `Failed to execute 'removeChild' on 'Node'` and the Next application-error screen. Reproduced both with and without the new What We Are section in the isolated preview. The new figure independently handles preference changes correctly. Investigate existing animation/pin cleanup.
3. **Square & Cash App:** NEIGHBORHOOD extends past the project panel and viewport at 320 px.
4. **Jobs framing:** the title and job star are clipped on touch viewports. Tapping the star still opens the job; the opened copy and application link fit.
5. **Content:** friends now use the six supplied cutouts and filename handles, with supporting copy awaiting review; What We Are now has the four approved principles; Ramp and Square & Cash App project panels lack campaign media.

The remaining cards are design questions: mobile glasses/text overlap, small orbit logos, service-carousel discoverability, the three-line contact CTA, newsletter placeholder length, and a header theme that sometimes stays green after long page jumps.

## Results and artifacts

- 172 page/section captures across the four primary viewports, with focused follow-up captures for interactions and reproducible issues.
- No broken in-view images or uncaught page errors in the initial normal-motion capture runs. The live desktop preference-change error was found in follow-up testing.
- All four new figure states passed at 320, 390, 768, 1024, and 1440 px; button and description bounds fit. Keyboard, Escape, drag and spin passed. The isolated reduced-motion check passed.
- Phone/tablet menu, gallery next/lightbox, section-jump/back-scroll, and job-opening checks passed.
- The screenshots shipped with the audit are under `public/debug/layout-audit/2026-09-29/` and `public/debug/layout-audit/2026-10-02/`; content is in `app/debug/layout-audit/findings.ts`.
- Capture scripts and full-resolution working screenshots are local temporary artifacts under `/private/tmp/pathetic-layout-audit/` and `/private/tmp/pathetic-vitruvian/`.

No Sanity content was edited or published, and no changes were committed or pushed.
