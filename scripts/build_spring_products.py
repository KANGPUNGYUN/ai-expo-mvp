"""HCM-35T / HAM-10T product references, Daara listings 432341 / 432398.
No external services, texture downloads, or scene deletion. Each model owns a new scene.
Geometry units for the spring former and tank are photo-estimated, not surveyed.
Exterior proportions are photo-estimated; these are not manufacturing CAD assets.
"""
import bpy
import math
from mathutils import Vector
ROOT = '/Users/kangpungyun/Desktop/Projects/ai-expo-mvp'
OUT = ROOT + '/public/models'
materials = {}
state = {"objects": [], "parent": None}

def material(name, color, metal=0, rough=.4, alpha=1):
    m=bpy.data.materials.new('ToolingV6_'+name)
    m.diffuse_color=(*color,alpha);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,alpha)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Alpha'].default_value=alpha
    if alpha<1:m.surface_render_method='DITHERED'
    materials[name]=m

material('blue',(.023,.095,.43),.15,.34)
material('plate',(.55,.58,.60),.45,.34)
material('steel',(.59,.64,.67),.88,.34)
material('black',(.018,.022,.030),.38,.37)
material('rubber',(.012,.015,.019),0,.7)
material('lime',(.28,.54,.025),.08,.38)
material('tankgreen',(.035,.14,.075),.2,.4)
material('white',(.72,.74,.70),.18,.4)
material('navy',(.018,.027,.064),.18,.28)
material('brass',(.48,.32,.11),.78,.3)
material('red',(.42,.018,.023),.15,.32)
material('water',(.012,.32,.34),.15,.18,.66)
material('glass',(.57,.76,.73),.05,.12,.14)
material('hose',(.60,.64,.40),.03,.35,.64)
material('screen',(.008,.025,.085),.1,.28)
material('displaytext',(.22,.70,.70),.1,.4)

def start(name):
    scene=bpy.data.scenes.new('FORM_ToolingV6_'+name)
    bpy.context.window.scene=scene
    state["objects"]=[];state["parent"]=None
    return scene

def finish(o,name,mat,step=-1):
    o.name=name
    o.data.materials.append(materials[mat]);o['step']=step
    if state["parent"]:
        # Identity parent; vertices/transforms remain in scene coordinates.
        o.parent=state["parent"]
    state["objects"].append(o)
    return o

def box(name,loc,scale,mat,step=-1,bevel=.005):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('folded edge','BEVEL');m.width=min(bevel,min(scale)*.22);m.segments=3
        bpy.ops.object.modifier_apply(modifier=m.name)
        for poly in o.data.polygons:poly.use_smooth=True
        normal=o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=50
        bpy.ops.object.modifier_apply(modifier=normal.name)
    return finish(o,name,mat,step)

def cyl(name,loc,r,depth,mat,step=-1,axis='Z',vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc)
    o=bpy.context.object
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    if axis=='X':o.rotation_euler[1]=math.pi/2
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return finish(o,name,mat,step)

def sphere(name,loc,r,mat,step=-1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=loc)
    o=bpy.context.object
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,mat,step)

def torus(name,loc,major,minor,mat,axis='Z',step=-1):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=24,minor_segments=6,location=loc)
    o=bpy.context.object
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    if axis=='X':o.rotation_euler[1]=math.pi/2
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,mat,step)

def pipe(name,points,r,mat,step=-1,smooth=True):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=5;c.bevel_depth=r;c.bevel_resolution=1
    s=c.splines.new('BEZIER' if smooth else 'POLY')
    if smooth:
        s.bezier_points.add(len(points)-1)
        for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    else:
        s.points.add(len(points)-1)
        for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.scene.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    return finish(o,name,mat,step)

def bar(name,a,b,width,depth,mat,step=-1):
    mid=(Vector(a)+Vector(b))/2;length=(Vector(b)-Vector(a)).length
    o=box(name,mid,(width,depth,length),mat,step)
    o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler()
    return o

def group(name,step,animation=None,index=0):
    o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o)
    o['step']=step
    if animation:o['animation']=animation;o['index']=index
    state["objects"].append(o);state["parent"]=o
    return o

def bolt(loc,step=-1,axis='Y',r=.018):
    cyl('BoltSeat',loc,r*1.35,.008,'steel',step,axis,12)
    delta=Vector((0,-.007,0) if axis=='Y' else ((-.007,0,0) if axis=='X' else (0,0,.007)))
    cyl('SocketBolt',Vector(loc)+delta,r,.013,'black',step,axis,8)

def label(text,loc,size,mat='white',rotation=(math.pi/2,0,0)):
    c=bpy.data.curves.new('label','FONT');c.body=text;c.size=size;c.extrude=0;c.align_x='CENTER';c.align_y='CENTER'
    o=bpy.data.objects.new('Mark_'+text,c);bpy.context.scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    return finish(o,'Mark_'+text,mat)

def consolidate():
    # One draw call per parent/material/step. Moving assemblies remain independent.
    buckets={}
    for o in list(state["objects"]):
        if o.type!='MESH':continue
        key=(o.parent.name if o.parent else '',o.data.materials[0].name,o.get('step',-1))
        buckets.setdefault(key,[]).append(o)
    result=[o for o in state["objects"] if o.type!='MESH']
    for key,parts in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in parts:o.select_set(True)
        bpy.context.view_layer.objects.active=parts[0]
        bpy.ops.object.join();o=parts[0]
        o.name=(key[0] or 'Structure')+'_'+key[1].replace('ToolingV6_','')+'_'+str(key[2])
        result.append(o)
    state["objects"]=result

def export(name):
    state["parent"]=None
    consolidate()
    bpy.ops.object.select_all(action='DESELECT')
    for o in state["objects"]:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',use_selection=True,export_format='GLB',export_extras=True,use_active_scene=True)
    print(name,'exported meshes',sum(o.type=='MESH' for o in state["objects"]),'nodes',len(state["objects"]))

def studio(name,location,target,scale):
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True
    scene.render.resolution_x=1400;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.world=bpy.data.worlds.new('ReferenceStudio_'+name);scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.74,.78,.84,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
    scene.view_settings.view_transform='AgX'
    bpy.ops.object.camera_add(location=location);camera=bpy.context.object
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=scale;scene.camera=camera
    for loc,power,size in [((-3,-4,6),650,4),((4,-1,4),420,3),((1,4,5),850,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size
        o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.image_settings.file_format='PNG';scene.render.filepath=ROOT+'/scripts/previews/'+name+'-v6.png'
    bpy.ops.render.render(write_still=True)

# Helpers for the clipped front plate, stationary servo housings, and consoles.
material('brightblue',(.018,.22,.70),.26,.30)
material('panel',(.68,.72,.73),.55,.29)
material('yellow',(.85,.56,.015),.05,.38)
material('carbide',(.16,.19,.22),.83,.22)

def prism(name,outline,front,back,mat,step=-1):
    verts=[(x,y,z) for y in [front,back] for x,z in outline];n=len(outline)
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(o)
    return finish(o,name,mat,step)

def controller(x,z,compact=False):
    # Right hand console observed in both catalogue images. UI is illustrative.
    box('ConsoleArm',(x-.12,.03,z-.48),(.68,.24,.18),'brightblue')
    box('ConsolePedestal',(x,-.14,z-.36),(.25,.22,.54),'brightblue')
    width=.65 if compact else .56
    box('ControlPanel',(x,-.35,z),(width,.23,.49),'panel')
    box('MonitorFrame',(x,-.32,z+.54),(width,.12,.59),'white')
    box('MonitorGlass',(x,-.388,z+.55),(width-.08,.018,.49),'screen')
    # Separate areas and rows resemble the visible legacy CNC screen, not live data.
    for i in range(7):
        box('ScreenTable',(x+.13,-.400,z+.38+i*.052),(.17,.003,.009),'displaytext',bevel=0)
    for i in range(4):
        for j in range(3):box('ScreenDiagram',(x-.17+j*.07,-.401,z+.43+i*.065),(.038,.003,.022),'lime',bevel=0)
    box('KeyboardShelf',(x,-.50,z+.27),(width,.41,.04),'panel')
    for row in range(4):
        for col in range(10):box('KeyboardKey',(x-width*.43+col*width*.095,-.64+row*.055,z+.299),(.038,.032,.011),'black',bevel=0)
    for row in range(3):
        for col in range(7):
            box('ControlKey',(x-.11+col*.061,-.475,z+.1-row*.085),(.038,.014,.04),'yellow' if row==0 and col>3 else 'white')
    cyl('JogDial',(x-.24,-.49,z-.08),.065,.036,'steel',axis='Y')
    cyl('JogInset',(x-.24,-.514,z-.08),.042,.015,'black',axis='Y')
    cyl('EmergencyStopBase',(x+width*.35,-.482,z-.15),.053,.026,'yellow',axis='Y')
    cyl('EmergencyStop',(x+width*.35,-.51,z-.15),.037,.05,'red',axis='Y')
    for i in range(3):cyl('PilotButton',(x-.06+i*.075,-.49,z-.15),.018,.022,'black' if i<2 else 'red',axis='Y',vertices=16)

def lathe(name,loc,profile,mat,step=-1,axis='Z',segments=32):
    # Closed radial profile: actual recesses and bores, not black discs on a solid face.
    vertices=[(r*math.cos(i*math.tau/segments),r*math.sin(i*math.tau/segments),z) for r,z in profile for i in range(segments)]
    faces=[]
    for row in range(len(profile)):
        for i in range(segments):
            a=row*segments+i;b=row*segments+(i+1)%segments
            c=((row+1)%len(profile))*segments+(i+1)%segments;d=((row+1)%len(profile))*segments+i
            faces.append((a,b,c,d))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(o);o.location=loc
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    elif axis=='X':o.rotation_euler[1]=math.pi/2
    # Flat annular shoulders, smooth only the turned cylindrical surfaces.
    for row in range(len(profile)):
        smooth=abs(profile[row][1]-profile[(row+1)%len(profile)][1])>.00001
        for face in mesh.polygons[row*segments:(row+1)*segments]:face.use_smooth=smooth
    return finish(o,name,mat,step)

def bolt(loc,step=-1,axis='Y',r=.012):
    # Socket-cap screw: washer annulus, cylindrical head and a genuinely recessed hex socket.
    lathe('Washer',loc,[(r*1.28,-.002),(r*1.28,.001),(r*.58,.001),(r*.58,-.002)],'steel',step,axis,16)
    h=r*.85;verts=[];n=24
    for radius,height,hexagon in [(r,.001,False),(r,h*.85,False),(r*.90,h,False),(r*.46,h,True),(r*.46,h*.38,True)]:
        for i in range(n):
            a=i*math.tau/n
            rr=radius*math.cos(math.pi/6)/math.cos((a%(math.pi/3))-math.pi/6) if hexagon else radius
            verts.append((rr*math.cos(a),rr*math.sin(a),height))
    # Mark the inner rings as hexagonal with four vertices on every hex face.
    for row in [3,4]:
        for i in range(n):
            a=i*math.tau/n;rr=r*.46*math.cos(math.pi/6)/math.cos((a%(math.pi/3))-math.pi/6)
            verts[row*n+i]=(rr*math.cos(a),rr*math.sin(a),h if row==3 else h*.38)
    faces=[(row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i) for row in range(4) for i in range(n)]
    faces.append(tuple(range(4*n,5*n)))
    mesh=bpy.data.meshes.new('RecessedSocket');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('SocketCapScrew',mesh);bpy.context.scene.collection.objects.link(o);o.location=loc
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    elif axis=='X':o.rotation_euler[1]=math.pi/2
    for poly in mesh.polygons:poly.use_smooth=poly.index<n
    finish(o,'SocketCapScrew','carbide',step)

def child_group(name,part,parent,step):
    g=group(name,step);g.parent=parent;g['part']=part
    return g

def knurl(name,loc,r,depth,step=1,axis='X'):
    cyl(name,loc,r,depth,'steel',step,axis,32)
    for k in range(24):
        a=k*math.tau/24
        p=Vector(loc)+ (Vector((0,r*math.cos(a),r*math.sin(a))) if axis=='X' else Vector((r*math.cos(a),r*math.sin(a),0)))
        cyl('GripFlute',p,.0015,depth*.8,'carbide',step,axis,6)

def center_hub(z):
    g=group('CentralGuide',0);g['part']='quill'
    lathe('GuideMountFlange',(0,-.58,z),[(.16,-.02),(.16,.012),(.15,.02),(.052,.02),(.052,-.02)],'carbide',0,'Y',48)
    lathe('TurnedQuillBody',(0,-.65,z),[(.112,-.035),(.112,-.007),(.087,0),(.063,.015),(.063,.09),(.058,.098),(.014,.098),(.014,-.035)],'steel',0,'Y',48)
    for i in range(4):
        a=math.pi/4+i*math.pi/2;bolt((.134*math.cos(a),-.603,z+.134*math.sin(a)),0,r=.013)
    lathe('ColletNut',(0,-.754,z),[(.073,-.015),(.073,.014),(.066,.021),(.037,.021),(.037,-.015)],'carbide',0,'Y',48)
    for k in range(6):
        a=k*math.tau/6
        o=box('NutWrenchSlot',(.069*math.cos(a),-.76,z+.069*math.sin(a)),(.012,.025,.008),'black',0,.001);o.rotation_euler[1]=-a
    lathe('SplitCollet',(0,-.794,z),[(.035,-.025),(.035,.034),(.029,.042),(.009,.042),(.009,-.025)],'steel',0,'Y',48)
    # Slit grooves are narrow dark channels between collet jaws.
    for k in range(4):
        a=k*math.pi/2
        o=box('ColletSlit',(.033*math.cos(a),-.807,z+.033*math.sin(a)),(.004,.052,.006),'black',0,.0005);o.rotation_euler[1]=-a
    lathe('GuideInsertBore',(0,-.844,z),[(.025,-.009),(.025,.008),(.021,.012),(.007,.012),(.007,-.009)],'carbide',0,'Y',32)
    for xx in [-.044,.044]:
        box('InsertRetainer',(xx,-.805,z),(.025,.045,.047),'steel',0,.002)
        bolt((xx,-.83,z),0,r=.006)
    state['parent']=None
    g=group('WireLead',0,'wire-lead');g.location=(0,-.856,z);g['part']='wire'
    pipe('StraightWire',[(0,0,0),(0,-.084,0)],.006,'steel',0,False)
    state['parent']=None
    g=group('CounterKnife',2);g['part']='anvil'
    box('AnvilMount',(-.105,-.765,z+.055),(.07,.09,.105),'carbide',2,.004)
    box('AnvilAdjustmentSlot',(-.105,-.812,z+.055),(.014,.004,.064),'black',2,.002)
    for dz in [.027,.081]:bolt((-.105,-.816,z+dz),2,r=.009)
    box('AnvilArm',(-.048,-.85,z+.052),(.13,.06,.04),'steel',2,.003)
    prism('FixedCarbideSupport',[(-.021,z+.006),(.029,z+.006),(.033,z+.016),(.033,z+.042),(-.025,z+.042)],-.929,-.906,'carbide',2)
    box('SupportGroundFace',(.004,-.931,z+.010),(.048,.003,.008),'steel',2,.0005)
    bolt((-.014,-.934,z+.031),2,r=.005)
    knurl('AnvilAdjuster',(-.146,-.765,z+.055),.012,.026,2)
    state['parent']=None

def radial_slide(i,angle,z,reach=.90,servo=True):
    a=angle
    def pt(r,y=-.59,s=0):return (r*math.cos(a)-s*math.sin(a),y,z+r*math.sin(a)+s*math.cos(a))
    def rb(name,r,y,s,scale,mat,step=1,bevel=.002):
        o=box(name,pt(r,y,s),scale,mat,step,bevel);o.rotation_euler[1]=-a;return o
    fixed=group('LinearGuide_'+str(i),1);fixed['part']='guideway' if i==0 else 'rails'
    rb('MachinedBase',(reach+.20)/2,-.574,0,(reach-.20,.09,.17),'carbide')
    # Twin exposed ground tracks with countersunk mounting rows and polished edges.
    for side in [-.059,.059]:
        rb('GroundRail',(reach+.20)/2,-.64,side,(reach-.20,.04,.033),'steel')
        rb('RailRelief',(reach+.20)/2,-.662,side+.011,(reach-.22,.006,.005),'black',bevel=.0005)
        for r in [.25,.43,.61,.79]:
            if r<reach:bolt(pt(r,-.665,side),1,r=.007)
    if not servo:
        rb('LeadScrewChannel',(reach+.20)/2,-.625,0,(reach-.20,.018,.028),'black')
        bar('DriveShaft',pt(.22,-.659),pt(reach,-.659),.018,.018,'steel',1)
        # Visible representative helical drive shaft, between guide tracks.
        points=[]
        for k in range(161):
            u=k/160;theta=u*math.tau*20
            q=Vector(pt(.22+u*(reach-.22),-.66))
            q+=Vector((-.011*math.sin(a)*math.cos(theta),.011*math.sin(theta),.011*math.cos(a)*math.cos(theta)))
            points.append(q)
        pipe('LeadScrewThread',points,.0025,'steel',1,False)
    for r in [.205,reach]:rb('EndStop',r,-.676,0,(.025,.035,.11),'carbide')
    for k in range(16):
        r=.25+k*.027
        if r<reach:rb('TravelScaleTick',r,-.625,.092,(.0018,.002,.013 if k%5==0 else .007),'black',bevel=0)
    state['parent']=None
    motor=group('ServoDrive_'+str(i),1);motor['part']='drive' if i==0 else 'drives'
    if servo:
        # Fixed bearing body behind an independently rotating faceplate.
        lathe('StationaryBearing',pt(reach+.08,-.568),[(.147,-.02),(.147,.018),(.137,.026),(.033,.026),(.033,-.02)],'carbide',1,'Y',48)
        state['parent']=None
        drive=group('ServoCrank_'+str(i),1,'servo-crank',i)
        drive.location=pt(reach+.08,-.638);drive['part']='drive' if i==0 else 'drives';drive['angle']=a;drive['reach']=reach
        eccentric=.059 if i==6 else .0225
        lathe('RotatingFaceplate',(0,0,0),[(.138,-.012),(.138,.014),(.131,.020),(.023,.020),(.023,-.012)],'steel',1,'Y',48)
        lathe('CenterBearing',(0,-.022,0),[(.026,-.008),(.026,.012),(.013,.012),(.013,-.008)],'carbide',1,'Y',24)
        # Off-center holes and a witness mark make rotation visible, even at low speed.
        for k in range(7):
            t=k*math.tau/7
            lathe('FaceplateRecess',(.104*math.cos(t),-.022,.104*math.sin(t)),[(.010,-.002),(.010,.002),(.006,.002),(.006,-.002)],'carbide',1,'Y',16)
        mark=box('RotationWitness',(.119, -.024, 0),(.020,.003,.010),'yellow',1,.001)
        cyl('EccentricPin',(eccentric*math.cos(a),-.050,eccentric*math.sin(a)),.017,.070,'steel',1,'Y',24)
        bolt((eccentric*math.cos(a),-.094,eccentric*math.sin(a)),1,r=.011)
        state['parent']=None
        length=reach+.08+eccentric-.50
        link=group('ConnectingRod_'+str(i),1,'connecting-rod',i)
        link.location=pt(.50,-.713);link.rotation_euler[1]=math.pi/2-a
        link['part']='drive' if i==0 else 'drives';link['angle']=a;link['reach']=reach;link['link_length']=length
        for tip in [0,length]:
            lathe('LinkEye',(0,0,tip),[(.031,-.014),(.031,.014),(.017,.014),(.017,-.014)],'carbide',1,'Y',24)
            lathe('LinkBushing',(0,-.016,tip),[(.018,-.004),(.018,.008),(.010,.008),(.010,-.004)],'steel',1,'Y',24)
        box('ConnectingLinkWeb',(0,0,length/2),(.044,.025,length-.047),'carbide',1,.004)
        box('LinkMachinedInset',(0,-.015,length/2),(.018,.003,length-.09),'steel',1,.002)
        bolt((0,-.024,0),1,r=.010)
        state['parent']=motor
    else:
        rb('ServoBody',reach+.06,-.55,0,(.22,.16,.16),'carbide')
        for side in [-.055,.055]:
            for r in [reach-.02,reach+.13]:bolt(pt(r,-.635,side),1,r=.008)
    cyl('ConnectorGland',pt(reach+.08,-.51,.11),.016,.055,'brass',1,'Y',12)
    state['parent']=None
    is_cutter=abs(a-math.pi*1.5)<.01
    g=group(('CuttingSlide_' if is_cutter else 'ServoSlide_')+str(i),2 if is_cutter else 1,'cutter' if is_cutter else 'servo-slide',i);g['angle']=a;g['part']='cutter' if is_cutter else ('forming' if i==0 else 'slides');g['rotary_drive']=servo;g['reach']=reach
    moving=child_group('Carriage_'+str(i),'carriage' if i==0 else ('cutter-carriage' if is_cutter else 'carriages'),g,1)
    rb('Saddle',.39,-.708,0,(.22,.09,.18),'steel')
    for r in [.275,.505]:
        rb('CarriageEndSeal',r,-.704,0,(.012,.085,.178),'carbide')
        for side in [-.069,.069]:bolt(pt(r,-.75,side),1,r=.005)
    rb('SaddleTopPlate',.39,-.76,0,(.19,.014,.15),'carbide')
    for r in [.32,.46]:
        for side in [-.05,.05]:bolt(pt(r,-.772,side),1,r=.009)
    cyl('GreaseNipple',pt(.48,-.78,.075),.006,.023,'brass',1,'Y',8)
    state['parent']=g
    rb('ToolHolderBlock',.28,-.803,0,(.12,.11,.104),'steel',2 if is_cutter else 1)
    rb('ToolSlot',.28,-.86,0,(.106,.004,.048),'black',bevel=.001)
    for side in [-.037,.037]:bolt(pt(.29,-.866,side),1,r=.009)
    if is_cutter:
        box('BladeHolder',(0,-.86,z-.21),(.106,.10,.18),'carbide',2,.004)
        for xx in [-.048,.048]:box('BladeGuideJaw',(xx,-.92,z-.18),(.014,.035,.13),'steel',2,.002)
        box('BladeSeatingRecess',(0,-.914,z-.17),(.077,.003,.14),'black',2,.001)
        for xx in [-.03,.03]:bolt((xx,-.931,z-.232),2,r=.009)
        # Replaceable blade is a child of the moving cutter, preserving the stroke.
        blade=child_group('ReplaceableCuttingBlade','blade',g,2)
        prism('CarbideBlade',[(-.034,z-.216),(.034,z-.216),(.034,z-.126),(.024,z-.10),(-.024,z-.10),(-.034,z-.126)],-.943,-.923,'carbide',2)
        prism('HonedCuttingBevel',[(-.024,z-.10),(.024,z-.10),(.032,z-.122),(-.032,z-.122)],-.947,-.943,'steel',2)
        for xx in [-.017,.017]:bolt((xx,-.945,z-.184),2,r=.006)
        box('BladeSeatSeam',(0,-.945,z-.205),(.053,.001,.002),'black',2,0)
    elif i==0:
        rb('ToolShank',.16,-.884,0,(.22,.050,.040),'steel')
        for r in [.15,.22]:bolt(pt(r,-.912),1,r=.007)
        box('ReplaceableTipSeat',(.062,-.925,z-.018),(.067,.04,.045),'carbide',1,.002)
        prism('CoilingContactTip',[(.026,z-.038),(.071,z-.038),(.071,z-.018),(.034,z-.007)],-.951,-.931,'steel',1)
        lathe('CoilingRoller',(.078,-.951,z-.025),[(.020,-.005),(.020,.008),(.016,.012),(.006,.012),(.006,-.005)],'steel',1,'Y')
        bolt((.078,-.966,z-.025),1,r=.005)
        knurl('ToolAdjustment',(.244,-.88,z+.056),.015,.035)
    else:
        rb('ToolShank',.16,-.82,0,(.20,.04,.032),'steel')
        for r in [.19,.25]:bolt(pt(r,-.844),1,r=.007)
        rb('ContactInsert',.061,-.833,0,(.036,.03,.021 if i%2 else .035),'carbide')
    state['parent']=None

def output_and_feed(z,rollers):
    g=group('RearFeedFrame',0);g['part']='feed'
    box('FeedBearingBlock',(0,.65,z-.085),(.38,.61,.055),'steel',0)
    for yy in [.38,.86]:
        for xx in [-.16,.16]:bolt((xx,yy,z-.054),0,'Z',.009)
    for yy in [.45,.63,.81][:rollers//2]:
        box('BearingBridge',(0,yy,z-.048),(.28,.10,.025),'carbide',0,.003)
    for yy in [.35,.93]:
        lathe('EntryWireBush',(0,yy,z),[(.022,-.028),(.022,.028),(.007,.028),(.007,-.028)],'carbide',0,'Y',24)
    pipe('RearStraightWire',[(0,1.02,z),(0,-.85,z)],.006,'steel',0,False)
    state['parent']=None
    for i in range(rollers):
        g=group('FeedRoller_'+str(i),0,'feed',i);g.location=((-.09 if i%2==0 else .09),.45+(i//2)*.18,z);g['part']='feed'
        lathe('GroovedFeedRoller',(0,0,0),[(.083,-.036),(.087,-.03),(.087,-.010),(.080,-.003),(.080,.003),(.087,.010),(.087,.030),(.083,.036),(.021,.036),(.021,-.036)],'steel',0,'Z',48)
        cyl('BearingHub',(0,0,.044),.026,.022,'black',0,'Z')
        bolt((0,0,.055),0,'Z',.012)
        g['axis']=[0,1,0]
        box('RollerMark',(0,.06,.038),(.014,.025,.006),'black',0)
    state['parent']=None
    # Eight full wire turns, revealed progressively without thinning the wire.
    for turn in range(8):
        coil=group('CoilTurn_'+str(turn),1,'coil-turn',turn);coil.location=(0,-.94,z);coil['part']='coil';coil['drop_distance']=z-(.94 if z>1.9 else 1.21)
        points=[]
        for n in range(49):
            a=(turn+n/48)*math.tau
            points.append((.041+.041*math.cos(a+math.pi),-(turn+n/48)*.014,.041*math.sin(a+math.pi)))
        pipe('FormedWireTurn',points,.006,'steel',1,False)
    state['parent']=None

def legs(w,depth):
    for x in [-w/2+.09,w/2-.09]:
        for y in [-.42,depth-.1]:
            box('LevelFoot',(x,y,.07),(.25,.24,.08),'brightblue')
            cyl('RubberPad',(x,y,.025),.08,.05,'rubber')

def lamp(x,z):
    bar('TaskLampArm',(x,-.30,z),(x+.19,-.30,z+.36),.038,.038,'white')
    bar('TaskLampArm',(x+.19,-.30,z+.36),(x-.12,-.49,z+.22),.038,.038,'white')
    cyl('LampPivot',(x+.19,-.30,z+.36),.03,.06,'steel',axis='Y')
    o=box('TaskLight',(x-.12,-.53,z+.16),(.14,.12,.18),'white');o.rotation_euler[1]=-.35

def stage_previews(name,h):
    scene=bpy.context.scene
    camera=scene.camera
    scene.cycles.samples=28
    scene.render.resolution_x=1200;scene.render.resolution_y=900
    for step in range(4):
        for o in state['objects']:o.hide_render=False
        for o in state['objects']:
            owner=o
            while owner and not owner.get('part'):owner=owner.parent
            part=owner.get('part') if owner else None
            if part in ['blade','cutter-carriage']:part='cutter'
            if step==0:
                o.hide_render=o.type=='MESH' and part not in ['feed','quill','wire']
            elif step==2:
                o.hide_render=o.type=='MESH' and part not in ['cutter','anvil','quill','wire','coil']
            if o.get('animation')=='cutter' and step==2:o.location.z+=.10
            if o.get('animation')=='coil-turn':
                if step==0:o.hide_render=True
                if step==3:o.location.z-=.45
        if step==0:loc=(.85,2.3,h+1.2);target=(0,.25,h);scale=1.8
        elif step==1:loc=(.20,-4.8,h+.22);target=(0,-.65,h);scale=3.2 if name=='hcm-35t' else 1.05
        elif step==2:loc=(.64,-3.6,h+.30);target=(0,-.84,h-.04);scale=.78
        else:loc=(.45,-4,h+.2);target=(0,-.6,h-.5);scale=2.0
        camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
        scene.render.filepath=ROOT+'/scripts/previews/'+name+'-step-'+str(step)+'.png'
        bpy.ops.render.render(write_still=True)
        for o in state['objects']:
            if o.get('animation')=='cutter' and step==2:o.location.z-=.10
            if o.get('animation')=='coil-turn' and step==3:o.location.z+=.45
    for o in state['objects']:o.hide_render=False

def part_previews(name):
    scene=bpy.context.scene;camera=scene.camera
    scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=32
    ids=['feed','quill','guideway','carriage','forming','cutter','blade','anvil','drive','head' if name=='ham-10t' else 'spinner']
    for part in ids:
        selected=[]
        for o in state['objects']:
            owner=o;matches=False
            while owner:
                if owner.get('part')==part:matches=True
                owner=owner.parent
            o.hide_render=o.type=='MESH' and not matches
            if o.type=='MESH' and matches:selected.append(o)
        bpy.context.view_layer.update()
        coords=[o.matrix_world@Vector(corner) for o in selected for corner in o.bound_box]
        low=Vector(tuple(min(v[k] for v in coords) for k in range(3)));high=Vector(tuple(max(v[k] for v in coords) for k in range(3)))
        target=(low+high)/2;extent=(high-low).length
        direction=Vector((1.5,2.8,2.6) if part=='feed' else (1.5,-3.5,1.7)).normalized()
        camera.location=target+direction*max(2,extent*3)
        camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
        inv=camera.rotation_euler.to_matrix().transposed()
        projected=[inv@(v-target) for v in coords]
        width=max(v.x for v in projected)-min(v.x for v in projected)
        height=max(v.y for v in projected)-min(v.y for v in projected)
        camera.data.ortho_scale=max(width,height*4/3)*1.25
        scene.render.filepath=ROOT+'/scripts/previews/'+name+'-part-'+part+'.png'
        bpy.ops.render.render(write_still=True)
    for o in state['objects']:o.hide_render=False

# HCM-35T: clipped-shoulder plate, eight independent slides, two spinner attachments.
start('hcm-35t')
box('BaseCabinet',(0,.20,.46),(2.35,1.72,.78),'brightblue',bevel=.025)
outline=[(-1.13,.85),(1.13,.85),(1.13,2.68),(.63,3.18),(-.63,3.18),(-1.13,2.68)]
prism('UpperCabinet',outline,-.40,1.02,'brightblue')
prism('ClippedWorkPlate',[(x*.985,z) for x,z in outline],-.49,-.405,'panel')
box('BaseFrontDoor',(0,-.672,.44),(2.17,.025,.65),'brightblue')
legs(2.35,1.02)
g=group('OutputTrayAssembly',3);g['part']='tray'
box('FrontTray',(0,-.66,.86),(2.4,.45,.035),'steel',3)
state['parent']=None
box('TrayEdge',(0,-.89,.87),(2.45,.035,.06),'brightblue',3)
for i in range(45):box('TrayGrille',(-1.10+i*.05,-.65,.883),(.009,.30,.002),'black',3,0)
for x in [-.40,.40]:torus('LiftingEye',(x,.0,3.23),.075,.02,'brass','Y')
for x in [-1.02,1.02]:
    for z in [1.03,1.38,1.73,2.08,2.43]:bolt((x,-.505,z),r=.012)
for x in [-.85,-.65,-.45,.45,.65,.85]:
    for z in [1.01,1.09,2.65,2.73]:cyl('FixtureHole',(x,-.50,z),.012,.005,'black',axis='Y',vertices=10)
center_hub(1.96)
for i in range(8):radial_slide(i,i*math.pi/4,1.96,.86,True)
# Diagonal spinner attachments are visible in the HCM catalogue image and close-up videos.
for i,a in enumerate([math.pi*1.25,math.pi*1.75]):
    def p(r,y=-.91):return (r*math.cos(a),y,1.96+r*math.sin(a))
    bar('SpinnerMotor',p(.70),p(.45),.16,.17,'black',1)
    bar('SpinnerHead',p(.45),p(.28),.13,.14,'steel',1)
    for k in range(6):
        bar('MotorCoolingFin',p(.48+k*.032,-1.004),p(.48+k*.032,-1.015),.165,.012,'carbide',1)
    for r in [.31,.41]:bolt(p(r,-1.00),1,r=.012)
    g=group('Spinner_'+str(i),1,'spinner',i);g.location=p(.24);g['axis']=[math.cos(a),math.sin(a),0];g['part']='spinner'
    bar('SpinnerShaft',(0,0,0),(-.12*math.cos(a),0,-.12*math.sin(a)),.03,.03,'steel',1)
    collet=lathe('SpinnerCollet',(0,0,0),[(.042,-.025),(.042,.025),(.033,.040),(.015,.040),(.015,-.025)],'steel',1,'Z',32)
    collet.rotation_euler=Vector((-math.cos(a),0,-math.sin(a))).to_track_quat('Z','Y').to_euler()
    state['parent']=None
    pipe('SpinnerCable',[p(.71),p(.90,-.96),(p(.90)[0]*1.1,-.8,.14)],.018,'rubber')
output_and_feed(1.96,6)
controller(1.46,1.63)
box('VentFrame',(.85,-.697,.37),(.27,.025,.37),'white')
for z in range(11):box('VentSlot',(.85,-.715,.23+z*.025),(.21,.005,.008),'black',bevel=0)
label('HERDON',(.78,-.705,.68),.055,'white')
lamp(-.83,2.88)
export('hcm-35t')
studio('hcm-35t',(4.3,-8.5,4.1),(.12,0,1.65),4.7)
stage_previews('hcm-35t',1.96)
part_previews('hcm-35t')

# HAM-10T: enclosed slim body, raised perforated hood and independent upper tool changer.
start('ham-10t')
box('LowerCabinet',(0,.12,.60),(1.68,1.40,1.05),'brightblue',bevel=.018)
box('FrontDoor',(0,-.591,.62),(1.55,.024,.94),'brightblue')
legs(1.68,.80)
box('RearEnclosure',(0,.60,2.02),(1.66,.42,1.8),'brightblue')
for x in [-.83,.83]:box('EnclosurePillar',(x,-.06,2.0),(.09,1.15,1.84),'brightblue')
box('EnclosureRoof',(0,.10,2.93),(1.75,1.4,.07),'brightblue')
box('WorkBed',(0,-.38,1.78),(1.50,.14,1.25),'panel')
box('WorkBedSeam',(0,-.46,1.77),(1.5,.005,.006),'black')
for x in [-.69,.69]:
    for z in [1.2,1.34,1.48,1.93,2.1,2.24]:bolt((x,-.465,z),r=.013)
g=group('OutputTrayAssembly',3);g['part']='tray'
box('CatchTray',(0,-.63,1.13),(1.65,.48,.05),'steel',3)
box('CatchTrayLip',(0,-.88,1.15),(1.79,.04,.08),'brightblue',3)
state['parent']=None
center_hub(1.82)
for i,a in enumerate([0,math.pi,math.pi*1.25,math.pi*1.5,math.pi*1.75]):radial_slide(i,a,1.82,.61,False)
# XYZ carriage occupies the 12 o'clock position in place of the upper slide.
for x in [-.36,.36]:
    box('VerticalGuide',(x,-.49,2.48),(.065,.12,.66),'steel',2)
    for z in [2.19,2.37,2.58,2.76]:bolt((x,-.56,z),2,r=.014)
box('AxisMotor',(0,-.28,2.84),(.24,.27,.18),'white',2)
cyl('ZLeadscrew',(0,-.49,2.51),.026,.54,'steel',2)
head=group('ToolChangerXYZ',2,'toolhead')
head.location=(0,-.66,2.42);head['part']='head'
box('CrossSlide',(0,0,0),(.65,.21,.28),'steel',2)
for z in [-.08,.08]:box('CrossGuide',(0,-.118,z),(.59,.025,.025),'black',2)
for x in [-.24,.24]:
    for z in [-.09,.09]:bolt((x,-.14,z),2,r=.018)
cyl('ToolTurret',(-.16,-.20,-.03),.17,.09,'steel',2,'Y',32)
for k in range(6):
    a=k*math.pi/3
    bar('TurretTool',(-.16+.14*math.cos(a),-.22,-.03+.14*math.sin(a)),(-.16+.25*math.cos(a),-.22,-.03+.25*math.sin(a)),.036,.036,'steel',2)
cyl('VerticalSpinner',(.10,-.16,-.23),.074,.22,'black',2)
lathe('SpinnerChuck',(.10,-.16,-.37),[(.042,-.038),(.046,-.026),(.046,.024),(.037,.032),(.016,.032),(.016,-.038)],'steel',2,'Z',48)
for k in range(6):
    a=k*math.tau/6
    o=box('ChuckGripSlot',(.10+.044*math.cos(a),-.16+.044*math.sin(a),-.37),(.005,.007,.034),'carbide',2,.001);o.rotation_euler[2]=a
cyl('DownwardTool',(.10,-.16,-.45),.014,.11,'steel',2)
state['parent']=None
output_and_feed(1.82,4)
# Raised hood: light frame with 3 x 3 inspection openings. Static presentation pose.
hood=group('RaisedHood',-1)
hood.location=(0,-.18,2.97);hood.rotation_euler[0]=math.radians(-38)
for x in [-.86,.86]:box('HoodSide',(x,-.64,0),(.065,1.35,.09),'white')
for y in [-1.30,.02]:box('HoodCross',(0,y,0),(1.77,.07,.09),'white')
for x in [-.28,.28]:box('HoodGrid',(x,-.70,0),(.052,1.15,.05),'white')
for y in [-.40,-.79]:box('HoodGrid',(0,y,0),(1.65,.05,.05),'white')
box('HoodWindow',(0,-.65,.008),(1.65,1.25,.014),'glass')
state['parent']=None
for x in [-.78,.78]:
    bar('HoodGasStrut',(x,-.38,2.34),(x,-.94,3.46),.028,.028,'black')
controller(1.23,1.70,True)
box('ControlSupport',(1.12,-.10,1.24),(.60,.37,.21),'brightblue')
pipe('AirLine',[(1.0,-.17,1.22),(1.07,-.31,1.05),(1.00,-.32,.90)],.014,'hose')
label('HERDON',(.58,-.63,1.02),.045,'white')
lamp(-.61,2.55)
export('ham-10t')
studio('ham-10t',(4.4,-8.7,4.1),(.12,0,1.85),4.8)
stage_previews('ham-10t',1.82)
part_previews('ham-10t')
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/scripts/spring-products.blend')
print('HCM-35T and HAM-10T product models exported')
