import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  RefreshCw, TrendingUp, TrendingDown,
  ArrowDownCircle, ArrowUpCircle, Activity, Boxes,
} from 'lucide-react'
import { fetchTransactions, fetchItems, fetchStock } from '../services/sheetsApi'
import { CATEGORIES } from '../config/google'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

// ─────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────
const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const PIE_COLORS = {
  '스위치':       '#3B82F6',
  '라우터':       '#8B5CF6',
  '방화벽':       '#EF4444',
  '무선랜':       '#10B981',
  'NAC센서':      '#F59E0B',
  'IP관리기센서':  '#F97316',
  '기타':         '#6B7280',
}
const DEFAULT_PIE_COLOR = '#94A3B8'

const BAR_INBOUND  = '#3B82F6'  // blue-500
const BAR_OUTBOUND = '#F97316'  // orange-500

const fmt = (n) => n?.toLocaleString() ?? 0

// 현재 연도 기준 선택 가능한 연도 목록 (5년)
const THIS_YEAR   = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i)

// ─────────────────────────────────────────────────────────
// 커스텀 Tooltip (바 차트용)
// ─────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const inbound  = payload.find((p) => p.dataKey === 'inbound')?.value  ?? 0
  const outbound = payload.find((p) => p.dataKey === 'outbound')?.value ?? 0
  const diff     = inbound - outbound
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />입고
          </span>
          <span className="font-semibold text-gray-800">{fmt(inbound)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-orange-500">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />출고
          </span>
          <span className="font-semibold text-gray-800">{fmt(outbound)}</span>
        </div>
        <div className="border-t border-gray-100 pt-1 mt-1 flex items-center justify-between gap-4">
          <span className="text-gray-500">순증감</span>
          <span className={`font-bold ${diff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {diff >= 0 ? '+' : ''}{fmt(diff)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 커스텀 Tooltip (파이 차트용)
// ─────────────────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { pct } } = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{name}</p>
      <p className="text-gray-600">
        <span className="font-bold text-gray-900">{fmt(value)}</span>
        <span className="text-gray-400 ml-1">개 ({pct}%)</span>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────
export default function Stats() {
  const [txs, setTxs]       = useState([])
  const [items, setItems]   = useState([])
  const [stock, setStock]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [year, setYear]     = useState(THIS_YEAR)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [t, i, s] = await Promise.all([fetchTransactions(), fetchItems(), fetchStock()])
      setTxs(t)
      setItems(i)
      setStock(s)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // ── 품목 맵 ──
  const itemMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  )

  // ── 선택 연도 이력 필터 ──
  const yearTxs = useMemo(
    () => txs.filter((t) => t.date?.startsWith(String(year))),
    [txs, year]
  )

  // ─────────────────────────────────────────────────────
  // 연간 요약 통계
  // ─────────────────────────────────────────────────────
  const annualStats = useMemo(() => {
    const inbound  = yearTxs.filter((t) => t.type === '입고').reduce((s, t) => s + t.qty, 0)
    const outbound = yearTxs.filter((t) => t.type === '출고').reduce((s, t) => s + t.qty, 0)
    const activeItems = new Set(yearTxs.map((t) => t.itemId)).size
    return { inbound, outbound, net: inbound - outbound, activeItems }
  }, [yearTxs])

  // ─────────────────────────────────────────────────────
  // 월별 입출고 집계 (1~12월, 선택 연도)
  // ─────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return MONTH_LABELS.map((label, idx) => {
      const mm    = String(idx + 1).padStart(2, '0')
      const prefix = `${year}-${mm}`
      const mTxs  = yearTxs.filter((t) => t.date?.startsWith(prefix))
      return {
        month:   label,
        inbound:  mTxs.filter((t) => t.type === '입고').reduce((s, t) => s + t.qty, 0),
        outbound: mTxs.filter((t) => t.type === '출고').reduce((s, t) => s + t.qty, 0),
      }
    })
  }, [yearTxs, year])

  // ─────────────────────────────────────────────────────
  // 카테고리별 현재 재고 집계 (파이 차트 — 항상 최신)
  // ─────────────────────────────────────────────────────
  const stockByCat = useMemo(() => {
    const map = {}
    stock.forEach((s) => {
      const cat = itemMap[s.itemId]?.category || '기타'
      map[cat] = (map[cat] || 0) + s.current
    })
    const total = Object.values(map).reduce((a, b) => a + b, 0)
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [stock, itemMap])

  // ─────────────────────────────────────────────────────
  // 연도별 출고 상위 품목 Top 7
  // ─────────────────────────────────────────────────────
  const top7Items = useMemo(() => {
    const map = {}
    yearTxs
      .filter((t) => t.type === '출고')
      .forEach((t) => {
        map[t.itemId] = (map[t.itemId] || 0) + t.qty
      })
    const maxQty = Math.max(...Object.values(map), 1)
    return Object.entries(map)
      .map(([id, qty]) => ({
        id, qty,
        name:     itemMap[id]?.name     || id,
        brand:    itemMap[id]?.brand    || '',
        category: itemMap[id]?.category || '기타',
        pct: Math.round((qty / maxQty) * 100),
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 7)
  }, [yearTxs, itemMap])

  // ─────────────────────────────────────────────────────
  // 카테고리별 연간 출고 집계 (테이블)
  // ─────────────────────────────────────────────────────
  const outboundByCat = useMemo(() => {
    const map = {}
    yearTxs
      .filter((t) => t.type === '출고')
      .forEach((t) => {
        const cat = itemMap[t.itemId]?.category || '기타'
        map[cat] = (map[cat] || 0) + t.qty
      })
    const total = Object.values(map).reduce((a, b) => a + b, 0)
    return Object.entries(map)
      .map(([cat, qty]) => ({
        cat, qty,
        pct: total > 0 ? Math.round((qty / total) * 100) : 0,
      }))
      .sort((a, b) => b.qty - a.qty)
  }, [yearTxs, itemMap])

  // ─────────────────────────────────────────────────────
  // Y축 tick 포맷
  // ─────────────────────────────────────────────────────
  const yTickFmt = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v

  // ─────────────────────────────────────────────────────
  return (
    <div>
      {/* ── 헤더 ── */}
      <PageHeader
        title="월별 통계"
        description="연도별 입출고 현황 및 재고 분석"
        action={
          <div className="flex items-center gap-2">
            {/* 연도 선택 */}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input w-28 font-semibold text-sm"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <button onClick={load} className="btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-red-600 text-sm">오류: {error}</div>
      ) : (
        <div className="space-y-6">

          {/* ── 연간 요약 카드 4개 ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<ArrowDownCircle size={20} className="text-blue-600" />}
              bg="bg-blue-50"
              label={`${year}년 총 입고`}
              value={`${fmt(annualStats.inbound)}개`}
            />
            <StatCard
              icon={<ArrowUpCircle size={20} className="text-orange-500" />}
              bg="bg-orange-50"
              label={`${year}년 총 출고`}
              value={`${fmt(annualStats.outbound)}개`}
            />
            <StatCard
              icon={
                annualStats.net >= 0
                  ? <TrendingUp size={20} className="text-green-600" />
                  : <TrendingDown size={20} className="text-red-500" />
              }
              bg={annualStats.net >= 0 ? 'bg-green-50' : 'bg-red-50'}
              label="순 증감"
              value={`${annualStats.net >= 0 ? '+' : ''}${fmt(annualStats.net)}개`}
              valueColor={annualStats.net >= 0 ? 'text-green-600' : 'text-red-500'}
            />
            <StatCard
              icon={<Activity size={20} className="text-purple-600" />}
              bg="bg-purple-50"
              label="활동 품목 수"
              value={`${fmt(annualStats.activeItems)}종`}
            />
          </div>

          {/* ── 월별 입출고 막대 차트 ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">월별 입출고 수량</h2>
                <p className="text-xs text-gray-400 mt-0.5">{year}년 1월 ~ 12월</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />입고
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />출고
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                barCategoryGap="28%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={yTickFmt}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="inbound"  name="입고" fill={BAR_INBOUND}  radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="출고" fill={BAR_OUTBOUND} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 파이 차트 + 카테고리 출고 테이블 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* 파이 차트 — 카테고리별 현재 재고 */}
            <div className="card lg:col-span-3">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Boxes size={16} className="text-gray-500" />
                  카테고리별 현재 재고 현황
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">현재 재고 수량 기준 (연도 무관)</p>
              </div>
              {stockByCat.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                  재고 데이터가 없습니다.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* 파이 차트 */}
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={stockByCat}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stockByCat.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[entry.name] || DEFAULT_PIE_COLOR}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 범례 테이블 */}
                  <div className="w-full sm:w-auto sm:min-w-[180px] space-y-2">
                    {stockByCat.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[d.name] || DEFAULT_PIE_COLOR }}
                        />
                        <span className="text-xs text-gray-600 flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-semibold text-gray-800 shrink-0">
                          {fmt(d.value)}<span className="font-normal text-gray-400">개</span>
                        </span>
                        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 카테고리별 연간 출고 집계 테이블 */}
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800">카테고리별 출고 집계</h2>
                <p className="text-xs text-gray-400 mt-0.5">{year}년 출고 수량 기준</p>
              </div>
              {outboundByCat.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                  출고 데이터가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {outboundByCat.map((d, idx) => (
                    <div key={d.cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[d.cat] || DEFAULT_PIE_COLOR }}
                          />
                          <span className="text-xs text-gray-700">{d.cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{fmt(d.qty)}</span>
                          <span className="text-xs text-gray-400 w-8 text-right">{d.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${d.pct}%`,
                            backgroundColor: PIE_COLORS[d.cat] || DEFAULT_PIE_COLOR,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 상위 출고 품목 Top 7 ── */}
          <div className="card">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-800">출고 상위 품목 Top 7</h2>
              <p className="text-xs text-gray-400 mt-0.5">{year}년 출고 수량 기준</p>
            </div>
            {top7Items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">출고 데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {top7Items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {/* 순위 */}
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${idx === 0 ? 'bg-yellow-100 text-yellow-700'
                      : idx === 1 ? 'bg-gray-200 text-gray-600'
                      : idx === 2 ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-400'}
                    `}>
                      {idx + 1}
                    </div>

                    {/* 품목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                        {item.brand && (
                          <span className="text-xs text-gray-400 shrink-0">{item.brand}</span>
                        )}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: `${PIE_COLORS[item.category] || DEFAULT_PIE_COLOR}20`,
                            color: PIE_COLORS[item.category] || DEFAULT_PIE_COLOR,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      {/* 가로 바 */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${item.pct}%`,
                            backgroundColor: idx === 0 ? '#F59E0B'
                              : idx === 1 ? '#6B7280'
                              : idx === 2 ? '#F97316'
                              : BAR_OUTBOUND,
                          }}
                        />
                      </div>
                    </div>

                    {/* 수량 */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">{fmt(item.qty)}</p>
                      <p className="text-xs text-gray-400">개</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 월별 상세 테이블 ── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">월별 입출고 상세</h2>
              <p className="text-xs text-gray-400 mt-0.5">{year}년 월별 수치 요약</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-head">월</th>
                    <th className="table-head text-blue-600">입고 수량</th>
                    <th className="table-head text-orange-500">출고 수량</th>
                    <th className="table-head">순 증감</th>
                    <th className="table-head">입고 건수</th>
                    <th className="table-head">출고 건수</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(({ month, inbound, outbound }, idx) => {
                    const mm    = String(idx + 1).padStart(2, '0')
                    const prefix = `${year}-${mm}`
                    const mTxs  = yearTxs.filter((t) => t.date?.startsWith(prefix))
                    const inCnt  = mTxs.filter((t) => t.type === '입고').length
                    const outCnt = mTxs.filter((t) => t.type === '출고').length
                    const net    = inbound - outbound
                    const hasData = inbound > 0 || outbound > 0
                    return (
                      <tr key={month} className={`hover:bg-gray-50 ${!hasData ? 'opacity-40' : ''}`}>
                        <td className="table-cell font-medium text-gray-700">{month}</td>
                        <td className="table-cell">
                          <span className="font-semibold text-blue-600">{fmt(inbound)}</span>
                        </td>
                        <td className="table-cell">
                          <span className="font-semibold text-orange-500">{fmt(outbound)}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`font-semibold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {net > 0 ? '+' : ''}{fmt(net)}
                          </span>
                        </td>
                        <td className="table-cell text-gray-500">{inCnt > 0 ? `${inCnt}건` : '-'}</td>
                        <td className="table-cell text-gray-500">{outCnt > 0 ? `${outCnt}건` : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* 연간 합계 행 */}
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">합계</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600">{fmt(annualStats.inbound)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-500">{fmt(annualStats.outbound)}</td>
                    <td className="px-4 py-3 text-sm font-bold">
                      <span className={annualStats.net >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {annualStats.net >= 0 ? '+' : ''}{fmt(annualStats.net)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                      {yearTxs.filter((t) => t.type === '입고').length}건
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                      {yearTxs.filter((t) => t.type === '출고').length}건
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 요약 카드
// ─────────────────────────────────────────────────────────
function StatCard({ icon, bg, label, value, valueColor = 'text-gray-900' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  )
}
