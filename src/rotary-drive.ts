import { cycleProgress, ramp } from './process-cycle.ts';
/** Observed servo crank / connecting-link topology. Dimensions and schedule are illustrative. */
export function drivePose(index: number, step: number, elapsed: number, reach=.86, eccentricOverride?: number) {
  const cutter=index===6;
  // The layout planner drives the eccentric; link length follows so the rest position stays at .50.
  const eccentric=eccentricOverride ?? (cutter?.059:.0225);
  const radius=reach+.08;
  const linkLength=radius+eccentric-.50;
  const t=cycleProgress(elapsed);
  const start=cutter?.20:.08+(index%4)*.035;
  const end=cutter?.62:.60+(index%3)*.025;
  const active=step===(cutter?2:1);
  const theta=active ? Math.PI*(ramp(t,start,start+.16)+ramp(t,end,end+.16)) : 0;
  const pinRadial=radius+eccentric*Math.cos(theta);
  const pinLateral=eccentric*Math.sin(theta);
  const sliderRadial=pinRadial-Math.sqrt(linkLength**2-pinLateral**2);
  // Clamp rounding at the rest position so repeated pose application has no drift.
  const travel=Math.max(0,.50-sliderRadial);
  const linkAngle=Math.atan2(pinLateral,pinRadial-sliderRadial);
  return {theta,travel,pinRadial,pinLateral,sliderRadial,linkLength,linkAngle,eccentric,radius,active};
}
