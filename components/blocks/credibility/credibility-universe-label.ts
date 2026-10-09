import * as THREE from "three";
import { universeLogo } from "./credibility-universe-assets";
import type { UniverseLabelStyle } from "./credibility-universe-data";

export async function createUniverseLabel(
  file: string,
  name: string,
  style: UniverseLabelStyle,
  wordmarkHeight: number,
) {
  const image = await universeLogo(file);
  const canvas = document.createElement("canvas");
  canvas.width = style === "button" ? 1024 : 512;
  canvas.height = image?.naturalWidth
    ? Math.round((canvas.width * image.naturalHeight) / image.naturalWidth)
    : canvas.width / 4;
  const context = canvas.getContext("2d")!;
  if (image?.naturalWidth) {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = style === "button" ? "black" : "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    context.fillStyle = style === "button" ? "black" : "white";
    context.font = `bold ${canvas.width * 0.15}px sans-serif`;
    context.textAlign = "center";
    context.fillText(
      name,
      canvas.width / 2,
      canvas.height * 0.75,
      canvas.width,
    );
  }
  if (style === "button") {
    // Trim the artwork, not just its SVG viewBox. Different source files have
    // different invisible margins, which otherwise become uneven button padding.
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width,
      top = canvas.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] <= 8) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left) {
      left = top = 0;
      right = canvas.width - 1;
      bottom = canvas.height - 1;
    }
    const mark = document.createElement("canvas");
    mark.width = right - left + 1;
    mark.height = bottom - top + 1;
    mark
      .getContext("2d")!
      .drawImage(
        canvas,
        left,
        top,
        mark.width,
        mark.height,
        0,
        0,
        mark.width,
        mark.height,
      );
    const croppedWordmarkHeight =
      (wordmarkHeight * canvas.height) / mark.height;
    const fittedHeight = Math.min(34, 13 / croppedWordmarkHeight);
    const markWidth = Math.min(140, (fittedHeight * mark.width) / mark.height);
    const markHeight = (markWidth * mark.height) / mark.width;
    const width = Math.ceil(markWidth + 16);
    const height = Math.ceil(markHeight + 12);
    const element = document.createElement("span");
    element.dataset.universeLabel = "";
    element.setAttribute("aria-hidden", "true");
    // Browser compositing keeps these sharp at the device's actual resolution,
    // independent of the galaxy's deliberately capped WebGL pixel ratio.
    Object.assign(element.style, {
      position: "absolute",
      left: "50%",
      bottom: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      width: `${width}px`,
      height: `${height}px`,
      padding: "0",
      background: "#fff",
      border: "1.5px solid #000",
      borderRadius: "0",
      lineHeight: "0",
      pointerEvents: "none",
      transform: "translateX(-50%)",
      transformOrigin: "50% 100%",
    });
    const logo = document.createElement("img");
    logo.alt = "";
    logo.draggable = false;
    logo.src = mark.toDataURL("image/png");
    Object.assign(logo.style, {
      display: "block",
      width: `${markWidth}px`,
      height: `${markHeight}px`,
      maxWidth: "none",
      margin: "0",
      padding: "0",
      border: "0",
    });
    element.append(logo);
    const texture = new THREE.CanvasTexture(mark);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.labelWidth = width;
    texture.userData.labelHeight = height;
    return { texture, element };
  }
  // Keep the previous on-object presentation available as an option.
  const outlined = document.createElement("canvas");
  outlined.width = canvas.width + 80;
  outlined.height = canvas.height + 80;
  const outlineContext = outlined.getContext("2d")!;
  outlineContext.shadowColor = "rgba(0,0,0,.95)";
  outlineContext.shadowOffsetY = 6;
  outlineContext.shadowBlur = 20;
  for (let i = 0; i < 3; i++) outlineContext.drawImage(canvas, 40, 40);
  const texture = new THREE.CanvasTexture(outlined);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.wordmarkAspectHeight = canvas.height;
  return { texture, element: null };
}
