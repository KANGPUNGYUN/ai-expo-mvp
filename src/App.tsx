import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Expand,
  GraduationCap,
  Layers3,
  Link2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
  CircleHelp,
  Move3D,
  Factory,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { company } from "./data";
import { springProducts, currentSpringProduct, type SpringProductId } from "./spring-products";
import { useProcessClock } from "./use-process-clock";
import { CYCLE_SECONDS, processPhases, phaseIndex } from "./process-cycle";
import { partDetail } from "./part-details";
import { stageParts } from "./stage-lessons";
import { RenderedMotion } from "./RenderedMotion";
import { RotaryDriveDiagram } from "./RotaryDriveDiagram";
import { MotionDiagram } from "./MotionDiagram";
import LayoutPlanner from "./LayoutPlanner";
import LayoutDiagram from "./LayoutDiagram";
import {
  defaultLayout,
  isDefaultLayout,
  layoutReport,
  machineLayouts,
  mmToUnit,
  type AxisAdjust,
  type LayoutState,
} from "./tool-layout";
import type { AxisPose } from "./model-motion";
import { assetUrl } from "./asset-url";
const Scene = lazy(() => import("./Scene"));
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function App() {
  const [springProduct, setSpringProduct] = useState<SpringProductId>(currentSpringProduct);
  const [videoIndex, setVideoIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playback, setPlayback] = useState<"loop" | "sequence">("loop");
  const [cycleReset, setCycleReset] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(true);
  const [reset, setReset] = useState(0);
  const [view, setView] = useState<"perspective" | "front" | "focus">("focus");
  const [tab, setTab] = useState<"process" | "layout" | "info">("process");
  const [layouts, setLayouts] = useState<Record<string, LayoutState>>(() => ({
    "hcm-35t": defaultLayout("hcm-35t"),
    "ham-10t": defaultLayout("ham-10t"),
  }));
  const [wires, setWires] = useState<Record<string, number>>({ "hcm-35t": 3, "ham-10t": 0.8 });
  const [selectedAxis, setSelectedAxis] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [motionFailed,setMotionFailed]=useState(false);
  const onMotionFailure=useCallback(()=>setMotionFailed(true),[]);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<
    "proposal" | "help" | "videos" | null
  >(null);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activePage, setActivePage] = useState(!document.hidden);
  const viewer = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const product = springProducts[springProduct];
  const data = { ...company, specs: product.specs, steps: product.steps };
  const assetId = springProduct;
  const detail = data.steps[step];
  const layout = layouts[assetId] ?? {};
  const wireMm = wires[assetId] ?? 3;
  const planning = tab === "layout";
  const report = useMemo(
    () => (machineLayouts[assetId] ? layoutReport(assetId, layout, wireMm) : null),
    [assetId, layout, wireMm],
  );
  /** Axis offsets handed to the rig, so the model moves exactly as the panel calculates. */
  const pose = useMemo(() => {
    const spec = machineLayouts[assetId];
    if (!spec) return null;
    const map = new Map<number, AxisPose>();
    for (const axis of spec.axes) {
      const adj = layout[axis.index];
      if (!adj) continue;
      map.set(axis.index, {
        angleDelta: ((adj.angleDeg - axis.angleDeg) * Math.PI) / 180,
        mountDelta: mmToUnit(adj.mountMm - axis.mountMm),
        planeDelta: mmToUnit(adj.planeMm - axis.planeMm),
        eccentric: mmToUnit(adj.strokeMm) / 2,
        strokeUnit: mmToUnit(adj.strokeMm),
      });
    }
    return map;
  }, [assetId, layout]);
  const baseAngleDeg =
    selectedAxis === null
      ? null
      : (machineLayouts[assetId]?.axes.find((a) => a.index === selectedAxis)?.angleDeg ?? null);
  const layoutDirty = machineLayouts[assetId] ? !isDefaultLayout(assetId, layout) : false;
  const adjustAxis = useCallback(
    (index: number, patch: Partial<AxisAdjust>) => {
      setLayouts((prev) => ({
        ...prev,
        [assetId]: { ...prev[assetId], [index]: { ...prev[assetId][index], ...patch } },
      }));
    },
    [assetId],
  );
  const resetLayout = useCallback(() => {
    setLayouts((prev) => ({ ...prev, [assetId]: defaultLayout(assetId) }));
  }, [assetId]);
  const active =
    playing && visible && activePage && !modal && (ready || failed);
  const advanceStep = useCallback(() => {
    setSelectedPart(null);
    setStep(prev => (prev + 1) % 4);
  }, []);
  const { clock, elapsed, seek: setCyclePosition } = useProcessClock(active,speed,`${assetId}-${step}-${cycleReset}`,playback === "sequence",advanceStep);
  const phases = processPhases[step];
  const parts = stageParts(assetId,step);
  const focusedPart=partDetail(assetId,selectedPart);
  const motionPreview=failed && !motionFailed && assetId==="hcm-35t" && view==="focus" && !focusedPart && (step===1 || step===2);
  const inspectPart=(id: string)=>{
    setSelectedPart(selectedPart===id?null:id);setView("focus");setExploded(false);setPlaying(false);setCyclePosition(0);
    if(window.innerWidth<=768) viewer.current?.scrollIntoView({behavior:"smooth",block:"start"});
  };
  const selectStep = useCallback(
    (s: number) => {
      setStep(s);
      setSelectedPart(null);
      setView("focus");
      setExploded(false);
      setPlayback("loop");
      setCycleReset(v=>v+1);
      setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => {
    // Preserve an explicit play/step request when switching to the motion diagram.
    setFailed(true);
  }, []);
  const switchProduct = (id: SpringProductId) => {
    if (id === springProduct) return;
    setSpringProduct(id);
    setPlaying(false);
    setReady(false);
    setFailed(false);
    setExploded(false);
    setSelectedPart(null);
    setView("focus");
    setVideoIndex(0);
    setStep(0);
    const u = new URL(location.href);
    u.searchParams.set("product", id);
    history.pushState({}, "", u);
  };
  useEffect(() => {
    const f = () => {
      setSpringProduct(currentSpringProduct());
      setVideoIndex(0);
      setPlaying(false);
      setReady(false);
      setFailed(false);
        setExploded(false);
      setSelectedPart(null);
    };
    window.addEventListener("popstate", f);
    return () => window.removeEventListener("popstate", f);
  }, []);
  useEffect(() => {
    const node = viewer.current;
    if (!node) return;
    const ob = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    ob.observe(node);
    const onVisibility = () => setActivePage(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      ob.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (modal) {
      returnFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      returnFocus.current?.focus();
    }
  }, [modal]);
  useEffect(() => {
    const f = () => setExpanded(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dialog.current?.open) {
        if (document.fullscreenElement)
          void document.exitFullscreen().catch(() => setExpanded(false));
        else setExpanded(false);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  async function share() {
    const u = new URL(location.href);
    u.searchParams.set("product", springProduct);
    u.hash = "showroom";
    try {
      await navigator.clipboard.writeText(u.href);
      setNotice("현재 모델의 시연 링크를 복사했습니다.");
    } catch {
      setNotice(`공유 링크: ${u.href}`);
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (viewer.current?.requestFullscreen)
        await viewer.current.requestFullscreen();
      else setExpanded(!expanded);
    } catch {
      setExpanded(!expanded);
    }
  }
  function downloadProposal() {
    const body = `${data.name} 3D 시연 도입 제안\n\n안녕하세요, ${data.name} 담당자님.\n\n스프링 제조 기술을 신입 직원에게 쉽게 전수하고, 전시 현장에서 기계의 작동 원리를 설명할 수 있는 3D 시연을 제안드립니다.\n\n시연 링크: ${location.href.split("?")[0].split("#")[0]}?product=${springProduct}#showroom\n\n1단계: 대표 장비 1종 · 4단계 작동 설명 · 웹 링크 공유\n2단계: 제조사 도면 검토 · 실제 공정 반영 · 교육 콘텐츠 보완\n3단계: 설비별 교육 확대 · 비접촉 검사 및 호환성 검토\n\n확인할 자료: 제품 도면, 실제 작동 순서, 공개 가능한 사양, 담당자 검수 의견\n예산과 일정: 모델 상세도 및 자료 제공 범위 확인 후 협의\n\n현재 시연은 교육용 개념 모델이며 실제 장비 제어, 성능 예측, 품질 보증 기능은 포함하지 않습니다.\n\n간단한 미팅에서 적용 범위와 도입 비용을 함께 검토하고 싶습니다. 감사합니다.\n`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name}-3D-MVP-제안.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("제안 초안을 저장했습니다. 메일은 발송되지 않았습니다.");
  }
  return (
    <div className="app">
      <header className="header">
        <a className="wordmark" href="#" aria-label="FORM 홈">
          <span className="brand-symbol">
            <Box size={21} />
          </span>
          form<span className="brand-dot">.</span>
        </a>
        <span className="header-divider" />
        <span className="header-caption">INDUSTRIAL EXPERIENCE</span>
        <nav>
          <a href="#showroom">3D 쇼룸</a>
          <a href="#possibilities">활용 안내</a>
          <a href="#roadmap">도입 과정</a>
        </nav>
        <button className="header-cta" onClick={() => setModal("proposal")}>
          도입 제안 보기 <ArrowUpRight size={16} />
        </button>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> INTERACTIVE INDUSTRIAL SHOWROOM
            </div>
            <h1>
              보이지 않던 기술,
              <br />
              <span>눈앞에서 움직이다.</span>
            </h1>
            <p>
              설명만으로는 어려웠던 기계의 원리.
              <br className="mobile-br" /> 이제 직접 움직이고, 발견하고,
              이해하세요.
            </p>
          </div>
          <div className="hero-side">
            <span className="hero-line" />
            <span>
              기술을 더 쉽게.
              <br />
              경험을 더 가깝게.
            </span>
            <a href="#showroom" aria-label="3D 쇼룸으로 이동">
              <ArrowRight size={23} />
            </a>
          </div>
        </section>
        <section id="showroom" className="showroom-section">
          <div className="showroom-heading">
            <div className="showroom-brand">
              <Factory size={18} />
              <span>
                {company.name}
                <small>무캠식 스프링 성형기</small>
              </span>
            </div>
            <span className="demo-label">
              <span /> EDUCATIONAL CONCEPT DEMO
            </span>
          </div>
          <div className="product-picker" aria-label="스프링 장비 모델 선택">
              <div className="product-options">
                {(Object.keys(springProducts) as SpringProductId[]).map(id => (
                  <button key={id} aria-pressed={springProduct === id} onClick={() => switchProduct(id)}>
                    <strong>{springProducts[id].name}</strong>
                    <span>{springProducts[id].summary}</span>
                  </button>
                ))}
              </div>
            <button className="product-video-button" onClick={() => { setVideoIndex(0); setModal("videos"); }}>
              <Play size={15} /> 실제 작동 영상 <ArrowUpRight size={14} />
            </button>
          </div>
          <div
            className={`showroom ${expanded ? "is-expanded" : ""}`}
            ref={viewer}
          >
            <div className={`stage ${view === "focus" ? "is-focused" : ""}`}>
              <div className="stage-top">
                <span className="scene-caption">
                  <span className="live-dot" />
                  {failed
                    ? motionPreview ? "RENDERED MOTION" : "STATIC MODEL PREVIEW"
                    : ready
                      ? "INTERACTIVE 3D"
                      : "LOADING 3D"}
                </span>
              </div>
              <div className="stage-type" aria-hidden="true">
                SPRING
              </div>
              {!failed && (
                <>
                  <SceneBoundary key={`${assetId}-${retry}`} onError={onError}>
                    <Suspense fallback={null}>
                      <Scene
                        assetId={assetId}
                        steps={data.steps}
                        step={step}
                        playing={active}
                        speed={speed}
                        exploded={exploded}
                        labels={labels}
                        reset={reset}
                        view={view}
                        clock={clock}
                        elapsed={elapsed}
                        selectedPart={selectedPart}
                        pose={pose}
                        report={planning ? report : null}
                        selectedAxis={selectedAxis}
                        baseAngleDeg={baseAngleDeg}
                        onPart={inspectPart}
                        onStep={selectStep}
                        onReady={onReady}
                        onError={onError}
                      />
                    </Suspense>
                  </SceneBoundary>
                  {!ready && (
                    <div className="loading">
                      <span className="loader" />
                      3D 장비를 준비하고 있습니다
                    </div>
                  )}
                </>
              )}
              {failed && (
                <div className="photo-view poster-view">
                  {motionPreview ? <RenderedMotion step={step} elapsed={elapsed} active={active} speed={speed} onFailure={onMotionFailure}/> : <img
                    src={assetUrl(`models/${assetId}${view === "focus" ? focusedPart ? `-part-${selectedPart}` : `-step-${step}` : "-poster"}.webp?v=rotation-6`)}
                    alt={`${data.name} ${focusedPart?.name ?? detail.title} 정지 렌더 이미지`}
                  />}
                  {(
                    <div className="fallback-note">
                      {motionPreview ? "회전·링크 동작을 미리 렌더한 영상입니다. 아래 재생·구간 탐색과 연동됩니다." : focusedPart ? "선택 부품의 확대 렌더입니다. 실제 치수는 제조사 확인이 필요합니다." : "단계별 정지 렌더입니다. 움직임은 아래 동작 도해에서 확인하세요."}
                      <button
                        onClick={() => {
                          setFailed(false);
                          setReady(false);
                          setRetry((v) => v + 1);
                        }}
                      >
                        3D 다시 시도 <RotateCcw size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="focus-controls">
                <button aria-pressed={view === "focus"} onClick={()=>{setView("focus");setSelectedPart(null);setReset(v=>v+1);}}>단계 확대</button>
                <button aria-pressed={view !== "focus"} onClick={()=>{setView("perspective");setSelectedPart(null);}}>전체 장비</button>
                {view === "focus" && <span>{focusedPart?.name ?? (failed ? motionPreview ? "8축 회전 · 동작 렌더" : "부품 상세 · 정지 렌더" : "선택 부품 강조 · 외장 투시")}</span>}
              </div>
              <div className="stage-tools">
                <button
                  title="시점 초기화"
                  aria-label="시점 초기화"
                  disabled={failed}
                  onClick={() => {
                    setReset((v) => v + 1);
                    setView("perspective");
                  }}
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  title="정면 보기"
                  aria-label="정면 보기"
                  disabled={failed}
                  aria-pressed={view === "front"}
                  onClick={() =>
                    setView(view === "front" ? "perspective" : "front")
                  }
                >
                  <Box size={18} />
                </button>
                <button
                  title="화면 확대"
                  aria-label={expanded ? "화면 축소" : "화면 확대"}
                  onClick={fullscreen}
                >
                  <Expand size={18} />
                </button>
                <span />
                <button
                  title="조작 안내"
                  aria-label="조작 안내"
                  onClick={() => setModal("help")}
                >
                  <CircleHelp size={18} />
                </button>
              </div>
              <div className="stage-bottom">
                <div>
                  <span className="model-brand">{data.english}</span>
                  <strong>{product.name} · 무캠식 스프링 포밍기</strong>
                  <span className="model-sub">
                    게시 사양 기반 · 교육용 개념 모델
                  </span>
                </div>
                <span className="drag-hint">
                  <MousePointer2 size={15} />{" "}
                  {failed
                    ? motionPreview ? "동작 렌더 영상 · 시점 고정" : "정지 렌더 이미지 · 회전 불가"
                    : "드래그하여 회전 · 스크롤로 확대"}
                </span>
              </div>
            </div>
            <aside className="control-panel">
              <div className="panel-heading">
                <span className="eyebrow">{data.category}</span>
                <h2>{data.name}</h2>
                <p>{data.title.replace("\n", " ")}</p>
              </div>
              <div
                className="panel-tabs"
                role="tablist"
                aria-label="제품 상세"
                onKeyDown={(e) => {
                  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                  e.preventDefault();
                  const order = ["process", "layout", "info"] as const;
                  const next =
                    order[
                      (order.indexOf(tab) + (e.key === "ArrowRight" ? 1 : order.length - 1)) %
                        order.length
                    ];
                  setTab(next);
                  (
                    e.currentTarget.querySelector(`#tab-${next}`) as HTMLButtonElement
                  )?.focus();
                }}
              >
                <button
                  role="tab"
                  id="tab-process"
                  aria-controls="detail-panel"
                  tabIndex={tab === "process" ? 0 : -1}
                  aria-selected={tab === "process"}
                  onClick={() => setTab("process")}
                >
                  작동 과정
                </button>
                <button
                  role="tab"
                  id="tab-layout"
                  aria-controls="detail-panel"
                  tabIndex={tab === "layout" ? 0 : -1}
                  aria-selected={tab === "layout"}
                  onClick={() => {
                    setTab("layout");
                    setView("front");
                    setSelectedPart(null);
                  }}
                >
                  배치 설계
                </button>
                <button
                  role="tab"
                  id="tab-info"
                  aria-controls="detail-panel"
                  tabIndex={tab === "info" ? 0 : -1}
                  aria-selected={tab === "info"}
                  onClick={() => setTab("info")}
                >
                  제품 정보
                </button>
              </div>
              {tab === "process" ? (
                <div
                  className="process-content"
                  role="tabpanel"
                  id="detail-panel"
                  aria-labelledby="tab-process"
                >
                  <div className="process-heading">
                    <span>한 단계씩, 원리를 발견하세요</span>
                    <span>
                      0{step + 1} <b>/ 04</b>
                    </span>
                  </div>
                  <div className="step-list">
                    {data.steps.map((s, i) => (
                      <button
                        key={s.title}
                        className={`step-row ${step === i ? "active" : ""}`}
                        onClick={() => selectStep(i)}
                        aria-pressed={step === i}
                      >
                        <span className="step-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          {s.title}
                          {step === i && <small>{s.english}</small>}
                        </span>
                        {step === i ? (
                          <span className="step-pulse" />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="step-explanation" aria-live="polite">
                    <h3>{detail.title}</h3>
                    <p>{detail.text}</p>
                    <div className="learning-note">
                      <span>
                        <Sparkles size={13} />
                        {detail.point}
                      </span>
                      <p>{detail.detail}</p>
                    </div>
                  </div>
                  <div className="part-inspector">
                    <span className="eyebrow">이 단계에서 볼 부품</span>
                    <small>부품을 선택하면 개별 구조를 확대합니다.</small>
                    {parts.map((part,i)=><button key={part.id} aria-pressed={selectedPart===part.id} onClick={()=>inspectPart(part.id)}>
                      <b>{i+1}</b><span><strong>{part.name}</strong><small>{part.detail}</small></span>
                    </button>)}
                    {focusedPart && <div className="part-features" aria-live="polite"><strong>{focusedPart.name}</strong><ul>{focusedPart.features.map(feature=><li key={feature}>{feature}</li>)}</ul><button onClick={()=>setSelectedPart(null)}>단계 전체로 돌아가기</button></div>}
                  </div>
                </div>
              ) : tab === "layout" ? (
                <div
                  className="layout-content"
                  role="tabpanel"
                  id="detail-panel"
                  aria-labelledby="tab-layout"
                >
                  {report && (
                    <LayoutPlanner
                      assetId={assetId}
                      layout={layout}
                      report={report}
                      wireMm={wireMm}
                      selected={selectedAxis}
                      dirty={layoutDirty}
                      onChange={adjustAxis}
                      onWire={(mm) => setWires((prev) => ({ ...prev, [assetId]: mm }))}
                      onSelect={setSelectedAxis}
                      onReset={resetLayout}
                    />
                  )}
                </div>
              ) : (
                <div
                  className="info-content"
                  role="tabpanel"
                  id="detail-panel"
                  aria-labelledby="tab-info"
                >
                  <span className="info-kicker">PRODUCT OVERVIEW</span>
                  <dl>
                    {data.specs.map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="spec-note">
                    다아라 상품 페이지의 게시 사양입니다. 현재 판매 사양은 제조사 확인이 필요하며, 3D 모델은 공개 자료 기반 교육용 재구성입니다.
                  </p>
                  <a className="text-link" href={product.source} target="_blank" rel="noreferrer">
                    {product.name} 상품 상세 <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
              <div className="panel-bottom">
                <div className="playback-options" aria-label="재생 방식">
                  <button aria-pressed={playback==='loop'} onClick={()=>setPlayback('loop')}>이 단계 반복</button>
                  <button aria-pressed={playback==='sequence'} onClick={()=>setPlayback('sequence')}>전체 순서</button>
                </div>
                <button
                  className="play-button"
                  onClick={() => setPlaying(!playing)}
                  disabled={!ready && !failed}
                >
                  {playing ? (
                    <Pause size={17} />
                  ) : (
                    <Play size={17} fill="currentColor" />
                  )}
                  {playing ? "일시정지" : failed ? motionPreview ? "회전 동작 재생" : "동작 도해 재생" : playback==='loop' ? "이 단계 재생" : "전체 과정 재생"}
                  <span>{(playback==='loop'?6:24) / speed}s</span>
                </button>
                <p>
                  <span /> 실제 장비 제어가 아닌 작동 원리 시연입니다
                </p>
              </div>
            </aside>
            <section className="motion-workbench" aria-label="단계별 동작 상세">
              <div className="cycle-explanation">
                <span className="eyebrow">STEP 0{step+1} · {playback==='loop'?'REPEAT':'SEQUENCE'}</span>
                <h3>{detail.title}</h3>
                <p className="cycle-current">{phases[phaseIndex(elapsed)]}</p>
                <div className="cycle-phases">{phases.map((phase,i)=><button key={phase} className={i===phaseIndex(elapsed)?'active':''} aria-pressed={i===phaseIndex(elapsed)} onClick={()=>{setPlaying(false);setCyclePosition(i*1.5+.75);}}><b>{i+1}</b>{phase}</button>)}</div>
                <label className="cycle-scrubber">동작 위치 <input type="range" min="0" max="5.99" step=".01" value={elapsed} aria-label="단계 동작 위치" onChange={e=>{setPlaying(false); setCyclePosition(Number(e.target.value));}} /><span>{elapsed.toFixed(1)} / {CYCLE_SECONDS}s</span></label>
                <div className="cycle-actions"><button onClick={()=>setPlaying(!playing)} disabled={!ready && !failed}>{playing ? <Pause size={14}/> : <Play size={14}/>} {playing ? "동작 일시정지" : "동작 재생"}</button><button onClick={()=>{setCycleReset(v=>v+1);setPlayback("loop");setPlaying(true);}}>처음부터 반복 <RotateCcw size={14}/></button></div>
                <p className="tooling-note">공구 위치는 대표 교육 세팅입니다. 세부 형상은 HERDON 영상과 WAFIOS 공구 자료를 참고했으며 실제 HCM/HAM 세팅·치수는 미확인입니다.</p>
              </div>
              {planning && report ? (
                <LayoutDiagram
                  report={report}
                  selected={selectedAxis}
                  baseAngleDeg={baseAngleDeg}
                  onSelect={(i) => setSelectedAxis(selectedAxis === i ? null : i)}
                />
              ) : (
                <MotionDiagram step={step} elapsed={elapsed}/>
              )}
              {!planning && assetId==='hcm-35t' && (step===1 || step===2) && <RotaryDriveDiagram step={step} elapsed={elapsed}/>}
            </section>
            <div className="simulation-bar">
              <div className="bar-left">
                <button
                  aria-label="이전 단계"
                  onClick={() => selectStep((step + 3) % 4)}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  <b>0{step + 1}</b> / 04
                </span>
                <button
                  aria-label="다음 단계"
                  onClick={() => selectStep((step + 1) % 4)}
                >
                  <ChevronRight size={17} />
                </button>
                <div className="timeline" aria-label={`현재 ${step + 1}단계`}>
                  {data.steps.map((s, i) => (
                    <button
                      key={i}
                      className={i <= step ? "filled" : ""}
                      aria-label={`${s.title}로 이동`}
                      onClick={() => selectStep(i)}
                    />
                  ))}
                </div>
                <label className="speed-control">
                  <span>재생 속도</span>
                  <select
                    aria-label="재생 속도"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                  </select>
                </label>
              </div>
              <div className="bar-right">
                <button
                  aria-pressed={exploded}
                  onClick={() => setExploded(!exploded)}
                  disabled={failed}
                >
                  <Layers3 size={16} />
                  분해 보기
                  <span className={`switch ${exploded ? "on" : ""}`} />
                </button>
                <button
                  aria-pressed={labels}
                  onClick={() => setLabels(!labels)}
                  disabled={failed}
                >
                  <span className="label-icon">1</span>부품 표시
                  <span className={`switch ${labels ? "on" : ""}`} />
                </button>
              </div>
            </div>
          </div>
          <div className="viewer-footnote">
            <span>
              <CircleHelp size={13} /> 교육용 개념 시각화입니다. 내부 구조·공정
              순서는 제조사 검증이 필요합니다.
            </span>
            <button onClick={share}>
              <Link2 size={14} /> 이 시연 공유하기 <ArrowUpRight size={13} />
            </button>
          </div>
        </section>
        <section className="possibilities" id="possibilities">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BEYOND THE MACHINE</span>
              <h2>한 번의 시연, 더 많은 가능성.</h2>
            </div>
            <p>
              기술의 가치를 이해하는 순간,
              <br />
              다음 대화가 시작됩니다.
            </p>
          </div>
          <div className="feature-grid">
            {data.features.map(([title, desc], i) => {
              const Icon = [GraduationCap, Move3D, SlidersHorizontal][i];
              return (
                <article key={title}>
                  <div className="feature-top">
                    <Icon size={24} strokeWidth={1.5} />
                    <span>0{i + 1}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="roadmap" id="roadmap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                START SMALL, BUILD WITH CONFIDENCE
              </span>
              <h2>한 대부터 시작하는 디지털 전환.</h2>
            </div>
            <button
              className="outline-button"
              onClick={() => setModal("proposal")}
            >
              단계별 도입 제안 <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="roadmap-grid">
            {[
              [
                "01",
                "먼저, 경험하기",
                "대표 제품 1종의 외형과 핵심 작동 원리를 웹에서 시연합니다.",
                "지금 보고 있는 단계",
              ],
              [
                "02",
                "함께, 검증하기",
                "도면과 실제 공정으로 모델을 검수하고 교육 시나리오를 완성합니다.",
                "현장 자료 · 제조사 검수",
              ],
              [
                "03",
                "현장으로, 확장하기",
                "제품 라인업과 현장별 구성, 교육 콘텐츠를 필요한 만큼 확장합니다.",
                "범위와 예산에 맞춘 확장",
              ],
            ].map(([n, t, d, l]) => (
              <article key={n}>
                <span className="roadmap-number">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
                <span className="roadmap-label">
                  {n === "01" && <span className="live-dot" />}
                  {l}
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className="closing">
          <div>
            <span className="eyebrow">YOUR NEXT INDUSTRIAL EXPERIENCE</span>
            <h2>
              좋은 기술이,
              <br />더 쉽게 전달되도록.
            </h2>
          </div>
          <div>
            <p>
              우리 장비의 첫 번째 디지털 경험.
              <br />
              작은 시연부터 함께 설계해 보세요.
            </p>
            <button onClick={() => setModal("proposal")}>
              우리 회사 도입 제안 보기 <ArrowUpRight size={20} />
            </button>
          </div>
          <Box className="closing-bg" size={300} strokeWidth={0.5} />
        </section>
      </main>
      <footer>
        <a className="wordmark" href="#">
          form.
        </a>
        <p>기술을 이해하는 새로운 방식.</p>
        <span>© 2026 FORM · CONCEPT SHOWROOM</span>
        <a href="#showroom">다시 체험하기 ↑</a>
      </footer>
      <dialog
        ref={dialog}
        aria-label={
          modal === "videos"
            ? "제품 작동 영상"
            : modal === "help"
              ? "조작 안내"
              : "3D 쇼룸 도입 제안"
        }
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
        className={
          modal === "videos" ? "video-dialog" : ""
        }
      >
        <button
          className="modal-close"
          aria-label="닫기"
          onClick={() => setModal(null)}
        >
          <X size={22} />
        </button>
        {modal === "proposal" && (
          <>
            <span className="eyebrow">A SMALL FIRST STEP</span>
            <h2>
              {data.name}의<br />첫 번째 3D 쇼룸.
            </h2>
            <p className="modal-intro">
              대표 장비 한 대로 시작하고, 현장의 피드백으로 확장합니다.
            </p>
            <div className="proposal-items">
              {[
                "대표 장비 1종 · 4단계 작동 시연",
                "PC·모바일 웹 링크 · 별도 앱 설치 없음",
                "사진과 도면 검수 후 정확도 개선",
              ].map((t) => (
                <p key={t}>
                  <CheckCircle2 size={18} />
                  {t}
                </p>
              ))}
            </div>
            <div className="proposal-note">
              <strong>비용과 일정은 범위를 정한 뒤 협의합니다.</strong>
              <p>
                제품 도면, 작동 순서, 공개 가능한 사양을 준비하면 모델 상세도와
                교육 범위를 구체적으로 정할 수 있습니다.
              </p>
            </div>
            <button className="play-button" onClick={downloadProposal}>
              <Download size={17} /> 제안·메일 초안 내려받기
            </button>
            <button className="outline-button full" onClick={share}>
              <Link2 size={16} /> 이 시연 링크 복사
            </button>
            <p className="modal-fine">
              <Mail size={13} /> 검토용 초안이며, 다운로드해도 메일은 발송되지
              않습니다.
            </p>
          </>
        )}
        {modal === "videos" && (
          <>
            <span className="eyebrow">PRODUCT IN MOTION</span>
            <h2>{product.name} · 실제 작동 영상</h2>
            <p className="video-intro">상품 상세의 원본 영상{springProduct === 'hcm-35t' ? '과 회전 기구를 비교한 CSX 시리즈 영상' : ''}입니다. 3D 시연과 공구의 위치·움직임을 비교해 보세요.</p>
            <div className="video-options" aria-label="영상 선택">
              {product.videos.map((video, index) => (
                <button key={video.id} aria-pressed={videoIndex === index} onClick={() => setVideoIndex(index)}>
                  {index + 1}. {video.label}
                </button>
              ))}
            </div>
            <iframe
              key={product.videos[videoIndex].id}
              className="product-video"
              src={`https://www.youtube-nocookie.com/embed/${product.videos[videoIndex].id}`}
              title={`${product.name} ${product.videos[videoIndex].label}`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <p className="video-observation">관찰 포인트 · {product.videos[videoIndex].observed}</p>
            <div className="video-links">
              <a href={`https://www.youtube.com/watch?v=${product.videos[videoIndex].id}`} target="_blank" rel="noreferrer">YouTube에서 보기 <ArrowUpRight size={15} /></a>
              <a href={product.source} target="_blank" rel="noreferrer">상품 상세 · 사진과 사양 <ArrowUpRight size={15} /></a>
            </div>
            <p className="comparison-note">외부 영상이 재생되지 않으면 YouTube에서 열어 확인할 수 있습니다. 3D는 관찰한 동작을 교육용으로 단순화했으며 실제 CNC 타이밍과 생산 속도는 재현하지 않습니다.</p>
          </>
        )}
        {modal === "help" && (
          <>
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2>직접 움직여 보세요.</h2>
            <div className="help-items">
              <p>
                <MousePointer2 />
                드래그하여 회전, 휠 또는 두 손가락으로 확대
              </p>
              <p>
                <span className="help-number">1</span>숫자 표시나 오른쪽 목록을
                눌러 단계 선택
              </p>
              <p>
                <Play />
                전체 재생으로 네 단계의 작동 과정 관찰
              </p>
              <p>
                <Layers3 />
                분해 보기로 부품의 배치와 관계 확인
              </p>
            </div>
            <p className="modal-fine">
              실제 장비의 조작 교육은 제조사 안전 지침을 따라야 합니다.
            </p>
          </>
        )}
      </dialog>
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}
