# Anonymous shoulder-attached pointing figure

This supersedes the v3 portrait figure and its forearm attachment. Artwork was generated and edited with the built-in image generation tool, then converted to transparent WebP locally. No Sanity writes or uploads.

## Saved assets

- `public/images/what-we-do/pointing-figure-shoulder-v4.webp`: active pose, 512 × 512, 16,040 bytes. The entire image-left arm is absent, allowing the animated sleeve to attach directly at the shoulder.
- `public/images/what-we-do/pointing-figure-rest-v4.webp`: complete resting pose, 512 × 512, 19,192 bytes. Same canvas alignment and overhead figure, with the natural arm restored.
- `public/images/what-we-do/pointing-hand-v3.webp`: retained smaller pointing hand.

The figure occupies 7% of the section width with transparent space retained in the square canvas. Its face is obscured by the steep camera angle and cap. The active sprite's shoulder attachment is at 35.45% from the left and 25.45% from the top. The arm curves outward from that opening and tapers toward the hand. Clicking the figure retracts and disables the arm; clicking again enables it. The resting pose restores the entire photographed arm.

## Final prompts

### Complete resting figure

> Use case: photorealistic-natural. Create a NEW anonymous overhead fashion figure as a transparent website cutout. Reference: use the user's image with the enormous foreground pointing hand and tiny distant person ONLY for the extreme bird's-eye camera angle, distant anonymous figure, and foreshortened silhouette. Ignore the separate detailed curly-haired male cutout; that is the rejected previous version. Generate ONLY the little full-body figure, without the enormous hand or extended arm: those are animated separately in the website. One adult in a fashionable oversized black boxy jacket over a white tee, loose dark trousers and black shoes; natural asymmetrical stance, feet apart, knees subtly bent. Camera is directly overhead, looking steeply down from far above, roughly 80 degrees down: a compact foreshortened body, prominent crown and shoulders, shortened legs. Face is turned down and obscured by the brim of a plain dark baseball cap; no recognizable face, no eye contact, no portrait-like facial detail. The person should read as an anonymous tiny streetwear silhouette, like the small person at the base of the user's reference. Both arms are naturally down in the resting pose. The arm on IMAGE LEFT hangs slightly out from its shoulder, with a clear narrow transparent gap between the entire arm and the torso; its hand is near the hip. The other arm rests near its pocket. Keep the IMAGE LEFT shoulder's outer seam clearly legible for attaching a separate animated sleeve at the SHOULDER, not the elbow or forearm. Real photographic clothing folds and anatomy. Full body, both shoes and hands entirely visible. Neutral soft studio illumination. Isolated on genuinely transparent alpha, no ground, no cast shadow, no halo, no checkerboard, no text or logos. Square canvas, complete figure centered with a small transparent margin. Strong overhead foreshortening and anonymity are essential.

### Shoulder attachment sprite

The complete resting figure above was supplied as the edit target.

> Use case: precise-object-edit. Edit target: the supplied transparent overhead fashion figure. This is the ACTIVE POSE sprite for an animated stretchy arm. Remove the ENTIRE arm on IMAGE LEFT, starting at the anatomical SHOULDER seam: remove its upper arm, elbow, forearm and hand, leaving no sleeve stump hanging down. Finish the outer shoulder at approximately x=32%, y=28% of this square image as a small dark fabric armhole/socket that faces diagonally toward image upper-left. A separately rendered animated black sleeve will attach directly to this SHOULDER. Preserve the exact head, cap, obscured face, neck, torso, jacket lapels, shirt, opposite arm, trousers, shoes, all original proportions and every unchanged part of the pose. Keep the original canvas dimensions, image alignment, position and scale absolutely identical so this sprite crossfades precisely with the original complete resting pose. Keep genuine alpha transparency including the newly vacated arm region. Do not replace the missing arm, do not add a floating hand, no stump at the elbow or forearm, no new objects, no floor, no shadow, no background, no checkerboard, no text.
