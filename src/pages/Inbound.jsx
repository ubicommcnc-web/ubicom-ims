import { useEffect, useState } from 'react'
import { PackagePlus, CheckCircle } from 'lucide-react'
import { fetchItems, registerInbound } from '../services/sheetsApi'
import { useAuth } from '../context/AuthContext'
import ItemSearchInput from '../components/ItemSearchInput'
import PageHeader from '../components/PageHeader'
import { format } from 'date-fns'

const INITIAL = {
  item:     null,
  qty:      '',
  supplier: '',
  date:     format(new Date(), 'yyyy-MM-dd'),
  manager:  '',
  note:     '',
}

export default function Inbound() {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [form, setForm]       = useState({ ...INITIAL, manager: user?.name || '' })
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchItems().then(setItems).catch((e) => setError(e.message))
  }, [])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item) return setError('품목을 선택해주세요.')
    if (!form.qty || Number(form.qty) <= 0) return setError('수량을 입력해주세요.')
    if (!form.supplier) return setError('공급처를 입력해주세요.')

    setError(null)
    setSaving(true)
    try {
      await registerInbound({
        itemId:   form.item.id,
        qty:      Number(form.qty),
        supplier: form.supplier,
        date:     form.date,
        manager:  form.manager,
        note:     form.note,
      })
      setSuccess(true)
      setForm({ ...INITIAL, manager: user?.name || '' })
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
        title="입고 등록"
        description="입고된 장비를 등록합니다."
      />

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm">
          <CheckCircle size={18} />
          입고가 성공적으로 등록되었습니다.
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
            <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              <b>{form.item.brand}</b> · {form.item.model} · {form.item.category} · 단위: {form.item.unit}
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
              value={form.qty}
              onChange={(e) => set('qty', e.target.value)}
              placeholder="0"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">입고 날짜 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* 공급처 */}
        <div>
          <label className="label">공급처 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.supplier}
            onChange={(e) => set('supplier', e.target.value)}
            placeholder="공급처명 입력"
            className="input"
            required
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
          <button type="submit" disabled={saving} className="btn-primary">
            <PackagePlus size={16} />
            {saving ? '등록 중...' : '입고 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
