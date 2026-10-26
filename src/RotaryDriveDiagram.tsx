import { useState } from 'react';
import { drivePose } from './rotary-drive';
export function RotaryDriveDiagram({step,elapsed}:{step:number;elapsed:number}) {
  const [selected,setSelected]=useState(0);
  const poses=Array.from({length:8},(_,i)=>drivePose(i,step,elapsed));
  const focus=poses[selected];
  const px=503+(focus.pinRadial-focus.radius)*350;
  const py=170-focus.pinLateral*350;
  const sx=503+(focus.sliderRadial-focus.radius)*350;
  return <figure className="rotary-diagram">
    <figcaption><div><strong>8개 회전 구동부</strong><p>원판 회전 → 편심 핀 → 연결 링크 → 공구 왕복</p></div><span>영상 기반 기구 재구성 · 각도·시간은 교육용</span></figcaption>
    <div className="rotary-visuals"><svg viewBox="0 0 355 365" role="img" aria-label="8개 독립 회전 원판과 연결 링크">
      <circle cx="174" cy="170" r="26" fill="#d8e1ed" stroke="#7b91ac"/>
      {poses.map((p,i)=>{
        const a=i*Math.PI/4,scale=137;
        const point=(radial:number,lateral=0)=>[174+(radial*Math.cos(a)-lateral*Math.sin(a))*scale,170-(radial*Math.sin(a)+lateral*Math.cos(a))*scale];
        const c=point(p.radius),pin=point(p.pinRadial,p.pinLateral),slide=point(p.sliderRadial),tip=point(.18-p.travel);
        const color=i===6?'#e17f3a':selected===i?'#315bef':'#7589a3';
        return <g key={i} data-drive={i+1} data-angle={p.theta.toFixed(4)}>
          <path d={`M${point(.23)}L${c}`} stroke="#dce4ee" strokeWidth="19"/>
          <circle cx={c[0]} cy={c[1]} r="20" fill="#f4f7fb" stroke={color} strokeWidth={selected===i?3:1}/>
          <g transform={`translate(${c}) rotate(${-p.theta*180/Math.PI})`}><path d="M0 0L15 0" stroke={color} strokeWidth="3"/>{[0,1,2].map(n=><circle key={n} cx={12*Math.cos(n*2*Math.PI/3)} cy={12*Math.sin(n*2*Math.PI/3)} r="2.2" fill={color}/>)}</g>
          <path d={`M${pin}L${slide}`} stroke={color} strokeWidth="6" strokeLinecap="round"/>
          <path d={`M${slide}L${tip}`} stroke="#344b66" strokeWidth="8"/>
          <circle cx={pin[0]} cy={pin[1]} r="3" fill="#ffc35c" stroke="#9f7421"/>
          <circle cx={slide[0]} cy={slide[1]} r="3" fill="#fff" stroke={color}/>
          <text x={point(1.14)[0]} y={point(1.14)[1]+4} textAnchor="middle" fill={color} fontSize="11">{i+1}</text>
        </g>;
      })}
      <text x="174" y="350" textAnchor="middle" fill="#647b97" fontSize="11">각 원판은 자신의 중심축을 기준으로 회전합니다</text>
    </svg><svg viewBox="280 30 310 270" role="img" aria-label="선택 구동부의 회전과 왕복 확대 도해">
      <text x="490" y="68" textAnchor="middle" fill="#263f60" fontSize="14">구동부 {selected+1}{selected===6?' · 절단축':''}</text>
      <path d="M334 170H503" stroke="#dce4ee" strokeWidth="26"/>
      <circle cx="503" cy="170" r="48" fill="#e7edf5" stroke="#627c9f"/>
      <g transform={`translate(503 170) rotate(${-focus.theta*180/Math.PI})`}><path d="M0 0H39" stroke="#315bef" strokeWidth="4"/>{[0,1,2,3,4].map(i=><circle key={i} cx={35*Math.cos(i*2*Math.PI/5)} cy={35*Math.sin(i*2*Math.PI/5)} r="4" fill="#6e86a5"/>)}</g>
      <rect x={sx-13} y="153" width="27" height="34" rx="3" fill="#7b91ad"/>
      <path d={`M${px} ${py}L${sx} 170`} stroke="#344c6b" strokeWidth="11" strokeLinecap="round"/>
      <circle cx={px} cy={py} r="7" fill="#ffc35c" stroke="#936d20"/>
      <circle cx={sx} cy="170" r="5" fill="#fff" stroke="#344c6b"/>
      <text x="503" y="242" textAnchor="middle" fill="#315bef" fontSize="14">회전각 {(focus.theta*180/Math.PI).toFixed(0)}°</text>
      <text x="490" y="266" textAnchor="middle" fill="#607995" fontSize="12">공구 전진 {(focus.travel/(focus.eccentric*2)*100).toFixed(0)}%</text>
    </svg></div>
    <div className="drive-picker" aria-label="회전 구동부 선택">{poses.map((p,i)=><button key={i} aria-pressed={i===selected} onClick={()=>setSelected(i)}><b>{i+1}{i===6?' · 절단':''}</b><span>{p.active?'작동':'대기'}</span></button>)}</div>
  </figure>;
}
