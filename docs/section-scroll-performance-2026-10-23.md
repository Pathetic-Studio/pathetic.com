# Credibility → Work → What We Do scroll performance

Production build compared with commit ccc7615. Chrome on macOS, desktop 1440×1000 (DPR 1), phone 390×844 and tablet 820×1180 (DPR 2, touch emulation, 3× CPU slowdown). Each 14-second pass scrolls from 1.6 viewport heights before Work to 0.95 viewport heights inside Services. Separate first and repeat passes; CPU sampling was kept out of the reported timings. These are local browser measurements, not physical-device guarantees.

## Findings and changes

- Matrix prepared twelve glyph canvases and uploaded all twelve textures in one task while the visitor was still in Credibility/Work. The mobile baseline recorded a 165 ms task here. Glyph drawing now runs in a shared background worker, with transferable image bitmaps and cached artwork across routes. GPU uploads yield between textures.
- Network preloading starts while Work is visible. Feed text drawing and phone construction produced additional 112–159 ms tasks in the baseline. Feed drawing now uses the worker too; image decoding, geometry construction, uploads and shader preparation run in separate steps. Partial setup has cleanup for navigation away.
- The Matrix animation could race its asynchronous shader compilation, causing a blocking first draw. Its first animation frame now waits for preparation to finish.
- Canvas fallbacks yield between frames/groups when workers are unavailable. Worker and fallback paths retain the same glyph seeds, dimensions, phone feed, resolution and materials. Bitmap UV orientation is corrected explicitly.
- The phone visibility observer uses the newest intersection entry, including batched anchor arrivals.

## Measurements

FPS / longest frame in milliseconds. The tablet baseline was not captured.

| Layout / pass | Before: FPS / max ms | After: FPS / max ms | After frames >50 ms |
| --- | --- | --- | --- |
| desktop first | 59.7 / 49.9 | 59.9 / 33.3 | 0 |
| desktop repeat | 60 / 16.8 | 59.8 / 33.4 | 0 |
| mobile first | 57.6 / 183.4 | 59.4 / 66.6 | 1 |
| mobile repeat | 59.8 / 33.4 | 59.6 / 33.4 | 0 |
| tablet first | — | 59.5 / 50.0 | 0 |
| tablet repeat | — | 59.9 / 16.8 | 0 |

95th-percentile frame time was approximately 16.7–16.8 ms in all final runs. The large cold mobile stalls are reduced, with one remaining 67 ms startup frame; this is an improvement rather than a claim of uninterrupted 60 fps. GPU/browser startup cost still varies between runs.

## Checks

- Production build and TypeScript passed; all 37 static pages generated.
- Worker messages verified: three sets of four Matrix frames and the 600×1300 phone feed.
- Worker and worker-disabled fallback both render; Matrix frames advance and the phone becomes ready. Screenshots checked for correct glyphs, readable upright feed artwork and intact materials.
- First/repeat scroll traces recorded without runtime errors on all three layouts.
- Jobs → Services → Matrix, View Opportunities → Jobs → browser Back, a repeated round trip, and Matrix → Network → Matrix all passed on desktop, tablet and phone. Saved scroll positions, city rendering, advancing frames, phone readiness and unlocked interaction were checked. The touch navigation checks also used 12 Mbps downloads and 80 ms latency.

Scripts, CPU profiles, frame/long-animation-frame data and screenshots are in /private/tmp/pathetic-section-scroll-oct23/. The final comparison is before.json versus verified.json. Intermediate traces are retained separately.
