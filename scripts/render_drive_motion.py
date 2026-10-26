"""Run through Blender MCP after injecting JSON from export-drive-poses.mjs into POSES."""
import bpy
import math
from mathutils import Vector, Quaternion
ROOT='/Users/kangpungyun/Desktop/Projects/ai-expo-mvp'
POSES = []
if not POSES:raise ValueError('Inject scripts/drive-preview-poses.json into POSES before running')
scene=[s for s in bpy.data.scenes if s.name.startswith('FORM_ToolingV6_hcm-35t')][-1]
bpy.context.window.scene=scene
objects=[o for o in scene.objects if o.type in ['MESH','EMPTY']]
rig=[o for o in objects if o.get('animation')]
base={o.name:(o.location.copy(),o.rotation_euler.to_quaternion(),o.scale.copy()) for o in rig}
for o in objects:o.hide_render=False
camera=scene.camera
camera.location=(.18,-5,2.16);target=Vector((0,-.65,1.96))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=3.2
scene.render.resolution_x=640;scene.render.resolution_y=480;scene.render.resolution_percentage=100
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
scene.render.film_transparent=False
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.86,.91,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
for group in POSES:
    for frame_index,frame in enumerate(group['frames']):
        for o in rig:
            pos,quat,scale=base[o.name];o.location=pos;o.rotation_mode='QUATERNION';o.rotation_quaternion=quat;o.scale=scale
            kind=o.get('animation');index=o.get('index',0);a=o.get('angle',index*math.pi/4)
            theta,travel,link_angle=frame['drives'][index%8]
            if kind=='servo-crank':o.rotation_quaternion=Quaternion((0,-1,0),theta)@quat
            if kind in ['connecting-rod','servo-slide','cutter']:
                o.location.x-=travel*math.cos(a);o.location.z-=travel*math.sin(a)
                if kind=='connecting-rod':o.rotation_quaternion=Quaternion((0,-1,0),link_angle)@quat
            if kind=='coil-turn':o.hide_render=group['step']==1 and index>=math.ceil(frame['form']*8)
            if kind=='spinner':
                if group['step']==1:
                    axis=o.get('axis',[0,0,1]);o.rotation_quaternion=quat@Quaternion(Vector((axis[0],-axis[2],axis[1])),frame['form']*math.pi*4)
        scene.render.filepath=ROOT+'/scripts/previews/rotation/step-'+str(group['step'])+'-'+str(frame_index).zfill(3)+'.png'
        bpy.ops.render.render(write_still=True)
for o in rig:
    pos,quat,scale=base[o.name];o.location=pos;o.rotation_quaternion=quat;o.scale=scale;o.hide_render=False
scene.render.film_transparent=True
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=28
scene.render.filepath=ROOT+'/scripts/previews/hcm-35t-step-1.png'
bpy.ops.render.render(write_still=True)
print('96 drive-motion frames and full eight-station preview rendered')
