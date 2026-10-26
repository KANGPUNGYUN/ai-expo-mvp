import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three-stdlib';
import {createModelRig,applyModelPose} from '../src/model-motion.ts';
import {drivePose} from '../src/rotary-drive.ts';
const decoder=typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder;await decoder.ready;
const b=readFileSync(new URL('../public/models/hcm-35t.glb',import.meta.url));
const {scene}=await new GLTFLoader().setMeshoptDecoder(decoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const rig=createModelRig(scene),cranks=rig.filter(p=>p.animation==='servo-crank'),links=rig.filter(p=>p.animation==='connecting-rod');
assert.equal(cranks.length,8);assert.equal(links.length,8);
for(let index=0;index<8;index++) {
  const crank=cranks.find(p=>p.index===index),rod=links.find(p=>p.index===index),slide=rig.find(p=>p.index===index&&['servo-slide','cutter'].includes(p.animation));
  const a=index*Math.PI/4;
  for(const step of [1,2])for(let n=0;n<=120;n++) {
    const time=n*5.99/120,p=drivePose(index,step,time);
    applyModelPose(rig,step,time,false);scene.updateMatrixWorld(true);
    const pin=new THREE.Vector3(p.eccentric*Math.cos(a),p.eccentric*Math.sin(a),.075).applyMatrix4(crank.node.matrixWorld);
    const bigEye=new THREE.Vector3(0,p.linkLength,0).applyMatrix4(rod.node.matrixWorld);
    const smallEye=new THREE.Vector3().applyMatrix4(rod.node.matrixWorld);
    const anchor=new THREE.Vector3(.50*Math.cos(a),1.96+.50*Math.sin(a),.713).applyMatrix4(slide.node.matrixWorld);
    assert(pin.distanceTo(bigEye)<2e-6,`Axis ${index+1}: big eye stays on eccentric pin (${pin.distanceTo(bigEye)})`);
    assert(anchor.distanceTo(smallEye)<2e-6,`Axis ${index+1}: small eye stays on slider pin`);
    assert(Math.abs(bigEye.distanceTo(smallEye)-p.linkLength)<2e-6,'Connecting link length constant');
    assert(p.travel>=0&&p.travel<=p.eccentric*2+1e-8,'Travel within crank stroke');
  }
  applyModelPose(rig,index===6?2:1,3,false);
  assert(Math.abs(crank.node.quaternion.dot(crank.quaternion))<.5,'Each faceplate rotates in its operating stage');
  assert(crank.node.position.equals(crank.position),'Faceplate rotates around its own fixed center');
}
console.log('PASS: 8 independently rotating cranks, 8 rigid links, 1936 sampled poses; both pin joints remain connected and each disk center stays fixed.');
