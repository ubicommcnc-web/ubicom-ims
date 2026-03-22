import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

/**
 * 품목 검색 인풋 컴포넌트
 * props:
 *  - items: 전체 품목 배열
 *  - value: 선택된 품목 객체
 *  - onChange: (item) => void
 *  - placeholder
 */
export default function ItemSearchInput({ items = [], value, onChange, placeholder = '품목명 또는 모델번호 검색...' }) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const [filtered, setFiltered] = useState([])
  const ref = useRef(null)

  // 선택된 값이 바뀌면 인풋 텍스트 동기화
  useEffect(() => {
    if (value) setQuery(`${value.name} (${value.model})`)
    else setQuery('')
  }, [value])

  // 검색어 변경 시 필터
  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    if (!q) {
      setFiltered([])
      setOpen(false)
      onChange(null)
      return
    }
    const lower = q.toLowerCase()
    const result = items.filter(
      (it) =>
        it.name.toLowerCase().includes(lower) ||
        it.model.toLowerCase().includes(lower) ||
        it.brand.toLowerCase().includes(lower)
    )
    setFiltered(result)
    setOpen(true)
  }

  function select(item) {
    onChange(item)
    setOpen(false)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => filtered.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input pl-9"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item.id}
              onMouseDown={() => select(item)}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.brand} · {item.model}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-3 text-sm text-gray-500">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  )
}
