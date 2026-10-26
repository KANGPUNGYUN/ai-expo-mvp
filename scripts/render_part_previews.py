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
