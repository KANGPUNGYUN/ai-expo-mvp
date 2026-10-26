import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three-stdlib';
import {cameraPose} from '../src/camera-pose.ts';
const decoder=typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder;
await decoder.ready;
for(const assetId of ['hcm-35t','ham-10t']) {
  const b=readFileSync(new URL(`../public/models/${assetId}.glb`,import.meta.url));
  const {scene}=await new GLTFLoader().setMeshoptDecoder(decoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  scene.updateMatrixWorld(true);
  for(const part of ['feed','quill','guideway','carriage','forming','cutter','blade','anvil','drive',assetId==='hcm-35t'?'spinner':'head']) {
    const box=new THREE.Box3();scene.traverse(o=>{if(!o.isMesh)return;let p=o,match=false;while(p){if(p.userData.part===part)match=true;p=p.parent;}if(match)box.union(new THREE.Box3().setFromObject(o,true));});
    for(const aspect of [1.4,335/450]) {
      const pose=cameraPose('focus',aspect,2,assetId,part);
      const camera=new THREE.PerspectiveCamera(35,aspect,.1,50);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
      let limit=0;
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);limit=Math.max(limit,Math.abs(p.x),Math.abs(p.y));}
      assert(limit<1,`${assetId}/${part} at ${aspect}: frame limit ${limit.toFixed(2)}`);
    }
  }
  console.log(`PASS ${assetId}: all ten component bounds fit desktop and mobile cameras`);
}
