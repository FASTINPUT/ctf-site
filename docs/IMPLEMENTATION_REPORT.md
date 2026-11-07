# FASTINPUT CTF Writeups — 구현 및 검증 보고

작업일: 2026-11-07 (한국 시간). 첨부한 Next.js 프로젝트 소스를 수정했으며 외부 DB·인증 설정·Storage·GitHub·배포 환경은 변경하지 않았습니다.

## 구현 완료

아래 기능은 소스 구현 완료 범위입니다. DB 연결을 포함한 실제 사용자 흐름 검증 완료를 의미하지 않습니다.

- 네이비 다크 디자인 토큰, 공통 Button/Card/Badge/Input/Select/Modal/Dialog/Dropdown/Toast/Tabs/Tooltip/Breadcrumb/Pagination/Empty/Skeleton.
- 상단 브랜드·검색·탐색·인증 버튼, 접을 수 있는 동적 카테고리 사이드바, 모바일 드로어, 키보드 포커스·skip link.
- Dashboard: 실제 레코드 기준 수치, 카테고리별 글 수·최근 글·최근 작성/수정일, 최근 Writeups. 데이터가 없는 값은 임의 생성하지 않습니다.
- 전체/카테고리/북마크 아카이브: 제목·본문 DB 검색, 메타데이터 필터, 정렬, 서버 페이지 나누기, 오류/빈 화면/재시도. 신규 컬럼이 없으면 기존 projection으로 읽기를 유지합니다.
- 작성·수정 공통 에디터: 선택 메타데이터, 툴바, 작성/미리보기/분할, GFM, 문법 강조·언어명·코드 복사, 현재 위치 삽입.
- 기존 다중 페이지 형식 왕복 보존, 페이지 추가·이동·삭제·제목·순서 변경, 최소 1페이지 보호.
- 이미지/PDF 선택·드롭·여러 파일·클립보드, MIME/확장자/크기/시그니처 클라이언트 검사, 파일 단위 진행·실패 안내, 기존 Storage 및 공개 첨부 주소 유지.
- 계정 UUID·글 ID별 로컬 자동 초안·복구·폐기, 저장 시각·미저장 표시, 새로고침/닫기·일반 링크 이탈 경고, 관리자 Dashboard의 이 기기 초안 목록. 일부 비밀 키 패턴은 로컬 저장을 중단합니다.
- CTF 기본 템플릿과 Web/Pwn/Forensic별 분석 항목.
- 상세: 현재 페이지 자동 H2/H3 목차·현재 섹션 표시, 공개 스포일러, 북마크·링크 복사·내보내기·복제, 기존 file_url 첨부 표시, 같은 카테고리 이전/다음 글·관련 글.
- 실제 데이터의 분야/월/난이도/플랫폼별 학습 집계, 경력이나 실적을 만들어내지 않는 소개 페이지.
- 로그인/로그아웃 유지, 단순 로그인과 관리자 RPC 판정 분리, 권한 확인 실패 시 관리자 UI 차단.
- 카테고리 이름 변경 시 slug 보존, 연결 글 확인 후 삭제 제한, 예약 경로 입력 제한. 동시 요청/직접 API 우회까지 막으려면 별도 FK SQL 적용이 필요합니다.
- 한국어 문서 언어·사이트명·설명·Open Graph·브랜드 SVG icon, 외부 폰트 의존성 제거, 기본 Next/Vercel 이미지 정리, 보안 응답 헤더.

## 주요 변경 파일

| 경로 | 역할 |
| --- | --- |
| `app/layout.tsx`, `app/globals.css`, `app/icon.svg` | 디자인·메타데이터·브랜드 |
| `app/components/Shell.tsx`, `Provider.tsx`, `AuthButtons.tsx`, `ui.tsx` | 공통 레이아웃·인증·UI |
| `app/components/Dashboard.tsx`, `Archive.tsx`, `PostRow.tsx`, `Drafts.tsx` | 대시보드·탐색·초안 목록 |
| `app/components/Editor.tsx`, `Markdown.tsx` | 공통 작성기·안전한 Markdown |
| `app/components/CategoryAdmin.tsx` | 카테고리 추가/관리 |
| `app/lib/{supabase,types,content,queries}.ts` | 공통 클라이언트·타입·호환성·DB 요청 |
| `app/page.tsx`, `app/[category]/page.tsx`, `app/[category]/[id]/page.tsx` | 기존 조회 경로 유지 및 개선 |
| `app/write/page.tsx`, `app/edit/[id]/page.tsx` | 에디터 공유 |
| `app/{categories,writeups,bookmarks,stats,about}/page.tsx` | 신규 탐색·학습 화면 |
| `app/{login,logout,add-category,manage-categories}/page.tsx` | 기존 기능 유지/개선 |
| `sql/00_audit.sql` ~ `03_category_integrity.sql` | 감사·메타데이터·권한·관계 보호 |
| `tests/content.test.tsx`, `tests/queries.test.tsx` | 의미 있는 로컬 회귀 테스트 |
| `.env.example`, `README.md`, `docs/LIVE_CHECKLIST.md` | 설정·권한 전환·운영 검증 |
| `package.json`, `package-lock.json`, `next.config.ts` | GFM/코드 강조/테스트 의존성·보안 헤더 |

## 데이터베이스 변경

소스에서 기존 `posts.category`와 `categories.slug`, `post-files`, `file_url`, 본문 구분자를 확인했습니다. 실제 DB 스키마·RLS 상태는 접근 정보가 없어 확인하지 못했습니다.

- `01_metadata.sql`: nullable 플랫폼·문제 URL·난이도·상태·풀이 날짜·수정일, 태그·페이지 제목 배열, 공개 여부를 추가합니다. 기존 본문을 재작성하지 않습니다. 수정 시각 트리거, 검색/정렬 인덱스, RLS를 따르는 필터 목록 RPC를 제공합니다.
- `02_access.sql`: 신뢰된 JWT app_metadata 기반 `fi_is_admin()`, 공개 읽기·관리자 쓰기, 기존 permissive 쓰기 정책에 대한 restrictive guard, `post-files` 업로드 정책·10MiB/MIME 제한. 실제 적용하지 않았습니다.
- `03_category_integrity.sql`: slug 고유 인덱스, 삭제/slug 변경 RESTRICT FK, 예약 경로 방어 트리거. 기존 고아 데이터를 자동 삭제하지 않는 NOT VALID 제약을 사용합니다. 중복 slug가 있으면 트랜잭션이 실패하므로 감사 후 수동 해결해야 합니다.
- 관리자 UUID 역할 지정 → SQL 검토/적용 → 로그아웃/재로그인 → 검증 순서를 README에 명시했습니다. 관리자 역할 없이 권한 SQL부터 적용하지 마세요.

## 실행 및 빌드 결과

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| `npm ci` 및 `npm install` | 성공 | 잠금 파일 의존성 설치 및 필요한 패키지 추가 |
| `npm run lint` | 성공 | 오류·경고 0개 |
| `npx tsc --noEmit` | 성공 | TypeScript 검사 |
| `npm test` | 16/16 통과 | 다중 페이지 보존·업로드 검사·XSS/URL·GFM·스포일러·10개 코드 언어·코드 안 스포일러 보존·비밀 키 패턴·DB 요청/페이지 범위/기존 스키마 fallback |
| `npm run build` | 성공 | Next.js 16.2.6 production compile/type checking/prerender |

초기 lint 오류는 수정했습니다. 테스트 CLI의 IPC 소켓 제한은 `node --import tsx --test` 방식으로 IPC 서버 없이 실행하도록 바꿨습니다. 기본 `<img>` lint 예외는 Markdown 첨부의 알 수 없는 크기와 외부 origin 때문에 해당 렌더러에만 근거를 명시해 적용했습니다.
설치된 `node_modules/next/dist/docs/`의 client boundary, Link, useParams, metadata 문서를 확인했습니다. AGENTS.md를 유지했습니다.

## 검증하지 못한 항목

- 실제 Supabase 로그인·로그아웃·권한 전환, 운영 게시글 CRUD, 실제 카테고리/통계 수치 일치, 파일 업로드/다운로드 및 실제 RLS 우회 차단.
- SQL 문법/실행 결과·기존 정책과의 충돌·FK 데이터 유효성. SQL은 제안된 적용 파일이며 DB에서 실행 검증되지 않았습니다.
- 모바일/데스크톱 브라우저 시각·상호작용 검증: 제공 프리뷰 실행기가 Next dev에 `--host`/`--strictPort`를 전달해 `unknown option --host`로 시작하지 못했습니다. 프리뷰 환경 문제를 감추기 위해 프로덕션 실행 명령을 바꾸지 않았습니다.
- localStorage 복구·북마크·클립보드·브라우저 이탈 경고·dialog 포커스·드롭·붙여넣기의 실제 브라우저 통합 동작. 소스 구현과 로컬 단위/서버 렌더 테스트 범위만 확인했습니다.
- 현 GitHub/호스팅에 대한 연결·배포·실제 사용자의 데이터 보존 검증. 첨부 소스에 DB 레코드/Storage 파일이 들어 있지 않아 이를 로컬에서 대조할 수 없습니다.

## 배포 방법

수정 소스를 기존 저장소에 반영하고 두 공개 환경변수를 기존 Supabase 프로젝트로 유지하세요. 백업·감사·관리자 역할 지정·SQL 검토/적용을 마친 뒤 Preview에서 `docs/LIVE_CHECKLIST.md`를 수행하고 기존 배포 브랜치로 반영합니다. 이 작업에서는 GitHub push나 외부 배포를 하지 않았습니다.

## 추가로 필요한 작업

- 실제 관리자 UUID 지정, SQL 승인/적용, 토큰 갱신, 기존 RLS와 공개 버킷 설정 검증.
- 실제 서비스 체크리스트, 특히 기존 글/첨부와 일반 사용자의 직접 API 차단 검증.
- 필요하면 비공개 첨부용 별도 버킷·서버 서명 URL·서버 업로드 검사/악성코드 검사 설계. 현재 공개 버킷 첨부를 private로 바꾸지 않습니다.
- 큰 데이터 규모가 되면 통계의 요약 조회를 서버 집계 RPC/캐시로 전환하고 원격 이미지 크기 메타데이터를 관리하세요.
- 클라우드 초안 동기화, 비공개 글 작성 UI, 자동 FLAG 감지, 바이트별 업로드 퍼센트는 이번 범위에서 구현하지 않았습니다. 관련 글은 같은 카테고리 기준이며 태그 유사도 점수는 사용하지 않습니다.
