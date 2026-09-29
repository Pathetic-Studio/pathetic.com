/** Continue the rendered light across the seam without masking the 3D scene. */
export function createLifecycleEnvironment(
  root: HTMLElement | null,
  source: HTMLCanvasElement,
) {
  const html = document.documentElement;
  const surfaces = new Set<HTMLElement>();
  const sections = new Set<HTMLElement>();
  const spills: Array<{
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    edge: "top" | "bottom";
    mask: CanvasGradient;
  }> = [];
  let marked = false;

  const addSpill = (section: HTMLElement, edge: "top" | "bottom") => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("data-lifecycle-environment-spill", edge);
    Object.assign(canvas.style, {
      position: "absolute",
      left: "0",
      width: "100%",
      height: "min(52vh, 520px)",
      [edge === "bottom" ? "top" : "bottom"]: "-2px",
      zIndex: "0",
      pointerEvents: "none",
    });
    const context = canvas.getContext("2d", { alpha: true });
    if (context) {
      const mask = context.createLinearGradient(0, 0, 0, 128);
      mask.addColorStop(edge === "bottom" ? 0 : 1, "rgba(0,0,0,1)");
      mask.addColorStop(edge === "bottom" ? 0.025 : 0.975, "rgba(0,0,0,1)");
      mask.addColorStop(edge === "bottom" ? 1 : 0, "rgba(0,0,0,0)");
      const panel = [...section.children].find(
        (element) =>
          element.getAttribute("data-lifecycle-environment-surface") ===
          "panel",
      );
      if (panel) panel.after(canvas);
      else section.prepend(canvas);
      section.setAttribute("data-lifecycle-environment-spill-host", "");
      spills.push({ canvas, context, edge, mask });
    }
  };
  const mark = () => {
    if (!root || marked) return;
    marked = true;
    const all = [
      ...document.querySelectorAll<HTMLElement>("main section"),
    ].filter((section) => !section.parentElement?.closest("section"));
    const index = all.indexOf(root);
    const neighbors: HTMLElement[] = [root];
    for (const direction of [-1, 1]) {
      let i = index + direction;
      while (index >= 0 && all[i]) {
        neighbors.push(all[i]);
        if (!all[i].id.startsWith("_sectionSpacer")) break;
        i += direction;
      }
    }
    for (const section of neighbors) {
      sections.add(section);
      section.setAttribute("data-lifecycle-environment-section", "");
      surfaces.add(section);
      section.style.setProperty(
        "--lifecycle-original-color",
        getComputedStyle(section).backgroundColor,
      );
      section.setAttribute("data-lifecycle-environment-surface", "base");
      for (const element of section.querySelectorAll<HTMLElement>(
        ":scope > div, :scope > div > div",
      )) {
        // Self-contained scenes keep their lighting while the section's outer
        // background continues the glasses environment across the seam.
        if (element.closest("[data-lifecycle-environment-preserve]")) continue;
        const style = getComputedStyle(element);
        if (
          style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
          style.backgroundImage !== "none"
        ) {
          surfaces.add(element);
          element.setAttribute(
            "data-lifecycle-environment-surface",
            element.childElementCount ? "content-panel" : "panel",
          );
        }
      }
    }
    if (all[index + 1]) addSpill(all[index + 1], "bottom");
    const previousSlide = root.querySelector<HTMLElement>(
      "[data-lifecycle-fun-previous]",
    );
    if (previousSlide && window.innerWidth < 1024)
      addSpill(previousSlide, "top");
    for (const element of [
      document.body,
      document.getElementById("smooth-wrapper"),
    ]) {
      if (element) {
        surfaces.add(element);
        element.style.setProperty(
          "--lifecycle-original-color",
          getComputedStyle(element).backgroundColor,
        );
        element.setAttribute("data-lifecycle-environment-surface", "base");
      }
    }
  };
  const reset = () => {
    html.removeAttribute("data-lifecycle-environment");
    html.style.removeProperty("--lifecycle-environment-color");
    html.style.removeProperty("--lifecycle-environment-ink");
    html.style.removeProperty("--lifecycle-environment-brightness");
    html.style.removeProperty("--lifecycle-environment-darkness");
    surfaces.forEach((element) => {
      element.removeAttribute("data-lifecycle-environment-surface");
      element.style.removeProperty("--lifecycle-original-color");
    });
    sections.forEach((element) =>
      element.removeAttribute("data-lifecycle-environment-section"),
    );
    spills.forEach(({ canvas }) => {
      canvas.parentElement?.removeAttribute(
        "data-lifecycle-environment-spill-host",
      );
      canvas.remove();
    });
    surfaces.clear();
    sections.clear();
    spills.length = 0;
    marked = false;
  };
  return {
    update(color: string, progress: number, brightness: number) {
      if (progress < 0.001) {
        if (marked) reset();
        return;
      }
      mark();
      html.setAttribute("data-lifecycle-environment", "");
      html.style.setProperty("--lifecycle-environment-color", color);
      html.style.setProperty(
        "--lifecycle-environment-brightness",
        String(brightness),
      );
      html.style.setProperty(
        "--lifecycle-environment-darkness",
        `${(1 - brightness) * 100}%`,
      );
      html.style.setProperty(
        "--lifecycle-environment-ink",
        progress > 0.5 ? "#fff" : "#050505",
      );
      // Reuse this frame's edge light, copying just a two-pixel strip. No extra
      // 3D render, per-frame pixel readback, or new lighting is needed.
      spills.forEach(({ context, edge, mask }) => {
        context.clearRect(0, 0, 128, 128);
        context.globalCompositeOperation = "source-over";
        context.drawImage(
          source,
          0,
          edge === "bottom" ? source.height - 2 : 0,
          source.width,
          2,
          0,
          0,
          128,
          128,
        );
        context.globalCompositeOperation = "destination-in";
        context.fillStyle = mask;
        context.fillRect(0, 0, 128, 128);
      });
    },
    dispose: reset,
  };
}
