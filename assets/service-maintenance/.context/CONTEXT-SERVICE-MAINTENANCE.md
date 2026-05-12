# CONTEXT-EDGE-CASE — Static Assets Edge Case Page

> 이 문서는 `static-assets/assets/edge-case/**`의 정적 점검 안내 페이지 운영 맥락을 보존한다.
> append-only 히스토리 자산이며, 기존 결정을 삭제하거나 요약 치환하지 않는다.

## 2026-05-12 Static Maintenance Page Handoff

### 배경

- 대상은 인프라 레벨에서 서비스 장애/점검 시 직접 서빙할 정적 페이지다.
- 초기 요구는 `index.html` 단일 파일이었지만, 점검 시간은 운영 중 변경 가능성이 있어 `time.json`으로 분리했다.
- Figma 기준 화면은 중앙 정렬된 `megaphone -> text -> refresh button` 구조이며, megaphone pulse animation은 최종적으로 pulse가 모두 포함된 156px SVG를 inline으로 사용한다.

### 변경

- `index.html`
  - Pretendard JP 우선 font stack을 적용했다.
  - favicon과 megaphone/warning SVG는 외부 요청을 만들지 않도록 inline 처리했다.
  - `#maintenance-period`는 `fetch("./time.json", { cache: "no-store" })`로 `maintenancePeriod`를 읽어 교체한다.
  - `time.json` 로드 실패 또는 빈 값이면 HTML 안의 기본 점검 시간 문구를 fallback으로 유지한다.
  - megaphone pulse는 `.maintenance__pulse-inner/middle/outer` path에 class를 부여하고 `opacity` animation으로 제어한다.
  - `.maintenance__icon[data-pulse-motion]` 값으로 `outward`와 `in-out` motion을 전환한다.
- `time.json`
  - 현재 스키마는 `{ "maintenancePeriod": "..." }` 단일 필드다.
- `README.md`
  - 배포 구조, 점검 시간 변경, pulse motion 전환, 콘텐츠 다국어 검토를 운영자용으로 정리한다.

### 이유

- 인프라 fallback 페이지는 앱 번들, npm package, 외부 CDN, 외부 이미지 요청에 의존하지 않아야 한다.
- favicon/SVG는 inline이 가장 안전하지만, 점검 시간은 운영자가 빌드 없이 바꿀 수 있어야 하므로 JSON 분리가 더 실용적이다.
- pulse animation은 JS step 제어보다 CSS keyframes가 단순하고 장애 페이지 성격에 맞다.
- `data-pulse-motion` attribute는 운영 중 animation variant를 한 줄로 전환할 수 있게 한다.

### 영향

- 배포 시 `index.html`과 `time.json`은 같은 디렉터리에 함께 있어야 한다.
- `file://`로 직접 열면 브라우저 정책상 `fetch("./time.json")`가 실패할 수 있으므로, 로컬 확인은 HTTP static server 기준으로 한다.
- `index.html`만 단독 복사해도 화면은 뜨지만, 점검 시간은 inline fallback 값만 표시된다.
- 콘텐츠 다국어는 현재 full i18n 구현이 아니라 검토 단계다.

### 콘텐츠 / 다국어 검토

- 현재 외부화된 콘텐츠는 `maintenancePeriod`뿐이다.
- 다국어까지 운영하려면 다음 텍스트도 JSON 관리 대상으로 확장하는 것이 맞다.
  - `title`: `서비스 점검 중입니다.`
  - `description`: 점검 안내 본문
  - `maintenancePeriod`: 점검 시간
  - `notice`: 종료 시간 변경 가능 안내
  - `refreshLabel`: `새로고침`
- 권장 스키마는 locale-keyed object다.

```json
{
  "ko": {
    "title": "서비스 점검 중입니다.",
    "description": "안정적인 서비스 제공을 위해 현재 시스템 점검을 진행하고 있습니다. 점검 완료 후 다시 이용해 주세요.",
    "maintenancePeriod": "5월 7일 오전 2시 - 3시",
    "notice": "점검 상황에 따라 종료 시간이 변경될 수 있습니다.",
    "refreshLabel": "새로고침"
  },
  "en": {
    "title": "Service Maintenance in Progress",
    "description": "We are currently performing system maintenance to provide a stable service. Please try again after maintenance is complete.",
    "maintenancePeriod": "May 7, 2:00 AM - 3:00 AM",
    "notice": "The end time may change depending on maintenance progress.",
    "refreshLabel": "Refresh"
  }
}
```

- locale 결정은 infrastructure fallback 환경을 고려해 query string, `<html lang>`, 또는 서버가 주입한 정적 파일 선택 중 하나로 고정해야 한다.
- 브라우저 locale 자동 판정만으로 운영하면 장애 상황에서 예측성이 떨어질 수 있으므로 기본 locale은 `ko`로 두는 것이 안전하다.

### 검증 / 미해결

- `time.json` JSON parse 확인 완료.
- `README.md`와 `index.html`에서 `time.json`, `data-pulse-motion` 참조 확인 완료.
- 로컬 HTTP curl 검증은 sandbox networking/서버 연결 문제로 완료하지 못했다.
- visual screenshot 자동 검증은 이전 in-app browser screenshot timeout 이력 때문에 수행하지 않았다.
- 미해결: 실제 다국어 스키마 도입 여부와 locale 선택 정책.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- `index.html`은 외부 npm/CDN/이미지 요청 없이 렌더링한다.
- 점검 시간만 `time.json`으로 외부화하고, 실패 시 inline fallback을 유지한다.
- pulse animation은 CSS-only로 유지한다.
- i18n 확장은 locale 정책 결정 후 text JSON schema를 확장한다.

### next-session checklist

- `index.html`과 `time.json`이 같은 서빙 루트에 있는지 먼저 확인한다.
- 운영자가 점검 시간만 바꾸는 요구라면 `time.json`의 `maintenancePeriod`만 수정한다.
- 다국어 요구가 확정되면 `time.json`을 locale-keyed content JSON으로 확장하고, `html[lang]`/query/server 선택 정책을 먼저 고정한다.
- visual QA가 필요하면 HTTP static server에서 실제 브라우저 screenshot으로 Figma와 비교한다.

## 2026-05-12 Locale Directory i18n Expansion (append-only)

### 배경

- 대상 경로는 `static-assets/assets/edge-case/**`다.
- 이전 섹션에서는 다국어 구조가 검토 단계였고, locale 선택 정책이 미해결이었다.
- 이번 작업에서 정적 인프라 fallback 예측성을 우선해 locale별 self-contained 디렉터리 방식을 확정했다.

### 변경

- `index.html`과 `time.json`은 기본 locale `ko`로 root에 유지한다.
- `en/index.html`과 `en/time.json`을 추가했다.
  - `html lang="en"`을 사용한다.
  - 화면 문구와 inline fallback 점검 시간을 영문으로 관리한다.
- `jp/index.html`과 `jp/time.json`을 추가했다.
  - 경로는 운영 요구에 맞춰 `/jp/`를 사용한다.
  - HTML language tag는 표준 값인 `ja`를 사용한다.
  - 화면 문구와 inline fallback 점검 시간을 일본어로 관리한다.
- 모든 locale의 HTML은 기존 inline favicon, megaphone inline SVG, pulse animation, Pretendard JP 우선 font stack, `fetch("./time.json", { cache: "no-store" })` fallback 정책을 유지한다.
- `README.md`는 locale별 파일 구성과 배포 구조를 기준으로 갱신했다.
- `CONTEXT-INDEX.md`는 i18n 검토 기록에서 locale별 디렉터리 운영 기록까지 포함하도록 설명을 갱신했다.

### 이유

- 장애/점검 fallback 페이지는 build step, runtime locale resolver, 공통 content JSON parser 의존성이 늘어날수록 운영 실패면이 커진다.
- locale별 `index.html + time.json`은 중복은 늘지만, 인프라가 정적 파일을 직접 선택해 서빙할 수 있고 운영자가 locale별 문구를 빌드 없이 수정할 수 있다.
- `time.json` 경로를 모든 locale에서 `./time.json`으로 유지하면 root와 하위 locale 디렉터리의 동작 계약이 동일하다.

### 영향

- 배포 구조는 다음 파일을 함께 포함해야 한다.

```txt
edge-case/
  index.html
  time.json
  en/
    index.html
    time.json
  jp/
    index.html
    time.json
```

- root `/index.html`은 계속 `ko` 기본값이다.
- 영문은 `/en/index.html`, 일본어는 `/jp/index.html`로 직접 접근한다.
- locale별 점검 시간 변경은 해당 디렉터리의 `time.json`만 수정하면 된다.
- title/description/notice/refreshLabel 변경은 해당 locale의 `index.html`을 직접 수정한다.

### 검증 / 미해결

- JSON parse 검증 완료:
  - `time.json`
  - `en/time.json`
  - `jp/time.json`
- HTTP static server 응답 확인 완료:
  - `index.html`
  - `en/index.html`
  - `jp/index.html`
- locale별 `time.json` HTTP 응답 확인 완료:
  - `time.json`
  - `en/time.json`
  - `jp/time.json`
- visual/browser screenshot 검증은 Browser tool 미노출 및 Playwright CLI wrapper 대기 문제로 미수행이다.
- 미해결: 실제 인프라 라우팅에서 `/en/`, `/jp/` 경로를 어떤 조건으로 선택할지.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- 다국어 운영 방식은 locale-keyed shared JSON이 아니라 locale별 self-contained 디렉터리다.
- root는 `ko` 기본값으로 유지한다.
- 각 locale은 같은 디렉터리의 `./time.json`만 읽는다.
- inline favicon, inline megaphone SVG, CSS-only pulse animation, Pretendard JP 우선 font stack, `time.json` 실패 시 inline fallback 정책은 유지한다.

### next-session checklist

- root, `en/`, `jp/` 디렉터리에 각각 `index.html`과 `time.json`이 함께 있는지 확인한다.
- 점검 시간만 바꾸는 작업이면 해당 locale의 `time.json`만 수정한다.
- locale별 문구를 바꾸는 작업이면 해당 locale의 `index.html` fallback 텍스트와 `time.json` 값의 의미가 어긋나지 않는지 확인한다.
- 브라우저 검증이 필요하면 `static-assets/assets/edge-case` 기준 HTTP static server로 `/`, `/en/`, `/jp/`를 확인한다.

## 2026-05-12 Shared Markup/CSS/JS/Locale Refactor (append-only)

### 배경

- 대상 경로는 `static-assets/assets/edge-case/**`다.
- 직전 구조는 `index.html`, `en/index.html`, `jp/index.html`이 같은 markup, CSS, SVG, JS를 대부분 복제했다.
- locale별로 다른 것은 콘텐츠와 HTML language tag뿐이라 운영 중복이 컸다.
- 스타일은 inline이 아니라 `/css` 하위 파일로 분리해야 한다는 요구가 추가됐다.

### 변경

- root `index.html`을 단일 유지보수 markup으로 정리했다.
  - inline favicon과 megaphone SVG는 root HTML 안에 유지한다.
  - HTML 안의 한국어 문구는 `locale.json` 또는 JS 로드 실패 시 fallback으로 유지한다.
- `css/maintenance.css`를 추가해 기존 inline style과 pulse animation을 분리했다.
- `js/locale.js`를 추가해 locale 결정과 콘텐츠 주입 로직을 공통화했다.
  - query `locale`/`lang`을 먼저 본다.
  - path segment의 `ko`, `en`, `jp`, `ja`를 locale 후보로 본다.
  - 실패 시 HTML fallback 문구를 유지한다.
- `locale.json`을 추가해 `ko`, `en`, `jp` 콘텐츠를 한 파일에서 관리한다.
- 기존 `time.json`, `en/time.json`, `jp/time.json`은 제거했다.
- `en/index.html`, `jp/index.html`은 대형 복제 페이지가 아니라 root 페이지로 이동하는 얇은 redirect shell로 축소했다.
  - `/en/index.html` -> `../?locale=en`
  - `/jp/index.html` -> `../?locale=jp`
- refresh action은 inline `onclick`을 제거하고 native link refresh로 바꿨다.

### 이유

- 이 페이지는 인프라 fallback 정적 안내 페이지라 framework나 jQuery 도입보다 native 정적 파일 구성이 더 적합하다.
- JSON fetch와 DOM text 교체는 vanilla JS로 충분하다.
- CSS/JS/content를 공통화하면 locale 추가나 문구 변경 시 HTML 복제본을 반복 수정하지 않아도 된다.
- build/server include 없이 native HTML만으로 markup을 공유할 수 없으므로, 물리 locale HTML은 redirect shell로만 남기는 것이 중복 최소화에 가장 가깝다.

### 영향

- 배포 구조는 다음 파일을 함께 포함해야 한다.

```txt
edge-case/
  index.html
  locale.json
  css/
    maintenance.css
  js/
    locale.js
  en/
    index.html
  jp/
    index.html
```

- root `/index.html`은 기본 fallback locale `ko`다.
- 영문은 `/?locale=en`, 일본어는 `/?locale=jp`로 root 단일 markup에 주입된다.
- `/en/index.html`, `/jp/index.html`은 유지되지만 실제 화면 markup을 복제하지 않는다.
- `locale.json` 또는 `js/locale.js` 로드 실패 시 root 화면은 한국어 fallback으로 표시된다.
- `/en/`, `/jp/` URL을 유지한 채 root HTML을 그대로 렌더하려면 서버 rewrite 설정이 별도로 필요하다.

### 검증 / 미해결

- JSON parse 검증 대상:
  - `locale.json`
- 정적 확인 대상:
  - `index.html`
  - `css/maintenance.css`
  - `js/locale.js`
  - `en/index.html`
  - `jp/index.html`
- HTTP static server로 root, locale query, redirect shell 응답을 확인한다.
- 미해결: 실제 배포 인프라에서 `/en/`, `/jp/`를 URL 유지 rewrite로 처리할지, 현재처럼 root query redirect shell을 유지할지.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- 다국어 운영 방식은 locale별 대형 HTML 복제가 아니라 root 단일 markup + `locale.json` + `js/locale.js`다.
- 스타일은 `css/maintenance.css`에서 관리한다.
- content SOT는 `locale.json`이다.
- root HTML의 inline favicon, inline megaphone SVG, CSS-only pulse animation, Pretendard JP 우선 font stack, 실패 시 fallback 문구 정책은 유지한다.

### next-session checklist

- 콘텐츠 변경은 먼저 `locale.json`을 확인한다.
- 스타일 변경은 `css/maintenance.css`를 확인한다.
- locale 주입 동작 변경은 `js/locale.js`를 확인한다.
- `/en/index.html`, `/jp/index.html`은 redirect shell이므로 실제 화면 markup을 추가하지 않는다.
- URL 유지형 locale route가 필요하면 정적 인프라 rewrite 지원 여부를 먼저 확인한다.

## 2026-05-12 Folder Rename to Service Maintenance (append-only)

### 배경

- 기존 폴더명 `edge-case`는 기술적 예외 상황을 뜻해 실제 목적이 잘 드러나지 않았다.
- 현재 산출물의 목적은 서비스 점검 또는 일시적 이용 제한 상황에서 표시하는 정적 안내 페이지다.
- README는 회사 외부에 노출될 수 있어 내부 작업 히스토리보다 배포/수정 방법 중심의 공개 가능한 문서 톤이 필요했다.

### 변경

- 디렉터리 경로를 `assets/edge-case`에서 `assets/service-maintenance`로 변경했다.
- context 파일명을 `CONTEXT-EDGE-CASE.md`에서 `CONTEXT-SERVICE-MAINTENANCE.md`로 변경하고 `CONTEXT-INDEX.md`의 active context 항목을 갱신했다.
- `README.md`를 public-facing 운영 안내 문서로 재작성했다.
  - 내부 판단 과정과 장황한 히스토리 설명을 제거했다.
  - 배포 구조, locale route, 콘텐츠 수정, 스타일/애니메이션 수정, fallback 정책을 중심으로 정리했다.

### 이유

- `service-maintenance`는 서비스 점검 안내라는 목적을 경로에서 바로 드러낸다.
- public-facing README는 외부 이해관계자가 보더라도 민감하거나 과도하게 내부적인 실행 기록 없이 산출물 사용법을 이해할 수 있어야 한다.
- 기존 context 히스토리는 append-only로 보존하고, 현재 우선순위는 새 섹션에서 명시한다.

### 영향

- 배포 기준 경로는 `static-assets/assets/service-maintenance/**`다.
- 기존 `static-assets/assets/edge-case/**` 경로를 참조하던 배포 설정이나 문서가 있으면 새 경로로 갱신해야 한다.
- 화면 동작 구조는 이전 섹션의 root 단일 markup + `locale.json` + `js/locale.js` + `css/maintenance.css` 계약을 유지한다.

### 검증 / 미해결

- 파일 경로 확인 대상:
  - `assets/service-maintenance/index.html`
  - `assets/service-maintenance/locale.json`
  - `assets/service-maintenance/css/maintenance.css`
  - `assets/service-maintenance/js/locale.js`
  - `assets/service-maintenance/en/index.html`
  - `assets/service-maintenance/jp/index.html`
- 미해결: 실제 배포 인프라에서 기존 `edge-case` URL이 이미 쓰이고 있다면 redirect/alias 필요 여부를 별도 확인해야 한다.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- 현재 목적지향 경로명은 `service-maintenance`다.
- public-facing README는 사용법과 배포/수정 계약 중심으로 유지한다.
- 내부 히스토리와 의사결정 로그는 `.context/CONTEXT-SERVICE-MAINTENANCE.md`에 append-only로 보존한다.

### next-session checklist

- 작업 시작 시 `assets/service-maintenance`를 기준 경로로 사용한다.
- `edge-case`라는 이름이 새 문서나 코드에 다시 도입되지 않도록 확인한다.
- 배포 설정에서 이전 경로를 참조하는지 확인한다.
- README는 외부 노출 가능성을 전제로 작성한다.

## 2026-05-12 UTC Maintenance Window SOT (append-only)

### 배경

- 기존 `locale.json`은 각 locale 객체 안에 `maintenancePeriod` 표시 문자열을 직접 보관했다.
- 이 방식은 같은 점검 기간을 언어별 문자열로 반복 관리하게 만들어 시간 SOT가 locale 콘텐츠에 종속된다.
- 새 요구는 기간을 `start`, `end`로 나누고 UTC 기준의 독립 SOT로 관리하는 것이다.

### 변경

- `locale.json` 최상위에 `maintenanceWindow`를 추가했다.
  - `start`: `2026-05-06T17:00:00Z`
  - `end`: `2026-05-06T18:00:00Z`
- locale 콘텐츠는 `locales` 하위로 이동했다.
- 각 locale에 `intlLocale`과 `timeZone`을 추가했다.
  - `ko`: `ko-KR`, `Asia/Seoul`
  - `en`: `en-US`, `UTC`
  - `jp`: `ja-JP`, `Asia/Tokyo`
- locale별 `maintenancePeriod` 문자열은 제거했다.
- `js/locale.js`는 UTC `start/end`를 파싱하고 `Intl.DateTimeFormat`으로 locale/timeZone 기준 기간 문자열을 생성한다.
- README는 점검 기간 SOT가 UTC `maintenanceWindow`임을 기준으로 갱신했다.

### 이유

- 실제 점검 기간은 언어와 독립된 운영 데이터이므로 하나의 UTC SOT로 관리해야 한다.
- locale별 문구와 시간대/표시 locale은 분리되어야 한다.
- JS 또는 JSON 로드 실패 시 root HTML의 한국어 fallback 기간 문구를 유지하므로 장애 안내 페이지의 최소 표시 계약은 유지된다.

### 영향

- 운영자가 점검 기간을 바꿀 때는 `locale.json`의 `maintenanceWindow.start`와 `maintenanceWindow.end`만 수정한다.
- 표시 timezone을 바꾸려면 해당 locale의 `timeZone` 값을 수정한다.
- 영어 페이지는 지역을 특정하지 않기 위해 기본 표시 timezone을 `UTC`로 둔다.
- 기존 locale별 `maintenancePeriod` 문자열을 직접 수정하는 방식은 최신 계약이 아니다.

### 검증 / 미해결

- 검증 대상:
  - `locale.json` JSON parse
  - `js/locale.js` syntax check
  - mock DOM에서 `?locale=en` 기간 포맷
  - mock DOM에서 `/jp/` 기간 포맷
- 미해결: 영어 페이지의 기본 timezone을 `UTC`가 아닌 특정 지역으로 바꿀 운영 정책이 있는지.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- 점검 기간 SOT는 `locale.json`의 `maintenanceWindow.start/end` UTC 값이다.
- locale별 표시 문자열은 저장하지 않고 `js/locale.js`에서 생성한다.
- locale별 표시 기준은 `intlLocale`과 `timeZone`이다.

### next-session checklist

- 점검 기간 수정 시 `maintenanceWindow`만 먼저 확인한다.
- locale별 `maintenancePeriod` 문자열을 다시 추가하지 않는다.
- timezone 정책 변경이 있으면 `locales.{locale}.timeZone`만 수정한다.

## 2026-05-12 English Client Timezone Policy (append-only)

### 배경

- 점검 기간 SOT는 UTC지만, 영어 페이지는 글로벌 사용자 대상이다.
- HQ, 개발, 유지보수, CS는 한국 기준으로 운영되지만, 영어 사용자는 접속 국가가 불특정이다.
- `en`을 `UTC` 고정 표시로 두면 사용자 현지 시간 이해도는 낮아질 수 있다.

### 변경

- `locale.json`의 `locales.en.timeZone`을 `UTC`에서 `client`로 변경했다.
- `js/locale.js`는 `timeZone` 값이 `client`이면 `Intl.DateTimeFormat` 옵션에 `timeZone`을 넣지 않는다.
- 브라우저/OS의 기본 timezone으로 영어 점검 기간을 표시한다.
- README에 `timeZone: "client"` 정책을 추가했다.

### 이유

- UTC는 저장/SOT 기준으로 유지하되, 글로벌 영어 사용자에게는 현지 시간 표시가 더 이해하기 쉽다.
- timezone 약어는 `timeZoneName: "short"`로 계속 표시해 CS 문의 시 기준 시간대를 확인할 수 있게 한다.

### 영향

- `en` 화면의 점검 시간은 접속 환경 timezone에 따라 달라진다.
- `ko`는 계속 `Asia/Seoul`, `jp`는 계속 `Asia/Tokyo` 기준이다.
- 운영자가 영어 화면도 고정 timezone으로 보여줘야 한다고 결정하면 `locales.en.timeZone`만 `UTC` 또는 다른 IANA timezone으로 바꾸면 된다.

### 검증 / 미해결

- 검증 대상:
  - `locale.json` JSON parse
  - `js/locale.js` syntax check
  - mock DOM에서 `?locale=en`이 환경 timezone으로 포맷되는지 확인
- 미해결: 실제 브라우저/OS timezone별 표시 QA.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- `en`은 `timeZone: "client"`로 접속 환경 timezone을 사용한다.
- UTC `maintenanceWindow.start/end`는 계속 단일 SOT다.

### next-session checklist

- 영어 표시 시간이 사용자 환경별로 달라지는 것은 의도된 동작이다.
- 영어 timezone 고정 요구가 생기면 `locales.en.timeZone`만 수정한다.

## 2026-05-12 README Infrastructure Requirements Update (append-only)

### 배경

- 현재 구조는 단일 HTML 파일이 아니라 정적 디렉터리 전체 배포를 전제로 한다.
- 인프라 끼워넣기 조건을 README에서 바로 판단할 수 있어야 한다.

### 변경

- README에 `Infrastructure Requirements` 섹션을 추가했다.
- 정적 디렉터리 전체 서빙 조건, query string 유지 조건, 단일 HTML 환경 미지원 조건을 명시했다.
- 권장 CSP 기준을 문서화했다.

### 이유

- 외부 노출 가능한 README에서도 배포 전제와 실패 조건을 명확히 알 수 있어야 한다.
- `/en/index.html`, `/jp/index.html`은 route shell이므로 query string이 제거되면 locale route가 깨진다.

### 영향

- 구현 파일 변경은 없다.
- README는 현재 구조가 정적 assets 디렉터리 통합용이며 single-file 장애 페이지용이 아니라는 점을 명시한다.

### 검증 / 미해결

- README에서 `Infrastructure Requirements` 섹션 확인.
- 미해결: 실제 인프라 CSP/route 설정 확인.

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- 인프라 통합 조건은 README의 `Infrastructure Requirements`를 기준으로 판단한다.

### next-session checklist

- 배포 이슈가 있으면 README의 정적 디렉터리/단일 HTML/query/CSP 조건을 먼저 확인한다.

## 2026-05-12 Final Handoff Check (append-only)

### 배경

- `assets/service-maintenance/**` 개편 작업의 종료 판단을 위해 현재 파일 구조, 콘텐츠 SOT, locale/timezone 정책, 인프라 통합 조건을 최종 점검했다.

### 변경

- 구현 파일 변경은 없다.
- 최종 handoff 기준을 이 섹션에 정리한다.

### 이유

- 다음 세션은 과거 `edge-case`, `time.json`, locale별 HTML 복제 결정보다 최신 `service-maintenance` 계약을 우선해야 한다.
- README는 public-facing 운영 안내이고, 상세 의사결정 히스토리는 이 context 문서에 보존한다.

### 영향

- 현재 기준 경로는 `static-assets/assets/service-maintenance/**`다.
- 화면 구조는 root 단일 markup + `css/maintenance.css` + `js/locale.js` + `locale.json`이다.
- `en/index.html`, `jp/index.html`은 route shell이며 실제 화면 markup을 복제하지 않는다.
- 점검 기간 SOT는 `locale.json`의 `maintenanceWindow.start/end` UTC 값이다.
- locale별 timezone 정책은 `ko=Asia/Seoul`, `en=client`, `jp=Asia/Tokyo`다.
- 인프라 통합 조건은 README의 `Infrastructure Requirements` 섹션을 기준으로 한다.

### 검증 / 미해결

- 확인 완료:
  - 파일 구조 확인
  - `locale.json` JSON parse
  - `js/locale.js` syntax check
  - README의 `Infrastructure Requirements` 섹션 확인
- 미수행:
  - `prettier` formatter: 로컬 명령 없음
  - 실제 브라우저/OS timezone별 visual QA
  - 실제 배포 인프라 CSP/query route 확인
- 미해결:
  - 기존 `edge-case` 배포 URL 사용 이력이 있으면 alias/redirect 필요 여부 확인
  - 단일 HTML 장애 페이지 환경이 필요하면 별도 single-file variant 설계 필요

### current-priority contract

- 최신 우선순위는 이 섹션이다.
- `service-maintenance`가 목적지향 경로명이다.
- `locale.json`의 UTC `maintenanceWindow.start/end`가 시간 SOT다.
- locale별 표시 시간은 `js/locale.js`가 `intlLocale`과 `timeZone`으로 생성한다.
- 영어는 `timeZone: "client"`로 접속 환경 timezone을 사용한다.
- README는 외부 노출 가능성을 전제로 유지한다.

### next-session checklist

- 새 작업은 `assets/service-maintenance`에서 시작한다.
- 콘텐츠/시간 수정은 `locale.json`을 먼저 본다.
- 스타일 수정은 `css/maintenance.css`를 먼저 본다.
- locale 동작 수정은 `js/locale.js`를 먼저 본다.
- 배포 문제는 README의 인프라 요구사항을 먼저 확인한다.
