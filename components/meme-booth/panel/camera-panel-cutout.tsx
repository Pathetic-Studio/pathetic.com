"use client";

import CameraPanelCore from "./camera-panel-core";
import CameraRendererCutout from "./renderers/camera-renderer-cutout";

export default function CameraPanelCutout() {
    return <CameraPanelCore CameraRenderer={CameraRendererCutout} />;
}
