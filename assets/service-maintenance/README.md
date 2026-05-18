# Service Maintenance Page

서비스 점검 또는 일시적인 서비스 이용 제한 상황에서 정적 파일로 제공하는 안내 페이지입니다.

이 페이지는 별도 빌드 과정이나 외부 라이브러리 없이 동작합니다. 기본 화면은 한국어이며, `locale.json`을 통해 영어와 일본어 콘텐츠를 함께 관리합니다.

## Structure

```txt
service-maintenance/
  index.html
  standalone.html
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

- `index.html`: 점검 안내 화면의 기본 markup과 한국어 fallback 콘텐츠
- `standalone.html`: CSS, JS, locale 데이터를 포함한 단일 HTML 배포용 파일
- `locale.json`: UTC 기준 점검 기간과 언어별 문구
- `css/maintenance.css`: 화면 스타일과 megaphone pulse animation
- `js/locale.js`: 현재 locale에 맞는 콘텐츠 적용
- `en/index.html`: 영어 안내로 이동하는 정적 route shell
- `jp/index.html`: 일본어 안내로 이동하는 정적 route shell

## Locale Routes

```txt
ko: /index.html
en: /en/index.html -> /?locale=en
jp: /jp/index.html -> /?locale=jp
```

일본어 route 폴더명은 `jp`를 사용하지만, HTML language tag는 표준 값인 `ja`를 사용합니다.

`standalone.html`은 locale route를 사용하지 않고 접속자의 브라우저 언어를 기준으로 `ko`, `en`, `jp` 콘텐츠를 선택합니다. 브라우저 언어가 지원 대상이 아니면 한국어 콘텐츠를 표시합니다.

## Content Updates

점검 기간과 안내 문구는 `locale.json`에서 수정합니다.

점검 기간은 언어별 문구가 아니라 `maintenanceWindow`의 UTC 값이 기준입니다. 화면에는 각 locale의 `timeZone` 기준으로 변환해 표시합니다.
`timeZone`이 `client`이면 접속자의 브라우저/OS 시간대를 사용합니다. 화면에는 `GMT+9`, `PDT`, `JST` 같은 timezone suffix를 표시하지 않습니다.

```json
{
  "maintenanceWindow": {
    "start": "2026-05-06T17:00:00Z",
    "end": "2026-05-06T18:00:00Z"
  },
  "locales": {
    "ko": {
      "timeZone": "Asia/Seoul"
    },
    "en": {
      "timeZone": "client"
    },
    "jp": {
      "timeZone": "Asia/Tokyo"
    }
  }
}
```

`locale.json`에서 관리하는 항목:

- `maintenanceWindow.start`
- `maintenanceWindow.end`
- `documentTitle`
- `title`
- `description`
- `notice`
- `refreshLabel`
- `intlLocale`
- `timeZone`

`locale.json` 또는 `js/locale.js`를 불러오지 못하면 `index.html`에 포함된 기본 한국어 문구가 표시됩니다.

## Styling

스타일은 `css/maintenance.css`에서 관리합니다.

Megaphone pulse animation은 `index.html`의 `data-pulse-motion` 값으로 전환할 수 있습니다.

```html
<div class="maintenance__icon" data-pulse-motion="outward" aria-hidden="true"></div>
```

- `outward`: 안쪽에서 바깥쪽으로 퍼지는 형태
- `in-out`: 안쪽에서 바깥쪽으로 표시된 뒤 다시 안쪽으로 사라지는 형태

사용자 환경이 `prefers-reduced-motion: reduce`이면 애니메이션은 정지된 상태로 표시됩니다.

## Deployment

`index.html`, `locale.json`, `css/maintenance.css`, `js/locale.js`, `en/index.html`, `jp/index.html`을 같은 디렉터리 구조로 배포합니다.

favicon은 service-maintenance 배포 스코프 밖의 상대 경로에 의존하지 않도록 `https://raw.githubusercontent.com/uniai-corp/makeup/refs/heads/main/assets/favicon/` 절대 URL을 참조합니다.
megaphone SVG는 `index.html`에 포함되어 있어 별도 이미지 요청을 만들지 않습니다.

단일 HTML만 등록할 수 있는 환경에는 `standalone.html`을 사용합니다. 이 파일은 CSS, JS, locale 데이터, 본문 SVG, favicon data URI를 모두 포함하며 외부 favicon 요청도 만들지 않습니다. `locale.json`은 계속 원본 콘텐츠 SOT이고, `standalone.html`은 단일 파일 배포를 위한 파생 산출물입니다.

## Infrastructure Requirements

이 페이지는 정적 디렉터리 전체를 서빙할 수 있는 환경을 기준으로 합니다.

충족되는 환경:

- 정적 파일과 하위 디렉터리를 함께 배포할 수 있음
- `index.html`에서 같은 디렉터리의 `locale.json`, `css/maintenance.css`, `js/locale.js`를 요청할 수 있음
- `/en/index.html`, `/jp/index.html`에서 root 페이지의 query route로 이동할 수 있음
- query string을 유지함

단일 HTML 파일만 등록하는 장애 페이지 환경에서는 `standalone.html`을 사용합니다.

권장 CSP 기준:

```txt
script-src 'self'
style-src 'self'
connect-src 'self'
img-src 'self' data: https://raw.githubusercontent.com
```

`standalone.html`은 inline `<style>`과 inline `<script>`를 사용하므로, 엄격한 CSP 환경에서는 해당 inline block에 대한 hash 또는 별도 inline 허용 정책이 필요합니다.

`/en/index.html`과 `/jp/index.html`은 각각 `/?locale=en`, `/?locale=jp`로 이동하는 route shell입니다. 인프라가 query string을 제거하거나 root `index.html` 접근을 막으면 언어별 route가 정상 동작하지 않습니다.
