import { springCycle } from './process-cycle';
export function MotionDiagram({step,elapsed}:{step:number;elapsed:number}) {
  const c=springCycle(step,elapsed);
  const x=step===0?80+c.feed*132:step===1?188:180;
  return <figure className="motion-diagram">
    <figcaption><strong>동작 도해</strong><span>대표 공구 세팅 · 위치 관계 단순화</span></figcaption>
    <svg viewBox="0 0 320 180" role="img" aria-label={['롤러가 선재를 가이드로 공급하는 동작','성형 팁에서 코일이 형성되는 동작','가동 날이 고정 날과 교차한 뒤 복귀하는 동작','절단된 스프링이 받침대로 낙하하는 동작'][step]}>
      <defs><marker id={`arrow-${step}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs>
      <path d="M20 145H300" stroke="#dce3ed"/>
      <rect x="94" y="72" width="71" height="25" rx="3" fill="#d4deea" stroke="#8094ad"/>
      <path d="M94 84H165" stroke="#fff" strokeWidth="4"/>
      <text x="126" y="62" textAnchor="middle">선재 가이드</text>
      <path d={`M18 84H${x}`} stroke="#e0a534" strokeWidth="4"/>
      {step===0 && <>
        {[57,111].map((y,i)=><g key={y} transform={`translate(55 ${y}) rotate(${c.feed*360*(i===0?1:-1)})`}><circle r="19" fill="#6f839a"/><circle r="6" fill="#e7edf4"/><path d="M0 -16V-8M0 8V16M-16 0H-8M8 0H16" stroke="#dce5ee" strokeWidth="2"/></g>)}
        <path d="M175 112H245" stroke="#315bef" strokeWidth="2" markerEnd={`url(#arrow-${step})`}/>
        <text x="55" y="151" textAnchor="middle">이송 롤러</text><text x="215" y="135" textAnchor="middle">선재 전진</text>
      </>}
      {step>0 && <g transform={`translate(0 ${step===3?c.drop*55:0})`} opacity={step===3&&c.drop>.97?.35:1}>
        {Array.from({length:8},(_,i)=><ellipse key={i} cx={188+i*9} cy="84" rx="8" ry="16" fill="none" stroke="#c48b1d" strokeWidth="3" opacity={step===1&&i>Math.floor(c.form*8)?0:1}/>)}
      </g>}
      {step===1 && <>
        <g transform={`translate(${-c.tool*14} 0)`}><rect x="270" y="89" width="30" height="24" rx="2" fill="#9eacbd"/><path d="M270 91H251V99H270" fill="#465d77"/></g>
        <path d="M282 130H240" stroke="#315bef" strokeWidth="2" markerEnd={`url(#arrow-${step})`}/>
        <text x="275" y="152" textAnchor="middle">성형 팁</text>
      </>}
      {step===2 && <>
        <path d="M166 44H196V68L180 78L166 68Z" fill="#60758b"/><text x="224" y="41" textAnchor="middle">고정 받침 날</text><path d="M204 46L186 60" stroke="#60758b"/>
        <g transform={`translate(0 ${-c.cut*38})`}><path d="M164 139H196L190 108H170Z" fill="#405974"/><path d="M170 108H190L192 114H168Z" fill="#b6cbdc"/><rect x="160" y="139" width="40" height="16" rx="2" fill="#9aaabc"/></g>
        <path d="M218 141V105" stroke="#ef7839" strokeWidth="2" markerEnd={`url(#arrow-${step})`}/><text x="250" y="153" textAnchor="middle">커팅 날 전진</text>
        {c.cut>.85&&<circle cx="180" cy="82" r="9" fill="none" stroke="#ed7734" strokeWidth="2"/>}
      </>}
      {step===3 && <><path d="M173 151H275V142M173 142V151" fill="none" stroke="#547394" strokeWidth="4"/><path d="M283 90V124" stroke="#315bef" strokeWidth="2" markerEnd={`url(#arrow-${step})`}/><text x="224" y="173" textAnchor="middle">배출 받침대</text></>}
    </svg>
  </figure>;
}
