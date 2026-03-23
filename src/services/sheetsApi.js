/**
 * Google Sheets API v4 연동 서비스
 * OAuth 2.0 accessToken을 이용해 직접 REST API 호출
 */

import { GOOGLE_CONFIG, SHEETS, TX_COLS, ITEMS_COLS } from '../config/google'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function getToken() {
  const token = sessionStorage.getItem('gAccessToken')
  if (!token) throw new Error('로그인이 필요합니다.')
  return token
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const url = `${BASE}/${GOOGLE_CONFIG.spreadsheetId}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 오류: ${res.status}`)
  }
  return res.json()
}

/** 시트 범위의 값 읽기 */
async function getRange(range) {
  const data = await apiFetch(`/values/${encodeURIComponent(range)}`)
  return data.values || []
}

/**
 * Excel/Sheets 시리얼 넘버 → 'YYYY-MM-DD' 문자열 변환
 * - 이미 날짜 문자열이면 그대로 반환
 * - 숫자(시리얼)이면 UTC 기준으로 변환
 *   공식: (serial - 25569) * 86400 * 1000 → Unix ms
 */
function serialToDateStr(value) {
  if (!value && value !== 0) return ''
  // 이미 'YYYY-MM-DD' 형식이면 그대로
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value
  const serial = Number(value)
  if (isNaN(serial) || serial <= 0) return String(value)
  const date = new Date((serial - 25569) * 86400 * 1000)
  const yyyy = date.getUTCFullYear()
  const mm   = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd   = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** 시트에 행 추가 */
async function appendRow(sheet, row) {
  return apiFetch(
    `/values/${encodeURIComponent(sheet + '!A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [row] }) }
  )
}

/** 특정 범위 덮어쓰기 */
async function updateRange(range, values) {
  return apiFetch(
    `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    { method: 'PUT', body: JSON.stringify({ values }) }
  )
}

// ──────────────────────────────────────────────
// 품목 (items 시트)
// ──────────────────────────────────────────────

/** 전체 품목 목록 반환 */
export async function fetchItems() {
  const rows = await getRange(`${SHEETS.ITEMS}!A2:H`)
  return rows.map((r) => ({
    id:       r[ITEMS_COLS.ID]       || '',
    name:     r[ITEMS_COLS.NAME]     || '',
    brand:    r[ITEMS_COLS.BRAND]    || '',
    category: r[ITEMS_COLS.CATEGORY] || '',
    model:    r[ITEMS_COLS.MODEL]    || '',
    unit:     r[ITEMS_COLS.UNIT]     || '개',
    minStock: Number(r[ITEMS_COLS.MIN_STOCK]) || 0,
    note:     r[ITEMS_COLS.NOTE]     || '',
  }))
}

/** 품목 추가 */
export async function addItem(item) {
  const id = `ITEM-${Date.now()}`
  await appendRow(SHEETS.ITEMS, [
    id,
    item.name,
    item.brand,
    item.category,
    item.model,
    item.unit || '개',
    item.minStock || 0,
    item.note || '',
  ])
  return id
}

/** items 시트에서 특정 품목의 실제 행 번호를 반환 (1-based, 헤더 제외 → 최소 2) */
async function findItemRowIndex(itemId) {
  const rows = await getRange(`${SHEETS.ITEMS}!A2:A`)
  const idx = rows.findIndex((r) => r[0] === itemId)
  if (idx === -1) throw new Error(`품목 ID(${itemId})를 찾을 수 없습니다.`)
  return idx + 2 // 헤더 행(row 1) + 0-based 배열 인덱스
}

/** 시트 탭 이름으로 numeric sheetId 조회 (batchUpdate용) */
async function getSheetId(sheetName) {
  const token = getToken()
  const url = `${BASE}/${GOOGLE_CONFIG.spreadsheetId}?fields=sheets.properties`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`시트 정보 조회 실패: ${res.status}`)
  const data = await res.json()
  const sheet = data.sheets?.find((s) => s.properties.title === sheetName)
  if (!sheet) throw new Error(`시트 '${sheetName}'를 찾을 수 없습니다.`)
  return sheet.properties.sheetId
}

/** 품목 수정 */
export async function updateItem(item) {
  const rowIndex = await findItemRowIndex(item.id)
  await updateRange(`${SHEETS.ITEMS}!A${rowIndex}:H${rowIndex}`, [[
    item.id,
    item.name,
    item.brand,
    item.category,
    item.model,
    item.unit || '개',
    Number(item.minStock) || 0,
    item.note || '',
  ]])
}

/** 품목 삭제 — batchUpdate deleteDimension 사용 */
export async function deleteItem(itemId) {
  const [rowIndex, sheetId] = await Promise.all([
    findItemRowIndex(itemId),
    getSheetId(SHEETS.ITEMS),
  ])
  const token = getToken()
  const url = `${BASE}/${GOOGLE_CONFIG.spreadsheetId}:batchUpdate`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based
            endIndex:   rowIndex,     // exclusive
          },
        },
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `삭제 오류: ${res.status}`)
  }
}

// ──────────────────────────────────────────────
// 이력 (transactions 시트)
// ──────────────────────────────────────────────

/** 전체 이력 반환 */
export async function fetchTransactions() {
  const rows = await getRange(`${SHEETS.TRANSACTIONS}!A2:I`)
  return rows.map((r) => ({
    id:      r[TX_COLS.ID]      || '',
    date:    serialToDateStr(r[TX_COLS.DATE]),
    itemId:  r[TX_COLS.ITEM_ID] || '',
    type:    r[TX_COLS.TYPE]    || '',
    qty:     Number(r[TX_COLS.QTY]) || 0,
    partner: r[TX_COLS.PARTNER] || '',
    project: r[TX_COLS.PROJECT] || '',
    manager: r[TX_COLS.MANAGER] || '',
    note:    r[TX_COLS.NOTE]    || '',
  }))
}

/** 입고 등록 */
export async function registerInbound({ itemId, qty, supplier, date, manager, note }) {
  const id = `TX-${Date.now()}`
  await appendRow(SHEETS.TRANSACTIONS, [
    id, date, itemId, '입고', qty, supplier, '', manager, note || '',
  ])
  await recalcStock()
  return id
}

/** 출고 등록 */
export async function registerOutbound({ itemId, qty, customer, project, date, manager, note }) {
  const id = `TX-${Date.now()}`
  await appendRow(SHEETS.TRANSACTIONS, [
    id, date, itemId, '출고', qty, customer, project, manager, note || '',
  ])
  await recalcStock()
  return id
}

// ──────────────────────────────────────────────
// 재고 (stock 시트) – transactions에서 계산 후 갱신
// ──────────────────────────────────────────────

/** 재고 재계산 및 stock 시트 갱신 */
export async function recalcStock() {
  const [items, txs] = await Promise.all([fetchItems(), fetchTransactions()])

  // 품목별 현재 재고 계산
  const stockMap = {}
  items.forEach((item) => {
    stockMap[item.id] = { ...item, current: 0 }
  })

  txs.forEach(({ itemId, type, qty }) => {
    if (!stockMap[itemId]) return
    if (type === '입고') stockMap[itemId].current += qty
    else if (type === '출고') stockMap[itemId].current -= qty
  })

  // stock 시트 전체 덮어쓰기
  const header = [['품목ID', '품목명', '현재재고', '최소재고', '부족여부']]
  const rows = Object.values(stockMap).map((s) => [
    s.id,
    s.name,
    s.current,
    s.minStock,
    s.current < s.minStock ? 'Y' : 'N',
  ])

  await updateRange(`${SHEETS.STOCK}!A1:E${rows.length + 1}`, [...header, ...rows])
  return Object.values(stockMap)
}

/** stock 시트에서 재고 읽기 (recalcStock 없이 빠른 조회) */
export async function fetchStock() {
  const rows = await getRange(`${SHEETS.STOCK}!A2:E`)
  return rows.map((r) => ({
    itemId:   r[0] || '',
    name:     r[1] || '',
    current:  Number(r[2]) || 0,
    minStock: Number(r[3]) || 0,
    shortage: r[4] === 'Y',
  }))
}
