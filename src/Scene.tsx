import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  Html,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { company } from "./data";
import { createModelRig, applyModelPose, createAxisGroups, applyAxisLayout, type LayoutPose } from "./model-motion";
import { cameraPose } from "./camera-pose";
import { stageParts } from "./stage-lessons";
import ReachOverlay from "./ReachOverlay";
import type { LayoutReport } from "./tool-layout";
import { assetUrl } from "./asset-url";
export interface SceneProps {
  assetId: string;
  steps: readonly { title: string; position: readonly number[] }[];
  step: number;
  playing: boolean;
  speed: number;
  exploded: boolean;
  labels: boolean;
  reset: number;
  view: "perspective" | "front" | "focus";
  clock: RefObject<number>;
  elapsed: number;
  selectedPart: string | null;
  /** Axis offsets from the layout planner, or null when it has not been opened. */
  pose: LayoutPose;
  /** Drawn over the model while the planner is open. */
  report: LayoutReport | null;
  selectedAxis: number | null;
  baseAngleDeg: number | null;
  onPart: (part: string) => void;
  onStep: (step: number) => void;
  onReady: () => void;
  onError: () => void;
}
function Machine(p: SceneProps) {
  const gltf = useGLTF(assetUrl(`models/${p.assetId}.glb?v=rotation-6`));
  const { invalidate } = useThree();
  const model = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = (o.material as THREE.MeshStandardMaterial).clone();
        const material = o.material as THREE.MeshStandardMaterial;
        o.userData.originalColor = material.color.clone();
        o.userData.originalOpacity = material.opacity;
      }
    });
    return s;
  }, [gltf]);
  const rig = useMemo(() => createModelRig(model), [model]);
  const axisGroups = useMemo(() => createAxisGroups(model), [model]);
  useEffect(() => { invalidate(); }, [p.elapsed,p.exploded,p.pose,invalidate]);
  useEffect(() => {
    p.onReady();
    return () => {
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          (o.material as THREE.Material).dispose();
        }
      });
    };
  }, [model]); // geometries belong to the shared GLTF cache
  useEffect(() => {
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const m = o.material as THREE.MeshStandardMaterial;
        let owner: THREE.Object3D | null = o;
        const ancestors: string[]=[];
        while (owner) { if(owner.userData.part) ancestors.push(owner.userData.part); owner=owner.parent; }
        const part=ancestors[0];
        const activeParts = stageParts(p.assetId,p.step).map(x=>x.id);
        if (p.step === 1) activeParts.push("slides", "drives", "rails");
        const selected = p.selectedPart ? ancestors.includes(p.selectedPart) : part ? ancestors.some(id=>activeParts.includes(id)) : o.userData.step === p.step;
        const focus = p.view === "focus";
        const color = (part === "cutter" || part === "blade" || part === "anvil") ? "#f88932" : "#4584ff";
        m.color.copy(o.userData.originalColor);
        if (focus && selected) m.color.lerp(new THREE.Color(color), .08);
        m.opacity = focus && !selected ? (p.selectedPart ? .025 : p.step === 0 ? .07 : .14) : o.userData.originalOpacity;
        m.transparent = m.opacity < 1;
        m.depthWrite = m.opacity >= 1;
        m.emissive.set(
          selected
            ? color
            : "#000",
        );
        m.emissiveIntensity = selected ? (focus ? .10 : .05) : 0;
      }
    });
    invalidate();
  }, [model, p.step, p.assetId, p.selectedPart, p.view, invalidate]);
  useFrame(() => {
    applyModelPose(rig, p.step, p.clock.current, p.exploded, p.pose);
    applyAxisLayout(axisGroups, p.pose);
    if (p.playing) invalidate();
  });
  return (
    <group>
      <primitive
        object={model}
        onClick={(e: {
          stopPropagation: () => void;
          object: THREE.Object3D;
        }) => {
          let owner: THREE.Object3D | null = e.object;
          while (owner && !owner.userData.part) owner = owner.parent;
          if (owner?.userData.part) { e.stopPropagation(); p.onPart(owner.userData.part); return; }
          const step = e.object.userData.step;
          if (typeof step === "number" && step >= 0) {
            e.stopPropagation();
            p.onStep(step);
          }
        }}
      />
      {p.report && (
        <ReachOverlay report={p.report} selected={p.selectedAxis} baseAngleDeg={p.baseAngleDeg} />
      )}
      {p.labels && p.view === "focus" && stageParts(p.assetId,p.step).filter(part=>!p.selectedPart || part.id===p.selectedPart).map((part,i)=>(
        <Html key={part.id} position={part.position} center zIndexRange={[5,0]}>
          <button className={`part-pin ${p.selectedPart===part.id?'selected':''}`} onClick={()=>p.onPart(part.id)} aria-label={`${part.name} 강조`}><b>{i+1}</b><span>{part.name}</span></button>
        </Html>
      ))}
      {p.labels && p.view !== "focus" &&
        p.steps.map((s, i) => (
          <Html
            key={i}
            position={[...s.position] as [number, number, number]}
            center
            zIndexRange={[4, 0]}
          >
            <button
              className={`hotspot ${p.step === i ? "selected" : ""}`}
              onClick={() => p.onStep(i)}
              aria-label={`${i + 1}단계 ${s.title}`}
            >
              {i + 1}
            </button>
          </Html>
        ))}
    </group>
  );
}
function CameraControl({
  reset,
  view,
  step,
  assetId,
  selectedPart,
}: {
  reset: number;
  view: string;
  step: number;
  assetId: string;
  selectedPart: string | null;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  useEffect(() => {
    const pose = cameraPose(view, aspect, step, assetId, selectedPart);
    camera.position.set(...pose.position);
    controls.current?.target.set(...pose.target);
    controls.current?.update();
    invalidate();
  }, [camera, reset, view, step, assetId, selectedPart, aspect, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={view === "focus" ? .15 : 3.2}
      maxDistance={Math.max(12, 12 * 0.95 / aspect)}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 + 0.04}
      enablePan={false}
      enableDamping
    />
  );
}
function ContextGuard({ onError }: { onError: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      onError();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}
export default function Scene(p: SceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [4, 3.1, 6.3], fov: 35, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-label={`${company.name} 3D 기계 모델`}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 7, 5]} intensity={2} />
      <directionalLight
        position={[-4, 3, -2]}
        intensity={1.2}
        color="#c5d5ff"
      />
      <Suspense fallback={null}>
        <Environment resolution={64}>
          <Lightformer intensity={3} position={[0, 5, -4]} scale={[8, 5, 1]} />
          <Lightformer
            intensity={2}
            position={[-5, 2, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[6, 6, 1]}
          />
        </Environment>
        <Machine {...p} />
        <ContactShadows
          position={[0, -0.025, 0]}
          opacity={0.24}
          scale={10}
          blur={2.5}
          far={5}
          resolution={256}
          frames={1}
          key={`${p.assetId}-${p.exploded}`}
        />
      </Suspense>
      <CameraControl reset={p.reset} view={p.view} step={p.step} assetId={p.assetId} selectedPart={p.selectedPart} />
      <ContextGuard onError={p.onError} />
    </Canvas>
  );
}
