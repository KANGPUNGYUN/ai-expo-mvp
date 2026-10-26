import { useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import { FACE_CENTRE_Y, mmToUnit, type LayoutReport } from "./tool-layout";

/** The plane the forming tools close on, just in front of the faceplate. */
const PLANE_Z = 0.88;
const OK = "#2f7df6";
const REACH = "#15a877";
const BAD = "#e8503f";

function ring(radiusMm: number, segments = 72): [number, number, number][] {
  const r = mmToUnit(radiusMm);
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [Math.cos(a) * r, FACE_CENTRE_Y + Math.sin(a) * r, PLANE_Z] as [number, number, number];
  });
}

function arc(fromDeg: number, toDeg: number, radiusMm: number): [number, number, number][] {
  const r = mmToUnit(radiusMm);
  const steps = Math.max(2, Math.ceil(Math.abs(toDeg - fromDeg) / 3));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    return [Math.cos(a) * r, FACE_CENTRE_Y + Math.sin(a) * r, PLANE_Z] as [number, number, number];
  });
}

function atRadius(angleDeg: number, radiusMm: number): [number, number, number] {
  const a = (angleDeg * Math.PI) / 180;
  const r = mmToUnit(radiusMm);
  return [Math.cos(a) * r, FACE_CENTRE_Y + Math.sin(a) * r, PLANE_Z];
}

export interface ReachOverlayProps {
  report: LayoutReport;
  /** Axis index the planner has open, or null for the whole-machine view. */
  selected: number | null;
  /** Mount angle this axis started from, for the swing arc. */
  baseAngleDeg: number | null;
}

/**
 * Draws the calculated envelope over the running model: the radius band every tool shares,
 * each tool's advance line, and the swing arc for the axis being edited.
 */
export default function ReachOverlay({ report, selected, baseAngleDeg }: ReachOverlayProps) {
  const wireR = Math.max(1.2, report.wireMm / 2);
  const envelope = report.envelope;
  const labelRadius = useMemo(
    () => Math.max(...report.axes.map((a) => a.farMm), 50) + 14,
    [report.axes],
  );

  return (
    <group renderOrder={2}>
      {/* Wire axis: the target every forming tool closes on. */}
      <mesh position={[0, FACE_CENTRE_Y, PLANE_Z]}>
        <circleGeometry args={[mmToUnit(wireR), 24]} />
        <meshBasicMaterial color="#f0a01e" transparent opacity={0.95} depthTest={false} />
      </mesh>

      {envelope && (
        <>
          <Line points={ring(Math.max(envelope.innerMm, 0.4))} color={REACH} lineWidth={1.6} dashed dashSize={0.012} gapSize={0.012} depthTest={false} transparent opacity={0.85} />
          <Line points={ring(envelope.outerMm)} color={OK} lineWidth={1.6} dashed dashSize={0.012} gapSize={0.012} depthTest={false} transparent opacity={0.7} />
        </>
      )}

      {report.axes.map((axis) => {
        const clashing = axis.clashWith.length > 0 || axis.overshootMm > 0;
        const colour = clashing ? BAD : axis.touches ? REACH : OK;
        const isOpen = selected === axis.index;
        return (
          <group key={axis.index}>
            {/* Stroke: from the holder at rest to the tool tip at full advance. */}
            <Line
              points={[atRadius(axis.angleDeg, axis.farMm), atRadius(axis.angleDeg, Math.max(axis.nearMm, -wireR))]}
              color={colour}
              lineWidth={isOpen ? 4 : 2}
              depthTest={false}
              transparent
              opacity={isOpen || selected === null ? 1 : 0.35}
            />
            <mesh position={atRadius(axis.angleDeg, Math.max(axis.nearMm, -wireR))}>
              <circleGeometry args={[mmToUnit(isOpen ? 3.4 : 2.4), 16]} />
              <meshBasicMaterial color={colour} depthTest={false} transparent opacity={isOpen || selected === null ? 1 : 0.4} />
            </mesh>
            {isOpen && baseAngleDeg !== null && Math.abs(axis.angleDeg - baseAngleDeg) > 0.5 && (
              <Line points={arc(baseAngleDeg, axis.angleDeg, axis.farMm + 7)} color="#f0a01e" lineWidth={3} depthTest={false} />
            )}
            {isOpen && (
              <Html position={atRadius(axis.angleDeg, labelRadius)} center zIndexRange={[6, 0]}>
                <span className={`reach-tag ${clashing ? "is-bad" : axis.touches ? "is-reach" : ""}`}>
                  {Math.round(axis.angleDeg)}° · {axis.nearMm.toFixed(1)}–{axis.farMm.toFixed(1)} mm
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
