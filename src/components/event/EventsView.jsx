import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import AnnotatedText from '../common/AnnotatedText'
import './EventsView.css'

const TYPE_LABEL = {
  battle: '战争',
  political: '政变',
  unification: '统一',
  founding: '建国',
  culture: '文化',
}

function labelForType(type) {
  if (!type) return '未分类'
  return TYPE_LABEL[type] || type
}

function byYearAsc(a, b) {
  return (a?.year ?? 0) - (b?.year ?? 0)
}

export default function EventsView() {
  const events = useHistoricalEvents()
  const [selected, setSelected] = useState(new Set())

  const types = useMemo(() => {
    const s = new Set()
    events.forEach(e => {
      if (e?.type) s.add(e.type)
    })
    return Array.from(s).sort((a, b) => labelForType(a).localeCompare(labelForType(b), 'zh-Hans-CN'))
  }, [events])

  const selectedCount = selected.size
  const filtered = useMemo(() => {
    const list = events.slice().sort(byYearAsc)
    if (selectedCount === 0) return list
    return list.filter(e => e?.type && selected.has(e.type))
  }, [events, selected, selectedCount])

  function toggle(type) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="events-page" id="events-page">
      <div className="container">
        <header className="events-header">
          <h1 className="events-title">历史事件</h1>
          <p className="events-subtitle">按标签筛选（可多选），点击事件进入详情页。</p>
        </header>

        <div className="events-filters" role="group" aria-label="事件筛选">
          <button
            type="button"
            className={`filter-chip ${selectedCount === 0 ? 'active' : ''}`}
            onClick={() => setSelected(new Set())}
          >
            全部
          </button>
          {types.map(t => (
            <button
              key={t}
              type="button"
              className={`filter-chip ${selected.has(t) ? 'active' : ''}`}
              onClick={() => toggle(t)}
              title={t}
            >
              {labelForType(t)}
            </button>
          ))}
        </div>

        <div className="events-list" aria-label="事件列表">
          {filtered.map(evt => (
            <Link key={evt.id} to={`/event/${evt.id}`} className="events-card">
              <div className="events-card-year">{evt.year}</div>
                <div className="events-card-main">
                  <div className="events-card-title">
                  <AnnotatedText text={evt.name} />
                  <span className="events-card-tag">🏷 {labelForType(evt.type)}</span>
                </div>
                <div className="events-card-sub">
                  <AnnotatedText text={evt.location || '—'} />
                </div>
                <div className="events-card-desc">
                  <AnnotatedText text={evt.summary || evt.impact || ''} />
                </div>
              </div>
              <span className="events-card-arrow">›</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="events-empty">没有匹配的事件。</div>
          )}
        </div>
      </div>
    </div>
  )
}
