"""Export the homepage goggles without changing the source .blend.

Blender --background '/path/to/pathetic.com goggles.blend' --disable-autoexec \
  --python scripts/export-lifecycle-goggles.py
"""
import json
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
bpy.context.scene.frame_set(1)
root = bpy.data.objects['_PARENT ROTATOR']
parts = [root, *root.children_recursive]

# Bake smooth lens contours offline, instead of adding runtime subdivision.
lens = bpy.data.objects['lenses']
for face in lens.data.polygons:
    face.use_smooth = True
if 'sharp_edge' in lens.data.attributes:
    lens.data.attributes.remove(lens.data.attributes['sharp_edge'])
subdivision = lens.modifiers.new('Web lens curvature', 'SUBSURF')
subdivision.levels = subdivision.render_levels = 1

frame = bpy.data.objects['goggles 2026']
smooth = frame.modifiers.new('Web rim smoothness', 'SMOOTH')
smooth.factor = 0.35
smooth.iterations = 3

# The old export spent most of its geometry on tiny hoops and beads.
for name, ratio in [
    ('earring large', .25), ('earring large.001', .18),
    ('nose hoops', .24), ('earring_nose_balls', .6),
    ('ball', .4), ('ball.001', .4),
]:
    modifier = bpy.data.objects[name].modifiers.new('Web jewellery', 'DECIMATE')
    modifier.ratio = ratio

bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(
    filepath=str(ROOT / 'public/models/pathetic-goggles-smooth.glb'),
    export_format='GLB', use_selection=True, export_apply=True,
    export_animations=False, export_cameras=False, export_lights=False,
    export_extras=False, export_texcoords=False, export_normals=True,
)

# The reflector is a vertically extruded curve. Retain its actual bent profile
# and UVs as a small strip, rather than shipping the Blender scene or 2,048 faces.
card = bpy.data.objects['pathetic.com-gothic']
evaluated = card.evaluated_get(bpy.context.evaluated_depsgraph_get())
mesh = evaluated.to_mesh()
columns = {}
heights = []
for loop in mesh.loops:
    u, v = mesh.uv_layers.active.data[loop.index].uv
    point = card.matrix_world @ mesh.vertices[loop.vertex_index].co
    heights.append(point.z)
    if abs(v) < 0.00001:
        columns[round(u, 5)] = [round(point.x, 6), round(-point.y, 6), round(u, 5)]
profile = {
    'bottom': round(min(heights), 6), 'top': round(max(heights), 6),
    'columns': [columns[u] for u in sorted(columns)],
}
evaluated.to_mesh_clear()
path = ROOT / 'components/blocks/lifecycle/goggles-reflector.json'
path.write_text(json.dumps(profile, indent=2) + '\n')
print('Exported goggles and reflection profile; source .blend unchanged.')
