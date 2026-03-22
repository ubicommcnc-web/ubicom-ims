import { useEffect, useState, useMemo } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { fetchTransactions, fetchItems } from '../services/sheetsApi'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { TypeBadge } from './Dashboard'

export default function History() {
  const [txs, setTxs]         = useState([])
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // 필터 상태
  const [query, setQuery]         = useState('')
  const [typeFilter, setTypeFilter] = useState('전체')
  const [managerFilter, setManagerFilter] = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [t, i] = await Promise.all([fetchTransactions(), fetchItems()])
      setTxs(t.sort((a, b) => new Date(b.date) - new Date(a.date)))
      setItems(i)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const itemMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  )

  // 담당자 목록 (유니크)
  const managers = useMemo(
    () => [...new Set(txs.map((t) => t.manager).filter(Boolean))].sort(),
    [txs]
  )

  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return txs.filter((t) => {
      if (typeFilter !== '전체' && t.type !== typeFilter) return false
      if (managerFilter && t.manager !== managerFilter) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (lower) {
        const item = itemMap[t.itemId]
        const hay = `${item?.name || ''} ${t.partner} ${t.project} ${t.manager} ${t.note}`.toLowerCase()
        if (!hay.includes(lower)) return false
      }
      return true
    })
  }, [txs, itemMap, query, typeFilter, managerFilter, dateFrom, dateTo])

  return (
    <div>
      <PageHeader
        title="이력 조회"
        description="입출고 전체 이력을 확인합니다."
        action={
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        }
      />

      {/* 필터 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명, 거래처, 프로젝트..."
            className="input pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
          <option value="전체">전체 구분</option>
          <option value="입고">입고</option>
          <option value="출고">출고</option>
        </select>
        <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="input">
          <option value="">전체 담당자</option>
          {managers.map((m) => <option key={m}>{m}</option>)}
        </select>
        <div className="flex gap-2 items-center">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-xs" />
          <span className="text-gray-400 text-xs shrink-0">~</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-xs" />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-red-600 text-sm">오류: {error}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['날짜', '구분', '품목명', '브랜드', '수량', '거래처 / 고객사', '프로젝트명', '담당자', '비고'].map((h) => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-sm text-gray-400">
                      조건에 맞는 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => {
                    const item = itemMap[tx.itemId]
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-500 whitespace-nowrap">{tx.date}</td>
                        <td className="table-cell"><TypeBadge type={tx.type} /></td>
                        <td className="table-cell font-medium">{item?.name || tx.itemId}</td>
                        <td className="table-cell text-gray-500">{item?.brand || '-'}</td>
                        <td className="table-cell font-semibold">
                          {tx.qty.toLocaleString()}
                          <span className="text-xs text-gray-400 ml-0.5">{item?.unit || '개'}</span>
                        </td>
                        <td className="table-cell">{tx.partner || '-'}</td>
                        <td className="table-cell text-gray-500">{tx.project || '-'}</td>
                        <td className="table-cell">{tx.manager}</td>
                        <td className="table-cell text-gray-400 max-w-[120px] truncate" title={tx.note}>{tx.note || '-'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length}건 표시 / 전체 {txs.length}건
          </div>
        </div>
      )}
    </div>
  )
}
