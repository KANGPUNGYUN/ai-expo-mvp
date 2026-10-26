# 공구 상세 및 단계별 동작 고도화

2026-10-22. HCM-35T / HAM-10T 외형은 [기존 상품·영상 조사](../product-research/README.md)를 유지합니다. 작은 공구가 저해상도 영상에서 구분되지 않는 부분은 WAFIOS 공식 공구 자료의 확대 사진·도해를 대조했습니다. 웹 확인은 gstack browse, PDF는 Poppler로 렌더링하여 시각 확인했습니다.

## 부품별 근거와 반영

| 부품 | 공식 자료 | 반영한 형상 | 한계 |
|---|---|---|---|
| 공급 롤러 | [Feed rollers W01/W03](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Druck-feder/L_TC_Feed-Rollers-W01-W03_V1-1_EN.pdf) | 외주 홈, 중심 축·고정부, 마주 보는 롤러 | HCM/HAM 실제 롤러 배치는 미확인 |
| 선재 가이드·퀼 | [Coiling wire guide with insert](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Schenkel-feder/L_TC_Coiling-Wire-Guide-with-Insert_V1-2_EN.pdf) | 중앙 보어, 교체형 인서트, 고정 나사, 가이드 출구 | 해당 공구와 HCM/HAM의 호환성 근거가 아님 |
| 성형 팁 | [Modular coiling set](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Schenkel-feder/L_TC_Modular-Coiling-Set-MCS_V1-2_EN.pdf) / [Coating tooling](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Druck-feder/L_TC_Coating-Tooling_V1-1_EN.pdf) | 홀더·접촉 팁·조정 나사, 구분된 재질 | 교육용 코일 세팅이며 실물 세팅 도면 아님 |
| 커팅 날·클램프 | [Cutting tool holder with insert](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Druck-feder/L_TC_Cutting-Tool-Holder-with-Insert_V1-3_EN.pdf) | 클램프, 체결 볼트, 교체형 날, 연마된 얇은 날 끝 | HCM/HAM 전용 공구 규격 미확인 |
| 절단 받침 | [Cutting mandrels and cutters W04](https://www.wafios.com/fileadmin/user_upload/WAFIOS/Downloads/Downloads_Prospekte/Englisch/Werkzeug/Druck-feder/L_TC_TC-W04-Cutting-Mandrels-and-Cutters_V1-2_EN.pdf) | 고정 지지부와 가동 날을 분리 | 회전 절단 공구 자료는 형상 참고이며 HCM/HAM 직선 절단 방식의 증거가 아님 |

공식 자료 목록: [압축 스프링 기계](https://www.wafios.com/en/machines/spring-coiling-machines/compression-spring-machines), [토션 스프링 기계](https://www.wafios.com/en/machines/spring-coiling-machines/torsion-spring-machines). 원본 PDF와 확인용 PNG는 이 폴더에 보관했습니다.

## 구현

- 스프링: 공급 → 성형 → 절단 → 배출. 하부 슬라이드를 독립 커팅 조립체로 구분하고 고정 받침, 선재 출구, 날의 전진·복귀를 표시합니다. 송급 롤러는 반대 방향으로 회전하고 코일 권수는 선경을 유지한 채 증가합니다.
- HCM: 7개 성형 슬라이드 + 1개 커팅 슬라이드, 스피너 2개. HAM: 4개 성형 슬라이드 + 1개 커팅 슬라이드, 상부 XYZ 공구 헤드. 이는 교육용 공구 배정이며 제조사 공정 프로그램이 아닙니다.
- 단계 클릭 시 확대·반복 재생. 6초 시계로 3D, 동작 도해, 진행 구간을 동기화합니다. 세부 구간 클릭이나 슬라이더 조작 시 정지 자세로 탐색합니다.
- WebGL 미지원 환경에는 12개 단계 정지 렌더와 SVG 동작 도해를 제공합니다. 정지 이미지를 실시간 3D로 표시하지 않습니다.

## 재생성

`build_spring_products.py`를 Blender MCP에 전체 소스로 전달합니다. `scripts/previews/*-step-*.png`와 GLB가 생성됩니다. PNG는 Pillow로 품질 92 WebP로 변환하여 `public/models`에 둡니다. 스프링 전체 렌더는 `*-v4.png`입니다.

정확한 치수, 공구 간 여유, 절단 궤적·타이밍은 제조사 도면·세팅 및 검수가 필요합니다. 이 결과는 부품 위치와 작동 관계를 설명하는 시연 모델입니다.

## v5: 개별 부품 형상 재작성

사용자가 확대 상태에서도 부품 상세가 부족하다고 피드백하여 공구부를 다시 모델링했습니다.

- 소켓 나사: 돌출 다각형 대신 와셔, 원통 머리, 내부 육각 소켓 벽과 바닥을 실제 메시로 구현했습니다.
- 퀼: 내부가 막힌 원통 대신 관통 보어, 단계별 선삭 단면, 콜릿 너트·인서트·체결 브래킷을 구분했습니다.
- 송급: 외주 V홈을 회전 단면 메시로 제작하고 축·베어링 받침·입구 부시를 추가했습니다.
- 직선 구동: 가이드 레일, 새들, 끝단 씰, 윤활 니플, 위치 눈금, 스토퍼와 나선형 이송축을 구분했습니다. **나선형 이송축·윤활 구조와 눈금은 기계 요소 설명을 위한 대표 형상이며 해당 HERDON 제품의 내부 구동 설계를 확인한 것이 아닙니다.**
- 절단: 커팅 홀더와 교체형 인서트를 별도 노드로 나누고 안착 홈·측면 턱·날의 경사면·체결부를 추가했습니다. 인서트는 커팅 슬라이드의 자식으로 같은 궤적을 따릅니다.
- 두 제품 각각 10개 부품 렌더, 개별 카메라 목표, 부품별 관찰 항목을 연결했습니다. WebGL 미지원 시에도 부품 선택에 따라 다른 확대 이미지가 표시됩니다.
- Meshopt + 16비트 위치 양자화로 HCM 5,419,388 → 1,092,740 bytes, HAM 3,607,892 → 802,292 bytes. 형상 단순화(decimation)는 적용하지 않았습니다. `three-stdlib`의 실제 클라이언트 디코더로 CPU 로딩·동작 검사를 통과했습니다.

재생성 순서: Blender MCP에서 `scripts/build_spring_products.py` 실행 → `scripts/previews/*-part-*.png`, `*-step-*.png`, `*-v5.png`를 WebP로 변환 → `node scripts/optimize-models.mjs` → 모델/동작 검사와 빌드. `scripts/render_part_previews.py`는 부품 렌더 함수의 별도 사본입니다.

## v6: HCM 회전 기구 정정

추가 영상 조사에서 회전 원판의 편심 핀과 연결봉에 의한 왕복 전달을 확인했습니다. HCM의 v5 노출 이송축은 제거하고 고정 베어링 몸체·회전 원판·링크·직선 가이드로 교체했습니다. 기존 v5 기록의 이송축은 이전 대표 형상이며 현재 HCM 구현에 해당하지 않습니다. HAM의 별도 구조는 유지합니다. [영상 프레임과 구현 범위](../rotation-research/README.md). 최신 전체 렌더 파일은 `*-v6.png`이며, HCM 성형·절단에는 시계와 동기화하는 사전 렌더 동영상 대체 화면을 추가했습니다.
