import { RotateCcw, TriangleAlert } from "lucide-react";
import {
  machineLayouts,
  type AxisAdjust,
  type LayoutReport,
  type LayoutState,
} from "./tool-layout";

function Slider({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  hint,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="planner-slider">
      <span className="planner-slider-top">
        <span>{label}</span>
        <b>
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(1)}
          <i>{unit}</i>
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="planner-slider-hint">{hint}</span>}
    </label>
  );
}

export interface LayoutPlannerProps {
  assetId: string;
  layout: LayoutState;
  report: LayoutReport;
  wireMm: number;
  selected: number | null;
  dirty: boolean;
  onChange: (index: number, patch: Partial<AxisAdjust>) => void;
  onWire: (mm: number) => void;
  onSelect: (index: number | null) => void;
  onReset: () => void;
}

export default function LayoutPlanner(p: LayoutPlannerProps) {
  const spec = machineLayouts[p.assetId];
  if (!spec) return null;
  const open = p.report.axes.find((a) => a.index === p.selected) ?? null;
  const adjust = p.selected !== null ? p.layout[p.selected] : null;
  const base = spec.axes.find((a) => a.index === p.selected) ?? null;

  return (
    <div className="planner">
      <div className="planner-intro">
        <span>공구를 옮겨 달면 도달 반경과 회전각이 어떻게 바뀌는지 먼저 계산합니다.</span>
        {p.dirty && (
          <button className="planner-reset" onClick={p.onReset}>
            <RotateCcw size={12} /> 기본 배치
          </button>
        )}
      </div>

      <div className="planner-summary">
        <div>
          <span>공통 작업 반경</span>
          <b>
            {p.report.envelope
              ? `${Math.max(p.report.envelope.innerMm, 0).toFixed(1)} – ${p.report.envelope.outerMm.toFixed(1)}`
              : "없음"}
            {p.report.envelope && <i>mm</i>}
          </b>
        </div>
        <div>
          <span>선재 도달</span>
          <b>
            {p.report.reaching}
            <i>/ {p.report.axes.length}축</i>
          </b>
        </div>
        <div className={p.report.clashes ? "is-bad" : ""}>
          <span>간섭 축</span>
          <b>
            {p.report.clashes}
            <i>개</i>
          </b>
        </div>
      </div>

      <Slider
        label="가공 선경"
        unit="mm"
        value={p.wireMm}
        min={spec.wireMm[0]}
        max={spec.wireMm[1]}
        step={0.1}
        hint={`게시 사양 Ø ${spec.wireMm[0]} – ${spec.wireMm[1]} mm`}
        onChange={p.onWire}
      />

      <div className="planner-axes" role="tablist" aria-label="공구 축 선택">
        {p.report.axes.map((axis) => {
          const bad = axis.clashWith.length > 0 || axis.overshootMm > 0;
          return (
            <button
              key={axis.index}
              role="tab"
              aria-selected={p.selected === axis.index}
              className={`planner-axis ${bad ? "is-bad" : axis.touches ? "is-reach" : "is-short"} ${p.selected === axis.index ? "selected" : ""}`}
              onClick={() => p.onSelect(p.selected === axis.index ? null : axis.index)}
            >
              <b>{axis.index + 1}</b>
              <span>{Math.round(axis.angleDeg)}°</span>
            </button>
          );
        })}
      </div>

      {open && adjust && base ? (
        <div className="planner-detail">
          <div className="planner-detail-head">
            <strong>{open.name}</strong>
            <span>{open.drive === "crank" ? "서보 원판 · 편심 링크" : "직선 서보 슬라이드"}</span>
          </div>

          <Slider
            label="설치 각도"
            unit="°"
            value={adjust.angleDeg}
            min={0}
            max={359}
            hint={`기본 ${base.angleDeg}° · 인접 축과 ${Math.round(open.halfArcDeg * 2)}° 이상 떨어져야 합니다`}
            onChange={(v) => p.onChange(open.index, { angleDeg: v })}
          />
          <Slider
            label="홀더 장착 위치"
            unit="mm"
            value={adjust.mountMm}
            min={10}
            max={90}
            step={0.5}
            hint={`중심에서 공구 끝까지 · 기본 ${base.mountMm} mm`}
            onChange={(v) => p.onChange(open.index, { mountMm: v })}
          />
          <Slider
            label="스트로크"
            unit="mm"
            value={adjust.strokeMm}
            min={2}
            max={spec.strokeMaxMm}
            hint={
              open.drive === "crank"
                ? `편심량 ${open.eccentricMm.toFixed(1)} mm · 게시 최대 ${spec.strokeMaxMm} mm`
                : `게시 최대 ${spec.strokeMaxMm} mm`
            }
            onChange={(v) => p.onChange(open.index, { strokeMm: v })}
          />
          <Slider
            label="작업 평면"
            unit="mm"
            value={adjust.planeMm}
            min={0}
            max={60}
            hint={`선재 방향 위치 · 기본 ${base.planeMm} mm · 평면이 겹치면 같은 자리를 다툽니다`}
            onChange={(v) => p.onChange(open.index, { planeMm: v })}
          />

          <dl className="planner-figures">
            <div>
              <dt>도달 반경</dt>
              <dd>
                {open.nearMm.toFixed(1)} – {open.farMm.toFixed(1)} mm
              </dd>
            </div>
            <div>
              <dt>선재까지</dt>
              <dd className={open.touches ? "is-reach" : open.overshootMm > 0 ? "is-bad" : "is-short"}>
                {open.overshootMm > 0
                  ? `중심 ${open.overshootMm.toFixed(1)} mm 통과`
                  : open.shortfallMm > 0
                    ? `${open.shortfallMm.toFixed(1)} mm 부족`
                    : "도달"}
              </dd>
            </div>
            <div>
              <dt>90% 전진 회전각</dt>
              <dd>{Math.round(open.crank90Deg)}°</dd>
            </div>
            {open.drive === "crank" && (
              <div>
                <dt>링크 흔들림</dt>
                <dd>± {open.linkSwingDeg.toFixed(1)}°</dd>
              </div>
            )}
            <div>
              <dt>작업 평면</dt>
              <dd>{open.planeMm} mm</dd>
            </div>
            <div>
              <dt>공구 점유각</dt>
              <dd>{Math.round(open.halfArcDeg * 2)}°</dd>
            </div>
          </dl>

          {open.clashWith.length > 0 && (
            <p className="planner-clash">
              <TriangleAlert size={13} />
              {open.clashWith.map((i) => i + 1).join(", ")}번 축과 간섭 범위입니다.
            </p>
          )}
        </div>
      ) : (
        <p className="planner-empty">축을 선택하면 각도·스트로크를 조정하고 계산값을 볼 수 있습니다.</p>
      )}

      {p.report.warnings.length > 0 && (
        <ul className="planner-warnings">
          {p.report.warnings.map((w) => (
            <li key={w}>
              <TriangleAlert size={13} />
              {w}
            </li>
          ))}
        </ul>
      )}
      <p className="planner-note">
        교육용 재구성 계산입니다. 실제 공구 간섭과 치수는 제조사 도면으로 확인해야 합니다.
      </p>
    </div>
  );
}
