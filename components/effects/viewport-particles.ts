/** Put travelling fragments outside the smoother and section clipping layers. */
export function createViewportParticleLayer(name: string) {
  const layer = document.createElement("div");
  layer.dataset.viewportParticles = name;
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "60",
    contain: "strict",
  });
  document.body.appendChild(layer);
  return layer;
}
