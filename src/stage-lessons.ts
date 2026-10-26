export interface PartNote { id: string; name: string; detail: string; position: [number, number, number]; }
export function stageParts(asset: string, step: number): PartNote[] {
  const h = asset === 'ham-10t' ? 1.82 : 1.96;
  return [
    [{id:'feed',name:'이송 롤러',detail:'맞물린 롤러가 선재를 이송',position:[0,h,-.63]}, {id:'quill',name:'선재 가이드 · 퀼',detail:'중앙 보어로 선재 유도',position:[0,h,.85]}, {id:'wire',name:'공급 선재',detail:'가이드 출구에서 성형부로 전진',position:[0,h,.93]}],
    [{id:'guideway',name:'직선 가이드',detail:asset==='hcm-35t'?'연마 레일 · 링크 왕복 · 위치 눈금':'연마 레일 · 나선 이송축 · 위치 눈금',position:[.57,h,.66]}, {id:'carriage',name:'이동 슬라이더',detail:'새들 · 끝단 씰 · 윤활 니플',position:[.39,h,.78]}, {id:'drive',name:asset==='hcm-35t'?'회전 원판 · 연결 링크':'서보 구동부',detail:asset==='hcm-35t'?'원판 회전 · 편심 핀 · 링크 왕복':'하우징 · 베어링 커버 · 케이블 글랜드',position:[asset==='ham-10t'?.69:.94,h,.61]}, {id:'forming',name:'성형 팁',detail:'선재를 받쳐 코일로 굽힘',position:[.09,h-.03,.96]}, {id:'coil',name:'성형 중 선재',detail:'선경을 유지하며 권수 증가',position:[.04,h,1.04]}, {id:asset==='ham-10t'?'head':'spinner',name:asset==='ham-10t'?'상부 공구 헤드':'스피너',detail:'제품별 보조 성형 공구',position:asset==='ham-10t'?[.1,2.14,.86]:[-.2,h-.2,.91]}],
    [{id:'cutter',name:'커팅 슬라이드 · 홀더',detail:'안착 홈 · 가이드 턱 · 체결부',position:[0,h-.28,.9]}, {id:'blade',name:'교체형 커팅 인서트',detail:'날 끝 · 경사면 · 매입형 체결부',position:[0,h-.14,.95]}, {id:'anvil',name:'고정 받침 날',detail:'선재 절단 위치를 지지',position:[0,h+.035,.93]}, {id:'quill',name:'선재 가이드 출구',detail:'가이드 앞에서 절단',position:[0,h,.85]}],
    [{id:'coil',name:'완성 스프링',detail:'공구 이격 후 아래로 낙하',position:[.04,h-.3,1.08]}, {id:'tray',name:'배출 받침대',detail:'제품을 수집하는 위치',position:[0,asset==='ham-10t'?1.16:.9,1.0]}],
  ][step] as PartNote[];
}
