import { advanceAt, type LayoutReport } from "./tool-layout";

/** Faceplate view, 1 mm = 1 px in a 180 mm half-width frame. Works without WebGL. */
const HALF = 104;
const px = (mm: number) => mm;
/** SVG y grows downward, so a mount angle counts counter-clockwise from 3 o'clock. */
const point = (angleDeg: number, radiusMm: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return [px(Math.cos(a) * radiusMm), -px(Math.sin(a) * radiusMm)] as const;
};

export interface LayoutDiagramProps {
  report: LayoutReport;
  selected: number | null;
  baseAngleDeg: number | null;
  onSelect: (index: number) => void;
}

export default function LayoutDiagram({ report, selected, baseAngleDeg, onSelect }: LayoutDiagramProps) {
  const { envelope, wireMm } = report;
  const open = report.axes.find((a) => a.index === selected) ?? null;
  const faceplate = Math.max(...report.axes.map((a) => a.farMm), 50) + 22;

  return (
    <figure className="layout-diagram">
      <figcaption>
        <span>배치 도해</span>
        <span>페이스플레이트 정면 · 1 mm = 1 px</span>
      </figcaption>
      <svg viewBox={`${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`} role="img" aria-label="공구 설치 각도와 도달 반경 도해">
        <circle cx={0} cy={0} r={faceplate} className="ld-face" />
        {envelope && (
          <>
            <circle cx={0} cy={0} r={Math.max(envelope.outerMm, 1)} className="ld-band-outer" />
            <circle cx={0} cy={0} r={Math.max(envelope.innerMm, 0.6)} className="ld-band-inner" />
          </>
        )}
        {[20, 40, 60].map((r) => (
          <circle key={r} cx={0} cy={0} r={r} className="ld-grid" />
        ))}

        {report.axes.map((axis) => {
          const clashing = axis.clashWith.length > 0 || axis.overshootMm > 0;
          const state = clashing ? "is-bad" : axis.touches ? "is-reach" : "is-short";
          const isOpen = selected === axis.index;
          const [fx, fy] = point(axis.angleDeg, axis.farMm);
          const [nx, ny] = point(axis.angleDeg, Math.max(axis.nearMm, -wireMm / 2));
          return (
            <g
              key={axis.index}
              className={`ld-axis ${state} ${isOpen ? "is-open" : ""} ${selected !== null && !isOpen ? "is-dim" : ""}`}
              onClick={() => onSelect(axis.index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(axis.index);
                }
              }}
              aria-label={`${axis.name} ${Math.round(axis.angleDeg)}도`}
            >
              <line x1={fx} y1={fy} x2={nx} y2={ny} className="ld-stroke" />
              <circle cx={fx} cy={fy} r={2.6} className="ld-mount" />
              <circle cx={nx} cy={ny} r={isOpen ? 4.2 : 3.2} className="ld-tip" />
              <text x={point(axis.angleDeg, faceplate + 9)[0]} y={point(axis.angleDeg, faceplate + 9)[1]} className="ld-num">
                {axis.index + 1}
              </text>
              <text x={point(axis.angleDeg, faceplate + 17)[0]} y={point(axis.angleDeg, faceplate + 17)[1]} className="ld-plane">
                Z{axis.planeMm}
              </text>
            </g>
          );
        })}

        {open && baseAngleDeg !== null && Math.abs(open.angleDeg - baseAngleDeg) > 0.5 && (
          <path d={arcPath(baseAngleDeg, open.angleDeg, open.farMm + 12)} className="ld-swing" />
        )}
        {open && open.drive === "crank" && <path d={crankPath(open.strokeMm, open.linkMm)} className="ld-crank" />}

        <circle cx={0} cy={0} r={Math.max(wireMm / 2, 1.4)} className="ld-wire" />
      </svg>
      <div className="layout-legend">
        <span className="is-reach">선재 도달</span>
        <span className="is-short">미도달</span>
        <span className="is-bad">간섭 · 중심 통과</span>
        {envelope && <span className="is-band">공통 작업 반경</span>}
      </div>
    </figure>
  );
}

function arcPath(fromDeg: number, toDeg: number, radiusMm: number) {
  const [x1, y1] = point(fromDeg, radiusMm);
  const [x2, y2] = point(toDeg, radiusMm);
  const delta = ((toDeg - fromDeg) % 360 + 360) % 360;
  const large = delta > 180 ? 1 : 0;
  // Counter-clockwise in machine terms is clockwise in SVG's downward-y frame.
  return `M ${x1} ${y1} A ${radiusMm} ${radiusMm} 0 ${large} 0 ${x2} ${y2}`;
}

/** Advance against crank angle, drawn as a small inset curve under the faceplate. */
function crankPath(strokeMm: number, linkMm: number) {
  const w = 54;
  const h = 20;
  const x0 = -w / 2;
  const y0 = HALF - 14;
  const pts = Array.from({ length: 25 }, (_, i) => {
    const deg = (i / 24) * 360;
    const v = advanceAt(deg, strokeMm, linkMm) / Math.max(strokeMm, 0.001);
    return `${x0 + (i / 24) * w} ${y0 - v * h}`;
  });
  return `M ${pts.join(" L ")}`;
}
