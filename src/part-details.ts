export interface PartDetail {
  name: string;
  features: string[];
  target: [number, number, number];
  offset: [number, number, number];
}
export function partDetail(asset: string, id: string | null): PartDetail | undefined {
  if (!id) return undefined;
  const h=asset==='ham-10t'?1.82:1.96;
  const reach=asset==='ham-10t'?.61:.86;
  const details: Record<string,PartDetail> = {
    feed: {name:'송급 롤러 조립체',features:['V형 선재 홈','축 어깨와 고정 나사','베어링 받침·입구 부시'],target:[0,h,-.63],offset:[.64,.76,-1.28]},
    quill: {name:'선재 가이드 · 퀼',features:['관통 보어와 교체형 부시','분할 콜릿·잠금 너트','플랜지 체결·인서트 고정부'],target:[0,h,.73],offset:[.25,.18,.8]},
    guideway: {name:'직선 가이드 조립체',features:['양측 연마 레일·체결 홈',asset==='hcm-35t'?'회전 링크로 구동되는 슬라이드':'중앙 나선형 이송축','끝단 스토퍼·위치 눈금'],target:[(reach+.2)/2,h,.64],offset:[.25,.27,1.05]},
    carriage: {name:'이동 슬라이더',features:['새들·상부 체결판','끝단 씰과 고정 나사','윤활 주입 니플'],target:[.39,h,.74],offset:[.18,.13,.62]},
    forming: {name:'성형 공구 조립체',features:['분리된 공구 홀더·샹크','교체형 접촉 팁·성형 롤러','미세 조정 노브·고정 나사'],target:[.22,h,.87],offset:[.18,.16,.95]},
    cutter: {name:'커팅 슬라이드 · 홀더',features:['날 안착 홈과 양측 가이드 턱','슬라이더·홀더 결합면','별도 인서트 체결 나사'],target:[0,h-.26,.87],offset:[.23,.15,.95]},
    blade: {name:'교체형 커팅 인서트',features:['연마된 날 끝과 경사면','실제 두께가 있는 인서트','매입형 육각 소켓 체결부'],target:[0,h-.16,.94],offset:[.10,.055,.36]},
    anvil: {name:'고정 절단 받침',features:['접촉면·초경 받침 인서트','높이 조정 슬롯','고정 브래킷·조정 노브'],target:[-.06,h+.05,.85],offset:[.18,.13,.56]},
    drive: {name:asset==='hcm-35t'?'회전 원판 · 연결 링크':'서보 구동부',features:asset==='hcm-35t'?['자기 중심축으로 도는 서보 원판','편심 핀·양단 링크 베어링','회전을 공구 왕복으로 전달']:['단차가 있는 하우징','베어링 커버·둘레 체결부','케이블 글랜드'],target:[asset==='hcm-35t'?.74:reach+.08,h,.68],offset:[.24,.20,asset==='hcm-35t'?1.25:.85]},
    spinner: {name:'스피너 축 · 콜릿',features:['분리된 회전 축·콜릿','공구를 잡는 축 구멍','정지 하우징과 회전부 구분'],target:[0,h-.17,.91],offset:[.25,.2,1.1]},
    head: {name:'상부 공구 헤드',features:['횡방향 가이드·터릿','스핀들·단차형 척','척 그립 홈과 공구 축'],target:[0,2.35,.82],offset:[.35,.25,1.5]},
  };
  return details[id];
}
