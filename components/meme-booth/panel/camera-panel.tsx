//components/meme-booth/panel/camera-panel.tsx
"use client";

import CameraPanelCore from "./camera-panel-core";
import CameraRendererBasic from "./renderers/camera-renderer-basic";

export default function CameraPanel() {
    return <CameraPanelCore CameraRenderer={CameraRendererBasic} />;
}
