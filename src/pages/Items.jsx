import { useEffect, useState, useMemo } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  PackageSearch, AlertCircle, CheckCircle,
} from 'lucide-react'
import { fetchItems, addItem, updateItem, deleteItem } from '../services/sheetsApi'
import { CATEGORIES } from '../config/google'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'

// ─────────────────────────────────────────────────────────
// 빈 폼 초기값
// ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name:     '',
  brand:    '',
  category: '',
  model:    '',
  unit:     '개',
  minStock: '',
  note:     '',
}

// ─────────────────────────────────────────────────────────
// 폼 유효성 검사
// ─────────────────────────────────────────────────────────
function validate(form) {
  if (!form.name.trim())     return '품목명을 입력해주세요.'
  if (!form.category)        return '카테고리를 선택해주세요.'
  if (!form.model.trim())    return '모델번호를 입력해주세요.'
  if (form.minStock !== '' && Number(form.minStock) < 0)
                             return '최소재고수량은 0 이상이어야 합니다.'
  return null
}

// ─────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────
export default function Items() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [apiError, setApiError]   = useState(null)
  const [toast, setToast]         = useState(null)   // { type: 'success'|'error', msg }

  // 필터
  const [query, setQuery]         = useState('')
  const [catFilter, setCatFilter] = useState('전체')

  // 모달 상태
  const [addOpen, setAddOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState(null) // item 객체
  const [deleteTarget, setDeleteTarget] = useState(null) // item 객체

  // ── 데이터 로드 ──
  async function load() {
    setLoading(true)
    setApiError(null)
    try {
      setItems(await fetchItems())
    } catch (e) {
      setApiError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // ── 토스트 ──
  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── 추가 완료 ──
  async function handleAdd(formData) {
    await addItem(formData)
    await load()
    setAddOpen(false)
    showToast('success', `'${formData.name}' 품목이 등록되었습니다.`)
  }

  // ── 수정 완료 ──
  async function handleEdit(formData) {
    await updateItem({ ...formData, id: editTarget.id })
    await load()
    setEditTarget(null)
    showToast('success', `'${formData.name}' 품목이 수정되었습니다.`)
  }

  // ── 삭제 완료 ──
  async function handleDelete() {
    await deleteItem(deleteTarget.id)
    await load()
    showToast('success', `'${deleteTarget.name}' 품목이 삭제되었습니다.`)
    setDeleteTarget(null)
  }

  // ── 필터 ──
  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return items.filter((it) => {
      if (catFilter !== '전체' && it.category !== catFilter) return false
      if (lower) {
        const hay = `${it.name} ${it.brand} ${it.model} ${it.note}`.toLowerCase()
        if (!hay.includes(lower)) return false
      }
      return true
    })
  }, [items, query, catFilter])

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="품목 관리"
        description={`전체 ${items.length}종 등록`}
        action={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            신규 품목 추가
          </button>
        }
      />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 mb-5 rounded-xl text-sm border
            ${toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

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
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input w-full sm:w-44"
        >
          <option value="전체">전체 카테고리</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <LoadingSpinner />
      ) : apiError ? (
        <div className="card text-red-600 text-sm">오류: {apiError}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['품목명', '브랜드', '카테고리', '모델번호', '단위', '최소재고', '비고', '관리'].map((h) => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <PackageSearch size={36} className="text-gray-300" />
                        <p className="text-sm">등록된 품목이 없습니다.</p>
                        <button
                          className="mt-1 text-xs text-blue-500 hover:underline"
                          onClick={() => setAddOpen(true)}
                        >
                          + 첫 번째 품목 추가하기
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 cursor-pointer group"
                      onClick={() => setEditTarget(item)}
                    >
                      <td className="table-cell font-medium text-gray-900">{item.name}</td>
                      <td className="table-cell text-gray-500">{item.brand || '-'}</td>
                      <td className="table-cell">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">{item.model || '-'}</td>
                      <td className="table-cell text-gray-500">{item.unit}</td>
                      <td className="table-cell font-semibold text-gray-800">{item.minStock}</td>
                      <td className="table-cell text-gray-400 max-w-[140px] truncate" title={item.note}>
                        {item.note || '-'}
                      </td>
                      {/* 수정 / 삭제 버튼 */}
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTarget(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                            title="수정"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length}개 표시 / 전체 {items.length}개
          </div>
        </div>
      )}

      {/* ── 신규 등록 모달 ── */}
      {addOpen && (
        <ItemModal
          title="신규 품목 추가"
          initialData={EMPTY_FORM}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
          submitLabel="등록"
          submitClass="btn-primary"
        />
      )}

      {/* ── 수정 모달 ── */}
      {editTarget && (
        <ItemModal
          title="품목 수정"
          initialData={{
            name:     editTarget.name,
            brand:    editTarget.brand,
            category: editTarget.category,
            model:    editTarget.model,
            unit:     editTarget.unit,
            minStock: String(editTarget.minStock),
            note:     editTarget.note,
          }}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
          submitLabel="저장"
          submitClass="btn-primary"
          itemId={editTarget.id}
        />
      )}

      {/* ── 삭제 확인 팝업 ── */}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 카테고리 배지
// ─────────────────────────────────────────────────────────
const CAT_COLORS = {
  '스위치':      'bg-blue-100 text-blue-700',
  '라우터':      'bg-purple-100 text-purple-700',
  '방화벽':      'bg-red-100 text-red-700',
  '무선랜':      'bg-green-100 text-green-700',
  'NAC센서':     'bg-yellow-100 text-yellow-700',
  'IP관리기센서': 'bg-orange-100 text-orange-700',
  '기타':        'bg-gray-100 text-gray-600',
}

function CategoryBadge({ category }) {
  const cls = CAT_COLORS[category] || 'bg-gray-100 text-gray-600'
  return <span className={`badge ${cls}`}>{category || '-'}</span>
}

// ─────────────────────────────────────────────────────────
// 추가 / 수정 공용 모달
// ─────────────────────────────────────────────────────────
function ItemModal({ title, initialData, onSave, onClose, submitLabel, submitClass, itemId }) {
  const [form, setForm]     = useState({ ...initialData })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(form)
    if (err) return setError(err)
    setError(null)
    setSaving(true)
    try {
      await onSave({ ...form, minStock: Number(form.minStock) || 0 })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* 모달 패널 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* 품목ID (수정 시 표시) */}
          {itemId && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              품목 ID: <span className="font-mono text-gray-600">{itemId}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* 품목명 */}
          <div>
            <label className="label">품목명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예) 24포트 스위치"
              className="input"
              required
            />
          </div>

          {/* 브랜드 */}
          <div>
            <label className="label">브랜드</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="예) Cisco, HP, Ubiquiti"
              className="input"
            />
          </div>

          {/* 카테고리 + 단위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">카테고리 <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="input"
                required
              >
                <option value="">선택</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">단위</label>
              <select
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="input"
              >
                {['개', '대', 'EA', 'SET', '식'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 모델번호 */}
          <div>
            <label className="label">모델번호 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              placeholder="예) WS-C2960X-24TS-L"
              className="input font-mono"
              required
            />
          </div>

          {/* 최소재고수량 */}
          <div>
            <label className="label">최소재고수량</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => set('minStock', e.target.value)}
                placeholder="0"
                className="input pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {form.unit || '개'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">현재 재고가 이 수량 미만이면 부족으로 표시됩니다.</p>
          </div>

          {/* 비고 */}
          <div>
            <label className="label">비고</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={2}
              placeholder="추가 메모 (선택)"
              className="input resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" disabled={saving} className={submitClass}>
              {saving ? '저장 중...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 삭제 확인 팝업
// ─────────────────────────────────────────────────────────
function DeleteConfirm({ item, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState(null)

  async function handle() {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* 아이콘 */}
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>

        <h3 className="text-base font-semibold text-gray-900 text-center mb-1">품목 삭제</h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          아래 품목을 삭제하면 복구할 수 없습니다.
        </p>

        {/* 삭제 대상 정보 */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 my-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">품목명</span>
            <span className="font-semibold text-gray-900">{item.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">모델번호</span>
            <span className="font-mono text-xs text-gray-600">{item.model || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">카테고리</span>
            <span className="text-gray-600">{item.category || '-'}</span>
          </div>
        </div>

        {/* ⚠️ 입출고 이력 경고 */}
        <div className="flex gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>이 품목의 입출고 이력(transactions)은 함께 삭제되지 않습니다. 이력은 별도로 관리해주세요.</span>
        </div>

        {error && (
          <p className="text-xs text-red-600 text-center mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 justify-center"
            disabled={deleting}
          >
            취소
          </button>
          <button
            onClick={handle}
            disabled={deleting}
            className="btn-danger flex-1 justify-center"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
