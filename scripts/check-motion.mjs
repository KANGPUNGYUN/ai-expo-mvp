import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three-stdlib';
import { partDetail } from '../src/part-details.ts';
const decoder=typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder;
await decoder.ready;
import { createModelRig, applyModelPose } from '../src/model-motion.ts';
import { cameraPose } from '../src/camera-pose.ts';

for (const assetId of ['hcm-35t','ham-10t']) {
  const buffer=readFileSync(new URL(`../public/models/${assetId}.glb`,import.meta.url));
  const asset=await new GLTFLoader().setMeshoptDecoder(decoder).parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
  const root=asset.scene;
  const rig=createModelRig(root);
  const base=new THREE.Box3().setFromObject(root,true);
  const size=base.getSize(new THREE.Vector3());
  assert(size.x>2&&size.x<4,'Model horizontal bounds must not include stale scenes');
  assert(size.y>1.5&&size.y<4,'Model vertical bounds');
  {
    assert.equal(rig.filter(p=>p.animation==='servo-slide').length,assetId==='hcm-35t'?7:4);
    assert.equal(rig.filter(p=>p.animation==='toolhead').length,assetId==='ham-10t'?1:0);
    assert.equal(rig.filter(p=>p.animation==='feed').length,assetId==='hcm-35t'?6:4);
    assert.equal(rig.filter(p=>p.animation==='coil-turn').length,8);
    applyModelPose(rig,1,.25,false);
    const early=rig.filter(p=>p.animation==='coil-turn'&&p.node.visible).length;
    applyModelPose(rig,1,5,false);
    assert(rig.filter(p=>p.animation==='coil-turn'&&p.node.visible).length>early,'Wire turns accumulate during forming');
    for(const p of rig.filter(p=>p.animation==='coil-turn')) assert(p.node.scale.equals(p.scale),'Wire gauge is not scaled during forming');
    applyModelPose(rig,1,2.2,false);
    assert(rig.some(p=>p.animation==='servo-slide'&&p.node.position.distanceTo(p.position)>.01),'Servo tools advance');
    for(const p of rig.filter(p=>p.animation==='servo-slide')) assert(p.node.quaternion.equals(p.quaternion),'Linear slides must not orbit like cams');
    applyModelPose(rig,3,5.8,false);
    for(const coil of rig.filter(p=>p.animation==='coil-turn')) assert(Math.abs(coil.node.position.y-(assetId==='hcm-35t'?.94:1.21))<1e-5,'Coil lands above the product-specific tray');
    const cutter=rig.find(p=>p.animation==='cutter');
    assert(cutter,'Dedicated cutter assembly exists');
    applyModelPose(rig,2,3,false);
    assert(Math.abs(cutter.node.position.y-cutter.position.y-.118)<1e-6,'Blade reaches cutting position');
    assert(rig.filter(p=>p.animation==='servo-slide').every(p=>p.node.position.equals(p.position)),'Other tools stay still during cutting');
    applyModelPose(rig,2,5.8,false);
    assert(cutter.node.position.equals(cutter.position),'Blade fully retracts');
    applyModelPose(rig,0,3,false);
    const rollers=rig.filter(p=>p.animation==='feed');
    assert(rollers.every(p=>p.axis.equals(new THREE.Vector3(0,1,0))),'Feed axes align with wire path');
    const a=new THREE.Quaternion().copy(rollers[0].quaternion).invert().multiply(rollers[0].node.quaternion);
    const b=new THREE.Quaternion().copy(rollers[1].quaternion).invert().multiply(rollers[1].node.quaternion);
    assert(Math.abs(a.clone().multiply(b).w)>1-1e-6,'Opposed feed rollers counter-rotate');
    const wire=rig.find(p=>p.animation==='wire-lead');
    assert(wire,'Visible wire lead exists');
    applyModelPose(rig,0,.1,false); const short=wire.node.scale.z;
    applyModelPose(rig,0,5,false); assert(wire.node.scale.z>short,'Wire advances through guide');
    for(const part of ['feed','quill','wire','guideway','carriage','drive','forming','cutter','blade','anvil','coil','tray']) {
      let found=false;root.traverse(o=>{if(o.userData.part===part)found=true;});
      assert(found,`Semantic selection exists: ${part}`);
    }
    let blade;root.traverse(o=>{if(o.userData.part==='blade')blade=o;});
    assert(blade,'Replaceable blade is independently addressable');
    let owner=blade.parent;
    while(owner && owner.userData.animation!=='cutter')owner=owner.parent;
    assert(owner,'Blade inherits the cutter stroke');
    for(const id of ['feed','quill','guideway','carriage','forming','cutter','blade','anvil','drive',assetId==='ham-10t'?'head':'spinner']) {
      const detail=partDetail(assetId,id);assert(detail,'Part camera and explanatory features exist');
      const pose=cameraPose('focus',1.3,2,assetId,id);
      assert.deepEqual(pose.target,detail.target,'Individual part gets its own camera target');
    }
    for(const aspect of [1.5,335/450]) for(const step of [0,1,2,3]) {
      const focus=cameraPose('focus',aspect,step,assetId);
      const camera=new THREE.PerspectiveCamera(35,aspect,.1,50);
      camera.position.set(...focus.position);camera.lookAt(...focus.target);camera.updateMatrixWorld();
      const target=new THREE.Vector3(...focus.target).project(camera);
      assert(Math.abs(target.x)<1e-6&&Math.abs(target.y)<1e-6,'Focused stage target centered');
    }

  }
  for(const step of [0,1,2,3]) {
    applyModelPose(rig,step,1.125,true);root.updateMatrixWorld(true);
    const pose=rig.map(p=>p.node.matrixWorld.toArray());
    applyModelPose(rig,step,1.125,true);root.updateMatrixWorld(true);
    assert.deepEqual(rig.map(p=>p.node.matrixWorld.toArray()),pose,'Applying same paused pose must not accumulate transform drift');
    const box=new THREE.Box3().setFromObject(root,true);
    assert(box.min.toArray().every(Number.isFinite)&&box.max.toArray().every(Number.isFinite),'Finite animated bounds');
  }
  applyModelPose(rig,0,0,false);root.updateMatrixWorld(true);
  for(const p of rig) {
    assert(p.node.position.distanceTo(p.position)<1e-7,'Assembled position restored');
    assert(Math.abs(p.node.quaternion.dot(p.quaternion))>1-1e-7,'Assembled rotation restored');
  }
  // Camera framing uses the same default and mobile layout as Scene.tsx.
  for(const aspect of [1.5,335/450,280/450]) for(const view of ['perspective','front']) for(const exploded of [false,true]) {
    applyModelPose(rig,0,0,exploded);root.updateMatrixWorld(true);
    const camera=new THREE.PerspectiveCamera(35,aspect,.1,50);
    const pose=cameraPose(view,aspect);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);camera.updateMatrixWorld();
    const box=new THREE.Box3().setFromObject(root,true);
    let maxX=0,maxY=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const n=new THREE.Vector3(x,y,z).project(camera);maxX=Math.max(maxX,Math.abs(n.x));maxY=Math.max(maxY,Math.abs(n.y));
    }
    assert(maxX<1&&maxY<1,`Model fits camera ${view}, exploded=${exploded}, aspect=${aspect}: ${maxX},${maxY}`);
  }
  console.log(`PASS ${assetId}: ${rig.length} moving assemblies, 4 step poses, pause stability, explode/reassemble, desktop/mobile camera bounds`);
}
console.log('CPU geometry/animation contract checks only; these do not establish WebGL acceptance.');
