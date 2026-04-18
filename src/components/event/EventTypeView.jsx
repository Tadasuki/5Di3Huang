import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import AnnotatedText from '../common/AnnotatedText'
import './EventTypeView.css'

function byYearAsc(a, b) {
  return (a?.year ?? 0) - (b?.year ?? 0)
}

export default function EventTypeView() {
  const { type } = useParams()
  const events = useHistoricalEvents()

  const list = useMemo(() => {
    const t = decodeURIComponent(type || '')
    if (!t) return []
    return events.filter(e => e?.type === t).slice().sort(byYearAsc)
  }, [events, type])

  if (!type) {
    return (
      <div className="event-type-page">
        <div className="container event-type-not-found">
          <h2>未指定事件类型</h2>
          <Link to="/" className="btn btn-primary">返回首页</Link>
        </div>
      </div>
    )
  }

  const typeLabel = decodeURIComponent(type)

  return (
    <div className="event-type-page" id={`event-type-${typeLabel}`}>
      <div className="container">
        <header className="event-type-header">
          <div className="event-type-badge">🏷</div>
          <div>
            <h1 className="event-type-title">{typeLabel}</h1>
            <p className="event-type-sub">共 {list.length} 个事件 · 按时间排序</p>
          </div>
        </header>

        <div className="event-type-timeline" aria-label="同类事件时间轴">
          {list.map(evt => (
            <Link key={evt.id} to={`/event/${evt.id}`} className="event-type-card">
              <div className="event-type-year">{evt.year}</div>
              <div className="event-type-name">{evt.name}</div>
              <div className="event-type-meta">
                {evt.location || '—'}
              </div>
              <div className="event-type-desc">
                <AnnotatedText text={evt.summary || evt.impact || ''} />
              </div>
            </Link>
          ))}
          {list.length === 0 && (
            <div className="event-type-empty">该类型暂无事件，可在 data/historical_events.json 中补充。</div>
          )}
        </div>
      </div>
    </div>
  )
}
