# UBICOM IMS 설정 가이드

## 1. Google Cloud Console 설정

### 1-1. 프로젝트 생성
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 (예: `ubicom-ims`)

### 1-2. API 활성화
- Google Sheets API v4
- Google Drive API

### 1-3. OAuth 2.0 클라이언트 ID 생성
1. API 및 서비스 > 사용자 인증 정보 > 사용자 인증 정보 만들기 > OAuth 클라이언트 ID
2. 애플리케이션 유형: **웹 애플리케이션**
3. 승인된 JavaScript 원본 추가:
   - `http://localhost:3000` (개발)
   - `https://your-domain.com` (운영)
4. 생성된 **클라이언트 ID** 복사

### 1-4. API 키 생성
1. 사용자 인증 정보 만들기 > API 키
2. API 제한: Google Sheets API 선택
3. 생성된 **API 키** 복사

### 1-5. OAuth 동의 화면 설정
1. 게시 상태: **내부** (유비콤 Google Workspace 사용 시)
2. 테스트 사용자에 팀원 이메일 추가

---

## 2. Google Sheets 스프레드시트 설정

### 2-1. 새 스프레드시트 생성
- https://sheets.google.com 에서 새 시트 생성

### 2-2. 시트 구조 설정

**시트1: items** (탭 이름을 `items`로 변경)
| A: 품목ID | B: 품목명 | C: 브랜드 | D: 카테고리 | E: 모델번호 | F: 단위 | G: 최소재고수량 | H: 비고 |
|-----------|----------|----------|------------|-----------|--------|--------------|--------|
| ITEM-001  | 24포트 스위치 | Cisco  | 스위치       | WS-C2960  | 대      | 5            |        |

**시트2: transactions** (탭 이름을 `transactions`로 변경)
| A: 이력ID | B: 날짜 | C: 품목ID | D: 구분 | E: 수량 | F: 거래처 | G: 프로젝트명 | H: 담당자 | I: 비고 |
|----------|--------|---------|--------|-------|---------|------------|---------|--------|
| TX-001   | 2026-03-01 | ITEM-001 | 입고 | 10 | 시스코코리아 | | 홍길동 | |

**시트3: stock** (탭 이름을 `stock`으로 변경)
| A: 품목ID | B: 품목명 | C: 현재재고 | D: 최소재고 | E: 부족여부 |
|----------|----------|-----------|-----------|---------|
| (앱에서 자동 계산 및 입력) |

### 2-3. URL에서 스프레드시트 ID 복사
```
https://docs.google.com/spreadsheets/d/[여기가 ID]/edit
```

---

## 3. 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_SPREADSHEET_ID=xxxx
VITE_GOOGLE_API_KEY=xxxx
```

---

## 4. 설치 및 실행

```bash
# Node.js 설치 필요 (https://nodejs.org)

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

## 5. 팀원 접근 권한

- Google Workspace 사용 중: OAuth 동의화면을 **내부**로 설정하면 자동으로 유비콤 도메인 계정만 로그인 가능
- 일반 Gmail 사용 중: OAuth 동의화면 테스트 사용자에 팀원 이메일(8명) 추가
