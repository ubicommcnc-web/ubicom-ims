# UBICOM IMS — IT 네트워크 장비 재고관리 시스템

> **UBICOM Inventory Management System**
> 유비콤 팀(8명)을 위한 IT 네트워크 장비 입출고·재고 현황 관리 웹 애플리케이션

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [폴더 구조](#3-폴더-구조)
4. [환경변수 설정](#4-환경변수-설정)
5. [로컬 개발 실행](#5-로컬-개발-실행)
6. [GitHub Pages 배포](#6-github-pages-배포)
7. [Google Cloud Console 설정](#7-google-cloud-console-설정)
8. [Google Sheets DB 구조](#8-google-sheets-db-구조)
9. [주요 기능 설명](#9-주요-기능-설명)

---

## 1. 프로젝트 개요

유비콤의 IT 네트워크 장비(스위치·라우터·방화벽·무선랜·NAC센서·IP관리기센서 등) 재고를 팀 전체가 실시간으로 관리하기 위한 웹앱입니다.

**별도 백엔드 서버 없이** Google Sheets를 데이터베이스로, Google OAuth 2.0을 인증 수단으로 사용하여 운영 비용 없이 사내 팀원만 접근 가능한 재고관리 시스템을 구현합니다.

| 항목 | 내용 |
|------|------|
| 사용 대상 | 유비콤 팀원 8명 |
| 인증 방식 | Google OAuth 2.0 (Google 계정 로그인) |
| 데이터 저장소 | Google Sheets (시트 3개) |
| 배포 환경 | GitHub Pages (정적 호스팅) |
| 지원 디바이스 | PC, 태블릿, 모바일 (반응형) |

---

## 2. 기술 스택

### 프론트엔드

| 패키지 | 버전 | 용도 |
|--------|------|------|
| **React** | 18.3.x | UI 라이브러리 |
| **Vite** | 5.4.x | 빌드 도구 / 개발 서버 |
| **React Router DOM** | 6.26.x | 클라이언트 사이드 라우팅 |
| **Tailwind CSS** | 3.4.x | 유틸리티 우선 CSS 프레임워크 |
| **lucide-react** | 0.462.x | 아이콘 라이브러리 |
| **date-fns** | 4.1.x | 날짜 포맷 유틸리티 |

### 인증 / API

| 패키지 | 버전 | 용도 |
|--------|------|------|
| **@react-oauth/google** | 0.12.x | Google OAuth 2.0 토큰 플로우 |
| **Google Sheets API v4** | REST | 스프레드시트 읽기 / 쓰기 (fetch 직접 호출) |

### 배포 도구

| 패키지 | 버전 | 용도 |
|--------|------|------|
| **gh-pages** | 6.2.x | `dist/` → `gh-pages` 브랜치 자동 배포 |

---

## 3. 폴더 구조

```
ubicom-ims/
│
├── public/                         # 정적 파일
│
├── src/
│   ├── config/
│   │   └── google.js               # Google API 설정값, 시트 상수, 컬럼 인덱스, 카테고리 목록
│   │
│   ├── services/
│   │   └── sheetsApi.js            # Google Sheets REST API 연동 함수 모음
│   │                               #   fetchItems / addItem
│   │                               #   fetchTransactions / registerInbound / registerOutbound
│   │                               #   fetchStock / recalcStock
│   │
│   ├── context/
│   │   └── AuthContext.jsx         # Google OAuth 로그인 상태 전역 관리 (React Context)
│   │
│   ├── components/
│   │   ├── Layout.jsx              # 사이드바 + 상단바 + Outlet (반응형)
│   │   ├── ItemSearchInput.jsx     # 품목명·모델번호 실시간 검색 드롭다운 컴포넌트
│   │   ├── PageHeader.jsx          # 페이지 제목·설명·액션버튼 공통 헤더
│   │   └── LoadingSpinner.jsx      # 로딩 인디케이터
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx           # Google 로그인 화면
│   │   ├── Dashboard.jsx           # 대시보드 (요약 카드, 부족 경고, 최근 이력)
│   │   ├── Inbound.jsx             # 입고 등록 폼
│   │   ├── Outbound.jsx            # 출고 등록 폼 (재고 초과 검증 포함)
│   │   ├── StockList.jsx           # 재고 목록 테이블 (카테고리·검색·부족필터)
│   │   └── History.jsx             # 입출고 이력 테이블 (날짜·구분·담당자 필터)
│   │
│   ├── App.jsx                     # 라우팅 정의 + 인증 보호 라우트(PrivateRoute)
│   ├── main.jsx                    # 앱 진입점 (GoogleOAuthProvider, BrowserRouter, AuthProvider)
│   └── index.css                   # Tailwind 지시자 + 공통 컴포넌트 클래스 정의
│
├── index.html                      # Vite HTML 엔트리
├── vite.config.js                  # Vite 설정 (base: '/ubicom-ims/')
├── tailwind.config.js              # Tailwind 설정 (content 경로, 커스텀 색상)
├── postcss.config.js               # PostCSS (Tailwind + Autoprefixer)
├── package.json                    # 의존성 및 npm 스크립트
├── .env.example                    # 환경변수 템플릿 (복사하여 .env로 사용)
├── .gitignore                      # node_modules, dist, .env 제외
└── README.md                       # 이 문서
```

---

## 4. 환경변수 설정

프로젝트 루트의 `.env.example`을 복사해 `.env` 파일을 만들고 아래 세 값을 입력합니다.

```bash
cp .env.example .env
```

```env
# Google OAuth 2.0 클라이언트 ID
# Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 ID
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com

# Google Sheets 스프레드시트 ID
# 시트 URL: https://docs.google.com/spreadsheets/d/[여기]/edit
VITE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

# Google Sheets API Key
# Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > API 키
VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ `.env` 파일은 `.gitignore`에 등록되어 있어 GitHub에 절대 업로드되지 않습니다.
> ⚠️ Vite에서 환경변수는 반드시 `VITE_` 접두사로 시작해야 브라우저에서 접근됩니다.

---

## 5. 로컬 개발 실행

### 사전 요구사항

- [Node.js](https://nodejs.org) **v18 이상** 설치 필요
- Google Cloud 설정 완료 및 `.env` 파일 작성 완료

### 실행 명령어

```bash
# 1. 프로젝트 폴더로 이동
cd ubicom-ims

# 2. 의존성 패키지 설치
npm install

# 3. 개발 서버 시작 (http://localhost:3000 자동 오픈)
npm run dev
```

### 기타 명령어

```bash
# 프로덕션 빌드 (dist/ 폴더 생성)
npm run build

# 빌드 결과 로컬 미리보기
npm run preview
```

---

## 6. GitHub Pages 배포

### 전제 조건

- GitHub 저장소 생성 완료
- 저장소명이 `ubicom-ims` (vite.config.js의 `base: '/ubicom-ims/'`와 일치)

### 배포 절차

```bash
# 1. Git 초기화 및 원격 저장소 연결 (최초 1회)
git init
git remote add origin https://github.com/<GitHub계정>/ubicom-ims.git
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. GitHub Pages 배포 (빌드 + gh-pages 브랜치 자동 푸시)
npm run deploy
```

`npm run deploy`는 내부적으로 다음 두 단계를 순서대로 실행합니다.

```
predeploy → npm run build   # dist/ 빌드
deploy    → gh-pages -d dist # dist/ 내용을 gh-pages 브랜치로 푸시
```

### 배포 후 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **`gh-pages`** / `/ (root)` 선택 → **Save**

### 접속 URL

```
https://<GitHub계정>.github.io/ubicom-ims/
```

> ⚠️ 배포 후 Google Cloud Console에서 OAuth 클라이언트의
> **승인된 JavaScript 원본**에 위 URL을 반드시 추가해야 로그인이 작동합니다.

---

## 7. Google Cloud Console 설정

### 7-1. 프로젝트 및 API 활성화

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 (예: `ubicom-ims`)
3. **API 및 서비스 → 라이브러리**에서 아래 두 API 활성화
   - `Google Sheets API`
   - `Google Drive API`

### 7-2. OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
2. 애플리케이션 유형: **웹 애플리케이션**
3. **승인된 JavaScript 원본** 추가

   | 환경 | URL |
   |------|-----|
   | 로컬 개발 | `http://localhost:3000` |
   | GitHub Pages | `https://<계정>.github.io` |

4. 생성된 **클라이언트 ID** → `.env`의 `VITE_GOOGLE_CLIENT_ID`에 입력

### 7-3. API 키 생성

1. **사용자 인증 정보 만들기 → API 키**
2. (권장) **API 제한 → 키 제한 → Google Sheets API** 선택
3. (권장) **애플리케이션 제한 → HTTP 리퍼러** 설정
4. 생성된 **API 키** → `.env`의 `VITE_GOOGLE_API_KEY`에 입력

### 7-4. OAuth 동의 화면 설정

| 조건 | 설정 방법 |
|------|-----------|
| **Google Workspace** 사용 (유비콤 도메인) | 게시 상태를 **내부**로 설정 → 도메인 내 계정 전체 자동 허용 |
| **일반 Gmail** 사용 | 게시 상태: 테스트 → **테스트 사용자**에 팀원 이메일 8개 추가 |

> 팀원 계정만 로그인 가능하게 하려면 **내부(Internal)** 설정을 권장합니다.

---

## 8. Google Sheets DB 구조

스프레드시트 하나에 **시트 3개**를 아래 이름으로 생성합니다.
시트 탭 이름은 정확히 `items` / `transactions` / `stock`이어야 합니다.

### 시트1: `items` — 품목 마스터

| 열 | 필드명 | 설명 | 예시 |
|----|--------|------|------|
| A | 품목ID | 앱에서 자동 생성 (`ITEM-타임스탬프`) | `ITEM-1711234567890` |
| B | 품목명 | 장비 이름 | `24포트 스위치` |
| C | 브랜드 | 제조사 | `Cisco` |
| D | 카테고리 | 아래 7가지 중 하나 | `스위치` |
| E | 모델번호 | 모델 식별자 | `WS-C2960X-24TS-L` |
| F | 단위 | 재고 단위 | `대`, `개`, `EA` |
| G | 최소재고수량 | 부족 판단 기준값 | `5` |
| H | 비고 | 메모 | (선택) |

**카테고리 허용값:** `스위치` / `라우터` / `방화벽` / `무선랜` / `NAC센서` / `IP관리기센서` / `기타`

---

### 시트2: `transactions` — 입출고 이력

| 열 | 필드명 | 설명 | 예시 |
|----|--------|------|------|
| A | 이력ID | 앱에서 자동 생성 (`TX-타임스탬프`) | `TX-1711234567891` |
| B | 날짜 | `yyyy-MM-dd` 형식 | `2026-03-22` |
| C | 품목ID | items 시트의 품목ID 참조 | `ITEM-1711234567890` |
| D | 구분 | `입고` 또는 `출고` | `입고` |
| E | 수량 | 정수 | `10` |
| F | 거래처 | 입고 시 공급처, 출고 시 고객사 | `시스코코리아` |
| G | 프로젝트명 | 출고 시 프로젝트 (선택) | `신분당선 NAC 구축` |
| H | 담당자 | 처리한 팀원 이름 | `홍길동` |
| I | 비고 | 메모 (선택) | |

---

### 시트3: `stock` — 현재 재고 현황 (자동 계산)

> 앱이 직접 계산하여 덮어씁니다. **수동 편집 불필요**.

| 열 | 필드명 | 설명 |
|----|--------|------|
| A | 품목ID | items 시트의 품목ID |
| B | 품목명 | items 시트에서 복사 |
| C | 현재재고 | transactions 전체 합산 (입고 합계 − 출고 합계) |
| D | 최소재고 | items 시트의 최소재고수량 |
| E | 부족여부 | 현재재고 < 최소재고이면 `Y`, 아니면 `N` |

**재고 계산 공식:**

```
현재재고 = Σ(해당 품목 입고 수량) − Σ(해당 품목 출고 수량)
부족여부 = 현재재고 < 최소재고 ? "Y" : "N"
```

---

## 9. 주요 기능 설명

### 🔐 인증 — Google OAuth 2.0 로그인

- `@react-oauth/google`의 **토큰 플로우(implicit flow)** 사용
- 로그인 성공 시 `access_token`을 `sessionStorage`에 저장
- 이후 모든 Sheets API 호출 시 `Authorization: Bearer <token>` 헤더로 인증
- `AuthContext`가 사용자 정보(이름, 이메일, 프로필 사진)를 전역 제공
- 미로그인 상태에서 보호된 페이지 접근 시 `/login`으로 자동 리다이렉트
- 브라우저 탭을 닫으면 세션 만료 (sessionStorage 특성)

---

### 📊 대시보드 (`/dashboard`)

- **요약 카드 4개**: 전체 품목 수 / 재고 부족 종 수 / 오늘 입고 건수 / 오늘 출고 건수
- **재고 부족 경고**: 현재고가 최소재고 미만인 품목을 적색 카드로 목록 표시
- **최근 입출고 이력**: 날짜 내림차순 최근 10건 테이블
- 새로고침 버튼으로 데이터 수동 갱신 가능

---

### 📥 입고 등록 (`/inbound`)

| 필드 | 필수 | 설명 |
|------|------|------|
| 품목 선택 | ✅ | 품목명·모델번호·브랜드 실시간 검색 후 선택 |
| 수량 | ✅ | 1 이상 정수 |
| 입고 날짜 | ✅ | 기본값: 오늘 날짜 |
| 공급처 | ✅ | 공급 업체명 |
| 담당자 | ✅ | 기본값: 로그인 계정 이름 자동 입력 |
| 비고 | — | 선택 입력 |

- 등록 후 `recalcStock()` 자동 호출 → stock 시트 실시간 갱신
- 성공 시 초록색 토스트 알림 표시 후 폼 초기화

---

### 📤 출고 등록 (`/outbound`)

| 필드 | 필수 | 설명 |
|------|------|------|
| 품목 선택 | ✅ | 선택 즉시 현재 재고 수량 표시 |
| 수량 | ✅ | 현재 재고 초과 시 등록 차단 |
| 출고 날짜 | ✅ | 기본값: 오늘 날짜 |
| 고객사 | ✅ | 납품처 회사명 |
| 프로젝트명 | — | 관련 프로젝트 (선택) |
| 담당자 | ✅ | 기본값: 로그인 계정 이름 자동 입력 |
| 비고 | — | 선택 입력 |

- **재고 초과 방지**: 요청 수량 > 현재 재고이면 오류 메시지 표시 후 차단
- 품목 선택 시 현재고가 최소재고 미만이면 빨간색으로 경고 표시

---

### 📦 재고 목록 (`/stock`)

- 전체 품목의 현재 재고를 테이블로 표시 (품목명 / 브랜드 / 모델번호 / 카테고리 / 현재고 / 최소재고 / 상태)
- **3중 필터**: 텍스트 검색 + 카테고리 드롭다운 + 부족 품목만 체크박스
- 부족 품목 행은 연한 빨간 배경으로 시각적 구분, ⚠️ 아이콘 표시
- **재계산 버튼**: transactions 시트 전체를 다시 집계하여 stock 시트를 즉시 갱신

---

### 📋 이력 조회 (`/history`)

- 전체 입출고 이력을 날짜 내림차순으로 표시
- **4중 필터** 동시 적용 가능

  | 필터 | 방식 |
  |------|------|
  | 텍스트 검색 | 품목명·거래처·프로젝트명·담당자·비고 통합 검색 |
  | 구분 | 전체 / 입고 / 출고 선택 |
  | 담당자 | 이력에 존재하는 담당자 목록 자동 생성 |
  | 날짜 범위 | 시작일 ~ 종료일 지정 |

- 표시 건수 / 전체 건수 하단 표시

---

### 🔄 공통 UI 패턴

- **ItemSearchInput**: 품목명·모델번호·브랜드를 동시에 검색하는 드롭다운. 외부 클릭 시 자동 닫힘
- **반응형 레이아웃**: 데스크톱은 고정 사이드바, 모바일은 햄버거 메뉴 + 오버레이 슬라이드 사이드바
- **로딩 상태**: 모든 API 호출 중 스피너 표시
- **오류 처리**: API 실패 시 오류 메시지 카드 표시
- **인증 만료**: API 호출 시 토큰이 없으면 "로그인이 필요합니다" 에러 throw

---

## 라이선스

사내 전용 도구입니다. 외부 배포 및 공개를 금합니다.

© 2026 UBICOM. All rights reserved.
