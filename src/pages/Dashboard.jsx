import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import { fetchStock, fetchTransactions, fetchItems } from '../services/sheetsApi'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Dashboard() {
  const [stock, setStock]   = useState([])
  const [txs, setTxs]       = useState([])
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [s, t, i] = await Promise.all([fetchStock(), fetchTransactions(), fetchItems()])
      setStock(s)
      setTxs(t)
      setItems(i)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]))
  const shortages = stock.filter((s) => s.shortage)
  const recent = [...txs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  const totalItems   = stock.length
  const inboundToday = txs.filter(
    (t) => t.type === '입고' && t.date === format(new Date(), 'yyyy-MM-dd')
  ).length
  const outboundToday = txs.filter(
    (t) => t.type === '출고' && t.date === format(new Date(), 'yyyy-MM-dd')
  ).length

  return (
    <div>
      <PageHeader
        title="대시보드"
        description={`${format(new Date(), 'yyyy년 M월 d일 (eee)', { locale: ko })}`}
        action={
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-red-600 text-sm">오류: {error}</div>
      ) : (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Boxes size={22} className="text-blue-600" />}
              bg="bg-blue-50"
              label="전체 품목"
              value={`${totalItems}종`}
            />
            <SummaryCard
              icon={<AlertTriangle size={22} className="text-red-500" />}
              bg="bg-red-50"
              label="재고 부족"
              value={`${shortages.length}종`}
              alert={shortages.length > 0}
            />
            <SummaryCard
              icon={<ArrowDownCircle size={22} className="text-green-600" />}
              bg="bg-green-50"
              label="오늘 입고"
              value={`${inboundToday}건`}
            />
            <SummaryCard
              icon={<ArrowUpCircle size={22} className="text-orange-500" />}
              bg="bg-orange-50"
              label="오늘 출고"
              value={`${outboundToday}건`}
            />
          </div>

          {/* 부족 품목 경고 */}
          {shortages.length > 0 && (
            <div className="card border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="font-semibold text-red-700">재고 부족 품목 ({shortages.length}종)</h2>
                <Link to="/stock" className="ml-auto text-xs text-blue-600 hover:underline">전체 보기</Link>
              </div>
              <div className="space-y-2">
                {shortages.map((s) => (
                  <div key={s.itemId} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">현재 <b className="text-red-600">{s.current}</b></span>
                      <span className="text-gray-400">/ 최소 {s.minStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최근 입출고 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">최근 입출고 이력</h2>
              <Link to="/history" className="ml-auto text-xs text-blue-600 hover:underline">전체 보기</Link>
            </div>

            {recent.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">이력이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr>
                      {['날짜', '구분', '품목명', '수량', '거래처', '담당자'].map((h) => (
                        <th key={h} className="table-head">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-500">{tx.date}</td>
                        <td className="table-cell">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="table-cell font-medium">{itemMap[tx.itemId]?.name || tx.itemId}</td>
                        <td className="table-cell">{tx.qty.toLocaleString()}</td>
                        <td className="table-cell">{tx.partner || '-'}</td>
                        <td className="table-cell">{tx.manager}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon, bg, label, value, alert }) {
  return (
    <div className={`card flex items-center gap-4 ${alert ? 'border-red-200' : ''}`}>
      <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  )
}

export function TypeBadge({ type }) {
  return (
    <span className={`badge ${type === '입고' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
      {type}
    </span>
  )
}
