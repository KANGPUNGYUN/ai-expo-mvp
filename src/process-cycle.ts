/** Six-second teaching cycles shared by the model, timeline and motion diagrams. */
export const CYCLE_SECONDS = 6;
export function cycleProgress(elapsed: number) { return ((elapsed % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS / CYCLE_SECONDS; }
export function ramp(t: number, start: number, end: number) {
  const x = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
}
export function stroke(t: number, start = .18, end = .72) {
  return ramp(t, start, start + .16) * (1 - ramp(t, end, end + .16));
}
export function springCycle(step: number, elapsed: number) {
  const t = cycleProgress(elapsed);
  return {
    t,
    feed: step === 0 ? ramp(t,.1,.72) : 1,
    form: step === 1 ? ramp(t,.12,.76) : step > 1 ? 1 : 0,
    cut: step === 2 ? stroke(t,.2,.62) : 0,
    drop: step === 3 ? ramp(t,.2,.78) : 0,
    tool: step === 1 ? stroke(t,.12,.7) : 0,
  };
}
export const processPhases = [
  ["롤러 준비", "선재 이송", "가이드 통과", "공급 정지"],
  ["공구 접근", "선재 굽힘", "코일 형성", "공구 복귀"],
  ["절단 위치 정렬", "커팅 날 전진", "날·받침 교차", "커팅 날 복귀"],
  ["공구 이격", "스프링 분리", "받침대로 낙하", "배출 확인"],
] as const;
export function phaseIndex(elapsed: number) { return Math.min(3, Math.floor(cycleProgress(elapsed) * 4)); }
