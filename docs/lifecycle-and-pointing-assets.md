# Lifecycle and pointing figure assets

Local artwork update, September 17, 2026. No Sanity uploads or publishing.

The pointing figure described below is the previous v3 version. The active figure now uses the [anonymous overhead v4 artwork and shoulder attachment](pointing-figure-v4.md). Lifecycle assets below remain current.

## Additional orbit photos — September 18, 2026

All five photos in `Downloads/PATHETIC STUDIO WIREFRAMES` now orbit alongside the three apparel cutouts. The original compositions and backgrounds are preserved. They were converted directly from the supplied PNGs to WebP, at a maximum 360px long edge without upscaling. Combined size: 114,392 bytes, down from 1,572,424 bytes (92.7% smaller).

Files below are saved under `public/images/lifecycle/slide-2/pathetic/`:

| WebP | Supplied PNG |
| --- | --- |
| `rhinestone-street-style.webp` | `ACS_3270 1.png` |
| `basketball-editorial.webp` | `ACS_3263 1.png` |
| `party-crowd.webp` | `8ED681A6-9C41-449A-804E-CE07DF1121C6_1_105_c 1.png` |
| `party-friends.webp` | `E1147777-3F17-4839-8EB6-DEBDFC55F812_1_105_c 1.png` |
| `party-merch-rail.webp` | `FAC954AC-CBAE-4D47-97AB-D92B26063A84_1_105_c 1.png` |

## Saved assets

| File under `public/images` | Source | Web size |
| --- | --- | --- |
| `lifecycle/slide-2/pathetic/rhinestone-tee.webp` | `Downloads/pathetic assets/to use/DSC00035-Edit.jpg` | 512 × 440, 18.7 KB |
| `lifecycle/slide-2/pathetic/glasses-tee.webp` | `Downloads/pathetic assets/to use/Gemini_Generated_Image_m1xoh0m1xoh0m1xo.jpeg` | 512 × 449, 25.2 KB |
| `lifecycle/slide-2/pathetic/camo-hoodie.webp` | `Downloads/pathetic assets/to use/Gemini_Generated_Image_pwarnppwarnppwar (1).png` | 433 × 512, 75.3 KB |
| `what-we-do/pointing-model-v3.webp` | New generated overhead model | 768 × 1152, 53.9 KB |
| `what-we-do/pointing-hand-v3.webp` | Resized existing `bendy-man-hand-v2.png` | 320 × 320, 8.5 KB |

The three garment cutouts and new model were made with the **built-in image generation tool**, then resized and converted to WebP with Sharp, preserving transparency. Original source files and previous site artwork remain available. The two café characters use the existing `cafe-headphones-person.webp` and `cafe-worker.webp` cutouts.

The model's complete photograph provides the closed pose. A CSS mask hides its photographed left hand while the animated sleeve is extended, so opening and closing use the same aligned body. The interactive sleeve uses cubic curves, joined at the photographed cuff and animated hand's wrist.

## Research reference

[SSENSE: The High School Standard](https://www.ssense.com/en-us/editorial/fashion/the-high-school-standard) informed the tailored black clothing and editorial posing. The higher camera angle follows the user's supplied reference. The generated figure is fictional.

## Final prompts

Each of the three garment photographs was supplied individually as an edit target with this prompt:

> Use case: background-extraction. Edit target: the supplied garment product photograph. Remove only the background, surface and cast shadow and isolate the exact garment on a genuinely transparent alpha background. Preserve the entire garment silhouette, original proportions, all edges and seams, colors, texture, neckline label, graphics and printed/rhinestone words exactly. Do not redraw or restyle the design. No additional objects, no floor, no border, no watermark or checkerboard. Center the complete cutout with a small transparent margin. This is a floating product asset for a website.

The new figure was generated with this prompt:

> Use case: photorealistic-natural. Asset: a single full-body cutout for an interactive fashion-studio website, with a genuinely transparent background and no floor or shadow. Create one adult male fashion model photographed from a strong high camera angle, approximately 50 degrees down, looking up toward the camera with calm editorial confidence. Contemporary SSENSE-style ecommerce/editorial photography: natural texture, slightly awkward sculptural pose, oversized matte black tailored blazer over a plain ivory ribbed tank, very wide black trousers, polished black chunky shoes. Dark short hair, slim build. Full body including shoes, both hands, entire head, roomy transparent margin. He stands with knees slightly bent, feet separated in an asymmetrical stance; the perspective makes his head and shoulders more prominent and his feet recede. His right arm (image right) is relaxed with hand in trouser pocket. His left arm (image left) is bent naturally at the elbow, with the forearm angled gently toward image-left and down, relaxed left hand at hip level. Keep that left elbow and wrist clearly separate from the torso silhouette, allowing a later sprite edit. Soft neutral studio light, realistic adult anatomy, sharp high quality photographic skin and fabric; fashion photograph, not illustration, not 3D render. No props, no text, no logos, no floor, no background, no checkerboard baked into the image. Portrait composition, one model only. This is a new model inspired by high-angle editorial photography, not a reproduction of a particular real person.
