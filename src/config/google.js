// Google API 설정
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ].join(' '),
  discoveryDocs: [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
  ],
}

// 시트 이름 상수
export const SHEETS = {
  ITEMS:        'items',
  TRANSACTIONS: 'transactions',
  STOCK:        'stock',
}

// 컬럼 인덱스 (0-based)
export const ITEMS_COLS = {
  ID:          0, // 품목ID
  NAME:        1, // 품목명
  BRAND:       2, // 브랜드
  CATEGORY:    3, // 카테고리
  MODEL:       4, // 모델번호
  UNIT:        5, // 단위
  MIN_STOCK:   6, // 최소재고수량
  NOTE:        7, // 비고
}

export const TX_COLS = {
  ID:          0, // 이력ID
  DATE:        1, // 날짜
  ITEM_ID:     2, // 품목ID
  TYPE:        3, // 구분(입고/출고)
  QTY:         4, // 수량
  PARTNER:     5, // 거래처
  PROJECT:     6, // 프로젝트명
  MANAGER:     7, // 담당자
  NOTE:        8, // 비고
}

export const STOCK_COLS = {
  ITEM_ID:     0, // 품목ID
  NAME:        1, // 품목명
  CURRENT:     2, // 현재재고
  MIN_STOCK:   3, // 최소재고
  SHORTAGE:    4, // 부족여부
}

// 카테고리 목록
export const CATEGORIES = [
  '스위치',
  '라우터',
  '방화벽',
  '무선랜',
  'NAC센서',
  'IP관리기센서',
  '기타',
]
