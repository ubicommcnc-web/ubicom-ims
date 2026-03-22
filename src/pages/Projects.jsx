import { useEffect, useState, useMemo } from 'react'
import {
  Search, RefreshCw, ChevronDown, ChevronUp,
  Building2, FolderOpen, BarChart3, PackageMinus,
  CalendarRange, TrendingUp,
} from 'lucide-react'
import { fetchTransactions, fetchItems } from '../services/sheetsApi'
import { CATEGORIES } from '../config/google'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

// ─────────────────────────────────────────────────────────
// 카테고리별 색상
// ─────────────────────────────────────────────────────────
const CAT_COLORS = {
  '스위치':       'bg-blue-100   text-blue-700',
  '라우터':       'bg-purple-100 text-purple-700',
  '방화벽':       'bg-red-100    text-red-700',
  '무선랜':       'bg-green-100  text-green-700',
  'NAC센서':      'bg-yellow-100 text-yellow-700',
  'IP관리기센서':  'bg-orange-100 text-orange-700',
  '기타':         'bg-gray-100   text-gray-600',
}

function CategoryBadge({ category }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[category] || 'bg-gray-100 text-gray-600'}`}>
      {category || '미분류'}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// 숫자 포맷 헬퍼
// ─────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString()

// ─────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────
export default function Projects() {
  const [txs, setTxs]       = useState([])
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  // 필터
  const [customerQuery, setCustomerQuery] = useState('')
  const [catFilter, setCatFilter]         = useState('전체')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')

  // 확장된 고객사 카드 (Set)
  const [expanded, setExpanded] = useState(new Set())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [t, i] = await Promise.all([fetchTransactions(), fetchItems()])
      setTxs(t)
      setItems(i)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // ── item 맵 ──
  const itemMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  )

  // ── 출고 데이터만 필터 후 날짜·카테고리 적용 ──
  const outboundTxs = useMemo(() => {
    return txs.filter((t) => {
      if (t.type !== '출고') return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo   && t.date > dateTo)   return false
      if (catFilter !== '전체') {
        const cat = itemMap[t.itemId]?.category
        if (cat !== catFilter) return false
      }
      return true
    })
  }, [txs, itemMap, dateFrom, dateTo, catFilter])

  // ── 고객사별 집계 ──
  const customerStats = useMemo(() => {
    const map = {}   // customer → { txCount, totalQty, projects:{}, categories:{} }

    outboundTxs.forEach((t) => {
      const customer = t.partner || '(고객사 미기재)'
      const project  = t.project  || '(프로젝트 미기재)'
      const item     = itemMap[t.itemId]
      const cat      = item?.category || '기타'

      if (!map[customer]) {
        map[customer] = { customer, txCount: 0, totalQty: 0, projects: {}, categories: {} }
      }
      const cs = map[customer]
      cs.txCount++
      cs.totalQty += t.qty

      // 프로젝트별 집계
      if (!cs.projects[project]) {
        cs.projects[project] = { project, txCount: 0, totalQty: 0, rows: [] }
      }
      cs.projects[project].txCount++
      cs.projects[project].totalQty += t.qty
      cs.projects[project].rows.push(t)

      // 카테고리별 집계
      cs.categories[cat] = (cs.categories[cat] || 0) + t.qty
    })

    // 총 출고 수량 내림차순 정렬
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty)
  }, [outboundTxs, itemMap])

  // ── 고객사 검색 필터 ──
  const filtered = useMemo(() => {
    const lower = customerQuery.toLowerCase()
    if (!lower) return customerStats
    return customerStats.filter((cs) =>
      cs.customer.toLowerCase().includes(lower)
    )
  }, [customerStats, customerQuery])

  // ── 전체 요약 통계 ──
  const totalTxCount  = outboundTxs.length
  const totalQty      = outboundTxs.reduce((s, t) => s + t.qty, 0)
  const totalCustomers = filtered.length
  const totalProjects  = useMemo(() => {
    const set = new Set(outboundTxs.map((t) => `${t.partner}|${t.project}`))
    return set.size
  }, [outboundTxs])

  // ── 카테고리 전체 집계 ──
  const catSummary = useMemo(() => {
    const map = {}
    outboundTxs.forEach((t) => {
      const cat = itemMap[t.itemId]?.category || '기타'
      map[cat] = (map[cat] || 0) + t.qty
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [outboundTxs, itemMap])

  // ── 카드 토글 ──
  function toggleExpand(customer) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(customer) ? next.delete(customer) : next.add(customer)
      return next
    })
  }
  function expandAll()   { setExpanded(new Set(filtered.map((c) => c.customer))) }
  function collapseAll() { setExpanded(new Set()) }

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="프로젝트별 출고 현황"
        description="고객사 및 프로젝트 단위 출고 집계"
        action={
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        }
      />

      {/* ── 필터 바 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* 고객사 검색 */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="고객사 검색"
            className="input pl-9"
          />
        </div>

        {/* 카테고리 */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input"
        >
          <option value="전체">전체 카테고리</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        {/* 날짜 범위 */}
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
          <CalendarRange size={15} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input flex-1 text-sm"
          />
          <span className="text-gray-400 text-xs shrink-0">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input flex-1 text-sm"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
              title="날짜 초기화"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-red-600 text-sm">오류: {error}</div>
      ) : (
        <div className="space-y-6">

          {/* ── 상단 요약 카드 4개 ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<PackageMinus size={20} className="text-orange-500" />}
              bg="bg-orange-50"
              label="총 출고 건수"
              value={`${fmt(totalTxCount)}건`}
            />
            <SummaryCard
              icon={<BarChart3 size={20} className="text-blue-600" />}
              bg="bg-blue-50"
              label="총 출고 수량"
              value={`${fmt(totalQty)}개`}
            />
            <SummaryCard
              icon={<Building2 size={20} className="text-purple-600" />}
              bg="bg-purple-50"
              label="고객사 수"
              value={`${fmt(totalCustomers)}곳`}
            />
            <SummaryCard
              icon={<FolderOpen size={20} className="text-green-600" />}
              bg="bg-green-50"
              label="프로젝트 수"
              value={`${fmt(totalProjects)}건`}
            />
          </div>

          {/* ── 카테고리별 출고 집계 바 ── */}
          {catSummary.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">카테고리별 출고 수량</h2>
              </div>
              <div className="space-y-2.5">
                {catSummary.map(([cat, qty]) => {
                  const pct = totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={cat} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {fmt(qty)}개 <span className="text-gray-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 고객사 카드 목록 ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                고객사별 출고 현황
                <span className="ml-2 text-gray-400 font-normal">({filtered.length}곳)</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={expandAll} className="text-xs text-blue-500 hover:underline">전체 펼치기</button>
                <span className="text-gray-300">|</span>
                <button onClick={collapseAll} className="text-xs text-gray-400 hover:underline">전체 접기</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card text-center py-14 text-gray-400 text-sm">
                조건에 맞는 출고 데이터가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((cs) => (
                  <CustomerCard
                    key={cs.customer}
                    cs={cs}
                    itemMap={itemMap}
                    isOpen={expanded.has(cs.customer)}
                    onToggle={() => toggleExpand(cs.customer)}
                    totalQty={totalQty}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 상단 요약 카드
// ─────────────────────────────────────────────────────────
function SummaryCard({ icon, bg, label, value }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 고객사 카드 (접기/펼치기)
// ─────────────────────────────────────────────────────────
function CustomerCard({ cs, itemMap, isOpen, onToggle, totalQty }) {
  const projects    = Object.values(cs.projects)
  const catEntries  = Object.entries(cs.categories).sort((a, b) => b[1] - a[1])
  const shareOfTotal = totalQty > 0 ? Math.round((cs.totalQty / totalQty) * 100) : 0

  return (
    <div className="card p-0 overflow-hidden">
      {/* 카드 헤더 — 고객사 요약 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* 고객사 아이콘 + 이름 */}
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{cs.customer}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            프로젝트 {projects.length}건 · 출고 {fmt(cs.txCount)}회
          </p>
        </div>

        {/* 수량 + 점유율 */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-lg font-bold text-gray-900">{fmt(cs.totalQty)}<span className="text-xs font-normal text-gray-400 ml-1">개</span></p>
          <p className="text-xs text-gray-400">전체 대비 {shareOfTotal}%</p>
        </div>

        {/* 카테고리 배지 (최대 3개) */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {catEntries.slice(0, 3).map(([cat]) => (
            <CategoryBadge key={cat} category={cat} />
          ))}
          {catEntries.length > 3 && (
            <span className="text-xs text-gray-400">+{catEntries.length - 3}</span>
          )}
        </div>

        {/* 펼치기 아이콘 */}
        <div className="text-gray-400 shrink-0 ml-1">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* 수량 바 */}
      <div className="px-5 pb-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${shareOfTotal}%` }}
          />
        </div>
      </div>

      {/* 펼쳐진 상세 */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {/* 카테고리별 집계 */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">카테고리별 출고</p>
            <div className="flex flex-wrap gap-2">
              {catEntries.map(([cat, qty]) => (
                <div key={cat} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                  <CategoryBadge category={cat} />
                  <span className="text-xs font-semibold text-gray-700">{fmt(qty)}개</span>
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트별 테이블 */}
          {projects.map((proj) => (
            <ProjectSection
              key={proj.project}
              proj={proj}
              itemMap={itemMap}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 프로젝트 섹션 (고객사 카드 내부)
// ─────────────────────────────────────────────────────────
function ProjectSection({ proj, itemMap }) {
  const sorted = [...proj.rows].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* 프로젝트 소헤더 */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-white">
        <FolderOpen size={14} className="text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{proj.project}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {proj.txCount}건 · <b className="text-gray-600">{fmt(proj.totalQty)}개</b>
        </span>
      </div>

      {/* 상세 이력 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-100">
              <th className="table-head">날짜</th>
              <th className="table-head">품목명</th>
              <th className="table-head">카테고리</th>
              <th className="table-head">수량</th>
              <th className="table-head">담당자</th>
              <th className="table-head">비고</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => {
              const item = itemMap[tx.itemId]
              return (
                <tr key={tx.id} className="hover:bg-orange-50/30">
                  <td className="table-cell text-gray-500 whitespace-nowrap">{tx.date}</td>
                  <td className="table-cell font-medium text-gray-900">
                    {item?.name || tx.itemId}
                    {item?.model && (
                      <span className="ml-1 text-xs font-mono text-gray-400">{item.model}</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <CategoryBadge category={item?.category} />
                  </td>
                  <td className="table-cell font-semibold text-orange-600">
                    {fmt(tx.qty)}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">{item?.unit || '개'}</span>
                  </td>
                  <td className="table-cell text-gray-600">{tx.manager}</td>
                  <td className="table-cell text-gray-400 max-w-[120px] truncate" title={tx.note}>
                    {tx.note || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* 소계 행 */}
          <tfoot>
            <tr className="bg-orange-50/50 border-t border-orange-100">
              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-orange-700">소계</td>
              <td className="px-4 py-2 text-sm font-bold text-orange-700">{fmt(proj.totalQty)}개</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
