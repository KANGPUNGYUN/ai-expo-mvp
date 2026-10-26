import * as THREE from "three";
import { drivePose } from "./rotary-drive.ts";
import { springCycle, stroke } from "./process-cycle.ts";
import { FACE_CENTRE_Y } from "./tool-layout.ts";

export type RigAnimation =
  "cam" | "slide" | "feed" | "spring" |
  "servo-slide" | "spinner" | "toolhead" | "coil-turn" | "cutter" | "wire-lead" | "servo-crank" | "connecting-rod";
export interface RigPart {
  node: THREE.Object3D;
  animation: RigAnimation;
  index: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  angle: number;
  dropDistance: number;
  rotaryDrive: boolean;
  reach: number;
  axis: THREE.Vector3;
}
/** One axis as the layout planner has it set: angle offset, radial offset and stroke. */
export interface AxisPose {
  angleDelta: number;
  mountDelta: number;
  planeDelta: number;
  eccentric: number;
  strokeUnit: number;
}
export type LayoutPose = Map<number, AxisPose> | null;

/** Every node belonging to a numbered slide axis, including the parts the rig does not animate. */
export interface AxisNode {
  node: THREE.Object3D;
  index: number;
  animated: boolean;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}
const AXIS_NAME = /^(LinearGuide|ServoDrive|Carriage|ServoCrank|ConnectingRod|ServoSlide|CuttingSlide)_(\d+)/;
export function createAxisGroups(root: THREE.Object3D): AxisNode[] {
  const groups: AxisNode[] = [];
  const claimed = new Set<THREE.Object3D>();
  // traverse() is a depth-first pre-order walk, so a parent is always claimed before its children.
  root.traverse((node) => {
    const match = AXIS_NAME.exec(node.name);
    if (!match) return;
    for (let p = node.parent; p; p = p.parent) if (claimed.has(p)) return;
    claimed.add(node);
    groups.push({
      node,
      index: Number(match[2]),
      animated: !!node.userData.animation,
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
    });
  });
  return groups;
}

const CENTRE = new THREE.Vector3(0, FACE_CENTRE_Y, 0);
const SPIN_AXIS = new THREE.Vector3(0, 0, 1);
const spin = new THREE.Quaternion();
/**
 * Swing a whole axis assembly about the faceplate centre.
 * Runs after applyModelPose, which has already rebuilt the animated nodes from their rest pose.
 */
export function applyAxisLayout(groups: AxisNode[], pose: LayoutPose) {
  if (!pose) return;
  for (const g of groups) {
    const axis = pose.get(g.index);
    if (!g.animated) {
      g.node.position.copy(g.position);
      g.node.quaternion.copy(g.quaternion);
    }
    if (!axis || !axis.angleDelta) continue;
    g.node.position.sub(CENTRE).applyAxisAngle(SPIN_AXIS, axis.angleDelta).add(CENTRE);
    g.node.quaternion.premultiply(spin.setFromAxisAngle(SPIN_AXIS, axis.angleDelta));
  }
}

export function createModelRig(root: THREE.Object3D): RigPart[] {
  const parts: RigPart[] = [];
  root.traverse((node) => {
    if (!node.userData.animation) return;
    parts.push({
      node,
      animation: node.userData.animation,
      index: node.userData.index ?? 0,
      dropDistance: node.userData.drop_distance ?? .72,
      rotaryDrive: !!node.userData.rotary_drive,
      reach: node.userData.reach ?? .86,
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
      scale: node.scale.clone(),
      angle: node.userData.angle ?? (node.userData.index ?? 0) * Math.PI / 4,
      axis: new THREE.Vector3(...(node.userData.axis ?? [0, 0, 1])).normalize(),
    });
  });
  return parts;
}
/** Update only independent assemblies, preserving each child's local transform. */
export function applyModelPose(
  parts: RigPart[],
  step: number,
  elapsed: number,
  exploded: boolean,
  pose: LayoutPose = null,
) {
  for (const part of parts) {
    const { node, animation, index } = part;
    node.position.copy(part.position);
    node.quaternion.copy(part.quaternion);
    node.scale.copy(part.scale);
    node.visible = true;
    const cycle = springCycle(step, elapsed);
    const axis = pose?.get(index);
    const drive=drivePose(index,step,elapsed,part.reach,axis?.eccentric);
    if(animation === "servo-crank") {
      node.rotateZ(drive.theta);
      if(exploded) {node.position.x+=.18*Math.cos(part.angle);node.position.y+=.18*Math.sin(part.angle);node.position.z+=.34;}
    }
    if(animation === "connecting-rod") {
      node.position.x -= drive.travel*Math.cos(part.angle);
      node.position.y -= drive.travel*Math.sin(part.angle);
      node.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),drive.linkAngle));
      if(exploded) {node.position.x+=.18*Math.cos(part.angle);node.position.y+=.18*Math.sin(part.angle);node.position.z+=.34;}
    }
    if (animation === "servo-slide") {
      // Forming tools work in stage 2; the dedicated lower blade owns cutting.
      const travel = part.rotaryDrive ? drive.travel : step === 1 ? stroke(cycle.t, .12 + (index % 3) * .04, .69) * (axis?.strokeUnit ?? .045) : 0;
      const separation = exploded ? .18 : 0;
      const offset = separation - travel + (axis?.mountDelta ?? 0);
      node.position.x += offset * Math.cos(part.angle);
      node.position.y += offset * Math.sin(part.angle);
      node.position.z += axis?.planeDelta ?? 0;
      if (exploded) node.position.z += .34;
    }
    if (animation === "cutter") {
      node.position.y += part.rotaryDrive ? drive.travel : cycle.cut * (axis?.strokeUnit ?? .118);
      // The blade climbs toward the wire, so moving its mount out means dropping it.
      node.position.y -= axis?.mountDelta ?? 0;
      node.position.z += axis?.planeDelta ?? 0;
      if (exploded) { node.position.y -= .18; node.position.z += .34; }
    }
    if (animation === "wire-lead") {
      node.scale.z *= step === 0 ? .08 + cycle.feed * .92 : 1;
      if (exploded) node.position.z += .34;
    }
    if (animation === "spinner" && step === 1) node.rotateOnAxis(part.axis, cycle.form * Math.PI * 4);
    if (animation === "toolhead") {
      if (step === 1) {
        node.position.x += cycle.tool * .035;
        node.position.y -= cycle.tool * .08;
        node.position.z += cycle.tool * .025;
      }
      if (exploded) { node.position.y += .22; node.position.z += .30; }
    }
    if (animation === "coil-turn") {
      node.visible = step !== 0 && (step !== 1 || index < Math.ceil(cycle.form * 8));
      if (step === 3) {
        node.position.y -= cycle.drop * part.dropDistance;
        node.position.z += cycle.drop * .12;
      }
      if (exploded) node.position.z += .34;
    }
    const angle = (index * Math.PI) / 4;
    if (animation === "slide") {
      const travel =
        step === 2
          ? Math.max(0, Math.sin(elapsed * 4 - index * 0.7)) * 0.055
          : 0;
      const separation = exploded ? 0.2 : 0;
      node.position.x += (separation - travel) * Math.cos(angle);
      node.position.y += (separation - travel) * Math.sin(angle);
      if (exploded) node.position.z += 0.42;
    }
    if (animation === "cam") {
      if (step === 2) node.rotateZ(elapsed * 1.4);
      if (exploded) node.position.z += 0.14;
    }
    if (animation === "feed" && step === 0)
      node.rotateOnAxis(part.axis, cycle.feed * Math.PI * 4 * (index % 2 === 0 ? -1 : 1));
    if (animation === "spring") {
      if (step === 0) node.scale.z *= 0.2;
      if (step === 1) node.scale.z *= 0.2 + ((elapsed % 2) / 2) * 0.8;
      if (step === 3) {
        node.position.y -= (elapsed % 2) * 0.48;
        node.position.z += 0.06;
      }
      if (exploded) node.position.z += 0.42;
    }
  }
}
