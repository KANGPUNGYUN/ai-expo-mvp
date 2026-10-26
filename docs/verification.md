# 검증 기록

2026-10-21 · 로컬 개발 서버 5173 / 프로덕션 빌드 미리보기 4173

## 범위 축소 (2026-10-26)

쇼룸을 아이케이미래 HCM-35T / HAM-10T 단독 구성으로 정리했습니다. 이전에 포함했던 두 번째 업체(절삭유 정제기) 화면, 모델, 생성 스크립트, 현장 배치 계산기와 사용하지 않던 v2 GLB를 모두 제거했습니다. 아래 기록 중 해당 업체를 대상으로 한 항목은 더 이상 적용되지 않습니다.

`npx tsc --noEmit`, `check-models.mjs`, `check-motion.mjs`, `check-rotary-drive.mjs`, `check-part-framing.mjs`, `npm run build` 재통과를 확인했습니다. GitHub Pages 배포를 추가했으므로 런타임 자산 경로는 `import.meta.env.BASE_URL` 기준입니다.

## 최신: 8축 회전 기구 v6 (2026-10-22)

- CSX-35(24/28초), CSX-20(18/19.4초), HCM(15/16초) 영상과 현장 MP4를 시각 대조했습니다. 무캠식을 원판 비회전으로 해석했던 오류를 정정했습니다. [근거·한계](rotation-research/README.md).
- HCM 260노드·142메시·1028.5 KiB, HAM 158노드·97메시·783.6 KiB. 8개 회전 원판과 8개 연결봉, 고정 베어링 몸체, 링크의 양쪽 핀·부시를 분리했습니다.
- `check-rotary-drive.mjs`: 실제 Meshopt GLB에서 1,936개 자세의 양쪽 연결점, 링크 길이, 스트로크, 원판 고정 중심 및 회전을 통과했습니다. `check-models.mjs`, `check-motion.mjs`, `check-part-framing.mjs`, `npm run build`도 통과했습니다.
- gstack 5173: 성형 원판별 각도 변화, 절단 시 7번 축만 회전, 축 선택, 2.75초 탐색 시 영상과 시계 일치, 일시정지 유지, 2배속, 영상 모달에서 정지/닫기 후 재개를 확인했습니다. HCM 비교 영상 4개 전환 및 HAM 2개 원본 영상 유지 확인.
- 개별 회전 부품 선택 시 확대 정지 이미지로 교체, 다시 선택하면 동작 영상으로 복귀합니다. 전체 순서의 다음 단계 전환도 확인했습니다.
- 프로덕션 빌드 미리보기 4173: `RENDERED MOTION`, video readyState 4, 성형→절단 시 영상 교체와 새 단계 시계 초기화, 화면을 도해까지 내린 상태에서 각도·시계 진행 확인.
- 375px 페이지와 4개 영상 선택 모달의 가로 넘침 없음. 모바일 도해를 보는 동안 절단축 각도가 0→0.7379→2.7651 rad로 진행하는 것도 확인했습니다. 모바일은 전체 8축과 선택 축 확대를 세로로 분리했습니다. [데스크톱](rotation-research/desktop.png), [모바일](rotation-research/mobile-diagram.png), [Blender 동작 프레임](rotation-research/drive-sequence.jpg)을 시각 확인했습니다.
- 자동화 WebGL 생성 실패는 여전합니다. 위 영상은 Blender 사전 렌더이며 실시간 GPU 회전·선택·실기기 FPS 수용 검증은 미완료입니다. Three.js core 청크 크기 경고가 남지만 빌드는 성공했습니다.

## 이전: 개별 부품 v5 (2026-10-22)

- HCM 212노드·117메시·1067.1 KiB, HAM 158노드·97메시·783.5 KiB. Meshopt 압축 사용; 메시 단순화 없이 위치 16비트 양자화.
- 커팅 인서트가 독립 선택되며 커팅 슬라이드의 자식인지, 압축을 클라이언트와 같은 three-stdlib 디코더로 해제 가능한지 확인했습니다. 기존 공급·성형·절단·낙하·조립/분해 CPU 검사도 통과했습니다.
- 20개 부품 WebP 디코딩, 부품 선택 시 이미지 교체·상세 항목·0초 정지, 전체 단계로 복귀, 375px 가로 넘침 없음 확인.
- Blender에서 새 공구부와 개별 가이드/커팅 날/퀼 렌더를 시각 확인했습니다. [부품 데스크톱](tooling-research/v5/guideway-desktop.png), [모바일](tooling-research/v5/guideway-mobile.png).
- `check-part-framing.mjs`: 20개 부품의 실제 모델 경계가 데스크톱 및 모바일 카메라 안에 들어오는지 CPU 투영 검사 통과. 송급부·스피너의 초기 잘림을 수정했습니다.
- 실제 GPU 회전·선택 강조·프레임률은 자동화 환경 WebGL 실패로 여전히 미검증입니다. 부품별 정지 렌더 및 CPU 디코더·변환 검증과 구분합니다.

## 이전: 공구 상세·단계별 동작 v4 (2026-10-22)

- [공구별 공식 근거와 한계](tooling-research/README.md). WAFIOS 공식 PDF 6종을 시각 확인하고 가이드·롤러·성형 팁·클램프·커팅 날·받침을 구분했습니다.
- HCM-35T 119노드/90메시/1375.2 KiB, HAM-10T 95노드/71메시/963.7 KiB. 외부 텍스처 없이 각 GLB 1.5 MB 미만.
- CPU 검사: 커팅 날 0.118 단위 전진 및 완전 복귀, 절단 중 다른 성형 슬라이드 정지, 롤러 반대 방향 회전, 선재 공급, 일정한 선경·권수 증가, 제품별 받침대 위 낙하 종료, 조립/분해·정지 변환 안정성, 단계 카메라 목표 중앙 정렬 통과.
- `node scripts/check-models.mjs`, `node scripts/check-motion.mjs`, `npm run build` 통과. Three.js core 청크 크기 경고는 유지됩니다.
- gstack browse 5173: 단계 선택 후 재생, 6초 반복 유지, 일시정지, 3.25초 탐색과 절단 단계 문구, 전체 순서 다음 단계, 2배속, 모델 전환 시 시계 초기화, 마지막 단계에서 처음으로 순환 확인.
- 세부 구간 클릭 시 3.75초 정지 자세와 문구가 일치합니다. 세 제품의 12개 단계 WebP 모두 decode 성공.
- 프로덕션 빌드 미리보기 4173: HAM 절단 단계 재생, 영상 모달에서 시계 정지/닫은 후 재개, 구간 선택, 데스크톱 가로 넘침 없음. 초기 모델 오류 처리가 완료되기 전에는 시계가 대기합니다.
- 375px에서 가로 넘침 없음. 데스크톱 부품 목록과 재생 버튼은 내부 스크롤 없이 표시합니다.
- [절단 확대 데스크톱](tooling-research/ham-cutting-desktop.png), [모바일](tooling-research/ham-cutting-mobile.png). 이미지 영역은 Blender 정지 렌더 대체 화면이며 움직임은 별도 동작 도해로 제공합니다.
- 자동화 Chromium의 WebGL 컨텍스트 생성 실패는 계속됩니다. **3D 실제 GPU 애니메이션, 부품 투시/클릭·회전, 모바일 FPS는 미검증**입니다. CPU 검사 및 SVG 시계 검증과 구분합니다.

## 이전: 상품 상세·영상 기반 v3

스프링 시연은 HCM-35T와 HAM-10T 두 제품으로 교체했습니다. 아래 v2 기록은 이전 사진 기반 모델에 대한 이력입니다. 최신 출처·영상 관찰·사양·제약은 [상품 조사 기록](product-research/README.md)에 있습니다.

- HCM-35T: 92노드, 68메시, 1219.2KiB. HAM-10T: 76노드, 57메시, 842.3KiB.
- 두 제품 모두 무캠식 독립 서보 방식으로 표현합니다. HCM 슬라이드 8개/스피너 2개, HAM 하단·측면 슬라이드 5개/상부 XYZ 툴 체인저를 분리했습니다.
- `check-models.mjs`, `check-motion.mjs`, `npm run build` 통과. 선재 굵기를 유지한 권수 증가, 독립 슬라이드 비회전, 반복 변환 안정성, 정면·사선 및 모바일 카메라 범위를 검증했습니다.
- 제품별 원본 비교, 사진, 게시 사양, 영상 두 개, 출처 링크, URL 직접 접근/새로고침/뒤로 가기, 업체 전환 후 선택 유지 확인.
- 영상 모달 종료 시 iframe 제거, 375px 페이지와 비교 모달 가로 넘침 없음.
- [HCM 비교 화면](product-research/hcm-comparison.png), [HAM 비교 화면](product-research/ham-comparison.png), [원본 영상 모달](product-research/video-dialog.png).
- 현재도 자동화 WebGL 컨텍스트 생성 실패로 실시간 GPU 동작과 FPS는 미검증입니다. 정지 렌더와 CPU 검사를 GPU 검증으로 간주하지 않습니다.

## 통과

- `npm run build`: TypeScript 검사 및 Vite 프로덕션 빌드.
- `node scripts/check-models.mjs`: GLB 헤더/버전/길이, 4개 공정별 선택 가능한 노드, 애니메이션 대상 노드, 외부 텍스처 의존성 없음.
- 아이케이미래 v2 GLB: 74개 노드, 1107.9 KiB, 19개 애니메이션 조립체. (v6 범위 축소 시 제거)
- Blender MCP에서 모델 생성, GLB 내보내기, GLB 재가져오기 및 Cycles 정지 렌더 완료. 렌더 결과 시각 검토.
- gstack `/browse`로 참고 사이트 `https://pouch.fornerds.ai/`의 공정/부품/제품 정보 구성 확인.
- gstack 브라우저: URL 갱신, 단계 선택/이전/다음, 제품 정보 및 원본 카탈로그 연결.
- 갤러리 열기/닫기, Escape 닫기와 원래 버튼으로 포커스 복귀, 실제 MP4와 controls 연결.
- 브라우저 뒤로 가기와 선택 모델 동기화.
- 실제 사진 비교, 375px/768px 가로 넘침 없음.
- 네이티브 전체 화면 진입과 Escape 종료. 확인 중 발견한 Escape 상태 불일치를 수정하고 재검증했습니다.
- 링크 복사 핸들러가 업체 쿼리와 #showroom을 포함한 URL을 clipboard.writeText로 전달하는지 계측 검증. 실제 시스템 클립보드 저장은 별도 미검증.
- 업체별 도입 제안, 실제 Blob 다운로드에 업체명/시연 URL/도입 단계 포함 확인. 메일 발송은 구현하지 않았고 UI에도 명시.
- 프로덕션 index.html은 React/UI만 선로드, Three.js는 동적 Scene import로 로드.

## 미검증 / 제한

자동화 Chromium에서 `THREE.WebGLRenderer: Error creating WebGL context` / SwiftShader `BindToCurrentSequence failed`가 발생했습니다. 기본 headless, headed connect, CI/no-sandbox 구성을 시도했으나 실시간 WebGL 검증은 완료하지 못했습니다. Headed 실행은 Chromium 프로세스 시작 오류로 종료됐습니다. 이 환경에서는 참고 사이트 역시 WebGL 실패 안내를 표시했습니다.

**따라서 실제 브라우저의 회전/확대, GPU 부품 강조, 분해 애니메이션, 순차 재생, 실제 프레임률은 검증 완료로 간주하지 않습니다.** 아래 이전 버전 스크린샷은 명시적으로 표시된 Blender 정지 렌더 대체 화면입니다. v6 HCM 성형·절단은 사전 렌더 동영상이며 역시 실시간 WebGL 검증이 아닙니다. WebGL 구동이 가능한 브라우저에서 추가 수용 검증이 필요합니다. 초기 모델/컨텍스트 실패 시 대체 화면 전환은 관찰했으며, 실행 중 컨텍스트 손실 처리 코드는 있으나 실제 주입 검증하지 못했습니다.

코드에 구현된 성능 정책: demand 프레임 루프, DPR 최대 1.5, 선택 업체 GLB만 로드, 외부 HDR 없음, 256px 단일 contact shadow, 화면 밖/백그라운드/모달에서 재생 중단. 성능 정책이 실제 모바일 FPS를 보장하지는 않습니다. Vite는 Three.js core 청크 약 704 kB (gzip 181 kB)에 대한 크기 경고를 표시하며 빌드는 성공합니다.

모델은 사진 기반 외형 참고와 교육용 개념 동작입니다. 측정 도면이나 제조사 검수가 없으므로 실제 치수, 내부 순서, 성능/불량률 예측, 설비 호환성을 보장하지 않습니다. 생산 배포·실제 메일 발송은 수행하지 않았습니다.

## 시각 증거

2026-10-21 사진·영상 기반 v2 고도화:

- [아이케이미래 원본과 개선 모델](refinement/ik-comparison.png)
- [모바일 원본 비교](refinement/comparison-mobile.png)

아이케이미래는 IMG_0188 영상의 8방향 장비를 기준으로 재구성했습니다. IMG_0204의 HAX-60T는 상부 형상이 달라 별도 카탈로그로 구분합니다.

v2 추가 검증:

- `node scripts/check-motion.mjs`: GLB를 Three.js GLTFLoader로 읽고 4단계 변환, 정지 자세의 반복 적용 안정성, 분해 후 조립 복귀를 확인했습니다.
- 데스크톱 및 335×450·280×450 화면 비율에서 정면/사선, 조립/분해 상태의 모델 경계가 카메라 안에 들어오는지 CPU 투영 검사 통과.
- `node scripts/check-models.mjs`: 모델마다 독립된 단일 장면, 60개 이하 메시, 1.5MB 미만 GLB, 공정별 선택 노드와 외부 텍스처 비의존성을 확인했습니다.
- 원본 비교 모달의 양쪽 이미지 디코딩, 설명, Escape 닫기, 375px 가로 넘침을 gstack 브라우저로 확인했습니다.
- 제품 정보의 원본 자료 버튼은 아이케이미래 IMG_0204로 연결됩니다. 아이케이미래 갤러리 두 번째 항목은 controls가 있는 MP4입니다.
- 최종 GLB 내보내기와 반응형 카메라 수정 후 `npm run build` 재통과.

초기 v1 화면 기록(아래 이미지는 최신 모델이 아닙니다):

- [아이케이미래 데스크톱](qa/ik-mirae-desktop.png)
- [아이케이미래 모바일](qa/ik-mirae-mobile.png)

## WebGL 지원 브라우저에서 남은 수용 검증

1. 각 제품 링크에서 `INTERACTIVE 3D`와 숫자 핫스폿이 나타나는지 확인.
2. 회전/확대/정면/초기화 후 장비가 잘리지 않는지 확인.
3. 네 단계를 선택해 설명과 선택 부품이 일치하는지 확인.
4. 재생/정지와 0.5/1/2배속, 분해/조립, 부품 표시 전환 확인.
5. 실제 사진으로 전환 후 3D 복귀, 업체 교체, 화면 이탈/복귀 시 상태 확인.
6. 모바일 실기기에서 렌더 속도와 조작감을 확인하고 제조사 검수 수행.
