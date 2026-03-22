/**
 * SheetJS(xlsx) 기반 엑셀 내보내기 유틸리티
 * 사용처: StockList.jsx, History.jsx
 */
import * as XLSX from 'xlsx'

// ─────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────

/** 오늘 날짜 → YYYYMMDD 문자열 */
function todayStr() {
  const d    = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/**
 * rows 배열을 xlsx 파일로 다운로드
 * @param {object[]} rows       - 각 항목이 {컬럼명: 값} 형태인 배열
 * @param {string}   filename   - 저장 파일명 (확장자 포함)
 * @param {string}   sheetName  - 시트 탭 이름
 * @param {number[]} colWidths  - 각 열 너비 (문자 단위, wch)
 */
function downloadXlsx(rows, filename, sheetName, colWidths = []) {
  const ws = XLSX.utils.json_to_sheet(rows)

  // 열 너비 설정
  if (colWidths.length) {
    ws['!cols'] = colWidths.map((w) => ({ wch: w }))
  }

  // 헤더 행 freeze (첫 행 고정)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// ─────────────────────────────────────────────────────────
// 재고 목록 내보내기
// 파일명: 재고목록_YYYYMMDD.xlsx
// ─────────────────────────────────────────────────────────

/**
 * @param {object[]} filtered  - StockList의 filtered 배열 (stock 행)
 * @param {object}   itemMap   - { [itemId]: item } 매핑
 */
export function exportStockList(filtered, itemMap) {
  const rows = filtered.map((s) => {
    const item = itemMap[s.itemId] ?? {}
    return {
      '품목명':    s.name,
      '브랜드':    item.brand    ?? '',
      '모델번호':  item.model    ?? '',
      '카테고리':  item.category ?? '',
      '단위':      item.unit     ?? '개',
      '현재재고':  s.current,
      '최소재고':  s.minStock,
      '상태':      s.shortage ? '부족' : '정상',
      '비고':      item.note     ?? '',
    }
  })

  downloadXlsx(
    rows,
    `재고목록_${todayStr()}.xlsx`,
    '재고목록',
    // 열 너비: 품목명·브랜드·모델번호·카테고리·단위·현재고·최소고·상태·비고
    [28, 16, 24, 14, 6, 10, 10, 8, 30],
  )
}

// ─────────────────────────────────────────────────────────
// 입출고 이력 내보내기
// 파일명: 입출고이력_YYYYMMDD.xlsx
// ─────────────────────────────────────────────────────────

/**
 * @param {object[]} filtered  - History의 filtered 배열 (transaction 행)
 * @param {object}   itemMap   - { [itemId]: item } 매핑
 */
export function exportHistory(filtered, itemMap) {
  const rows = filtered.map((tx) => {
    const item = itemMap[tx.itemId] ?? {}
    return {
      '날짜':         tx.date,
      '구분':         tx.type,
      '품목명':       item.name     ?? tx.itemId,
      '브랜드':       item.brand    ?? '',
      '모델번호':     item.model    ?? '',
      '카테고리':     item.category ?? '',
      '수량':         tx.qty,
      '단위':         item.unit     ?? '개',
      '거래처/고객사': tx.partner   ?? '',
      '프로젝트명':   tx.project    ?? '',
      '담당자':       tx.manager,
      '비고':         tx.note       ?? '',
    }
  })

  downloadXlsx(
    rows,
    `입출고이력_${todayStr()}.xlsx`,
    '입출고이력',
    // 날짜·구분·품목명·브랜드·모델번호·카테고리·수량·단위·거래처·프로젝트·담당자·비고
    [14, 6, 28, 14, 22, 14, 8, 6, 22, 28, 10, 30],
  )
}
