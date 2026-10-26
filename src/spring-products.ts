export type SpringProductId = "hcm-35t" | "ham-10t";
const steps = [
  {
    title: "선재 공급", english: "WIRE FEEDING",
    text: "후면의 공급 롤러가 선재를 중앙 가이드로 이송합니다. 공구가 접근하기 전에 필요한 길이를 공급합니다.",
    point: "관찰 포인트", detail: "중앙 가이드와 선재의 방향을 살펴보세요. 후면 롤러 배치는 공개 사양의 개수에 맞춘 개념 표현입니다.",
    position: [-0.12, 2.12, 0.92],
  },
  {
    title: "굽힘 · 코일 성형", english: "BENDING & FORMING",
    text: "외곽 8개 서보 원판의 회전이 편심 핀과 연결 링크를 통해 공구의 왕복 운동으로 전달됩니다. 성형 공구는 순서를 달리해 움직이고, 절단축은 다음 단계에서 작동합니다.",
    point: "영상 관찰", detail: "CSX-35·CSX-20의 작동 영상을 추가 대조했습니다. 회전·링크 구조를 반영했으며 HCM의 정확한 편심량과 축별 타이밍은 교육용 예시입니다.",
    position: [0, 1.96, 1.08],
  },
  {
    title: "커팅 날 · 절단", english: "CUTTING STROKE",
    text: "하부 커팅 슬라이드가 날을 밀어 올리고 고정 받침 앞에서 선재를 절단한 뒤 복귀합니다. 날 끝과 가이드 출구의 위치를 확대해 보세요.",
    point: "공구 세팅 예시", detail: "가동 날·받침·클램프를 별도 부품으로 표현했습니다. 절단 공구의 정확한 위치와 세팅은 가공 제품에 따라 달라집니다.",
    position: [0.64, 1.39, 0.94],
  },
  {
    title: "배출 · 품질 확인", english: "OUTPUT & INSPECTION",
    text: "성형이 끝난 선재를 절단하고 받침대로 배출하는 과정을 보여줍니다. 실제 검사 장치는 후속 연계 검토 대상입니다.",
    point: "교육용 재구성", detail: "동작은 영상 관찰을 바탕으로 느리게 재구성했습니다. 실제 CNC 프로그램이나 생산 속도를 재현한 것은 아닙니다.",
    position: [0, 0.9, 1.0],
  },
] as const;
export const springProducts = {
  "hcm-35t": {
    name: "HCM-35T", summary: "8축 회전 링크 · 독립 슬라이드", sourceId: "432341",
    source: "https://blog.daara.co.kr/sell_view.html?cid=ikhome&no=432341",
    steps,
    videos: [
      { id: "JeaOk84H3DE", label: "성형부 가공 영상 1", observed: "중앙 가이드와 방사형 공구의 접근·복귀" },
      { id: "i_u42MBUcUk", label: "HCM-35T 원본 2", observed: "공구 끝단과 선재 굽힘 과정" },
      { id:"Q0-Ti_HLaRQ",label:"CSX-35 · 회전 링크 참고",observed:"24–28초: 외곽 원판·편심 핀과 연결 링크. HCM과 다른 모델의 기구 참고 영상입니다." },
      { id:"WV2KPmobq_M",label:"CSX-20 · 8축 동작 참고",observed:"18–19.4초: 각 원판의 회전과 링크 각도 변화. 치수와 제어 타이밍을 HCM과 동일하게 간주하지 않습니다." },
    ],
    specs: [
      ["모델 / 제조사", "HCM-35T / HERDON"],
      ["구동 방식", "무캠식 · 기본 12축 / 최대 16축"],
      ["가공 선경", "Ø 1.0–4.0 mm"],
      ["최대 이송률 / 스트로크", "90 m/min / 130 mm"],
      ["공급 롤러 / 중량", "6개 / 4,000 kg"],
      ["게시 치수 (cm)", "210 × 200 × 195"],
    ],
    comparison: [
      ["전면과 조작반", "모서리가 꺾인 전면판, 8방향 슬라이드, 우측 모니터와 조작반을 상세 사진에 맞췄습니다."],
      ["무캠식 구동", "독립 슬라이드 왕복과 대각선 스피너를 재구성했습니다. 외곽 서보 원판의 회전과 편심 핀·링크 왕복을 연결했습니다. 정지된 베어링 하우징과 회전 원판은 별도 부품입니다."],
      ["영상과 사양", "상세 페이지의 영상 2개에서 중앙 가이드·공구·선재를 확인했습니다. 내부 롤러 배치와 CNC 타이밍은 개념 표현입니다."],
    ],
  },
  "ham-10t": {
    name: "HAM-10T", summary: "상부 XYZ 툴 체인저", sourceId: "432398",
    source: "https://blog.daara.co.kr/sell_view.html?cid=ikhome&no=432398",
    steps: steps.map((s, i) => ({ ...s,
      ...(i === 1 ? { title: "툴 체인저 · 코일 성형", english: "XYZ TOOL CHANGER",
        text: "12시 방향 슬라이드 대신 독립된 4축 툴 체인저를 사용합니다. 상부 헤드가 XYZ 방향으로 이동하며 선재 가공을 돕습니다.",
        point: "HAM-10T 구조", detail: "영상에 보이는 수직 공구와 중앙 가이드 사이의 움직임을 살펴보세요. 실제 제어 프로그램은 공개되어 있지 않습니다." } : {}),
      position: i === 0 ? [-.12, 1.99, .92] : i === 1 ? [0, 1.82, 1.08] : i === 2 ? [0, 1.67, .94] : [0,1.16,1.0],
    })),
    videos: [
      { id: "1aTlmCkzxtI", label: "상부 공구 가공 영상", observed: "수직 공구와 중앙 선재 가이드의 상대 움직임" },
      { id: "Lr1UDtIvx5w", label: "중앙 성형부 확대 영상", observed: "중앙 가이드 둘레의 공구와 선재" },
    ],
    specs: [
      ["모델 / 제조사", "HAM-10T / HERDON"],
      ["구동 방식", "무캠식 · 기본 12축 / 최대 16축"],
      ["특징", "독립 4축 툴 체인저 · XYZ 이동"],
      ["가공 선경", "Ø 0.4–1.0 mm"],
      ["최대 이송률 / 스트로크", "160 m/min / 80 mm"],
      ["공급 롤러 / 중량", "4개 / 850 kg"],
      ["게시 치수 (cm)", "140 × 120 × 160"],
    ],
    comparison: [
      ["덮개와 외장", "열린 상부 보호 커버, 좁은 본체와 우측 조작반을 HAM-10T 상세 사진 기준으로 재구성했습니다."],
      ["상부 툴 체인저", "12시 방향 슬라이드를 대체하는 상부 헤드와 하단 슬라이드 구성을 반영했습니다. XYZ 이동은 교육용으로 단순화했습니다."],
      ["영상의 공구 동작", "두 영상에서 중앙 가이드와 공구 끝단, 상부 수직 공구의 위치 변화를 확인했습니다. 코일은 학습을 위한 예시 형상입니다."],
    ],
  },
} as const;
export function currentSpringProduct(): SpringProductId {
  return new URLSearchParams(location.search).get("product") === "ham-10t" ? "ham-10t" : "hcm-35t";
}
