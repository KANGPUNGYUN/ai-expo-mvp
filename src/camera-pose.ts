import { partDetail } from "./part-details.ts";
/** Keep the complete equipment in view when the showroom becomes narrow. */
export function cameraPose(view: string, aspect: number, step = 0, assetId = "hcm-35t", selectedPart: string | null = null) {
  if (view === "focus") {
    const detail=partDetail(assetId,selectedPart);
    if(detail) {
      const scale=Math.max(1,1.25/Math.max(aspect,.1));
      return {target:detail.target,position:detail.target.map((v,i)=>v+detail.offset[i]*scale) as [number,number,number]};
    }
    if(assetId==="hcm-35t" && step===1) {
      const target:[number,number,number]=[0,1.96,.65];
      const scale=Math.max(1,1.05/Math.max(aspect,.1));
      return {target,position:[.3*scale,1.96+.2*scale,.65+4.15*scale] as [number,number,number]};
    }
    const height = assetId === "ham-10t" ? 1.82 : 1.96;
    const target: [number,number,number] =
      step === 0 ? [0,height,.12] : step === 3 ? [.03,height-.35,1] : [.015,height,.91];
    const offset: [number,number,number] =
      step === 0 ? [1.05,1.35,-2.05] : step === 3 ? [.4,.3,2.5] : [.21,.18,1.62];
    const scale=Math.max(1,.95/Math.max(aspect,.1));
    return {target,position:target.map((v,i)=>v+offset[i]*scale) as [number,number,number]};
  }
  const target: [number, number, number] = [0, 1.8, 0];
  const position: [number, number, number] = view === "front" ? [0, target[1], 8.5] : [2.5, 3.2, 8.8];
  const distanceScale = Math.max(1, 0.95 / Math.max(aspect, 0.1));
  for (let axis = 0; axis < 3; axis++) {
    position[axis] = target[axis] + (position[axis] - target[axis]) * distanceScale;
  }
  return { position, target };
}
