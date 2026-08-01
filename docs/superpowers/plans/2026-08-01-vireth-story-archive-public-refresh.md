# 비레스 5083 이야기 서고 공개 개편 구현 계획

> **실행 기준:** `2026-08-01-default-start-reading-flow-design.md`와 `2026-08-01-story-archive-subculture-visual-design.md`를 함께 만족한다.

**목표:** 기본 시작 1개와 말미 참고 설명을 추가하고, 기존 14편·삽화 30개를 보존하면서 실제 비레스 풍경과 렌·듀란을 활용한 서브컬처형 공개 리더로 개편한다.

**구조:** 상위 서고의 `00_관리`를 데이터 정본, `05_뷰어`를 리더 정본, `90_도구/build_viewer.mjs`를 생성기로 유지한다. 공개 저장소는 `scripts/sync-public.mjs`로 생성 데이터·리더·자산을 동기화하고 Vinext/Sites 빌드로 배포한다.

**기술:** 정적 HTML/CSS/JavaScript, Node.js ESM 빌더, Vinext, Wrangler, Lucide 정적 SVG, Playwright CLI.

---

## 작업 1: 보존 기준과 계약 테스트

**파일**

- 생성: `tests/verify-public-contract.mjs`
- 수정: `package.json`
- 생성: `output/verification/baseline-content-sha256.json` (검증 산출물, 커밋 제외)

**순서**

1. 공개 대상 Markdown 14편과 문서 삽화 WebP 30개의 SHA-256을 기록한다.
2. 계약 테스트에 다음 기대값을 먼저 작성한다.
   - `project.name === "비레스 5083 이야기 서고"`
   - `project.world === "Vireth 5083"`
   - 독서 흐름 8개와 첫 ID `gate-arrival`
   - 기존 7개 흐름 ID와 문서 순서 보존
   - 참고 설명 14/14, 문서별 1~5개
   - 공개 문서 14편, 삽화 30개
   - 시작 이미지 8개와 고유 경로 8개
   - 공개 HTML·생성 데이터의 폐기 명칭 0
3. 변경 전 테스트를 실행해 새 계약 때문에 실패하는지 확인한다.

## 작업 2: 정본 데이터와 빌더

**파일**

- 수정: `../00_관리/기록문서_마스터인덱스_v1.json`
- 생성: `../00_관리/초기열람_참고설명_v1.json`
- 수정: `../90_도구/build_viewer.mjs`
- 생성: `../05_뷰어/assets/start-situations/gate-arrival.webp`
- 생성: `../05_뷰어/assets/archive-stage/vireth-city-stage.webp`
- 생성: `../05_뷰어/assets/archive-stage/ren.webp`
- 생성: `../05_뷰어/assets/archive-stage/duran.webp`

**순서**

1. 프로젝트 이름과 세계명을 확정값으로 교체한다.
2. `defaultFlowCount: 1`과 `gate-arrival` 첫 흐름을 설계 문구·문서 4편·순서 그대로 추가한다.
3. 14편 원문에서 실제로 사용한 시간·달력·화폐·행정·생활 용어만 골라 참고 설명 JSON을 작성한다.
4. 빌더가 참고 설명 JSON을 읽어 문서별 `references`로 병합하게 한다.
5. 빌더 검증을 8개 흐름, 14/14 참고 설명, 문서별 1~5개, 필수 용어와 빈 문자열 금지로 확장한다.
6. 기존 원본을 보존한 채 ImageMagick으로 네 공개 자산을 WebP 파생한다.
7. 빌더를 실행하고 계약 테스트를 다시 실행한다.

## 작업 3: 리더 정보 구조와 접근성

**파일**

- 수정: `../05_뷰어/review.html`
- 수정: `../05_뷰어/review.js`
- 수정: `../05_뷰어/review.css`
- 생성: `../05_뷰어/assets/icons/*.svg`

**순서**

1. 브라우저 제목, 브랜드 키커, 헤더 이름, H1과 보조문을 확정 문구로 교체한다.
2. 기존 시작 목록을 8개 실제 장면이 보이는 가로 이미지 탭으로 바꾼다.
3. 탭에 `role`, `aria-selected`, `aria-controls`, roving `tabindex`와 방향키/Home/End 동작을 추가한다.
4. 작은 세계 무대에 도시 장면과 렌·듀란을 배치하고 두 인물이 원문 화자가 아님을 접근 가능한 설명으로 구분한다.
5. `비레스를 둘러보기`, `이 장면과 함께 읽을 이야기`, `펼쳐 읽기`처럼 행동 중심 문구로 바꾼다.
6. Lucide `Map`, `Compass`, `BookOpen`, `CircleCheck`, `ArrowLeft`, `ArrowRight` 아이콘을 추가한다.
7. 아이콘 전용 버튼에 `title`, `aria-label`, 포커스 스타일을 제공한다.
8. `article.reader-document` 다음, 읽음 완료 조작 앞에 기본 펼침 `aside.reader-references`를 렌더링한다.
9. 참고 설명은 실제 heading과 `ul > li > dfn + p` 구조로 만든다.

## 작업 4: 시각 스타일과 반응형

**파일**

- 수정: `../05_뷰어/review.css`

**순서**

1. 세계 무대 높이를 데스크톱 260px, 모바일 330px 이하로 제한한다.
2. 도시 배경은 왼쪽 텍스트 구역에만 어두운 오버레이를 두고 인물·장면의 밝기와 색을 보존한다.
3. 시작 탭은 최대 반경 6px, 안정된 가로 크기와 높이를 사용한다.
4. 청록·적색·황금색을 역할별로 분리하여 단일 색조를 피한다.
5. 본문 종이를 밝히고 본문 색과 굵기를 유지하거나 강화한다.
6. 참고 설명을 종이 프레임과 분리된 밝은 구역으로 스타일링한다.
7. 1440×1000과 390×844에서 제목, 인물, 탭, 활성 장면, 문서 행이 재배치되어 겹치지 않게 한다.

## 작업 5: 동기화·빌드·정적 검증

**파일**

- 수정: `scripts/sync-public.mjs` (필요한 검증 추가)
- 수정: `app/page.tsx`
- 수정: `app/layout.tsx`
- 수정: `public/*`와 `public/assets/*` (동기화 결과)

**순서**

1. 상위 빌더를 실행한다.
2. `npm run sync:content`를 실행한다.
3. 공개 데이터·HTML·이미지 대체문에서 폐기 명칭을 검색한다.
4. 계약 테스트를 실행한다.
5. `npm run build`를 실행한다.
6. `wrangler deploy --dry-run`을 실행한다.
7. 변경 전후 해시를 비교해 원문 14편과 기존 삽화 30개가 동일한지 확인한다.

## 작업 6: Playwright 전체 화면 검증

**산출물**

- `output/playwright/final/01-start-desktop.png`
- `output/playwright/final/02-start-mobile.png`
- `output/playwright/final/03-reader-desktop.png`
- `output/playwright/final/04-reader-mobile.png`

**순서**

1. 로컬 서버에서 기본 주소와 `#scenario=gate-arrival`을 연다.
2. 데스크톱·모바일 전체 화면을 캡처하고 실제 이미지, 시작 탭 일부와 활성 장면의 동시 노출을 확인한다.
3. 기존 7개 해시를 순회해 선택·이미지·문서 4편을 확인한다.
4. 문서를 열어 원문·모든 삽화·참고 설명·읽음 완료 순서를 확인한다.
5. 14편을 순회해 참고 설명 14/14와 이미지 로드 실패 0을 확인한다.
6. 콘솔 오류, 가로 넘침, 겹침, 잘림, 빈 이미지와 현대성 드리프트를 검사한다.
7. 발견한 시각 결함을 수정하고 같은 뷰포트에서 다시 캡처한다.

## 작업 7: 커밋·푸시·Sites 배포

**순서**

1. 공개 저장소 변경 범위와 외부 정본 변경을 다시 확인한다.
2. 기능과 디자인을 한 커밋으로 `main`에 커밋한다.
3. 같은 SHA를 GitHub `origin/main`과 Sites 소스 `sites/main`에 푸시한다.
4. `.openai/hosting.json`의 기존 `project_id`로 해당 SHA의 Sites 버전을 저장한다.
5. 저장된 버전을 프로덕션에 배포하고 완료 상태를 확인한다.
6. 실제 배포 URL에서 기본 시작, 기존 해시, 자산, 데이터, 참고 설명과 폐기 명칭 0을 재검증한다.
