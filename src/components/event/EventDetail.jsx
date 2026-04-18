import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useHistoricalEvent, useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import { useAllLeaders } from '../../hooks/useDynasties'
import LeaderCard from '../home/LeaderCard'
import AnnotatedText from '../common/AnnotatedText'
import './EventDetail.css'

export default function EventDetail() {
  const { id } = useParams()
  const event = useHistoricalEvent(id)
  const events = useHistoricalEvents()
  const leaders = useAllLeaders()

  const leaderList = useMemo(() => {
    if (!event?.leaderIds?.length) return []
    const map = new Map(leaders.map(l => [l.id, l]))
    return event.leaderIds.map(x => map.get(x)).filter(Boolean)
  }, [event?.leaderIds, leaders])

  const sameTypeEvents = useMemo(() => {
    if (!event?.type) return []
    return events
      .filter(e => e?.type === event.type)
      .slice()
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
  }, [event?.type, events])

  if (!event) {
    return (
      <div className="event-detail">
        <div className="container event-not-found">
          <h2>未找到该事件</h2>
          <p>可在 <code>data/historical_events.json</code> 中补充事件条目。</p>
          <p style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/" className="btn btn-primary">返回首页</Link>
            {' '}
            <Link to="/timeline" className="btn btn-outline">时间线</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="event-detail" id={`event-detail-${event.id}`}>
      <div className="container">
        <header className="event-header">
          <div className="event-badge">{event.name.charAt(0)}</div>
          <div className="event-header-main">
            <h1 className="event-title">{event.name}</h1>
            <div className="event-meta">
              <span>📅 {event.year}</span>
              {event.location && (
                <Link to={`/map?event=${event.id}`} className="location-link tag-clickable" title="在地图中定位该地点">
                  📍 {event.location} <span className="jump-icon">↗</span>
                </Link>
              )}
              {event.type && (
                <Link to={`/events/type/${encodeURIComponent(event.type)}`} className="event-type-tag tag-clickable">
                  🏷 {event.type} <span className="jump-icon">↗</span>
                </Link>
              )}
            </div>
            {event.summary && <p className="event-summary"><AnnotatedText text={event.summary} /></p>}
          </div>
        </header>

        <section className="event-section" aria-labelledby="event-impact-heading">
          <h2 id="event-impact-heading" className="event-section-title">影响</h2>
          <p className="event-text"><AnnotatedText text={event.impact || '暂无影响描述。'} /></p>
        </section>

        <section className="event-section" aria-labelledby="event-people-heading">
          <h2 id="event-people-heading" className="event-section-title">相关领导人</h2>
          <div className="event-leaders">
            {leaderList.map((leader, i) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                dynastyColor="#c9a96e"
                index={i}
              />
            ))}
            {leaderList.length === 0 && (
              <p className="event-empty">暂无关联人物（可在事件条目中补充 leaderIds）。</p>
            )}
          </div>
        </section>

        {sameTypeEvents.length > 1 && (
          <section className="event-section" aria-labelledby="event-same-type-heading">
            <h2 id="event-same-type-heading" className="event-section-title">
              同类事件：{event.type}
            </h2>
            <div className="event-timeline-container">
              {sameTypeEvents.map(e => (
                <Link
                  key={e.id}
                  to={`/event/${e.id}`}
                  className={`event-timeline-item ${e.id === event.id ? 'active' : ''}`}
                >
                  <div className="event-timeline-marker" />
                  <div className="event-timeline-content">
                    <div className="event-timeline-date">
                      {e.year < 0 ? `公元前${Math.abs(e.year)}年` : `${e.year}年`}
                    </div>
                    <div className="event-timeline-name">{e.name}</div>
                    <div className="event-timeline-desc">
                      {e.location && <span>📍 {e.location} · </span>}
                      <AnnotatedText text={e.summary || e.impact || ''} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
