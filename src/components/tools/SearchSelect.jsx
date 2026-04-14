import { useEffect, useMemo, useRef, useState } from 'react'
import './SearchSelect.css'

function norm(s) {
  return (typeof s === 'string' ? s : '').trim()
}

export default function SearchSelect({
  label,
  placeholder = '搜索...',
  options,
  value,
  onChange,
  getKey = (o) => o?.value,
  getLabel = (o) => o?.label,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  const selected = useMemo(() => {
    const v = norm(value)
    return (options || []).find(o => norm(getKey(o)) === v) ?? null
  }, [options, value, getKey])

  const filtered = useMemo(() => {
    const q = norm(query).toLowerCase()
    const list = options || []
    if (!q) return list
    return list.filter(o => norm(getLabel(o)).toLowerCase().includes(q))
  }, [options, query, getLabel])

  useEffect(() => {
    const onDoc = (e) => {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return (
    <div className={`ss-root ${disabled ? 'ss-disabled' : ''}`} ref={rootRef}>
      {label && <div className="ss-label">{label}</div>}
      <div className="ss-control">
        <input
          className="search-input ss-input"
          value={open ? query : (selected ? norm(getLabel(selected)) : '')}
          placeholder={placeholder}
          onFocus={() => !disabled && setOpen(true)}
          onChange={(e) => {
            if (disabled) return
            setOpen(true)
            setQuery(e.target.value)
          }}
          readOnly={!open}
          disabled={disabled}
        />
        <button
          type="button"
          className="ss-toggle"
          onClick={() => !disabled && setOpen(v => !v)}
          aria-label="展开选项"
          disabled={disabled}
        >
          ▾
        </button>
      </div>

      {open && !disabled && (
        <div className="ss-menu" role="listbox">
          {filtered.length === 0 ? (
            <div className="ss-empty">无匹配结果</div>
          ) : (
            filtered.slice(0, 120).map(o => {
              const k = norm(getKey(o))
              const text = norm(getLabel(o))
              const active = k && k === norm(value)
              return (
                <button
                  type="button"
                  className={`ss-item ${active ? 'active' : ''}`}
                  key={k || text}
                  onClick={() => {
                    onChange?.(k)
                    setOpen(false)
                  }}
                >
                  {text}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

