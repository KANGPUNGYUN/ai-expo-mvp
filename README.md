# FORM — Industrial 3D Showroom

React + TypeScript + Vite, Three.js, React Three Fiber, drei. Blender MCP로 생성한 공개 자료 기반 GLB를 사용하는 아이케이미래 스프링 성형기의 교육·전시용 랜딩 페이지입니다.

공개 주소: <https://kangpungyun.github.io/ai-expo-mvp/>

## 실행

```sh
npm ci
npm run dev -- --port 5173
npm run build
npm run preview -- --port 4173
```

- HCM-35T: `http://localhost:5173/?product=hcm-35t#showroom`
- HAM-10T: `http://localhost:5173/?product=ham-10t#showroom`

배포본은 `/ai-expo-mvp/` 하위 경로에서 서비스됩니다. 런타임에서 만드는 모델·이미지·영상 경로는 `src/asset-url.ts`의 `assetUrl()`을 거쳐 `import.meta.env.BASE_URL`을 붙입니다. 새 자산 경로를 추가할 때 이 함수를 쓰지 않으면 배포본에서 404가 납니다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 `npm ci && npm run build` 후 `dist`를 GitHub Pages에 올립니다. 저장소 Settings → Pages의 Source는 **GitHub Actions**입니다.

## 포함 기능

- 제품별 직접 링크 및 브라우저 뒤로/앞으로 이동
- HCM-35T / HAM-10T 모델 선택, 게시 사양, 상품 상세 연결, 제품별 원본 YouTube 영상 2개, HCM 회전 기구 비교 영상 2개
- 회전, 확대, 정면, 초기화, 전체 화면
- 단계별 확대·외장 투시, 부품 이름·선택 강조, 단계 반복/전체 순서, 0.5/1/2배속
- 공통 6초 동작 시계, 세부 동작 4구간 선택, 일시정지·타임라인 탐색, WebGL 없이도 재생되는 동작 도해
- HCM의 8개 독립 회전 원판·편심 핀·연결봉·직선 슬라이드 연동, 축별 회전각/전진량 도해
- 모델별 10개 개별 부품 확대, 소켓 체결부·관통 가이드·롤러 홈·커팅 인서트 상세
- '배치 설계' 탭: 공구 축의 설치 각도·홀더 장착 위치·스트로크·작업 평면을 조정하면 도달 반경, 크랭크 회전각, 링크 흔들림, 공구 간섭, 공통 작업 반경을 바로 계산합니다. 조정값은 3D 모델의 실제 동작에 그대로 반영됩니다
- 부품 분해 보기
- 제품 정보와 단계별 도입 제안, 검토용 콜드메일 초안 파일 다운로드
- WebGL 실패/컨텍스트 손실 시 HCM 성형·절단은 Blender 동작 렌더 영상으로, 나머지는 정지 렌더와 동작 도해로 대체, 재시도
- 화면 밖/백그라운드/모달에서 시연 정지, 정지 시 demand 렌더링

## 모델과 자료

현재 스프링 시연은 `public/models/hcm-35t.glb`, `public/models/ham-10t.glb`를 사용합니다. `scripts/build_spring_products.py`를 Blender MCP로 실행해 생성했으며 원본은 `scripts/spring-products.blend`입니다. GLB 재내보내기 후 `node scripts/optimize-models.mjs`로 Meshopt 압축을 적용합니다. CLI에서는 `blender --background --python scripts/build_spring_products.py`로 재생성합니다. 원본 작업 파일은 웹에 배포하지 않습니다.

- HCM-35T: [다아라 432341](https://blog.daara.co.kr/sell_view.html?cid=ikhome&no=432341)의 상세 사진·게시 사양·연결 영상 2개를 기준으로, 꺾인 전면판과 8방향 독립 슬라이드·대각 스피너·우측 조작반을 재구성했습니다.
- HAM-10T: [다아라 432398](https://blog.daara.co.kr/sell_view.html?cid=ikhome&no=432398)의 상세 사진·게시 사양·연결 영상 2개를 기준으로, 상부 XYZ 툴 체인저·하단 슬라이드·열린 보호 커버와 조작반을 재구성했습니다.
- 무캠식은 회전 원판이 없다는 뜻이 아닙니다. HCM은 CSX-35/CSX-20의 실제 동작 영상을 추가 대조해 고정 베어링 몸체와 회전 원판·편심 핀을 분리하고 연결봉으로 슬라이드를 왕복시킵니다. 8개 원판은 각자의 중심에서 회전합니다. CSX와 HCM은 다른 모델이며 정확한 치수·축별 위상은 교육용 설정입니다. HAM은 별도의 상부 XYZ 구조를 유지합니다. 코일 예시는 굵기를 줄이는 스케일 변형 대신 권수를 순차 표시합니다.
- UI/인터랙션 참고: https://pouch.fornerds.ai/

모델 비례, 내부 구조, 공정 순서와 애니메이션은 교육용 개념이며 실제 공정의 검증된 디지털 트윈이 아닙니다. 불량률 0%는 목표이며 보장 수치가 아닙니다. 가격, 절감률, 실제 센서값, 호환성은 임의로 제시하지 않습니다.

메일 발송/문의 접수 서버는 없습니다. CTA는 제안 보기, 초안 다운로드, 링크 복사로 실제 동작합니다. 공유 링크는 배포 주소에서 그대로 쓸 수 있고, 로컬 개발 서버의 링크는 같은 컴퓨터에서만 열립니다.

## 구조

- `src/App.tsx`: 랜딩 페이지와 시연 상태, 대화상자
- `src/Scene.tsx`: GLB 로딩, 조명, 카메라, 애니메이션, 핫스폿
- `src/rotary-drive.ts`, `src/RotaryDriveDiagram.tsx`: 8축 회전 기구의 공유 기하 계산과 축별 도해
- `src/RenderedMotion.tsx`: 공통 시계와 동기화하는 동작 렌더 영상 대체 화면
- `docs/rotation-research/README.md`: 추가 영상 관찰과 회전 기구 정정 근거
- `src/model-motion.ts`: 부품 조립체의 기준 변환을 보존하는 공정별 동작
- `src/process-cycle.ts`, `src/use-process-clock.ts`: 3D·도해·타임라인을 동기화하는 공통 시계
- `src/stage-lessons.ts`, `src/MotionDiagram.tsx`: 부품별 설명과 동작 도해
- `docs/tooling-research/README.md`: 공구별 외부 근거와 재현 범위
- `src/camera-pose.ts`: 좁은 화면에 맞춘 정면·사선 카메라 거리
- `src/data.ts`: 업체 정보
- `src/asset-url.ts`: 배포 하위 경로를 반영한 런타임 자산 경로
- `src/spring-products.ts`: 제품별 공정·사양·출처·영상 정보
- `docs/product-research/README.md`: 상품·영상 관찰 기록과 반영 범위
- `src/style.css`: 반응형 스타일
- `docs/verification.md`: 실행 검증 결과

선택된 제품 GLB만 로드하며 GPU 픽셀 비율은 최대 1.5입니다. 외부 HDR 다운로드 없이 Lightformer 기반 조명을 생성합니다. UI와 3D 코드는 분리합니다. 폰트는 Google Fonts를 사용하며 미연결 시 시스템 폰트로 대체됩니다.

## 검증

```sh
node scripts/optimize-models.mjs # Blender 재내보내기 후 압축
node scripts/check-models.mjs
node scripts/check-motion.mjs
node scripts/check-rotary-drive.mjs
node scripts/check-part-framing.mjs
npm run build
```

동작 검사는 TypeScript를 직접 읽을 수 있는 Node.js 22.18 이상을 사용합니다. GLB 용량은 HCM-35T 약 1028 KiB, HAM-10T 약 784 KiB입니다. 정적 메시를 병합하고 애니메이션 조립체만 갱신합니다. CPU 검사와 정지 렌더는 실시간 WebGL 검증을 대신하지 않으며, 현재 자동화 브라우저의 WebGL 생성 실패 때문에 실제 GPU 동작과 FPS는 미검증입니다.

### 회전 동작 렌더 재생성

`node scripts/export-drive-poses.mjs`로 공유 기하 계산의 48개 자세/단계(6초, 초당 8자세)를 JSON으로 내보냅니다. `scripts/render_drive_motion.py`의 `POSES = []`에 해당 JSON을 삽입한 전체 소스를 Blender MCP로 실행합니다. 원본 장면은 `build_spring_products.py`가 생성한 v6입니다. 생성된 PNG는 ffmpeg의 `-framerate 8 -c:v libx264 -crf 19 -pix_fmt yuv420p -movflags +faststart -r 24`로 인코딩해 `public/models/hcm-35t-motion-{1,2}.mp4`에 저장합니다. 24fps 컨테이너이며 고유 렌더 자세는 초당 8개입니다. 두 파일은 약 158/85 KB이고 사전 렌더임을 UI에 명시합니다.

## 배치 설계 계산 근거

`src/tool-layout.ts`에 모든 계산이 순수 함수로 모여 있습니다. 모델 좌표 1.0 = 250 mm로 환산하며, 축 각도와 공구 끝단 반경은 GLB 리그에서 실측한 값(`ServoSlide_<n>` carbide 팁 반경)입니다.

- 전진량은 크랭크-슬라이더 식 `s(θ) = e(1 − cos θ) + L − √(L² − e² sin²θ)`를 씁니다. `s(180°) = 2e`이므로 스트로크는 편심의 두 배이고, 같은 식을 `src/rotary-drive.ts`가 3D 동작에 사용합니다. 패널 수치와 화면 움직임이 같은 계산에서 나옵니다.
- 공구 간섭은 두 공구의 중심선을 선분으로 보고 최소 거리를 구해 공구 폭 합의 절반과 비교합니다. 단 선재 방향 작업 평면이 공구 두께보다 멀리 떨어져 있으면 서로 지나가므로 검사하지 않습니다. 실제 다축 포밍기가 공구마다 Z 평면을 나누는 이유입니다.
- 공통 작업 반경은 성형축만으로 구합니다. 커팅축은 선재 중심을 지나야 절단이 되므로 도달 판정과 중심 통과 경고를 따로 적용합니다.
- 스트로크 상한(HCM-35T 130 mm, HAM-10T 80 mm)과 가공 선경 범위는 다아라 게시 사양입니다.

치수와 타이밍은 교육용 재구성입니다. 실제 공구 간섭과 세팅은 제조사 도면으로 확인해야 합니다.

## 현장 촬영 자료

전시회에서 직접 촬영한 사진과 영상은 공개 화면에 싣지 않습니다. 모델 제작에 참고한 원본은 `.local-references/`에 두었고 `.gitignore`와 빌드 대상에서 제외됩니다. 화면에 나오는 이미지는 Blender 렌더(`public/models/*.webp`, `*.mp4`)뿐입니다.
