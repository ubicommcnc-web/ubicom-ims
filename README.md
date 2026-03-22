# UBICOM IMS

> **유비콤 IT 네트워크 장비 재고관리 시스템**
> Google Sheets를 DB로 사용하는 사내 전용 재고관리 웹 애플리케이션

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [폴더 구조](#3-폴더-구조)
4. [환경변수 설정](#4-환경변수-설정)
5. [로컬 실행 방법](#5-로컬-실행-방법)
6. [배포 방법 (GitHub Pages)](#6-배포-방법-github-pages)
7. [Google Cloud Console 설정](#7-google-cloud-console-설정)
8. [Google Sheets DB 구조](#8-google-sheets-db-구조)
9. [화면 구성 및 주요 기능](#9-화면-구성-및-주요-기능)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 시스템명 | UBICOM IMS (Inventory Management System) |
| 목적 | IT 네트워크 장비(스위치·라우터·방화벽·무선랜·NAC센서 등) 입출고 및 재고 현황 관리 |
| 사용 대상 | 유비콤 팀원 8명 |
| 인증 | Google OAuth 2.0 — 구글 계정 로그인 |
| 데이터 저장소 | Google Sheets (시트 3개, 별도 백엔드 서버 없음) |
| 배포 환경 | GitHub Pages (정적 호스팅, 무료) |
| 지원 환경 | 데스크톱 / 태블릿 / 모바일 (반응형) |

---

## 2. 기술 스택

### Runtime Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react` | ^18.3.1 | UI 라이브러리 |
| `react-dom` | ^18.3.1 | DOM 렌더링 |
| `react-router-dom` | ^6.26.2 | 클라이언트 라우팅 |
| `@react-oauth/google` | ^0.12.1 | Google OAuth 2.0 토큰 플로우 |
| `date-fns` | ^4.1.0 | 날짜 포맷 |
| `lucide-react` | ^0.462.0 | 아이콘 |
| `recharts` | ^2.15.4 | 바 차트·파이 차트 |
| `xlsx` | ^0.18.5 | 엑셀 내보내기 (SheetJS) |
| `axios` | ^1.7.7 | HTTP 클라이언트 (예비용) |

### Dev Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `vite` | ^5.4.10 | 빌드 도구·개발 서버 |
| `@vitejs/plugin-react` | ^4.3.3 | Vite React 플러그인 |
| `tailwindcss` | ^3.4.14 | 유틸리티 CSS |
| `postcss` + `autoprefixer` | — | CSS 후처리 |
| `gh-pages` | ^6.2.0 | GitHub Pages 배포 |

### 외부 API

| 서비스 | 사용 목적 |
|--------|-----------|
| Google Sheets API v4 | 품목·이력·재고 데이터 읽기/쓰기 |
| Google OAuth 2.0 UserInfo | 로그인 사용자 프로필 조회 |

---

## 3. 폴더 구조

```
ubicom-ims/
│
├── public/                         # 정적 파일
├── dist/                           # 빌드 결과물 (git 제외)
│
├── src/
│   │
│   ├── config/
│   │   └── google.js               # API 설정값, 시트명 상수, 컬럼 인덱스, 카테고리 목록
│   │
│   ├── context/
│   │   └── AuthContext.jsx         # Google OAuth access_token·사용자 정보 전역 관리
│   │
│   ├── services/
│   │   └── sheetsApi.js            # Google Sheets REST API 연동 함수 전체
│   │                               #  - fetchItems / addItem / updateItem / deleteItem
│   │                               #  - fetchTransactions / registerInbound / registerOutbound
│   │                               #  - fetchStock / recalcStock
│   │
│   ├── utils/
│   │   └── exportExcel.js          # SheetJS 엑셀 내보내기 유틸
│   │                               #  - exportStockList() → 재고목록_YYYYMMDD.xlsx
│   │                               #  - exportHistory()   → 입출고이력_YYYYMMDD.xlsx
│   │
│   ├── components/
│   │   ├── Layout.jsx              # 사이드바 + 모바일 상단바 + Outlet (반응형)
│   │   ├── ItemSearchInput.jsx     # 품목명·모델번호·브랜드 실시간 검색 드롭다운
│   │   ├── PageHeader.jsx          # 페이지 제목·설명·액션 버튼 공통 헤더
│   │   └── LoadingSpinner.jsx      # 로딩 인디케이터
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx           # Google 로그인 화면
│   │   ├── Dashboard.jsx           # 대시보드 (요약 카드, 부족 경고, 최근 이력)
│   │   ├── Inbound.jsx             # 입고 등록 폼
│   │   ├── Outbound.jsx            # 출고 등록 폼 (재고 초과 방지 검증)
│   │   ├── Items.jsx               # 품목 관리 (목록 + 추가·수정 모달 + 삭제 팝업)
│   │   ├── StockList.jsx           # 재고 목록 (필터·검색·엑셀 내보내기)
│   │   ├── Projects.jsx            # 프로젝트별 출고 현황 (고객사 카드·카테고리 집계)
│   │   ├── Stats.jsx               # 월별 통계 (바 차트·파이 차트·Top7·연도 선택)
│   │   └── History.jsx             # 입출고 이력 (다중 필터·엑셀 내보내기)
│   │
│   ├── App.jsx                     # 라우팅 정의 + PrivateRoute 인증 보호
│   ├── main.jsx                    # 앱 진입점 (GoogleOAuthProvider·BrowserRouter·AuthProvider)
│   └── index.css                   # Tailwind 지시자 + 공통 컴포넌트 클래스
│
├── index.html                      # Vite HTML 엔트리
├── vite.config.js                  # base: '/ubicom-ims/', port: 3000
├── tailwind.config.js              # content 경로, 커스텀 색상
├── postcss.config.js               # Tailwind + Autoprefixer
├── package.json                    # 의존성 및 npm 스크립트
├── .env                            # 환경변수 (git 제외 — 직접 생성 필요)
├── .gitignore
└── README.md
```

---

## 4. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 세 값을 입력합니다.

```env
# ── Google OAuth 2.0 클라이언트 ID ──────────────────────────────────────────
# Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 ID
VITE_GOOGLE_CLIENT_ID=123456789000-xxxxxxxxxxxxxx.apps.googleusercontent.com

# ── Google Sheets 스프레드시트 ID ────────────────────────────────────────────
# 시트 URL: https://docs.google.com/spreadsheets/d/[여기]/edit
VITE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

# ── Google Sheets API Key ────────────────────────────────────────────────────
# Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > API 키
VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ `.env` 파일은 `.gitignore`에 등록되어 있어 GitHub에 업로드되지 않습니다.
> ⚠️ Vite 환경변수는 반드시 `VITE_` 접두사로 시작해야 브라우저에서 접근 가능합니다.

---

## 5. 로컬 실행 방법

### 사전 요구사항

- [Node.js v18 이상](https://nodejs.org) 설치
- `.env` 파일 작성 완료 ([4번 항목](#4-환경변수-설정) 참고)
- Google Cloud Console 설정 완료 ([7번 항목](#7-google-cloud-console-설정) 참고)

### 실행 명령

```bash
# 1. 프로젝트 폴더 이동
cd ubicom-ims

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작 → http://localhost:3000 자동 오픈
npm run dev
```

### 기타 명령

```bash
# 프로덕션 빌드 (dist/ 폴더 생성)
npm run build

# 빌드 결과 로컬 미리보기
npm run preview
```

---

## 6. 배포 방법 (GitHub Pages)

### 구조 이해

`vite.config.js`의 `base: '/ubicom-ims/'` 설정으로 모든 정적 자산 경로가
`https://<계정>.github.io/ubicom-ims/` 기준으로 생성됩니다.

### 최초 배포 (저장소 연결)

```bash
# Git 초기화 및 원격 저장소 연결 (최초 1회)
git init
git remote add origin https://github.com/<GitHub계정>/ubicom-ims.git
git add .
git commit -m "init: UBICOM IMS 초기 커밋"
git push -u origin main
```

### 배포 실행

```bash
# 빌드 + gh-pages 브랜치 자동 배포 (한 번에)
npm run deploy
```

내부 동작 순서:

```
predeploy  →  npm run build     # dist/ 빌드
deploy     →  gh-pages -d dist  # dist/ 내용을 gh-pages 브랜치로 푸시
```

### GitHub 저장소 Pages 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `gh-pages` / `/ (root)` → **Save**

### 배포 완료 후 접속 URL

```
https://<GitHub계정>.github.io/ubicom-ims/
```

> ⚠️ 배포 후 Google Cloud Console에서 OAuth 클라이언트의
> **승인된 JavaScript 원본**에 위 URL(`https://<계정>.github.io`)을 반드시 추가해야
> 로그인이 정상 동작합니다.

---

## 7. Google Cloud Console 설정

### 7-1. 프로젝트 생성 및 API 활성화

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 (예: `ubicom-ims`)
3. **API 및 서비스 → 라이브러리** 에서 다음 두 API 활성화

| API | 필요 이유 |
|-----|-----------|
| **Google Sheets API** | 스프레드시트 읽기·쓰기·행 삭제 |
| **Google Drive API** | 스프레드시트 목록 접근 (OAuth scope) |

### 7-2. OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
2. 애플리케이션 유형: **웹 애플리케이션**
3. **승인된 JavaScript 원본** 에 아래 URL 추가

| 환경 | 등록 URL |
|------|----------|
| 로컬 개발 | `http://localhost:3000` |
| GitHub Pages | `https://<GitHub계정>.github.io` |

4. 생성된 **클라이언트 ID** → `.env`의 `VITE_GOOGLE_CLIENT_ID`에 입력

### 7-3. API 키 생성

1. **사용자 인증 정보 만들기 → API 키**
2. (권장) **API 제한**: Google Sheets API 선택
3. (권장) **웹사이트 제한**: 운영 도메인 등록
4. 생성된 **API 키** → `.env`의 `VITE_GOOGLE_API_KEY`에 입력

### 7-4. OAuth 동의 화면 설정

| 조건 | 설정 방법 |
|------|-----------|
| **Google Workspace 도메인** 사용 중 | 게시 상태 **내부(Internal)** → 도메인 내 계정 전체 자동 허용 |
| **일반 Gmail** 사용 | 테스트 모드 → **테스트 사용자**에 팀원 이메일 8개 추가 |

### 7-5. 사용하는 OAuth Scope

```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.readonly
```

---

## 8. Google Sheets DB 구조

스프레드시트 하나에 시트 탭 3개를 생성합니다.
시트 탭 이름은 정확히 **`items`** / **`transactions`** / **`stock`** 이어야 합니다.

### 시트 1 — `items` (품목 마스터)

| 열 | 필드 | 타입 | 설명 | 예시 |
|----|------|------|------|------|
| A | 품목ID | 문자열 | 앱 자동 생성 `ITEM-타임스탬프` | `ITEM-1711234567890` |
| B | 품목명 | 문자열 | 장비 이름 | `24포트 스위치` |
| C | 브랜드 | 문자열 | 제조사 | `Cisco` |
| D | 카테고리 | 문자열 | 아래 7종 중 하나 | `스위치` |
| E | 모델번호 | 문자열 | 모델 식별자 | `WS-C2960X-24TS-L` |
| F | 단위 | 문자열 | 재고 단위 | `대`, `개`, `EA` |
| G | 최소재고수량 | 숫자 | 부족 판단 기준 | `5` |
| H | 비고 | 문자열 | 메모 (선택) | — |

**허용 카테고리 (7종):** `스위치` · `라우터` · `방화벽` · `무선랜` · `NAC센서` · `IP관리기센서` · `기타`

### 시트 2 — `transactions` (입출고 이력)

| 열 | 필드 | 타입 | 설명 | 예시 |
|----|------|------|------|------|
| A | 이력ID | 문자열 | 앱 자동 생성 `TX-타임스탬프` | `TX-1711234567891` |
| B | 날짜 | 문자열 | `yyyy-MM-dd` 형식 | `2026-03-22` |
| C | 품목ID | 문자열 | items 시트 품목ID 참조 | `ITEM-1711234567890` |
| D | 구분 | 문자열 | `입고` 또는 `출고` | `입고` |
| E | 수량 | 숫자 | 정수 | `10` |
| F | 거래처 | 문자열 | 입고:공급처 / 출고:고객사 | `시스코코리아` |
| G | 프로젝트명 | 문자열 | 출고 시 관련 프로젝트 (선택) | `신분당선 NAC 구축` |
| H | 담당자 | 문자열 | 처리 팀원 이름 | `홍길동` |
| I | 비고 | 문자열 | 메모 (선택) | — |

### 시트 3 — `stock` (현재 재고 — 앱 자동 계산)

> 입출고 등록 시 앱이 전체 transactions를 집계해 자동으로 덮어씁니다.
> **수동 편집 불필요.**

| 열 | 필드 | 설명 |
|----|------|------|
| A | 품목ID | items 시트 품목ID |
| B | 품목명 | items 시트에서 복사 |
| C | 현재재고 | `Σ입고 수량 − Σ출고 수량` |
| D | 최소재고 | items 시트 최소재고수량 |
| E | 부족여부 | 현재재고 < 최소재고 → `Y`, 그 외 → `N` |

---

## 9. 화면 구성 및 주요 기능

### 사이드바 메뉴 (전체 8개)

```
대시보드   /dashboard
입고 등록  /inbound
출고 등록  /outbound
품목 관리  /items
재고 목록  /stock
프로젝트 현황  /projects
통계       /stats
이력 조회  /history
```

---

### 🔐 로그인 `/login`
- Google OAuth 2.0 **토큰 플로우** 인증
- 로그인 성공 시 `access_token`을 `sessionStorage`에 저장
- 이후 Sheets API 호출 시 `Authorization: Bearer <token>` 헤더 자동 포함
- 미인증 상태에서 보호된 경로 접근 시 `/login`으로 자동 리다이렉트
- 탭 닫으면 세션 만료 (sessionStorage 특성)

---

### 📊 대시보드 `/dashboard`
- **요약 카드 4개**: 전체 품목 수 · 재고 부족 종수 · 오늘 입고 건수 · 오늘 출고 건수
- **재고 부족 경고**: 현재고 < 최소재고인 품목 목록 (적색 강조)
- **최근 입출고 이력**: 날짜 내림차순 최근 10건 테이블

---

### 📥 입고 등록 `/inbound`

| 필드 | 필수 | 비고 |
|------|:----:|------|
| 품목 선택 | ✅ | 품목명·모델번호·브랜드 실시간 검색 |
| 수량 | ✅ | 1 이상 정수 |
| 입고 날짜 | ✅ | 기본값: 오늘 |
| 공급처 | ✅ | |
| 담당자 | ✅ | 기본값: 로그인 계정 이름 |
| 비고 | — | |

- 등록 완료 시 `recalcStock()` 자동 호출 → stock 시트 즉시 갱신

---

### 📤 출고 등록 `/outbound`

| 필드 | 필수 | 비고 |
|------|:----:|------|
| 품목 선택 | ✅ | 선택 즉시 현재 재고 표시 |
| 수량 | ✅ | 현재 재고 초과 시 등록 차단 |
| 출고 날짜 | ✅ | 기본값: 오늘 |
| 고객사 | ✅ | |
| 프로젝트명 | — | |
| 담당자 | ✅ | 기본값: 로그인 계정 이름 |
| 비고 | — | |

- **재고 초과 방지**: 요청 수량 > 현재 재고이면 저장 차단 + 오류 메시지

---

### 📦 품목 관리 `/items`
- 전체 품목 테이블 (품목명·브랜드·카테고리·모델번호·단위·최소재고·비고)
- **신규 추가**: 모달 폼 (품목ID 자동 생성 `ITEM-타임스탬프`)
- **수정**: 행 클릭 → 수정 모달 (현재 값 자동 채움)
- **삭제**: 삭제 아이콘 클릭 → 확인 팝업 → Sheets `batchUpdate deleteDimension` 으로 행 삭제
- 텍스트 검색 + 카테고리 드롭다운 필터

---

### 📋 재고 목록 `/stock`
- 전체 품목 현재 재고 테이블
- **3중 필터**: 텍스트 검색 / 카테고리 / 부족 품목만 체크박스
- **재계산 버튼**: transactions 전체 재집계 → stock 시트 즉시 갱신
- **엑셀 내보내기**: 현재 필터 결과를 `재고목록_YYYYMMDD.xlsx`로 저장

---

### 🏢 프로젝트 현황 `/projects`
- **필터**: 고객사 검색 / 카테고리 / 날짜 범위
- **상단 요약 카드**: 총 출고 건수·수량 / 고객사 수 / 프로젝트 수
- **카테고리별 출고 수량 바**: 비율 진행 바로 시각화
- **고객사 카드**: 출고 수량 내림차순 / 카드 클릭으로 펼치기·접기
  - 카드 내부: 카테고리별 칩 + 프로젝트별 상세 테이블 + 소계 행

---

### 📈 통계 `/stats`
- **연도 선택 드롭다운** (현재 연도 기준 최근 5년)
- **연간 요약 카드**: 총 입고·출고·순 증감·활동 품목 수
- **월별 입출고 막대 차트** (`recharts BarChart`): 1~12월, 입고(파랑)·출고(주황), 커스텀 Tooltip
- **카테고리별 현재 재고 도넛 파이 차트** (`recharts PieChart`): 7가지 색상 + 범례 테이블
- **카테고리별 연간 출고 집계**: 순위·비율 진행 바
- **출고 상위 품목 Top 7**: 1·2·3위 금·은·동 색상 + 가로 진행 바
- **월별 상세 테이블**: 12개월 수량·건수 + 연간 합계 행

---

### 📋 이력 조회 `/history`
- 전체 입출고 이력 테이블 (날짜 내림차순)
- **4중 필터**: 텍스트 검색 / 구분(입고·출고) / 담당자 / 날짜 범위
- **엑셀 내보내기**: 현재 필터 결과를 `입출고이력_YYYYMMDD.xlsx`로 저장 (12개 컬럼)

---

## API 함수 목록 (`src/services/sheetsApi.js`)

| 함수 | 설명 |
|------|------|
| `fetchItems()` | items 시트 전체 조회 |
| `addItem(item)` | items 시트에 행 추가, ID 자동 생성 |
| `updateItem(item)` | 해당 품목 행 전체 덮어쓰기 |
| `deleteItem(itemId)` | `batchUpdate deleteDimension`으로 행 삭제 |
| `fetchTransactions()` | transactions 시트 전체 조회 |
| `registerInbound(...)` | 입고 행 추가 후 `recalcStock()` 실행 |
| `registerOutbound(...)` | 출고 행 추가 후 `recalcStock()` 실행 |
| `fetchStock()` | stock 시트 빠른 조회 |
| `recalcStock()` | transactions 전체 집계 후 stock 시트 갱신 |

---

## 라이선스

사내 전용 도구입니다. 외부 배포 및 무단 공개를 금합니다.

© 2026 UBICOM. All rights reserved.
