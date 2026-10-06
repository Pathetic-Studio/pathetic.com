"""Run with Blender --background --python scripts/optimize-jobs-models.py.

Keep the source models intact; these lower-poly copies are only used by Jobs
on small screens. Materials, UVs and model coordinates stay with the meshes.
"""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/models/jobs-mobile"
OUTPUT.mkdir(parents=True, exist_ok=True)

MODELS = [
    ("models/pathetic-goggles.glb", "goggles.glb", 0.25),
    ("desktop-flow/stack-toy/trashcan.glb", "trashcan.glb", 0.2),
    ("desktop-flow/stack-toy/desk_001.glb", "desk.glb", 0.45),
    ("desktop-flow/stack-toy/water cooler.glb", "water-cooler.glb", 0.45),
    ("desktop-flow/ads/duck.glb", "duck.glb", 0.4),
]

for source, target, ratio in MODELS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / "public" / source))
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or len(obj.data.polygons) < 300:
            continue
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new("Mobile detail", "DECIMATE")
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT / target), export_format="GLB",
        export_yup=True, export_materials="EXPORT", export_cameras=False,
    )
    print(f"Saved {target}: {(OUTPUT / target).stat().st_size:,} bytes")
