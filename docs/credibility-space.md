# Glasses → space trial

The local switch is `CREDIBILITY_PRESENTATION` in
`components/blocks/credibility/credibility-presentation.ts`. Use `universe` to
restore the separate galaxy with button labels; `space` joins adjacent lifecycle
and credibility blocks. No CMS changes are needed.

The lifecycle timeline owns the radial takeover and passes a shared progress ref
to both existing renderers. The glasses remain the same mesh, reflection maps,
canvas and WebGL context throughout. A tenth body joins the planet simulation
for the glasses, sharing its circulation, drag, keyboard controls and comet hits.
Its normalized position is projected into the original perspective camera;
there is no duplicate glasses model. Chrome redraws follow the simulation's
cadence (30fps idle, 60fps interacting), and stop when the section is hidden.
The planet renderer is prewarmed but doesn't draw behind the hidden timeline.

The nav's space masks use the same centre, oval proportions and softened falloff
as the backdrop. A dedicated white logo layer follows that mask on both layouts.
Its exit clips to the section's bottom edge. The background is bounded by the
viewport so the following section has a hard edge.

The tech presentation keeps brand logos at 30% opacity. Hover, keyboard focus
and click/tap inspection are available alongside the existing drag physics.
The planets circulate continuously, with inertia after drags and comet hits.
The interactive spiral uses 9,216 particles (25% fewer than the first trial),
with its original GPU forces intact. The older universe budget is unchanged.
Enter/Space toggles inspection; arrows move a focused object; Escape resets.
Reduced motion uses separate static sections instead of the scrubbed twirl.

The inspection outline follows live projected object bounds rather than a stale
pointer target. Mouse clicks do not latch it; touch taps stay selected until an
outside tap or exit. The glasses use cached surface samples for a close outline.
Callouts connect from the bottom-left corner to a square endpoint, with damped
logo drift and left-aligned RA/DEC coordinates. The glasses type “Cooking up your
next meme”. Decorative callouts never intercept dragging.

The original Jupiter, Earth and pigeon cutouts from Frame 2446 are stored as
`jupiter-figma.webp`, `earth-figma.webp` and `pigeon-figma.webp` in
`public/images/credibility/objects`. Transparent margins were trimmed and they
were encoded at up to 512px. `universeArtwork()` applies them only to this space
presentation. Existing Saturn, Neptune, Moon, Mars and UFO artwork already
matches that frame. The comet artwork and effects are unchanged.

On phones and portrait tablets the objects circulate on an evenly spaced oval,
and the galaxy stays broad instead of turning into a vertical column. Mobile
rendering uses up to 2× device resolution with a 2.4-megapixel budget. The mobile
headline shares its font-size and line-height tokens with the glasses scene.
