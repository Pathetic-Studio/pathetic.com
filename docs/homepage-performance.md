# Homepage performance check — local, 27 September 2026

All testing used an isolated local preview. No publishing, deployment, push or Sanity content write was performed.

## Changes

- GPS globe: 45 → 13 WebGL draw calls per frame (71% fewer). Latitude/longitude lines are one batched geometry; the satellite's edge geometry is also batched.
- Stable 30 fps globe rendering instead of a threshold timer that frequently fell to 22 fps. DOM logo orbits update separately at display rate. DPR is capped at 1.25, with antialiasing disabled for the line treatment.
- Near-viewport initialization, offscreen/tab-hidden/reduced-motion pauses, context-loss fallback and resource disposal remain in place.
- Slide two no longer runs its image orbit while hidden/offscreen. A ResizeObserver caches dimensions; reusable GSAP setters avoid allocating a new tween for every property on every frame.

## Measurements

Chrome headless with Metal graphics, 1440 × 1000 viewport, DPR 1, local Next development server, warm routes/assets. These are local comparative checks, not production or mobile-device benchmarks.

| Measurement | Before | After |
| --- | ---: | ---: |
| GPS draw calls / rendered frame | 45 | 13 |
| GPS frames / 6-second sample | 132 | 180 |
| GPS draw calls / 6-second sample | 5,940 | 2,340 |
| Page frame rate with GPS in view | 60 fps | 59.7 fps |
| Work section frame rate | 30 fps | 30 fps |

Additional warm five-second samples: credibility 59.4 fps (95th-percentile frame 16.8 ms), Network phone 59.6 fps (16.8 ms), Work 30 fps (33.4 ms), Talent Matrix 30 fps (33.4 ms). Pausing all work-preview videos left Work at 30 fps. A separate controlled check also measured Work at 30.0 fps with the GPS renderer active and 30.0 fps after deliberately losing its WebGL context; the globe does not explain that limit in this setup. No persistent long-frame spikes appeared in those Work/Matrix samples; the 30 fps limit remains a limitation of the measured configuration.

Initial development runs included route compilation (including the Instagram endpoint) and produced large transient stalls. Those contended samples are retained in the temporary reports but are not treated as evidence of a production regression or an improvement. Production measurements on the actual hosting/device mix are still needed before claiming a consistent 60 fps throughout the homepage.

## Functional checks

- Desktop and mobile GPS layout, pointer steering, arrow keys, full logo orbits, reduced-motion pause, offscreen pause and WebGL loss/restoration.
- Case-study index → client and next-client transitions; full-hero attraction, dragging/release, upright artwork, reduced motion and mobile overflow.
- Shared newsletter pigeon: repeated wide diagonal sweeps across a 1440px viewport, roughly 916px of paper travel, less than 0.01px measured grip separation, retained angular swing, and close animation. Screenshots inspected at both extremes. No newsletter form submitted.
- `pnpm typecheck` and `git diff --check`.

Temporary scripts, frame counts, CPU profiles, JSON reports and screenshots: `/private/tmp/pathetic-orbit-refine/`.

## Phone reliability follow-up

The phone now renders from its local profile snapshot before refreshing Instagram; stalled image loads are bounded. A 2D phone covers initialization and context loss. A ten-second stalled Instagram request did not block the 3D phone, and forced WebGL loss/restoration, screen cracking and two departures/returns passed.

A fresh, warm five-second sample with the entire 520 × 600 phone canvas inside the desktop viewport measured 60.0 fps, 16.7 ms at the 95th percentile and a 16.8 ms maximum frame interval (301 intervals). This measures page animation cadence in the same local Chrome/Metal development environment described above, not physical mobile hardware. The earlier follow-up scroll attempt overshot the section and its frame-rate sample is excluded.

A fresh 390 × 844 touch viewport at DPR 2 also displayed the complete 3D phone, with no horizontal overflow. The phone's canvas stayed at y=239.6 with a 368 × 395 layout across three settled scroll checks.

Case objects now visibly rotate, coast and float; all four corner-attraction checks kept their transformed bounds inside the hero. The next-client transition retains the departing page under the rising sheet, then hands off to the new hero without a blank gap. Desktop/mobile case layout, the sharper Ramp artwork, wide-sweep newsletter grip and cleanup were visually checked. Follow-up captures and reports: `/private/tmp/pathetic-refinements/`.
