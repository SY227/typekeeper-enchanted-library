"""OPTIONAL / NOT EXECUTED IN DELIVERY ENVIRONMENT.
Create an editable orthographic expression-review scene from the shipped 2D art.
Not a character mesh, native game, or replacement for the tested browser renderer.
Run with Blender: blender --background --python tools/blender/create_expression_review.py
Output is timestamped so no existing .blend file is overwritten.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, sys
try:
 import bpy
except ImportError as exc:
 raise SystemExit('Run this optional script inside Blender, not ordinary Python.') from exc
ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'asset-source/expressions'
STATES=['calm','focused','worried','alarmed','critical','defeated','celebrate']
for state in STATES:
 if not (ASSETS/f'{state}.png').is_file():
  raise FileNotFoundError(f'Missing expression master: {state}.png')
OUT=ROOT/'tools/blender/output'/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ')
OUT.mkdir(parents=True,exist_ok=False)
scene=bpy.data.scenes.new('Typekeeper_Expression_Review')
if bpy.context.window is None:
 raise RuntimeError('No Blender context window. Open the Scripting workspace and run this script there.')
bpy.context.window.scene=scene
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=876;scene.render.resolution_y=840;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.fps=24;scene.frame_start=1;scene.frame_end=168
scene.view_settings.view_transform='Standard'
cam_data=bpy.data.cameras.new('Orthographic_Character_Camera');cam=bpy.data.objects.new('Orthographic_Character_Camera',cam_data);scene.collection.objects.link(cam)
cam.location=(0,0,10);cam_data.type='ORTHO';cam_data.ortho_scale=4.65;scene.camera=cam
# Flat, emissive 2D planes preserve the approved artwork instead of relighting faces.
for index,state in enumerate(STATES):
 image=bpy.data.images.load(str(ASSETS/f'{state}.png'),check_existing=True)
 mat=bpy.data.materials.new('Expression_'+state);mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
 out=nodes.new('ShaderNodeOutputMaterial');tex=nodes.new('ShaderNodeTexImage');tex.image=image
 emission=nodes.new('ShaderNodeEmission');emission.inputs['Strength'].default_value=1
 transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader')
 links.new(tex.outputs['Color'],emission.inputs['Color']);links.new(tex.outputs['Alpha'],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(emission.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
 mesh=bpy.data.meshes.new('ExpressionQuad_'+state)
 mesh.from_pydata([(-2.19,-2.10,0),(2.19,-2.10,0),(2.19,2.10,0),(-2.19,2.10,0)],[],[(0,1,2,3)]);mesh.update()
 uv=mesh.uv_layers.new(name='UVMap')
 for poly in mesh.polygons:
  for loop in poly.loop_indices:
   vertex=mesh.vertices[mesh.loops[loop].vertex_index].co
   uv.data[loop].uv=((vertex.x+2.19)/4.38,(vertex.y+2.10)/4.2)
 obj=bpy.data.objects.new('Typekeeper_'+state,mesh);scene.collection.objects.link(obj);obj.data.materials.append(mat)
 for frame in range(1,169):
  obj.hide_render=not(index*24+1<=frame<=(index+1)*24);obj.hide_viewport=obj.hide_render
  obj.keyframe_insert(data_path='hide_render',frame=frame);obj.keyframe_insert(data_path='hide_viewport',frame=frame)
 scene.timeline_markers.new(state.upper(),frame=index*24+1)
 image.pack()
scene.frame_set(1)
# Save only this newly created review scene inside a new timestamped project file.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Typekeeper_Expression_Review.blend'))
for index,state in enumerate(STATES):
 scene.frame_set(index*24+1);scene.render.filepath=str(OUT/f'{state}.png');bpy.ops.render.render(write_still=True,scene=scene.name)
(OUT/'review-metadata.json').write_text(json.dumps({'blender':bpy.app.version_string,'frames':STATES,'kind':'2D expression review, not native game runtime'},indent=2))
print(f'Expression review saved to {OUT}')
