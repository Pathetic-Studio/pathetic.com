# Anchor navigation regression — 23 October 2026

Reproduced the live Jobs → Our Services → Matrix failure in Chrome and in the local production build. The Matrix startup observer received an offscreen entry followed by an onscreen entry in the same callback. Reading the first entry left the scene unstarted throughout the pin. Its startup, rendering and reveal observers now use the latest entry.

The navigation pass also fixed:

- Browser Back restoring a transient ScrollSmoother transform instead of the saved document scroll position.
- The Matrix appearing while remaining inert after a timeline refresh suppressed tween callbacks. Reveal state now synchronizes on timeline updates and refresh, with an explicit zero starting value.
- Footer and direct `#talent-matrix` links landing at the beginning of Services. Shared anchor resolution targets the revealed city within the desktop pin; native touch layouts use normal section positions.
- Cold mobile anchors drifting after font/layout changes. Native entries now settle their initial anchor, cancel stale restoration frames and bound alignment retries.
- An exact mobile Matrix landing leaving the header black against the dark city. The section includes its starting boundary when applying the navigation theme, including jumps back from below it.

## Validation

Production Chrome at 1440×1000, plus touch emulation at 820×1180 and 390×844. Touch checks used 3× CPU slowdown, 12 Mbps downloads and 80 ms latency; these are browser checks, not physical-device measurements.

- Jobs → Services → Matrix, repeated round trips, View Opportunities → Jobs → browser Back.
- Mid-scroll Work and Deel case study → Services → Matrix.
- Direct `#what-we-do` and `#talent-matrix` entries.
- Work footer → Talent Matrix, then the same footer anchor within the homepage.
- Matrix → Network → Matrix: phone ready, city rendering and frames advancing.
- Partial desktop takeover → Work → Back/Forward/Back: exact saved position (13642px) and identical reveal mask restored.
- Cold homepage: no Matrix canvas, city model or avatar downloads during the intro.
- Scene screenshots, canvas/frame checks, input state, page visibility, unlocked scrolling and no runtime errors.
- Mobile navigation visible at the exact Matrix anchor; menu open/close and exit/return colour changes checked.
- Production build, TypeScript and diff whitespace checks passed.

Browser scripts, screenshots, the live reproduction and a compressed Chrome navigation trace are in `/private/tmp/pathetic-anchor-travel-oct23/`. The isolated production build was removed after testing.
