import { useEffect, useState, useMemo } from 'react'
import { Search, RefreshCw, AlertTriangle, FileDown } from 'lucide-react'
import { fetchStock, fetchItems, recalcStock } from '../services/sheetsApi'
import { CATEGORIES } from '../config/google'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { exportStockList } from '../utils/exportExcel'

export default function StockList() {
  const [stock, setStock]     = useState([])
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [query, setQuery]     = useState('')
  const [category, setCategory] = useState('전체')
  const [onlyShort, setOnlyShort] = useState(false)

  const itemMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  )

  async function load(recalc = false) {
    setLoading(true)
    setError(null)
    try {
      if (recalc) {
        await recalcStock()
      }
      const [s, i] = await Promise.all([fetchStock(), fetchItems()])
      setStock(s)
      setItems(i)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return stock.filter((s) => {
      const item = itemMap[s.itemId]
      if (category !== '전체' && item?.category !== category) return false
      if (onlyShort && !s.shortage) return false
      if (lower) {
        const haystack = `${s.name} ${item?.brand || ''} ${item?.model || ''}`.toLowerCase()
        if (!haystack.includes(lower)) return false
      }
      return true
    })
  }, [stock, itemMap, query, category, onlyShort])

  return (
    <div>
      <PageHeader
        title="재고 목록"
        description={`전체 ${stock.length}종 품목`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportStockList(filtered, itemMap)}
              disabled={loading || filtered.length === 0}
              className="btn-secondary"
            >
              <FileDown size={15} />
              엑셀 내보내기
            </button>
            <button onClick={() => load(true)} className="btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              재계산
            </button>
          </div>
        }
      />

      {/* 필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명, 브랜드, 모델번호 검색"
            className="input pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="전체">전체 카테고리</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={onlyShort}
            onChange={(e) => setOnlyShort(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          부족 품목만
        </label>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-red-600 text-sm">오류: {error}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['품목명', '브랜드', '모델번호', '카테고리', '현재고', '최소재고', '상태'].map((h) => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                      조건에 맞는 품목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const item = itemMap[s.itemId]
                    return (
                      <tr key={s.itemId} className={`hover:bg-gray-50 ${s.shortage ? 'bg-red-50/40' : ''}`}>
                        <td className="table-cell font-medium">
                          <div className="flex items-center gap-1.5">
                            {s.shortage && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                            {s.name}
                          </div>
                        </td>
                        <td className="table-cell text-gray-500">{item?.brand || '-'}</td>
                        <td className="table-cell text-gray-500 font-mono text-xs">{item?.model || '-'}</td>
                        <td className="table-cell">
                          <span className="badge bg-gray-100 text-gray-600">{item?.category || '-'}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`font-semibold text-base ${s.shortage ? 'text-red-600' : 'text-gray-900'}`}>
                            {s.current}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">{item?.unit || '개'}</span>
                        </td>
                        <td className="table-cell text-gray-500">{s.minStock}</td>
                        <td className="table-cell">
                          {s.shortage ? (
                            <span className="badge bg-red-100 text-red-700">부족</span>
                          ) : (
                            <span className="badge bg-green-100 text-green-700">정상</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length}개 표시 / 전체 {stock.length}개
          </div>
        </div>
      )}
    </div>
  )
}
