# Work return and credibility orbit — local checks

- Route anchors now wait for the incoming pin layout before the page fades in. The scroller no longer schedules a competing fragment jump on client navigation.
- Browser Back/Forward uses the same placement step, retaining its saved scroll position. ScrollSmoother's deferred resize refresh stays aligned during the fade; alignment listeners are removed when the transition finishes.
- Credibility logo boxes are 20% smaller. Wordmarks scale from 0.32 at the back to 1 at the front. Dots remain on the path while the wordmarks stay upright.
- Mouse movement gently rotates the orbit about three axes. The WebGL lines and DOM waypoints use the same matrix, committed together at the existing 30 fps globe cadence; the logos keep travelling at display rate. Offscreen pausing and reduced-motion behavior are retained.

Local Chrome checks at 1440×1000 and touch 390×844: the Work return target remains within one pixel of its intended landing throughout the visible fade and afterward. Before the fix, a homepage round trip overshot by 7,484 pixels and eased back. Browser Back was tested separately because it bypasses the router transition callbacks.

Orbit checks covered opposite mouse positions, mobile bounds, and reduced motion: no page errors or horizontal overflow; reduced-motion logo positions remain unchanged. The shared projection was checked against Three.js matrices across desktop/mobile sizes and pointer extremes. TypeScript and diff checks pass.

Temporary browser scripts, samples, and screenshots: `/private/tmp/pathetic-orbit-return/`. All changes are local; nothing was pushed, deployed, or written to Sanity.

## Hand activation and shooting stars

The Work section's visibility observer now consumes the last entry in each delivery. Route restoration can queue an offscreen entry followed by an onscreen entry together; consuming only the first left the hand and project motion paused until another scroll. The same correction covers the section's video observers and the credibility scene's visibility state. Return-link and browser Back checks confirm the fingertip responds to the pointer immediately, without scrolling first.

Two staggered CSS shooting stars sit behind the globe. They use the scene's existing visibility state to pause offscreen, stay hidden with reduced motion, and add no WebGL draw calls. Local captures and browser checks: `/private/tmp/pathetic-hand-stars/`.
