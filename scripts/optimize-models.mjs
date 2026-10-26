import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { stat } from 'node:fs/promises';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
for(const name of ['hcm-35t','ham-10t']) {
  const path=new URL(`../public/models/${name}.glb`,import.meta.url).pathname;
  const before=(await stat(path)).size;
  const doc=await io.read(path);
  await doc.transform(dedup(),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12}));
  await io.write(path,doc);
  console.log(`${name}: ${before} -> ${(await stat(path)).size} bytes`);
}
