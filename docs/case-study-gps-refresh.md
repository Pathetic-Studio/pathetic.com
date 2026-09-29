# Case studies and GPS credibility — local preview

Nothing in this pass is published, deployed, pushed or written to Sanity.

## Case studies

Reference: Figma `B2iIUUnP09v4pt9mMg0QFF`, `case-study-ref` (`921:7390`).

The five existing client pages retain their campaign groupings, supplied copy and results. Each client now has one `object` in `lib/case-studies.ts`, reused by the index, the Matter hero and the next-client panel. The initial asset selection is the desktop computer for Deel, Stream ring for Sandbar, framed Meme Booth photo strip for Air, Ramp card, and payment terminal for Square & Cash App. Replace that one data field to change a client's object everywhere.

`client-case-study.tsx` uses a coloured client container, centred hero, project jump links, white project panels, result stars and framed video players. The Figma show-title SVGs and stars are local assets; the two selected BTS photos were converted to WebP (about 195 KB combined). Air keeps six community images in an upright, swipeable carousel. Other clients retain limited supporting imagery. Full videos remain click-to-load.

`case-study-object.tsx` now uses the basket's light gravity, bounces, drag/release inertia and scroll-velocity impulses across the **entire hero panel**, with no mouse attraction. Its walls align with the coloured panel's sides and top; the first project panel's top edge is the floor. A one-time alpha silhouette sample creates the convex collision shape so transparent image padding does not act as a cushion. Text and buttons render above the object, and object shadows are removed. Keyboard nudges, offscreen pausing, sleeping bodies and reduced motion remain supported. The former empty mobile object slot has been removed.

All five client objects were checked at double-resolution desktop size. The small computer and ring sources now use transparent high-resolution WebPs; details and exact generation prompts are in `docs/case-object-assets.md`.

Ramp now uses a neutral grey panel and the same crisp card on the homepage and client page. Its local 1396 × 884 WebP is about 51 KB, replacing the 140px source. Source: [Ramp's official card artwork](https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/65077a83e277e4dbf2fe993b_Homepage_Card.webp). The image is unchanged; CSS supplies the angled presentation.

The client container and next-client panel now have explicit black strokes. The project navigation is a narrow centred group, with wider gaps between outlined project cards, badges on their upper edge, and framed media matching the reference proportions. The YOM poster crops from the top; video playback always contains the full film. The two selected BTS images remain the only extra Deel photos.

`case-study-transition.ts` integrates with the existing transition router. Index clicks grow the object into the hero. The next-client panel rises with its title and object while the departing page remains visible beneath it. Once it covers the viewport, routing hands the object to the measured hero position. This avoids the old blank gap, guessed destination, second scale change and doubled artwork. Temporary artwork lives outside ScrollSmoother, is removed after the handoff and cannot receive focus. Modified links retain native browser behaviour. Reduced motion uses the existing short page fade.

Client project links now use the active scroll controller rather than native fragment scrolling, which previously moved the overflow-hidden wrapper to `scrollTop=1554` while the real page stayed at zero and could not scroll upward. Desktop and touch checks now land at the 110px section offset and return to the top. Returning to the index keeps an inert snapshot of the old page until the new route is ready, then fades it out; the index objects scale in with the homepage's `elastic.out(1, 1)`, 1.1-second duration and 0.14-second stagger. A deliberately delayed route still showed the departing content, with no blank wait.

## Credibility

Reference: Figma `Credibility — retro gps direction` (`948:2496`). The active export now points to `credibility-gps-section.tsx`. Both `credibility-orbit-section.tsx` (blue Earth) and `legacy-credibility-section.tsx` (original blobs) remain available.

The active GPS version uses a green line-shaded Earth with a batched latitude/longitude grid, scanlines, orbital paths and the same seven client logos. Logos complete full orbits; a separate 3D satellite follows its own orbital plane. Pointer movement positions a ground target and the satellite's plane and dish ease into alignment. Arrow keys move the target and Escape resets it. The heading uses the same `TitleText` stretched treatment as the homepage.

The logos are distributed at equal distances along their elliptical orbit, using a small arc-length table rebuilt only on resize. The dots and rendered orbit use the same curve, with each wordmark positioned beneath its dot. The inner frame, crosshair and edge telemetry labels have been removed.

The globe uses 13 draw calls per frame (previously 45), antialiasing off, DPR capped at 1.25 and a stable 30 fps cadence. DOM logos animate independently at display rate. Initialization occurs near the viewport; rendering pauses offscreen, when the tab is hidden and with reduced motion. Context-loss fallback and restoration are retained. The legacy blue Earth and original blob versions remain available.

Slide two's image orbit also pauses when its slide is hidden/offscreen. Its dimensions are cached by ResizeObserver and GSAP quick setters replace new per-frame tween initialization.

## Newsletter grip

The shared footer/basket pigeon now anchors the top of its paper to the bird's current transform. Only the paper's angle uses a damped spring: there is no delayed translation. The grip updates during reset/exit too. Hover/focus still stabilizes the form for typing. Wide diagonal mouse sweeps covered over 900 px of travel: measured separation stayed below 0.01 px while the paper retained roughly 5 degrees of swing. Screenshots were also inspected at opposite viewport edges; no subscription was submitted.

The bird's pointer travel range, follow durations and wing cadence were not changed. The original hover-settle/release behavior and 0.18-second reset have been restored; the paper remains attached throughout.

## Network phone

The 3D phone initializes from the local Instagram snapshot; the live profile refresh runs afterward. Image loads have a bounded wait. A matching 2D phone stays visible while WebGL initializes and during context loss, with the 3D phone resuming after restoration. Pixel ratio is capped at 1.5 and statistic movement uses cached container dimensions. Checks covered a stalled Instagram response, screen cracking, forced WebGL loss/restoration and leaving/re-entering the section.

## Middleware timeout

The old root `middleware.ts` invoked Supabase `auth.getUser()` on public pages and media with no timeout. It has been removed: this app's `/booth` page now redirects to Air, and there are no pages that require middleware-based session refresh. Protected API handlers still validate their users; the auth callback still exchanges its code and writes cookies independently.

The retained session-refresh helper now skips anonymous sessions, bounds future refresh calls to four seconds, aborts stalled fetches and ignores late cookie writes. It is no longer on the public request path. The reported production 504 still needs deployment logs to establish its exact cause; no production change was made.

## Checks

- TypeScript and whitespace checks.
- Local Chrome: five index destinations, index-to-client and next-client transitions, Matter dragging, desktop/mobile layout, and MP4 playback.
- Latest physics/navigation pass: desktop DPR 2, silhouette floor contact, drag/release, text layering, no shadow, all five object sources, section jump and scroll-back, delayed index request, snapshot cleanup, index-to-Ramp navigation, 390px touch layout and reduced-motion stability. Both desktop and touch jumps landed within 0.5px of the 110px offset, and the wrapper stayed at scrollTop zero.
- Reduced motion, rapid clicks, browser back, modified links, satellite steering and offscreen pausing.
- Session helper: anonymous path, successful cookie propagation, four-second stall deadline, abort and late-cookie guard; protected API checks retained.

Local review captures and temporary browser scripts: `/private/tmp/pathetic-orbit-refine/`, `/private/tmp/pathetic-refinements/` and `/private/tmp/pathetic-case-physics/`. See `docs/homepage-performance.md` for measured timings and their limits.
