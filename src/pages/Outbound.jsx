import { useEffect, useState } from 'react'
import { PackageMinus, CheckCircle } from 'lucide-react'
import { fetchItems, registerOutbound, fetchStock } from '../services/sheetsApi'
import { useAuth } from '../context/AuthContext'
import ItemSearchInput from '../components/ItemSearchInput'
import PageHeader from '../components/PageHeader'
import { format } from 'date-fns'

const INITIAL = {
  item:     null,
  qty:      '',
  customer: '',
  project:  '',
  date:     format(new Date(), 'yyyy-MM-dd'),
  manager:  '',
  note:     '',
}

export default function Outbound() {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [stockMap, setStockMap] = useState({})
  const [form, setForm]       = useState({ ...INITIAL, manager: user?.name || '' })
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    Promise.all([fetchItems(), fetchStock()])
      .then(([its, stk]) => {
        setItems(its)
        setStockMap(Object.fromEntries(stk.map((s) => [s.itemId, s])))
      })
      .catch((e) => setError(e.message))
  }, [])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  const currentStock = form.item ? (stockMap[form.item.id]?.current ?? '-') : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item) return setError('품목을 선택해주세요.')
    const qty = Number(form.qty)
    if (!qty || qty <= 0) return setError('수량을 입력해주세요.')
    if (currentStock !== null && currentStock !== '-' && qty > currentStock)
      return setError(`재고 부족: 현재 재고 ${currentStock}개, 출고 요청 ${qty}개`)
    if (!form.customer) return setError('고객사를 입력해주세요.')

    setError(null)
    setSaving(true)
    try {
      await registerOutbound({
        itemId:   form.item.id,
        qty,
        customer: form.customer,
        project:  form.project,
        date:     form.date,
        manager:  form.manager,
        note:     form.note,
      })
      setSuccess(true)
      setForm({ ...INITIAL, manager: user?.name || '' })
      // 재고 다시 불러오기
      fetchStock().then((stk) =>
        setStockMap(Object.fromEntries(stk.map((s) => [s.itemId, s])))
      )
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="출고 등록"
        description="출고된 장비를 등록합니다."
      />

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm">
          <CheckCircle size={18} />
          출고가 성공적으로 등록되었습니다.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* 품목 선택 */}
        <div>
          <label className="label">품목 선택 <span className="text-red-500">*</span></label>
          <ItemSearchInput
            items={items}
            value={form.item}
            onChange={(item) => set('item', item)}
          />
          {form.item && (
            <div className="mt-2 bg-orange-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
              <span className="text-orange-700">
                <b>{form.item.brand}</b> · {form.item.model} · {form.item.category}
              </span>
              <span className={`font-semibold ${currentStock < form.item.minStock ? 'text-red-600' : 'text-gray-700'}`}>
                현재고: {currentStock}{form.item.unit}
              </span>
            </div>
          )}
        </div>

        {/* 수량 + 날짜 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">수량 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max={currentStock !== '-' ? currentStock : undefined}
              value={form.qty}
              onChange={(e) => set('qty', e.target.value)}
              placeholder="0"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">출고 날짜 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* 고객사 */}
        <div>
          <label className="label">고객사 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.customer}
            onChange={(e) => set('customer', e.target.value)}
            placeholder="고객사명 입력"
            className="input"
            required
          />
        </div>

        {/* 프로젝트명 */}
        <div>
          <label className="label">프로젝트명</label>
          <input
            type="text"
            value={form.project}
            onChange={(e) => set('project', e.target.value)}
            placeholder="프로젝트명 입력 (선택)"
            className="input"
          />
        </div>

        {/* 담당자 */}
        <div>
          <label className="label">담당자 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.manager}
            onChange={(e) => set('manager', e.target.value)}
            placeholder="담당자 이름"
            className="input"
            required
          />
        </div>

        {/* 비고 */}
        <div>
          <label className="label">비고</label>
          <textarea
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            rows={3}
            placeholder="추가 메모 (선택)"
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setForm({ ...INITIAL, manager: user?.name || '' })}
            className="btn-secondary"
          >
            초기화
          </button>
          <button type="submit" disabled={saving} className="btn-primary bg-orange-500 hover:bg-orange-600">
            <PackageMinus size={16} />
            {saving ? '등록 중...' : '출고 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
