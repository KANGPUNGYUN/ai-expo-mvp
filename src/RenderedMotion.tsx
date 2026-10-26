import { useEffect, useRef, useState } from 'react';
import { assetUrl } from './asset-url';
/** Labelled pre-rendered fallback. The shared process clock remains authoritative. */
export function RenderedMotion({step,elapsed,active,speed,onFailure}:{step:number;elapsed:number;active:boolean;speed:number;onFailure:()=>void}) {
  const video=useRef<HTMLVideoElement>(null);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>setLoaded(false),[step]);
  useEffect(()=>{
    const v=video.current;if(!v||!loaded)return;
    v.playbackRate=speed;
    if(Math.abs(v.currentTime-elapsed)>.22 || !active) v.currentTime=Math.min(elapsed,Math.max(0,v.duration-.01));
    if(active) { if(v.paused) void v.play().catch((error: unknown)=>{
      // A stage change or a deliberate pause can interrupt a pending play request.
      if(error instanceof DOMException && error.name === 'AbortError') return;
      onFailure();
    }); }
    else v.pause();
  },[elapsed,active,speed,loaded,onFailure]);
  return <video ref={video} key={step} muted playsInline preload="auto" loop
    src={assetUrl(`models/hcm-35t-motion-${step}.mp4?v=rotation-6`)}
    poster={assetUrl(`models/hcm-35t-step-${step}.webp?v=rotation-6`)}
    aria-label="8축 원판 회전과 링크 왕복의 사전 렌더 동영상"
    onLoadedData={()=>setLoaded(true)} onError={onFailure}/>;
}
