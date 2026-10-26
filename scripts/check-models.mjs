import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
for (const name of ["hcm-35t", "ham-10t"]) {
  const glb = readFileSync(
    new URL(`../public/models/${name}.glb`, import.meta.url),
  );
  assert.equal(glb.readUInt32LE(0), 0x46546c67, "GLB header");
  assert.equal(glb.readUInt32LE(4), 2, "glTF version");
  assert.equal(glb.readUInt32LE(8), glb.length, "GLB declared size");
  const json = JSON.parse(
    glb.subarray(20, 20 + glb.readUInt32LE(12)).toString(),
  );
  assert(json.nodes.length >= 30, "Detailed model node count");
  assert.equal(
    json.scenes.length,
    1,
    "Export must contain only the active company scene",
  );
  assert(json.meshes.length <= (name === "hcm-35t" ? 160 : 110), "Draw-call geometry budget");
  assert(glb.length < 1_500_000, "Delivered GLB size budget");
  assert(!json.images?.some((i) => i.uri), "No remote texture dependencies");
  for (let step = 0; step < 4; step++)
    assert(
      json.nodes.some((n) => n.extras?.step === step),
      `Missing selectable step ${step}`,
    );
  assert(
    json.accessors.every((a) => a.count > 0),
    "Empty geometry accessor",
  );
  const names = json.nodes.map((n) => n.name);
  for (const required of ["ServoSlide_0", "CuttingSlide_", "CounterKnife", "CentralGuide", "WireLead", "FeedRoller_0", "CoilTurn_0", ...(name === "ham-10t" ? ["ToolChangerXYZ", "RaisedHood"] : ["Spinner_0"])])
    assert(
      names.some((n) => n.startsWith(required)),
      `Missing animated component ${required}`,
    );
  console.log(
    `PASS ${name}: ${json.nodes.length} nodes, ${json.meshes.length} meshes, all 4 process groups, ${(glb.length / 1024).toFixed(1)} KiB, self-contained GLB`,
  );
}
