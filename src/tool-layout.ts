/**
 * Tooling layout planner.
 *
 * Model space 1.0 = 250 mm (UNIT_MM). Axis angles, tool-tip radii and link lengths are
 * read off the GLB rig; stroke ceilings and wire ranges come from the published specs in
 * spring-products.ts. The crank-slider maths matches rotary-drive.ts so the numbers on the
 * panel and the motion on screen are the same calculation.
 *
 * Dimensions are a teaching reconstruction, not manufacturer drawings.
 */
export const UNIT_MM = 250;
/** Faceplate centre in model space: the wire axis the tools close on. */
export const FACE_CENTRE_Y = 1.96;
export const mmToUnit = (mm: number) => mm / UNIT_MM;
export const unitToMm = (u: number) => u * UNIT_MM;

export type DriveKind = "crank" | "linear";
export type AxisRole = "forming" | "cutting";

export interface AxisSpec {
  index: number;
  name: string;
  role: AxisRole;
  drive: DriveKind;
  /** Mount angle on the faceplate. 0 = 3 o'clock, counter-clockwise. */
  angleDeg: number;
  /** Tool tip radius at rest, measured from the wire centre. */
  mountMm: number;
  /** Full advance per cycle. On a crank axis this is twice the eccentric. */
  strokeMm: number;
  /** Working plane along the wire. Tools on different planes pass each other. */
  planeMm: number;
  /** Tool width across the slide, used for the clash check. */
  widthMm: number;
  /** Tool thickness along the wire. Two tools share a plane when their offset is smaller. */
  thicknessMm: number;
  /** Connecting rod length. Crank axes only. */
  linkMm: number;
}

export interface MachineLayoutSpec {
  label: string;
  /** Published maximum slide stroke. */
  strokeMaxMm: number;
  /** Published wire diameter range. */
  wireMm: readonly [number, number];
  axes: readonly AxisSpec[];
}

const crankLink = unitToMm(0.4625);

/** Measured from the GLB: ServoSlide_<n> carbide tip radius about (0, 1.96). */
function formingAxis(index: number, tipUnit: number, angleDeg: number, planeMm: number): AxisSpec {
  const mountMm = Math.round(unitToMm(tipUnit) * 10) / 10;
  return {
    index,
    name: `${index + 1}번 성형축`,
    role: "forming",
    drive: "crank",
    angleDeg,
    mountMm,
    // Default stroke closes the tool onto the wire surface, rounded up so it reaches.
    strokeMm: Math.ceil(mountMm - 1.5),
    planeMm,
    widthMm: 8,
    thicknessMm: 6,
    linkMm: crankLink,
  };
}

export const machineLayouts: Record<string, MachineLayoutSpec> = {
  "hcm-35t": {
    label: "8축 회전 링크 · 독립 슬라이드",
    strokeMaxMm: 130,
    wireMm: [1, 4],
    // Working planes step along the wire so neighbouring tools clear each other.
    axes: [
      formingAxis(0, 0.1643, 0, 0),
      formingAxis(1, 0.1867, 45, 7),
      formingAxis(2, 0.171, 90, 14),
      formingAxis(3, 0.1867, 135, 21),
      formingAxis(4, 0.171, 180, 28),
      formingAxis(5, 0.1867, 225, 35),
      {
        index: 6,
        name: "커팅축",
        role: "cutting",
        drive: "crank",
        angleDeg: 270,
        mountMm: 42.8,
        strokeMm: 43,
        planeMm: 49,
        widthMm: 10,
        thicknessMm: 6,
        linkMm: crankLink,
      },
      formingAxis(7, 0.1867, 315, 42),
    ],
  },
  "ham-10t": {
    label: "상부 XYZ 툴 체인저 · 하단 슬라이드",
    strokeMaxMm: 80,
    wireMm: [0.4, 1],
    axes: [
      { ...formingAxis(0, 0.2071, 0, 0), drive: "linear", linkMm: 0 },
      { ...formingAxis(1, 0.221, 180, 8), drive: "linear", linkMm: 0 },
      { ...formingAxis(2, 0.2991, 225, 16), drive: "linear", linkMm: 0 },
      {
        index: 3,
        name: "커팅축",
        role: "cutting",
        drive: "linear",
        angleDeg: 270,
        mountMm: 52,
        strokeMm: 53,
        planeMm: 32,
        widthMm: 8,
        thicknessMm: 5,
        linkMm: 0,
      },
      { ...formingAxis(4, 0.2991, 315, 24), drive: "linear", linkMm: 0 },
    ],
  },
};

export interface AxisAdjust {
  angleDeg: number;
  mountMm: number;
  strokeMm: number;
  planeMm: number;
}
export type LayoutState = Record<number, AxisAdjust>;

export function defaultLayout(assetId: string): LayoutState {
  const spec = machineLayouts[assetId];
  const state: LayoutState = {};
  if (!spec) return state;
  for (const a of spec.axes) {
    state[a.index] = { angleDeg: a.angleDeg, mountMm: a.mountMm, strokeMm: a.strokeMm, planeMm: a.planeMm };
  }
  return state;
}

export function isDefaultLayout(assetId: string, layout: LayoutState) {
  const base = defaultLayout(assetId);
  return Object.keys(base).every((k) => {
    const i = Number(k);
    return (
      base[i].angleDeg === layout[i]?.angleDeg &&
      base[i].mountMm === layout[i]?.mountMm &&
      base[i].strokeMm === layout[i]?.strokeMm &&
      base[i].planeMm === layout[i]?.planeMm
    );
  });
}

/** Shortest distance between two 2D segments. */
function segmentDistance(
  a0: readonly [number, number],
  a1: readonly [number, number],
  b0: readonly [number, number],
  b1: readonly [number, number],
) {
  const pointToSegment = (p: readonly [number, number], s0: readonly [number, number], s1: readonly [number, number]) => {
    const dx = s1[0] - s0[0];
    const dy = s1[1] - s0[1];
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - s0[0]) * dx + (p[1] - s0[1]) * dy) / lenSq));
    return Math.hypot(p[0] - (s0[0] + t * dx), p[1] - (s0[1] + t * dy));
  };
  const d = (a1[0] - a0[0]) * (b1[1] - b0[1]) - (a1[1] - a0[1]) * (b1[0] - b0[0]);
  if (d !== 0) {
    const t = ((b0[0] - a0[0]) * (b1[1] - b0[1]) - (b0[1] - a0[1]) * (b1[0] - b0[0])) / d;
    const u = ((b0[0] - a0[0]) * (a1[1] - a0[1]) - (b0[1] - a0[1]) * (a1[0] - a0[0])) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(
    pointToSegment(a0, b0, b1),
    pointToSegment(a1, b0, b1),
    pointToSegment(b0, a0, a1),
    pointToSegment(b1, a0, a1),
  );
}

/** Tool centre line at full advance, from the tip inward to the holder face. */
function toolSegment(angleDeg: number, nearMm: number, farMm: number) {
  const a = (angleDeg * Math.PI) / 180;
  const u: readonly [number, number] = [Math.cos(a), Math.sin(a)];
  return [
    [u[0] * nearMm, u[1] * nearMm] as const,
    [u[0] * farMm, u[1] * farMm] as const,
  ] as const;
}

/**
 * Slider displacement of a crank-slider at crank angle `deg`.
 * s(θ) = e(1 − cos θ) + L − √(L² − e² sin²θ), so s(0) = 0 and s(180°) = 2e.
 * A zero link length degrades to a pure sine advance, which is what the linear axes use.
 */
export function advanceAt(deg: number, strokeMm: number, linkMm: number) {
  const e = strokeMm / 2;
  const th = (deg * Math.PI) / 180;
  if (linkMm <= 0) return (strokeMm * (1 - Math.cos(th))) / 2;
  const lateral = e * Math.sin(th);
  return e * (1 - Math.cos(th)) + linkMm - Math.sqrt(Math.max(0, linkMm * linkMm - lateral * lateral));
}

/** Crank angle at which the tool has covered `fraction` of its stroke. */
export function crankAngleFor(fraction: number, strokeMm: number, linkMm: number) {
  const target = strokeMm * fraction;
  let lo = 0;
  let hi = 180;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (advanceAt(mid, strokeMm, linkMm) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Peak swing of the connecting rod away from the slide axis. */
export function linkSwingDeg(strokeMm: number, linkMm: number) {
  if (linkMm <= 0) return 0;
  return (Math.asin(Math.min(1, strokeMm / 2 / linkMm)) * 180) / Math.PI;
}

/** Shortest angular gap between two mount angles, in degrees. */
export function angularGap(a: number, b: number) {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return Math.min(d, 360 - d);
}

export interface AxisResult {
  index: number;
  name: string;
  role: AxisRole;
  drive: DriveKind;
  angleDeg: number;
  /** Tool tip radius at full advance. Negative means the tip crosses the wire axis. */
  nearMm: number;
  /** Tool tip radius at rest. */
  farMm: number;
  strokeMm: number;
  eccentricMm: number;
  linkMm: number;
  /** Crank rotation needed to cover 90% of the stroke. */
  crank90Deg: number;
  linkSwingDeg: number;
  planeMm: number;
  /** Half the angular width the tool occupies at full advance. */
  halfArcDeg: number;
  /** Reaches the wire surface without crossing the axis. */
  touches: boolean;
  /** How far past the wire axis the tip travels. 0 when it stops short. */
  overshootMm: number;
  /** Shortfall to the wire surface. 0 when it reaches. */
  shortfallMm: number;
  clashWith: number[];
  overStroke: boolean;
}

export interface LayoutReport {
  axes: AxisResult[];
  /** Radius band every active tool can work in. Null when the bands do not overlap. */
  envelope: { innerMm: number; outerMm: number } | null;
  /** Share of the faceplate circumference covered by tool holders. */
  coveragePct: number;
  clashes: number;
  reaching: number;
  wireMm: number;
  warnings: string[];
}

export function layoutReport(assetId: string, layout: LayoutState, wireMm: number): LayoutReport {
  const spec = machineLayouts[assetId];
  if (!spec) {
    return { axes: [], envelope: null, coveragePct: 0, clashes: 0, reaching: 0, wireMm, warnings: [] };
  }
  const wireR = wireMm / 2;
  const axes: AxisResult[] = spec.axes.map((a) => {
    const adj = layout[a.index] ?? {
      angleDeg: a.angleDeg,
      mountMm: a.mountMm,
      strokeMm: a.strokeMm,
      planeMm: a.planeMm,
    };
    const nearMm = adj.mountMm - adj.strokeMm;
    // At full advance the tool sits closest in, so its angular footprint is widest there.
    const halfArcDeg =
      nearMm <= 0 ? 90 : (Math.atan2(a.widthMm / 2, Math.max(nearMm, 0.8)) * 180) / Math.PI;
    // A forming tool must stop at the wire; a blade has to cross the centre to sever it.
    const touches = a.role === "cutting" ? nearMm <= wireR : nearMm <= wireR && nearMm >= -wireR;
    return {
      index: a.index,
      name: a.name,
      role: a.role,
      drive: a.drive,
      angleDeg: adj.angleDeg,
      nearMm,
      farMm: adj.mountMm,
      strokeMm: adj.strokeMm,
      eccentricMm: adj.strokeMm / 2,
      linkMm: a.linkMm,
      crank90Deg: crankAngleFor(0.9, adj.strokeMm, a.linkMm),
      linkSwingDeg: linkSwingDeg(adj.strokeMm, a.linkMm),
      planeMm: adj.planeMm,
      halfArcDeg,
      touches,
      overshootMm: a.role === "cutting" ? 0 : Math.max(0, -wireR - nearMm),
      shortfallMm: Math.max(0, nearMm - wireR),
      clashWith: [],
      overStroke: adj.strokeMm > spec.strokeMaxMm,
    };
  });

  // Two tools only fight for space when they share a working plane along the wire.
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const planeGap = Math.abs(axes[i].planeMm - axes[j].planeMm);
      const sharePlane = planeGap < (spec.axes[i].thicknessMm + spec.axes[j].thicknessMm) / 2;
      if (!sharePlane) continue;
      const [a0, a1] = toolSegment(axes[i].angleDeg, axes[i].nearMm, axes[i].farMm);
      const [b0, b1] = toolSegment(axes[j].angleDeg, axes[j].nearMm, axes[j].farMm);
      if (segmentDistance(a0, a1, b0, b1) < (spec.axes[i].widthMm + spec.axes[j].widthMm) / 2) {
        axes[i].clashWith.push(axes[j].index);
        axes[j].clashWith.push(axes[i].index);
      }
    }
  }

  // The cutting axis works at its own radius, so only forming tools define the shared band.
  const forming = axes.filter((a) => a.role === "forming");
  const innerMm = Math.max(...forming.map((a) => a.nearMm));
  const outerMm = Math.min(...forming.map((a) => a.farMm));
  const envelope = innerMm <= outerMm ? { innerMm, outerMm } : null;
  const coveragePct = Math.min(100, axes.reduce((sum, a) => sum + a.halfArcDeg * 2, 0) / 3.6);
  const clashes = axes.filter((a) => a.clashWith.length).length;
  const reaching = axes.filter((a) => a.touches).length;

  const warnings: string[] = [];
  const over = axes.filter((a) => a.overStroke);
  if (over.length) warnings.push(`스트로크가 게시 사양 ${spec.strokeMaxMm} mm를 넘는 축: ${over.map((a) => a.name).join(", ")}.`);
  const crossing = axes.filter((a) => a.overshootMm > 0);
  if (crossing.length) warnings.push(`선재 중심을 최대 ${Math.max(...crossing.map((a) => a.overshootMm)).toFixed(1)} mm 지나치는 축: ${crossing.map((a) => a.name).join(", ")}. 맞은편 공구와 부딪칠 수 있습니다.`);
  if (clashes) warnings.push(`공구 ${clashes}개가 같은 작업 평면에서 겹칩니다. 설치 각도를 벌리거나 작업 평면을 나눠야 합니다.`);
  const idle = axes.filter((a) => a.shortfallMm > 0 && a.role === "forming");
  if (idle.length) warnings.push(`선재에 ${Math.min(...idle.map((a) => a.shortfallMm)).toFixed(1)} mm 이상 못 미치는 축: ${idle.map((a) => a.name).join(", ")}.`);
  if (!envelope) warnings.push("공통 작업 반경이 없습니다. 축마다 도달 구간이 어긋나 같은 반경에서 함께 가공할 수 없습니다.");

  return { axes, envelope, coveragePct, clashes, reaching, wireMm, warnings };
}
