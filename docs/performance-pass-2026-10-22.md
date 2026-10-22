# Homepage performance check — 22 October 2026

## Setup

Optimized Next.js production build served locally from an isolated source copy on port 3002. The existing development server was left untouched. Chrome 155 on the local Mac, with desktop 1440 × 1000 / DPR 1, phone 390 × 844 / DPR 2, and tablet 768 × 1024 / DPR 2. Phone and tablet use touch emulation; these are not physical-device or production-network Web Vitals measurements.

Each main run sampled first and repeat 26-second full-page scrolls, section idle rendering, 16 simultaneous throws, footer interactions, and section cannons. The desktop run also navigated to Work and back through Our Services. A separate fresh-browser tablet confirmation used 24-second scrolls.

## Changes made during the check

- The CPU trace identified forced layout work in the nav artwork ticker. Replaced its per-frame section geometry reads with an IntersectionObserver watching a one-pixel strip at the nav. Matrix masking, section pop animations and the Work With Us override remain in place.
- Added dedicated 128px cannon cutouts for hats and drinks, sufficient for their 30–32px display size at up to 4× DPR. Their combined transfer size fell from 253,430 to 47,476 bytes (81%). They decode on section entry rather than waiting for the first volley.
- Verified that the new road-object simulation stops updating settled objects and pauses when its scene becomes inert. It does not add a second physics engine.

## Measurements

| Scenario | Average fps | 95th-percentile frame | Longest frame |
| --- | ---: | ---: | ---: |
| Desktop first scroll, final build | 59.3 | 16.8ms | 150ms |
| Desktop repeat scroll, final build | 58.6 | 16.8ms | 216.7ms |
| Phone first scroll, final build | 59.7 | 16.7ms | 100.1ms |
| Phone repeat scroll, final build | 60.0 | 16.7ms | 33.2ms |
| Tablet first scroll, fresh-browser confirmation | 59.4 | 16.7ms | 150ms |
| Tablet repeat scroll, fresh-browser confirmation | 60.0 | 16.8ms | 33.2ms |
| Desktop, 16 thrown road objects | 59.7 | 16.8ms | 33.4ms |
| Phone, 16 thrown road objects | 59.7 | 16.8ms | 33.3ms |
| Tablet, 16 thrown road objects | 60.0 | 16.8ms | 16.8ms |
| Desktop scroll after Work → Services return | 60.0 | 16.7ms | 16.8ms |

In the paired desktop repeat-scroll samples, average script time fell from 1.79 to 1.18ms per frame, and style recalculation from 2.06 to 1.87ms per frame. These are local measurements with normal run-to-run variation, not a guaranteed improvement on every device.

There are still occasional scene/asset-startup and scroll outliers; this is not a claim of uninterrupted 60fps. One tablet run measured 38.1fps with a 1.58-second maximum pause while background system indexing was active. A fresh-browser repeat reached 60fps with no frames above 50ms. Both raw samples are retained; host contention may contribute, so physical-tablet profiling remains useful. The initial automated cannon-hover samples also included isolated 133–200ms frame gaps without corresponding long JavaScript tasks; smaller assets are not presented as proof that every first-hover pause is eliminated.

## Behaviour and build checks

- Mouse and real emulated touch events grabbed, threw and settled pigeons and pizza. Blank service-card areas no longer intercept the pigeons. The phone pizza was obscured by visible card content in one final random spawn; its touch throw passed in the baseline and isolated regression checks with the same drag implementation.
- Mobile card swiping and vertical page scrolling remain available outside grabbed objects.
- Rat pulling/running ground alignment stayed within 0.01px at the sampled transitions; run frames advance with distance travelled.
- Footer hover, all eight letter flips, repeat flips, and successive star colour changes passed.
- Real basket shortcuts reached the revealed Matrix scene and the belief/wardrobe sections. Actual nav states and cannon contents were checked: Matrix green, blue stars with the cherub, and hats. Screenshots were inspected.
- Work → Our Services returned to the correct scroll position with the section interactive.
- No page errors or horizontal overflow in the production runs. Video request aborts occurred during intentional preview pausing/navigation; no missing local-image failures were found.
- Production build, type validation and `git diff --check` passed.

Raw results, CPU profiles and screenshots: `/private/tmp/pathetic-performance-oct22/`. Earlier focused drag/throw checks: `/private/tmp/pathetic-bts-cutouts-oct22/debris-isolated-results.json`.
