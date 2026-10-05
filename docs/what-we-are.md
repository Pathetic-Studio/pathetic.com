# What We Are — local section

What We Are is an independent section following What We Believe, using the parchment board `1009:2082` in Figma file `B2iIUUnP09v4pt9mMg0QFF`. The inset panel uses the exact paper texture over `#f7e7cb` at 30% multiply, with the black title from that board. The supplied Vitruvian figure is reused; the four hats now come from the updated parchment board. The original cloud/grid section keeps its own dimensions.

The page block renderer inserts this local section after the belief block, without a Sanity schema or content change. Its implementation is in `components/blocks/what-we-are/`. Desktop labels are capped at 18px; the composition fits a viewport-height panel with space underneath the figure.

Four corner buttons reveal the approved principles (Idea first, medium agnostic; Built for idea flow; At the intersection of tech, creativity and culture; Students of the internet). Hover and keyboard focus preview a look. Dragging a hat onto the head pins the outfit and description; dragging it away undresses the figure. Hats use the basket’s Matter gravity, bounce and throw response. They start on the heading and collide with the title, label boxes, the figure’s silhouette and the actual inset panel boundaries. Hover previews return a hat to its last physical location. There is no pickup or placement spin; clothing still scale-pops in with a short stagger. Clicking a hat or label also pins a look; Escape resets it. Keyboard focus follows a hat when it lands so removal and Escape remain available. The figure has a gentle perspective turn, can be dragged sideways, and makes a full turn on click or Enter. The artwork and hats share the figure transform. Reduced motion disables the turning; offscreen idle motion pauses. This uses CSS transforms, short GSAP tweens and a four-body Matter world, without another WebGL canvas. Physics pauses outside the viewport, while the document is hidden, and for reduced motion.

At 900px and below, a native horizontal snap carousel replaces the corner controls. The centered card selects its hat, outfit and copy automatically; four 44px pagination buttons and left/right keyboard arrows offer the same selection. The figure stays above the cards. The Matter hat world is disposed in this layout and rebuilt when returning to desktop. No Sanity schema, document, or published content was changed.

## Original assets (retained)

`public/images/what-we-are/` contains the new Figma `heading.svg` and optimized `parchment.webp`.

Saved under `public/images/belief/what-we-are/`:

- `vitruvian-man.png`, `orange-beanie.png`, `what-we-are.svg`, and `ellipse-*.svg`: original Figma exports. The older ellipse masks are retained as assets but are not used by the parchment board.
- `beret.webp`: generated black felt beret, trimmed and optimized to 512 × 248 with transparency.
- `courier-cap.webp`: generated blue delivery cap, trimmed and optimized to 512 × 339 with transparency.
- Owned Media reuses `public/images/lifecycle/memes/cafe-cap.webp`.

Both generated hats used the built-in image tool in **generate** mode, one image per call, then Sharp for transparent-margin trimming, sizing, and WebP conversion. The man was not regenerated.

### Beret prompt

Use case: product-mockup. Asset type: transparent hat cutout for a small interactive website collage. Generate ONE black wool artist's beret, viewed exactly from the front at eye level, as if worn on a forward-facing head but with NO person, head, face, mannequin or hair present. A soft asymmetrical crown slouches slightly to the viewer's right, tiny top stem, horizontal head opening and narrow rim. Real felt texture, subtle neutral studio highlights, no cast shadow outside the hat. Entire hat isolated and centered within a square transparent PNG canvas with 8 percent empty transparent margin. Its silhouette should be broad and low, width roughly twice its height. Product photography, crisp edges, genuine alpha transparency. No writing, logos, graphics, background, checkerboard, extra objects or framing.

### Courier-cap prompt

Use case: product-mockup. Asset type: transparent hat cutout for a small interactive website collage. Generate ONE cobalt-blue vintage courier's peaked cap, viewed exactly from the front at eye level, as if worn on a forward-facing head but with NO person, head, face, mannequin or hair present. Rounded structured blue fabric crown, black short curved peak, a simple blue horizontal head band, small plain silver round button at each side. Recognizable as a friendly old-school delivery driver's cap, no insignia or badges. Real canvas fabric, subtle neutral studio highlights, no cast shadow outside the hat. Entire cap isolated and centered within a square transparent PNG canvas with 8 percent empty transparent margin. Product photography, crisp edges, genuine alpha transparency. No writing, logos, military symbols, background, checkerboard, extra objects or framing.

## Verification

- Chrome viewport checks at 320 × 740, 390 × 844, 768 × 1024, 1024 × 768, and 1440 × 1250.
- All four hat/copy states tested at each width, with no button or copy crossing the viewport edge.
- Keyboard focus, Escape reset, pointer drag, and full spin checked. A completed turn returns the figure to the front.
- Reduced-motion switching tested independently of the rest of the homepage: motion stops, hat controls work, and turning restores when requested.
- The wider site audit is at `/debug/layout-audit`, available only in development.

## Parchment follow-up — 2 October 2026

The separate parchment section was checked at 1440 × 900, 1024 × 768, 768 × 1024, and 320 × 740. All supplied artwork loaded, the approved descriptions fit inside the panel, and there was no horizontal page overflow. Desktop lower labels now share a baseline at the top of their row. Local type checking and diff whitespace checks passed.


## Wardrobe update — 3 October 2026

Source: [What We Are parchment](https://www.figma.com/design/B2iIUUnP09v4pt9mMg0QFF/Pathetic-JONO?node-id=1009-2082). Clothing references are in groups `1013:2073`, `1015:2111`, `1015:2160` and `1015:2154` beside the board. The hats and most clothes are the supplied photographic cutouts. The existing approved principle copy is unchanged.

All active wardrobe assets live in `public/images/what-we-are/wardrobe/`, with transparent margins trimmed and original proportions preserved. The initial set was approximately **374 KiB** of WebP, sized for roughly twice its largest displayed dimensions; the fitted clothing replacements are documented below. Earlier generated hats are retained but unused.

| Hat / principle | Outfit |
| --- | --- |
| Camo cap / Idea first | Brown jacket, denim shorts, red cowboy boots, blue bottle |
| Yellow knit / Built for idea flow | Football jersey, embroidered shorts, sneakers, beer glass |
| Orange beanie / Tech, creativity and culture | Black leather dress, black heels, gold-handled bag |
| Black beret / Students of the internet | Full-length black coat, black boots, whisky glass |

The worn hat and clothing live inside the same transformed figure as the drawing. A temporary separate hat element handles travel and pointer capture, then hands rendering and keyboard focus back to the worn hat. This prevents hats drifting off the head during a spin. Invalid drops return to the rack. Touch dragging uses pointer capture and blocks scrolling only while holding the hat. There is no extra WebGL canvas. The later Matter pass runs its physics loop only while this section is visible.

### Generated clothing

The built-in image tool was used, with true transparency. Outputs were copied into the project, then trimmed, resized and converted to WebP with Sharp. The Vitruvian drawing was not regenerated.

- `leather-dress.webp` — **generate**. Brief: one black leather sleeveless midi dress, straight frontal catalog view; high round neckline, wide shoulder straps, fitted waist, slightly A-line skirt below the knees. Ghost garment with no human, mannequin, limbs, floor, glow or cast shadow. Realistic studio texture on a transparent background.
- `heels.webp` — **generate**. Brief: matching black leather open-toe wedge-heeled mules, slight overhead/front view, toes forward, side by side with a small gap. Empty shoes, no feet or person, transparent background, no floor or cast shadow.
- `handbag.webp` — **edit** of the supplied leather-outfit reference. Prompt: “Use case: background-extraction. Edit the supplied fashion reference to isolate ONLY the small black leather crescent handbag and its circular gold handle as one clean product cutout. Preserve the bag's actual design, rich black leather texture and gold handle. Remove the entire person, hand, clothes, shoes and all other content. Complete any tiny obscured part of the handle naturally. Center the single complete handbag on a genuinely transparent background, no floor, no cast shadow or glow. This is a small interactive website outfit accessory.”

### Interaction checks

- All four hover previews, hover-off returns, rapid hover reversals, drag-to-head, dragging a worn hat off, invalid drops, and spinning a dressed figure.
- Enter to wear a hat, keyboard focus following the hat, and Escape to clear it.
- Responsive checks at widths 320, 390, 768, 1024, 1440 and 1920. No horizontal overflow; descriptions stay within the panel.
- Actual emulated touch events attach and remove a hat at 390 × 844.
- Initial reduced-motion checks at 1024 × 768 and 1920 × 1080: all four outfits and descriptions work without flight/spin animations.
- Local typecheck passed. No Sanity writes, pushes or publication.


## Posed clothing and physical hats — follow-up, 3 October 2026

The four looks were regenerated against the supplied Vitruvian drawing: sleeves follow the horizontal arms; shorts, trousers, boots, sneakers and heels follow the outer, spread legs. The alternate raised arms and central legs remain visible as part of the original drawing. The figure was not regenerated.

Generation used the **built-in image tool**, one transparent outfit per call, with the original figure as the pose reference and the supplied fashion cutouts as the clothing reference. Exact prompts are in [what-we-are-posed-prompts.json](./what-we-are-posed-prompts.json). Cropped, optimized WebP garments are saved in `public/images/what-we-are/wardrobe/posed/`:

- `media-jacket.webp`, `media-shorts.webp`, `media-boot-left.webp`, `media-boot-right.webp`.
- `studio-jersey.webp`, `studio-shorts.webp`, `studio-shoe-left.webp`, `studio-shoe-right.webp`.
- `apparel-dress.webp`, `apparel-shoe-left.webp`, `apparel-shoe-right.webp`.
- `distribution-outfit.webp` (coat, trousers and boots fitted together).

Existing hats and accessories remain in use. Older garment exports are retained for reuse.

`hat-physics.ts` runs the four hats in one Matter world, with the basket’s gravity/friction/restitution and scroll turbulence. Static obstacles follow the heading, label borders and the figure’s anatomical regions. Two short simulation steps per frame limit tunnelling on fast throws. Bounds use the actual inset panel element; resize preserves relative positions and updates the obstacles. Dragged hats temporarily ignore obstacles so the head remains accessible, then regain collisions and measured release velocity. Natural collision rotation is retained; scripted pickup/placement revolutions are removed.

The head drop target uses a soft glow behind the drawing with no outline. Snapping still pins the copy/outfit; pulling the hat off removes them. Keyboard Enter/Escape and arrow-key pushes work, with focus transferred to the worn hat. Empty header space passes pointer events through to the hats; logo, menu, feature and navigation controls retain their hit areas.

Verification: all four hover looks; head snapping; removal with throw momentum; resting on label boxes; collision with the head; return to the previous physical location after hover; inset containment over 181 sampled frames (p95 16.8 ms locally); offscreen pause; emulated touch attach/remove; 320/390/768/1440 px layouts; mobile menu open/close; desktop header hit areas; and initial reduced-motion interactions. Browser checks reported no page errors. Local typecheck and whitespace checks pass. Nothing was pushed or published, and Sanity content was not changed.

## Mobile refinements — 5 October 2026

The camo cap is 12.5% of the figure width (previously 16%), with its lower edge retained at the forehead. Its loose desktop size is also reduced. The left boot export had no visible alpha pixels; the original 26,783-pixel boot component is restored without the stray shorts in the source crop. Both boots keep the approved pose and placement.

Verified at 320, 390, 768 and 1440px: native touch swipe changes the outfit, all four pagination choices select the matching hat, desktop hover releases back to the Matter world, and both camo boots render. Browser checks reported no page errors; typecheck and diff whitespace checks pass. The related home-return regression was reproduced after a case-study-to-home anchor link: redundant ScrollSmoother position writes consumed the first subsequent scroll. Guarding unchanged positions in `transition-shell.tsx` restores the Matrix reveal; three consecutive anchor/Back return cycles kept the work position and played the reveal. All edits remain local.

### Release follow-up

The supplied title paths now render directly as inline SVG instead of a separately loaded image. This preserves the Figma artwork and makes the heading visible immediately at phone and tablet widths. Checked at 320, 390 and 768px. The accumulated changes are prepared for the requested push to both `develop` and `feat/website-sections-update`; production build, TypeScript and whitespace checks pass. No Sanity content changes are part of this update.
