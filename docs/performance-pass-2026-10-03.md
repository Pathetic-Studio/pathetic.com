# Homepage performance pass — 3 October 2026

Local development preview on the existing feature branch. Nothing was pushed, deployed, or written to Sanity.

## Changes

- Fun mode previously changed inherited colour variables on `html` every animation frame. This invalidated styles throughout the page. Brightness, darkness and ink now use non-inheriting registered properties on the affected surfaces only. Repeated values are skipped, and the environment attribute is applied once per activation.
- The light-spill canvases copy the rendered edge only while visible. Scene lighting, reflections, colours, lightning span and bloom quality are unchanged.
- Lightning geometry updates retain their original interval but are divided across four frame groups. Hidden header bolts do not rebuild.
- Spin speed now builds progressively over 7.5 seconds. Lights still respond immediately. Releasing retains the existing eased deceleration.
- The Matrix overlay no longer fades after its exit mask has been removed. Exit state is retained across delayed scrub callbacks, preventing a late callback from restoring the green star.
- New wardrobe artwork was reduced from 1,099,164 to 382,448 bytes total while retaining transparency and approximately 2× display resolution. Wardrobe animation uses short transform tweens; there is no additional canvas or permanent animation loop.

## Measured comparison

Chrome for Testing 153, headless with Metal, 1440 × 900 at DPR 2, same local Next development server and scripted sequence. Each phase samples animation-frame intervals and Chrome style/script/task metrics. Both versions include the same profiling overhead. These are local comparisons, not production Web Vitals or physical-device guarantees.

| Phase | Before p95 | After p95 | Before frames >25 ms | After frames >25 ms |
| --- | ---: | ---: | ---: | ---: |
| Glasses idle, 2.2 s | 16.7 ms | 16.7 ms | 1 | 1 |
| Fun held, 8 s | 33.4 ms | 16.7 ms | 47 | 3 |
| Release, 3.5 s | 33.3 ms | 16.8 ms | 12 | 3 |
| Matrix exit | 16.7 ms | 16.8 ms | 1 | 2 |
| Homepage scroll | 16.8 ms | 16.7 ms | 2 | 1 |

Fun-mode style recalculation fell from **2.602 s to 0.230 s** over the sampled hold (about 91% less). Combined task time fell from 4.319 s to 2.236 s. Isolated long frames remain, including profiler startup; the maximum single frame did not improve consistently, so this is not a claim that all stalls are eliminated.

A separate 390 × 844 / DPR 2 touch-emulated pass sampled rapid full-page scrolling:

- First traversal: p95 16.8 ms, 7 frames >25 ms, 4 >50 ms, longest 216.7 ms in the final repeatable run.
- Repeat traversal: p95 16.8 ms, 2 frames >25 ms, none >50 ms.
- An earlier first traversal had a 533 ms outlier. First-use scene/asset preparation remains the main follow-up to profile on physical phones. Repeat scrolling did not show a sustained frame-rate drop.

## Behaviour checks

- 449 sampled frames covering slow Matrix exits, reverse crossings and three rapid jumps: no Matrix claim or visible green overlay after the next section crossed the top of the viewport.
- All four wardrobe previews, fast hover reversals, snap-on, removal, invalid drops, keyboard Enter/Escape, and spinning with clothing attached.
- Touch attach/remove using actual emulated touch events.
- Layouts from 320 px through 1920 px; initial reduced motion at 1024 and 1920 px.
- Browser runs completed without page errors. Local `pnpm typecheck` and `git diff --check` passed.

Working captures and raw CPU/frame traces are in `/private/tmp/pathetic-outfit-pass/` (`baseline.json`, `after.json`, `edge-touch-results.json`, `final-checks.json`). This temporary folder is not a deployable dependency.

## Mobile follow-up — 5 October 2026

- Shortened the glasses speed build from 7.5 to 4.5 seconds, retaining the progressive curve, immediate lighting response, and eased release.
- What We Do and Talent Matrix use normal stacked flow on phones and touch tablets. The desktop pin, reveal mask and rain transition remain. Mobile no longer mounts the transition canvas; the Matrix scene still animates within its own section.
- Basket physics now samples native touch scroll velocity directly. Empty basket space allows vertical page gestures; the objects remain draggable. A 105px emulated native swipe lifted all four objects by approximately 28–37px within the basket, with no page errors.
- The exact What We Are title artwork is inline SVG, so mobile heading visibility no longer depends on an image request. Work uses a tighter mobile composition and a centered square CTA.

Verified layouts at 320, 390 and 768px, including no horizontal overflow, contiguous unpinned services/Matrix sections, and visible heading artwork. A separate 1440px check confirmed the pinned desktop reveal and mask. These are browser-emulation checks, not physical-device performance measurements. Temporary captures and interaction results are in `/private/tmp/pathetic-mobile-release/`.
